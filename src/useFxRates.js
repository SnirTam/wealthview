import { useState, useEffect } from 'react'

const LS_KEY = 'wv_fx_rates'
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

export const CURRENCY_META = {
  USD: { symbol: '$',   name: 'US Dollar' },
  EUR: { symbol: '€',   name: 'Euro' },
  GBP: { symbol: '£',   name: 'British Pound' },
  JPY: { symbol: '¥',   name: 'Japanese Yen' },
  CAD: { symbol: 'C$',  name: 'Canadian Dollar' },
  AUD: { symbol: 'A$',  name: 'Australian Dollar' },
  CHF: { symbol: 'CHF ', name: 'Swiss Franc' },
  INR: { symbol: '₹',   name: 'Indian Rupee' },
  ILS: { symbol: '₪',   name: 'Israeli Shekel' },
  BRL: { symbol: 'R$',  name: 'Brazilian Real' },
  MXN: { symbol: 'Mex$', name: 'Mexican Peso' },
  CNY: { symbol: '¥',   name: 'Chinese Yuan' },
  SGD: { symbol: 'S$',  name: 'Singapore Dollar' },
  KRW: { symbol: '₩',   name: 'South Korean Won' },
}

// Static fallback rates — updated by hook when fetch succeeds
const FALLBACK = {
  USD: 1, EUR: 0.92, GBP: 0.78, JPY: 149.5, CAD: 1.36,
  AUD: 1.52, CHF: 0.89, INR: 83.1, ILS: 3.70, BRL: 4.95,
  MXN: 17.2, CNY: 7.24, SGD: 1.34, KRW: 1325,
}

// Module-level map — formatAmount reads from this so callers don't need to pass rates
export let liveRates = (() => {
  try {
    const cached = JSON.parse(localStorage.getItem(LS_KEY) || '{}')
    if (cached.ts && Date.now() - cached.ts < CACHE_TTL && cached.rates) {
      return { ...FALLBACK, ...cached.rates }
    }
  } catch {}
  return { ...FALLBACK }
})()

export function useFxRates() {
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    // Skip if cached data is still fresh
    try {
      const cached = JSON.parse(localStorage.getItem(LS_KEY) || '{}')
      if (cached.ts && Date.now() - cached.ts < CACHE_TTL && cached.rates) return
    } catch {}

    fetch('https://open.er-api.com/v6/latest/USD')
      .then(r => r.json())
      .then(data => {
        if (data.result === 'success' && data.rates) {
          liveRates = { ...FALLBACK, ...data.rates }
          try { localStorage.setItem(LS_KEY, JSON.stringify({ rates: liveRates, ts: Date.now() })) } catch {}
          forceUpdate(n => n + 1) // re-render consumers
        }
      })
      .catch(() => {})
  }, [])

  return liveRates
}
