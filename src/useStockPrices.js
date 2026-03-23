import { useState, useEffect, useRef } from 'react'

const CACHE_TTL = 15 * 60 * 1000 // 15 minutes
const LS_KEY = 'stock_prices_cache'
const CORS = 'https://corsproxy.io/?'

function loadCache() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}') } catch { return {} }
}
function saveCache(c) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(c)) } catch {}
}

// Initialise from localStorage so prices survive a page reload
let priceCache = loadCache()

async function fetchTicker(ticker) {
  const url = `${CORS}https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=2d`
  const res = await fetch(url)
  const data = await res.json()
  const meta = data?.chart?.result?.[0]?.meta
  if (!meta) return null
  const price = meta.regularMarketPrice
  const previousClose = meta.previousClose ?? meta.chartPreviousClose
  if (!price || !previousClose) return null
  const change = parseFloat((((price - previousClose) / previousClose) * 100).toFixed(2))
  return { price, previousClose, change }
}

export function useStockPrices(assets) {
  const [prices, setPrices] = useState(() => {
    const now = Date.now()
    const valid = {}
    Object.entries(priceCache).forEach(([ticker, e]) => {
      if (e.ts && now - e.ts < CACHE_TTL) valid[ticker] = { price: e.price, change: e.change, previousClose: e.previousClose }
    })
    return valid
  })
  const [lastUpdated, setLastUpdated] = useState(null)
  const timerRef = useRef(null)

  const tickerKey = assets
    .filter(a => a.category === 'Stocks' && a.ticker)
    .map(a => a.ticker).sort().join(',')

  useEffect(() => {
    if (!tickerKey) return
    const tickers = tickerKey.split(',')

    async function fetchAll() {
      const now = Date.now()
      const results = {}

      const settled = await Promise.allSettled(
        tickers.map(async ticker => {
          const cached = priceCache[ticker]
          if (cached && now - (cached.ts || 0) < CACHE_TTL) {
            return { ticker, data: { price: cached.price, change: cached.change, previousClose: cached.previousClose }, fromCache: true }
          }
          try {
            const data = await fetchTicker(ticker)
            return { ticker, data, fromCache: false }
          } catch {
            return { ticker, data: null, fromCache: false }
          }
        })
      )

      let fetched = false
      for (const result of settled) {
        if (result.status !== 'fulfilled') continue
        const { ticker, data, fromCache } = result.value
        if (data) {
          results[ticker] = data
          if (!fromCache) {
            priceCache[ticker] = { ...data, ts: now }
            fetched = true
          }
        } else {
          // fetch failed — use stale cache if available
          const cached = priceCache[ticker]
          if (cached) results[ticker] = { price: cached.price, change: cached.change, previousClose: cached.previousClose }
        }
      }

      if (fetched) saveCache(priceCache)
      if (Object.keys(results).length) {
        setPrices(prev => ({ ...prev, ...results }))
        setLastUpdated(new Date())
      }
    }

    fetchAll()
    timerRef.current = setInterval(fetchAll, CACHE_TTL)
    return () => clearInterval(timerRef.current)
  }, [tickerKey])

  return { prices, lastUpdated }
}
