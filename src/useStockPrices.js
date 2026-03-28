import { useState, useEffect, useRef } from 'react'

const STOCK_CACHE_TTL = 5 * 60 * 1000   // 5-min data freshness
const CRYPTO_CACHE_TTL = 60 * 1000       // 1-min data freshness
const POLL_INTERVAL = 60 * 1000          // refresh every 60s
const LS_STOCK = 'stock_prices_cache'
const LS_CRYPTO = 'crypto_prices_cache'
const CORS = 'https://corsproxy.io/?'

function loadCache(key) {
  try { return JSON.parse(localStorage.getItem(key) || '{}') } catch { return {} }
}
function saveCache(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)) } catch {}
}

let stockCache = loadCache(LS_STOCK)
let cryptoCache = loadCache(LS_CRYPTO)

async function fetchStockTicker(ticker) {
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

async function fetchCryptoIds(ids) {
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
  const data = await fetch(url).then(r => r.json())
  const result = {}
  for (const [id, v] of Object.entries(data)) {
    result[id] = { price: v.usd, change: v.usd_24h_change ?? 0 }
  }
  return result
}

export function useStockPrices(assets) {
  const [prices, setPrices] = useState(() => {
    const now = Date.now()
    const valid = {}
    for (const [ticker, e] of Object.entries(stockCache)) {
      if (e.ts && now - e.ts < STOCK_CACHE_TTL) valid[ticker] = { price: e.price, change: e.change, previousClose: e.previousClose }
    }
    for (const [id, e] of Object.entries(cryptoCache)) {
      if (e.ts && now - e.ts < CRYPTO_CACHE_TTL) valid[id] = { price: e.price, change: e.change }
    }
    return valid
  })
  const [lastUpdated, setLastUpdated] = useState(null)
  const timerRef = useRef(null)

  const stockKey = assets
    .filter(a => a.category === 'Stocks' && a.ticker)
    .map(a => a.ticker).sort().join(',')

  const cryptoKey = assets
    .filter(a => a.category === 'Crypto' && a.ticker)
    .map(a => a.ticker).sort().join(',')

  const assetKey = stockKey + '|' + cryptoKey

  useEffect(() => {
    if (!stockKey && !cryptoKey) return
    const stockTickers = stockKey ? stockKey.split(',') : []
    const cryptoIds    = cryptoKey ? cryptoKey.split(',') : []

    async function fetchAll() {
      const now = Date.now()
      const results = {}
      let didFetch = false

      // ── Stocks ────────────────────────────────────────────────────────────
      const stockSettled = await Promise.allSettled(
        stockTickers.map(async ticker => {
          const cached = stockCache[ticker]
          if (cached && now - (cached.ts || 0) < STOCK_CACHE_TTL) {
            return { ticker, data: { price: cached.price, change: cached.change, previousClose: cached.previousClose }, fromCache: true }
          }
          try {
            const data = await fetchStockTicker(ticker)
            return { ticker, data, fromCache: false }
          } catch {
            return { ticker, data: null, fromCache: false }
          }
        })
      )

      for (const result of stockSettled) {
        if (result.status !== 'fulfilled') continue
        const { ticker, data, fromCache } = result.value
        if (data) {
          results[ticker] = data
          if (!fromCache) {
            stockCache[ticker] = { ...data, ts: now }
            didFetch = true
          }
        } else {
          const cached = stockCache[ticker]
          if (cached) results[ticker] = { price: cached.price, change: cached.change, previousClose: cached.previousClose }
        }
      }
      if (didFetch) saveCache(LS_STOCK, stockCache)

      // ── Crypto ────────────────────────────────────────────────────────────
      if (cryptoIds.length > 0) {
        const staleIds = cryptoIds.filter(id => {
          const cached = cryptoCache[id]
          return !cached || now - (cached.ts || 0) >= CRYPTO_CACHE_TTL
        })

        if (staleIds.length > 0) {
          try {
            const fresh = await fetchCryptoIds(staleIds.join(','))
            for (const [id, data] of Object.entries(fresh)) {
              results[id] = data
              cryptoCache[id] = { ...data, ts: now }
            }
            saveCache(LS_CRYPTO, cryptoCache)
            didFetch = true
          } catch {}
        }

        // serve fresh cached crypto too
        for (const id of cryptoIds) {
          if (!results[id]) {
            const cached = cryptoCache[id]
            if (cached) results[id] = { price: cached.price, change: cached.change }
          }
        }
      }

      if (Object.keys(results).length) {
        setPrices(prev => ({ ...prev, ...results }))
        if (didFetch) setLastUpdated(new Date())
      }
    }

    fetchAll()
    timerRef.current = setInterval(fetchAll, POLL_INTERVAL)
    return () => clearInterval(timerRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetKey])

  return { prices, lastUpdated }
}
