import { useState, useEffect, useRef } from 'react'

const POLYGON_KEY = 'UqQavmhMSGECPDiz2I_sjIOKpz70NOdk'
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const LS_KEY = 'wv_stock_cache'

function loadCache() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}') } catch { return {} }
}
function saveCache(c) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(c)) } catch {}
}

// Initialise from localStorage so prices survive a page reload
let priceCache = loadCache()

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

export function useStockPrices(assets) {
  const [prices, setPrices] = useState(() => {
    const now = Date.now()
    const valid = {}
    Object.entries(priceCache).forEach(([ticker, e]) => {
      if (e.ts && now - e.ts < CACHE_TTL) valid[ticker] = { price: e.price, change: e.change }
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
      let fetched = false

      for (let i = 0; i < tickers.length; i++) {
        const ticker = tickers[i]
        const cached = priceCache[ticker]

        // Use cache if fresh
        if (cached && now - (cached.ts || 0) < CACHE_TTL) {
          results[ticker] = { price: cached.price, change: cached.change }
          continue
        }

        try {
          const res = await fetch(
            `https://api.polygon.io/v2/aggs/ticker/${ticker}/prev?adjusted=true&apiKey=${POLYGON_KEY}`
          )
          if (res.status === 429) {
            // Rate limited — use stale cache if available
            if (cached) results[ticker] = { price: cached.price, change: cached.change }
            await sleep(2000) // back off longer on 429
            continue
          }
          const data = await res.json()
          if (data.results?.[0]) {
            const r = data.results[0]
            const change = parseFloat((((r.c - r.o) / r.o) * 100).toFixed(2))
            const entry = { price: r.c, change, ts: now }
            priceCache[ticker] = entry
            results[ticker] = { price: r.c, change }
            fetched = true
          }
        } catch {
          if (cached) results[ticker] = { price: cached.price, change: cached.change }
        }

        // 500 ms delay between each request
        if (i < tickers.length - 1) await sleep(500)
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
