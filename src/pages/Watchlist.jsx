import { useState, useEffect, useRef } from 'react'
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts'
import AssetLogo from '../components/AssetLogo'
import { formatAmount } from './Dashboard'

const POLYGON_KEY = 'UqQavmhMSGECPDiz2I_sjIOKpz70NOdk'
const LS_KEY = 'wv_watchlist'
const PRICE_CACHE_KEY = 'wv_watchlist_prices'
const CACHE_TTL = 5 * 60 * 1000

const POPULAR_STOCKS = [
  { ticker: 'AAPL', name: 'Apple' }, { ticker: 'NVDA', name: 'NVIDIA' },
  { ticker: 'MSFT', name: 'Microsoft' }, { ticker: 'GOOGL', name: 'Google' },
  { ticker: 'AMZN', name: 'Amazon' }, { ticker: 'TSLA', name: 'Tesla' },
  { ticker: 'META', name: 'Meta' }, { ticker: 'JPM', name: 'JPMorgan' },
  { ticker: 'V', name: 'Visa' }, { ticker: 'SPY', name: 'S&P 500 ETF' },
  { ticker: 'QQQ', name: 'Nasdaq ETF' }, { ticker: 'NFLX', name: 'Netflix' },
]

const POPULAR_CRYPTO = [
  { ticker: 'bitcoin', name: 'Bitcoin (BTC)' },
  { ticker: 'ethereum', name: 'Ethereum (ETH)' },
  { ticker: 'solana', name: 'Solana (SOL)' },
  { ticker: 'ripple', name: 'XRP' },
  { ticker: 'dogecoin', name: 'Dogecoin (DOGE)' },
  { ticker: 'cardano', name: 'Cardano (ADA)' },
]

const QUICK_ADD = [
  { ticker: 'AAPL', name: 'Apple', category: 'Stocks' },
  { ticker: 'NVDA', name: 'NVIDIA', category: 'Stocks' },
  { ticker: 'bitcoin', name: 'Bitcoin (BTC)', category: 'Crypto' },
  { ticker: 'ethereum', name: 'Ethereum (ETH)', category: 'Crypto' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isMarketOpen() {
  try {
    const et = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }))
    const day = et.getDay()
    const mins = et.getHours() * 60 + et.getMinutes()
    return day >= 1 && day <= 5 && mins >= 570 && mins < 960
  } catch { return false }
}

function loadWatchlist() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]') } catch { return [] }
}
function saveWatchlist(items) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(items)) } catch {}
}

