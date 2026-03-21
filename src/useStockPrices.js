import { useState, useEffect } from 'react'

const POLYGON_KEY = 'UqQavmhMSGECPDiz2I_sjIOKpz70NOdk'

export function useStockPrices(assets) {
  const [prices, setPrices] = useState({})

  useEffect(() => {
    const stockAssets = assets.filter(a => a.category === 'Stocks' && a.ticker)
    if (stockAssets.length === 0) return

    async function fetchAll() {
      const results = {}
      await Promise.all(
        stockAssets.map(async asset => {
          try {
            const res = await fetch(
              `https://api.polygon.io/v2/aggs/ticker/${asset.ticker}/prev?adjusted=true&apiKey=${POLYGON_KEY}`
            )
            const data = await res.json()
            if (data.results?.[0]) {
              const r = data.results[0]
              const change = ((r.c - r.o) / r.o) * 100
              results[asset.ticker] = {
                price: r.c,
                change: parseFloat(change.toFixed(2)),
              }
            }
          } catch (e) {
            console.error('Stock fetch failed for', asset.ticker, e)
          }
        })
      )
      setPrices(results)
    }

    fetchAll()
    const interval = setInterval(fetchAll, 60000)
    return () => clearInterval(interval)
  }, [assets])

  return prices
}