function loadPriceCache() {
  try { return JSON.parse(localStorage.getItem(PRICE_CACHE_KEY) || '{}') } catch { return {} }
}
function savePriceCache(c) {
  try { localStorage.setItem(PRICE_CACHE_KEY, JSON.stringify(c)) } catch {}
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// Generate sparkline from current price + 24h change
function generateSparkline(change, points = 14) {
  if (change == null) return null
  const end = 100 + (change || 0)
  return Array.from({ length: points }, (_, i) => {
    const progress = i / (points - 1)
    const base = 100 + (end - 100) * Math.pow(progress, 0.8)
    const noise = (Math.random() - 0.48) * Math.abs(change || 0.5) * 0.4
    return { v: i === points - 1 ? end : base + noise }
  })
}

// ─── Sparkline ───────────────────────────────────────────────────────────────

function Sparkline({ data, change }) {
  if (!data) return <div style={{ width: 80 }} />
  const color = change >= 0 ? 'var(--green)' : 'var(--red)'
  return (
    <div style={{ width: 80, height: 36 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5}
            dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Watchlist ────────────────────────────────────────────────────────────────

export default function Watchlist({ currency = 'USD', onAddToPortfolio }) {
  const [items, setItems] = useState(loadWatchlist)
  const [prices, setPrices] = useState({})
  const [sparklines, setSparklines] = useState({})
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [inputCategory, setInputCategory] = useState('Stocks')
  const [fetchingKeys, setFetchingKeys] = useState(new Set())
  const priceCache = useRef(loadPriceCache())
  const marketOpen = isMarketOpen()

  // Fetch prices for all items
  useEffect(() => {
    if (!items.length) return
    let cancelled = false

    async function fetchAll() {
      const now = Date.now()
      const result = {}
      const newSparklines = {}

      for (const item of items) {
        if (cancelled) break
        const key = item.ticker
        const cached = priceCache.current[key]
        if (cached && now - (cached.ts || 0) < CACHE_TTL) {
          result[key] = cached
          newSparklines[key] = generateSparkline(cached.change)
          continue
        }

        if (item.category === 'Stocks') {
          try {
            const res = await fetch(
              `https://api.polygon.io/v2/aggs/ticker/${item.ticker}/prev?adjusted=true&apiKey=${POLYGON_KEY}`
            )
            if (res.status === 429) { await sleep(2000); continue }
            const data = await res.json()
            if (data.results?.[0]) {
              const r = data.results[0]
              const change = parseFloat((((r.c - r.o) / r.o) * 100).toFixed(2))
              const entry = { price: r.c, change, ts: now }
              priceCache.current[key] = entry
              result[key] = entry
              newSparklines[key] = generateSparkline(change)
            }
          } catch {}
          await sleep(500)

        } else if (item.category === 'Crypto') {
          // Crypto is batched later
        }
      }

      // Batch crypto fetch
      const cryptoItems = items.filter(i => i.category === 'Crypto')
      const uncached = cryptoItems.filter(i => {
        const c = priceCache.current[i.ticker]
        return !c || now - (c.ts || 0) >= CACHE_TTL
      })
      if (uncached.length) {
        const ids = uncached.map(i => i.ticker).join(',')
        try {
          const res = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
          )
          const data = await res.json()
          Object.entries(data).forEach(([id, d]) => {
            const entry = { price: d.usd, change: parseFloat((d.usd_24h_change || 0).toFixed(2)), ts: now }
            priceCache.current[id] = entry
            result[id] = entry
            newSparklines[id] = generateSparkline(entry.change)
          })
        } catch {}
      }
      // Include cached crypto
      cryptoItems.forEach(i => {
        const c = priceCache.current[i.ticker]
        if (c && !result[i.ticker]) {
          result[i.ticker] = c
          newSparklines[i.ticker] = generateSparkline(c.change)
        }
      })

      if (!cancelled) {
        savePriceCache(priceCache.current)
        setPrices(result)
        setSparklines(newSparklines)
      }
    }

    fetchAll()
    return () => { cancelled = true }
  }, [items])

  function addItem(ticker, name, category) {
    if (items.some(i => i.ticker === ticker)) return
    const updated = [...items, { ticker, name, category }]
    setItems(updated)
    saveWatchlist(updated)
    setInput('')
    setSuggestions([])
  }

  function removeItem(ticker) {
    const updated = items.filter(i => i.ticker !== ticker)
    setItems(updated)
    saveWatchlist(updated)
  }

  function handleInput(val) {
    setInput(val)
    if (!val.trim()) { setSuggestions([]); return }
    const upper = val.toUpperCase()
    const lower = val.toLowerCase()
    if (inputCategory === 'Stocks') {
      setSuggestions(POPULAR_STOCKS.filter(s =>
        s.ticker.startsWith(upper) || s.name.toLowerCase().startsWith(lower)
      ).slice(0, 5))
    } else {
      setSuggestions(POPULAR_CRYPTO.filter(s =>
        s.name.toLowerCase().includes(lower) || s.ticker.toLowerCase().startsWith(lower)
      ).slice(0, 5))
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && input.trim()) {
      const match = suggestions[0]
      if (match) {
        addItem(match.ticker, match.name, inputCategory)
      } else {
        const ticker = inputCategory === 'Stocks' ? input.trim().toUpperCase() : input.trim().toLowerCase()
        addItem(ticker, ticker, inputCategory)
      }
    }
  }

  return (
    <div style={{ maxWidth: 1600 }}>

      {/* Header */}
      <div className="fade-up" style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 600, fontFamily: 'var(--font-display)', letterSpacing: 0.3 }}>
          Watchlist
        </h1>
        <p style={{ fontSize: 14, color: 'var(--muted2)', marginTop: 8, fontFamily: 'var(--font-body)', fontWeight: 300 }}>
          Track assets you're watching before adding to your portfolio.
        </p>
      </div>

      {/* Market status + add input */}
      <div className="fade-up" style={{ marginBottom: 20, animationDelay: '60ms' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Category toggle */}
          {['Stocks', 'Crypto'].map(cat => (
            <button key={cat} onClick={() => { setInputCategory(cat); setInput(''); setSuggestions([]) }} style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
              background: inputCategory === cat ? 'var(--bg3)' : 'transparent',
              color: inputCategory === cat ? 'var(--text)' : 'var(--muted)',
              border: inputCategory === cat ? '1px solid var(--border2)' : '1px solid transparent',
              fontFamily: 'var(--font-body)', transition: 'all 0.15s',
            }}>{cat}</button>
          ))}

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: marketOpen ? 'var(--green)' : 'var(--muted)',
              animation: marketOpen ? 'pulse-green 2s infinite' : 'none',
            }} />
            <span style={{ fontSize: 11, color: marketOpen ? 'var(--green)' : 'var(--muted)', fontFamily: 'var(--font-body)' }}>
              {marketOpen ? 'Market open' : 'Market closed · Previous close'}
            </span>
          </div>
        </div>

        {/* Search input */}
        <div style={{ position: 'relative' }}>
          <input
            placeholder={inputCategory === 'Stocks' ? 'Search ticker or company (e.g. AAPL)…' : 'Search crypto (e.g. Bitcoin)…'}
            value={input}
            onChange={e => handleInput(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              width: '100%', padding: '12px 16px', borderRadius: 12,
              border: '1px solid var(--border2)', background: 'var(--bg2)',
              color: 'var(--text)', fontSize: 14, outline: 'none',
              fontFamily: 'var(--font-body)',
            }}
          />
          {suggestions.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20,
              background: 'var(--bg3)', border: '1px solid var(--border2)',
              borderRadius: 12, marginTop: 4, overflow: 'hidden',
            }}>
              {suggestions.map(s => (
                <div key={s.ticker} onClick={() => addItem(s.ticker, s.name, inputCategory)} style={{
                  padding: '11px 16px', cursor: 'pointer', fontSize: 13,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  fontFamily: 'var(--font-body)',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <AssetLogo ticker={s.ticker} category={inputCategory} size={28} />
                    <span style={{ fontWeight: 600, color: inputCategory === 'Stocks' ? 'var(--blue)' : 'var(--amber)' }}>
                      {inputCategory === 'Stocks' ? s.ticker : s.name}
                    </span>
                  </div>
                  <span style={{ color: 'var(--muted)', fontSize: 12 }}>
                    {inputCategory === 'Stocks' ? s.name : s.ticker}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick-add chips */}
      {items.length === 0 && (
        <div className="fade-up" style={{ marginBottom: 24, animationDelay: '100ms' }}>
          <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 10, fontFamily: 'var(--font-body)', letterSpacing: 1, textTransform: 'uppercase' }}>
            Quick add
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {QUICK_ADD.map(q => (
              <button key={q.ticker} onClick={() => addItem(q.ticker, q.name, q.category)} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 14px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
                background: 'var(--bg2)', border: '1px solid var(--border)',
                color: 'var(--text)', fontFamily: 'var(--font-body)',
                transition: 'all 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.background = 'var(--bg3)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg2)' }}
              >
                <AssetLogo ticker={q.ticker} category={q.category} size={22} />
                {q.ticker}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty state (no items) */}
      {items.length === 0 ? (
        <div className="fade-up" style={{
          background: 'var(--bg2)', borderRadius: 20, padding: '56px 32px',
          border: '1px solid var(--border)', textAlign: 'center',
          position: 'relative', overflow: 'hidden', animationDelay: '150ms',
        }}>
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            width: 400, height: 400, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(77,159,255,0.04) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            background: 'linear-gradient(135deg, rgba(77,159,255,0.12), rgba(45,212,191,0.08))',
            border: '1px solid rgba(77,159,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, margin: '0 auto 20px',
          }}>👁</div>
          <h2 style={{ fontSize: 20, fontWeight: 600, fontFamily: 'var(--font-display)', letterSpacing: 0.3, marginBottom: 8 }}>
            Your watchlist is empty
          </h2>
          <p style={{ fontSize: 14, color: 'var(--muted2)', fontFamily: 'var(--font-body)', fontWeight: 300, maxWidth: 320, margin: '0 auto 6px' }}>
            Search above to add stocks or crypto you're tracking.
          </p>
        </div>
      ) : (
        // Watchlist table
        <div className="fade-up table-scroll" style={{
          background: 'var(--bg2)', borderRadius: 16,
          border: '1px solid var(--border)', overflow: 'hidden',
          animationDelay: '120ms',
        }}>
          {/* Table header */}
          <div className="watchlist-table-header" style={{
            display: 'grid', gridTemplateColumns: '1fr 120px 110px 100px 130px 80px',
            padding: '12px 20px', borderBottom: '1px solid var(--border)',
            fontSize: 10, color: 'var(--muted)', fontWeight: 500,
            textTransform: 'uppercase', letterSpacing: 1.5, fontFamily: 'var(--font-body)',
          }}>
            <span>Asset</span>
            <span style={{ textAlign: 'right' }}>Price</span>
            <span style={{ textAlign: 'center' }}>24h</span>
            <span style={{ textAlign: 'center' }}>Trend</span>
            <span style={{ textAlign: 'center' }}>Action</span>
            <span style={{ textAlign: 'center' }}>Remove</span>
          </div>

          {items.map((item, i) => {
            const p = prices[item.ticker]
            const spark = sparklines[item.ticker]
            const change = p?.change ?? null
            return (
              <div key={item.ticker} className="watchlist-table-row" style={{
                display: 'grid', gridTemplateColumns: '1fr 120px 110px 100px 130px 80px',
                alignItems: 'center', padding: '14px 20px',
                borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none',
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* Name + logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <AssetLogo ticker={item.ticker} category={item.category} size={36} />
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 500, fontFamily: 'var(--font-body)' }}>{item.name}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>
                        {item.category === 'Stocks' ? item.ticker.toUpperCase() : item.ticker}
                      </span>
                      {!marketOpen && (
                        <span style={{
                          fontSize: 9, color: 'var(--muted)', fontFamily: 'var(--font-body)',
                          background: 'var(--bg3)', border: '1px solid var(--border)',
                          padding: '1px 6px', borderRadius: 10, letterSpacing: 0.5,
                          textTransform: 'uppercase',
                        }}>Prev close</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Price */}
                <p style={{ textAlign: 'right', fontWeight: 600, fontSize: 15,
                  fontFamily: 'var(--font-display)', letterSpacing: 0.3 }}>
                  {p?.price != null ? formatAmount(p.price, currency) : '—'}
                </p>

                {/* 24h change */}
                <div style={{ textAlign: 'center' }}>
                  {change != null ? (
                    <span style={{
                      fontSize: 12, fontWeight: 600,
                      color: change >= 0 ? 'var(--green)' : 'var(--red)',
                      background: change >= 0 ? 'var(--green-dim)' : 'var(--red-dim)',
                      padding: '3px 8px', borderRadius: 8,
                      fontFamily: 'var(--font-body)',
                    }}>
                      {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                    </span>
                  ) : (
                    <span style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>—</span>
                  )}
                </div>

                {/* Sparkline */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <Sparkline data={spark} change={change} />
                </div>

                {/* Add to portfolio */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <button onClick={() => onAddToPortfolio(item)} style={{
                    padding: '6px 12px', borderRadius: 8, fontSize: 11, cursor: 'pointer',
                    background: 'rgba(0,217,139,0.08)', color: 'var(--green)',
                    border: '1px solid rgba(0,217,139,0.2)',
                    fontFamily: 'var(--font-body)', fontWeight: 500,
                    transition: 'all 0.15s', whiteSpace: 'nowrap',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,217,139,0.15)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,217,139,0.08)' }}
                  >
                    + Portfolio
                  </button>
                </div>

                {/* Remove */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <button onClick={() => removeItem(item.ticker)} title="Remove" style={{
                    width: 28, height: 28, borderRadius: 8, background: 'transparent',
                    border: '1px solid var(--border)', color: 'var(--muted)',
                    fontSize: 16, cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--red-dim)'; e.currentTarget.style.borderColor = 'var(--red)'; e.currentTarget.style.color = 'var(--red)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)' }}
                  >×</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
