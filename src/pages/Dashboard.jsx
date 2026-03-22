import { useEffect, useState, useCallback, useRef } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import { useStockPrices } from '../useStockPrices'
import { startCheckout } from '../stripe'
import { supabase } from '../supabase'
import AssetLogo from '../components/AssetLogo'

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORY_COLORS = {
  'Stocks':      '#4d9fff',
  'Crypto':      '#ffb340',
  'Real Estate': '#00d98b',
  'Retirement':  '#a78bfa',
  'Cash':        '#6b6b80',
}
const CATEGORY_ICONS = {
  'Stocks': '📈', 'Crypto': '₿', 'Real Estate': '🏠', 'Retirement': '🏦', 'Cash': '💵'
}
const POPULAR_STOCKS = [
  { ticker: 'AAPL', name: 'Apple' },   { ticker: 'NVDA', name: 'NVIDIA' },
  { ticker: 'MSFT', name: 'Microsoft' },{ ticker: 'GOOGL', name: 'Google' },
  { ticker: 'AMZN', name: 'Amazon' },  { ticker: 'TSLA', name: 'Tesla' },
  { ticker: 'META', name: 'Meta' },    { ticker: 'JPM', name: 'JPMorgan' },
  { ticker: 'V', name: 'Visa' },       { ticker: 'SPY', name: 'S&P 500 ETF' },
  { ticker: 'QQQ', name: 'Nasdaq ETF' },
]
const POPULAR_CRYPTO = [
  { ticker: 'bitcoin',  name: 'Bitcoin (BTC)' },
  { ticker: 'ethereum', name: 'Ethereum (ETH)' },
  { ticker: 'solana',   name: 'Solana (SOL)' },
  { ticker: 'ripple',   name: 'XRP' },
  { ticker: 'dogecoin', name: 'Dogecoin (DOGE)' },
  { ticker: 'cardano',  name: 'Cardano (ADA)' },
]
const CATEGORIES = Object.keys(CATEGORY_COLORS)

// ─── Currency ─────────────────────────────────────────────────────────────────

export const CURRENCIES = {
  USD: { symbol: '$',  rate: 1,    label: 'USD' },
  EUR: { symbol: '€',  rate: 0.92, label: 'EUR' },
  GBP: { symbol: '£',  rate: 0.79, label: 'GBP' },
  ILS: { symbol: '₪',  rate: 3.7,  label: 'ILS' },
}

export function formatAmount(usdValue, currency = 'USD') {
  const c = CURRENCIES[currency] || CURRENCIES.USD
  return c.symbol + (usdValue * c.rate).toLocaleString(undefined, { maximumFractionDigits: 0 })
}

// ─── Greeting + name ─────────────────────────────────────────────────────────

function getFirstName(user) {
  const meta = user?.user_metadata
  if (meta?.full_name) return meta.full_name.split(' ')[0]
  if (meta?.name) return meta.name.split(' ')[0]
  if (user?.email) {
    const local = user.email.split('@')[0]
    const part = local.split(/[._\-+]/)[0]
    return part.charAt(0).toUpperCase() + part.slice(1)
  }
  return ''
}

function getGreeting(name = '') {
  const h = new Date().getHours()
  const base = h >= 5 && h < 12 ? 'Good morning' : h >= 12 && h < 18 ? 'Good afternoon' : h >= 18 && h < 22 ? 'Good evening' : 'Good night'
  const emoji = h >= 5 && h < 12 ? '🌅' : h >= 12 && h < 18 ? '☀️' : h >= 18 && h < 22 ? '🌆' : '🌙'
  return name ? `${base}, ${name} ${emoji}` : `${base} ${emoji}`
}

// ─── History helpers (Supabase format) ───────────────────────────────────────

function buildChartData(history, currentTotal) {
  if (!history.length) return null
  const byMonth = {}
  history.forEach(({ value, recorded_at }) => {
    const m = recorded_at.slice(0, 7)
    byMonth[m] = value
  })
  const months = Object.keys(byMonth).sort().slice(-5)
  const points = months.map(m => ({
    month: new Date(m + '-02').toLocaleDateString('en-US', { month: 'short' }),
    value: byMonth[m],
  }))
  const thisMonth = new Date().toISOString().slice(0, 7)
  if (months[months.length - 1] === thisMonth) {
    points[points.length - 1] = { month: 'Now', value: currentTotal }
  } else {
    points.push({ month: 'Now', value: currentTotal })
  }
  return points.length >= 2 ? points : null
}

function calcMonthChange(history, currentTotal) {
  if (!history.length) return null
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30)
  const older = history.filter(h => new Date(h.recorded_at) <= cutoff)
  if (!older.length) return null
  return currentTotal - older[older.length - 1].value
}

function calcSixMonthChange(history, currentTotal) {
  if (!history.length) return null
  const cutoff = new Date(); cutoff.setMonth(cutoff.getMonth() - 6)
  const older = history.filter(h => new Date(h.recorded_at) <= cutoff)
  if (!older.length) return null
  const prev = older[older.length - 1].value
  if (!prev) return null
  return ((currentTotal - prev) / prev) * 100
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function AddAssetModal({ onAdd, onClose, isPro, assetsCount, freeLimit, userEmail, prefill }) {
  const [category, setCategory] = useState(prefill?.category || 'Stocks')
  const [ticker, setTicker] = useState(prefill?.ticker || '')
  const [name, setName] = useState(prefill?.name || '')
  const [value, setValue] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const atLimit = !isPro && assetsCount >= freeLimit

  const inputStyle = {
    padding: '10px 14px', borderRadius: 10,
    border: '1px solid var(--border2)', background: 'var(--bg3)',
    color: 'var(--text)', fontSize: 14, outline: 'none',
    fontFamily: 'var(--font-body)', width: '100%',
  }

  function handleTickerInput(val) {
    setTicker(val.toUpperCase())
    setSuggestions(POPULAR_STOCKS.filter(s =>
      s.ticker.startsWith(val.toUpperCase()) || s.name.toLowerCase().startsWith(val.toLowerCase())
    ).slice(0, 4))
  }
  function handleCryptoInput(val) {
    setTicker(val)
    setSuggestions(POPULAR_CRYPTO.filter(s =>
      s.name.toLowerCase().includes(val.toLowerCase()) || s.ticker.toLowerCase().startsWith(val.toLowerCase())
    ).slice(0, 4))
  }
  function selectSuggestion(s) { setTicker(s.ticker); setName(s.name); setSuggestions([]) }

  function handleAdd() {
    if (!value) return
    if (category === 'Stocks' && !ticker) return
    if (category === 'Crypto' && !ticker) return
    if (['Real Estate', 'Retirement', 'Cash'].includes(category) && !name) return
    const finalName = category === 'Stocks'
      ? (POPULAR_STOCKS.find(s => s.ticker === ticker)?.name || ticker) + ' (' + ticker + ')'
      : category === 'Crypto'
        ? (POPULAR_CRYPTO.find(s => s.ticker === ticker)?.name || ticker)
        : name
    onAdd({ id: Date.now(), name: finalName, category, value: parseFloat(value),
      ticker: ['Stocks', 'Crypto'].includes(category) ? ticker : null })
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--bg2)', borderRadius: 20, padding: '28px',
        border: '1px solid var(--border2)', width: '100%', maxWidth: 480,
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <p style={{ fontWeight: 600, fontSize: 18, fontFamily: 'var(--font-display)', letterSpacing: 0.3 }}>Add asset</p>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: 20, cursor: 'pointer' }}>×</button>
        </div>

        {atLimit ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>✦</div>
            <p style={{ fontSize: 16, fontWeight: 600, fontFamily: 'var(--font-display)', marginBottom: 8 }}>Upgrade to Pro</p>
            <p style={{ fontSize: 13, color: 'var(--muted2)', marginBottom: 20, fontFamily: 'var(--font-body)' }}>
              You've used all {freeLimit} free assets. Upgrade for unlimited.
            </p>
            <button onClick={() => startCheckout(userEmail)} style={{
              background: 'linear-gradient(135deg, var(--green), var(--teal))',
              color: '#0a0a0f', padding: '10px 24px', borderRadius: 20,
              fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-display)',
            }}>Upgrade for $9.99/month →</button>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 20 }}>
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => { setCategory(cat); setTicker(''); setName(''); setSuggestions([]) }} style={{
                  padding: '10px 4px', borderRadius: 10, fontSize: 11,
                  fontWeight: category === cat ? 600 : 400,
                  background: category === cat ? CATEGORY_COLORS[cat] + '20' : 'var(--bg3)',
                  color: category === cat ? CATEGORY_COLORS[cat] : 'var(--muted)',
                  border: category === cat ? '1px solid ' + CATEGORY_COLORS[cat] + '50' : '1px solid var(--border)',
                  cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'var(--font-body)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                }}>
                  <span style={{ fontSize: 18 }}>{CATEGORY_ICONS[cat]}</span>{cat}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {category === 'Stocks' && (
                <div style={{ position: 'relative' }}>
                  <input placeholder="Ticker (e.g. AAPL)" value={ticker}
                    onChange={e => handleTickerInput(e.target.value)} style={inputStyle} />
                  {suggestions.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                      background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 10, marginTop: 4, overflow: 'hidden' }}>
                      {suggestions.map(s => (
                        <div key={s.ticker} onClick={() => selectSuggestion(s)} style={{
                          padding: '10px 14px', cursor: 'pointer', fontSize: 13,
                          display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-body)',
                        }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <span style={{ fontWeight: 600, color: 'var(--blue)' }}>{s.ticker}</span>
                          <span style={{ color: 'var(--muted)' }}>{s.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {category === 'Crypto' && (
                <div style={{ position: 'relative' }}>
                  <input placeholder="Search crypto (e.g. Bitcoin)" value={ticker}
                    onChange={e => handleCryptoInput(e.target.value)} style={inputStyle} />
                  {suggestions.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                      background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 10, marginTop: 4, overflow: 'hidden' }}>
                      {suggestions.map(s => (
                        <div key={s.ticker} onClick={() => selectSuggestion(s)} style={{
                          padding: '10px 14px', cursor: 'pointer', fontSize: 13,
                          display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-body)',
                        }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <span style={{ fontWeight: 600, color: 'var(--amber)' }}>{s.name}</span>
                          <span style={{ color: 'var(--muted)' }}>{s.ticker}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {['Real Estate', 'Retirement', 'Cash'].includes(category) && (
                <input placeholder={
                  category === 'Real Estate' ? 'Property description' :
                  category === 'Retirement' ? 'Account name (e.g. Fidelity 401k)' : 'Account name (e.g. Chase Checking)'
                } value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
              )}
              <input placeholder="Value (USD)" type="number" value={value}
                onChange={e => setValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()} style={inputStyle} />
              <button onClick={handleAdd} style={{
                background: 'linear-gradient(135deg, var(--green), var(--teal))',
                color: '#0a0a0f', padding: '12px', borderRadius: 10,
                fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-display)', letterSpacing: 0.5,
              }}>Add asset</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, subColor, delay = 0, accent }) {
  return (
    <div className="fade-up" style={{
      background: 'var(--bg2)', borderRadius: 16, padding: '22px 24px',
      border: '1px solid var(--border)', flex: 1, position: 'relative', overflow: 'hidden',
      animationDelay: delay + 'ms', transition: 'border-color 0.2s, transform 0.2s', cursor: 'default',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)' }}
    >
      {accent && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${accent}, transparent)`, borderRadius: '16px 16px 0 0' }} />}
      <p style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 10, letterSpacing: 1.5,
        textTransform: 'uppercase', fontWeight: 500, fontFamily: 'var(--font-body)' }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 600, lineHeight: 1, fontFamily: 'var(--font-display)', letterSpacing: 0.5 }}>{value}</p>
      {sub && <p style={{ fontSize: 12, color: subColor || 'var(--muted)', marginTop: 10,
        display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-body)' }}>{sub}</p>}
    </div>
  )
}

function WeeklySummaryCard({ user }) {
  const [enabled, setEnabled] = useState(user?.user_metadata?.weekly_summary === true)
  const [saving, setSaving] = useState(false)

  async function toggle() {
    const next = !enabled
    setEnabled(next)
    setSaving(true)
    try { await supabase.auth.updateUser({ data: { weekly_summary: next } }) } catch {}
    setSaving(false)
  }

  return (
    <div className="fade-up" style={{
      background: 'var(--bg2)', borderRadius: 16, padding: '20px 24px',
      border: '1px solid var(--border)', marginTop: 16, animationDelay: '350ms',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
    }}>
      <div>
        <p style={{ fontSize: 14, fontWeight: 500, fontFamily: 'var(--font-display)', letterSpacing: 0.2 }}>
          📬 Weekly portfolio summary
        </p>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, fontFamily: 'var(--font-body)' }}>
          {enabled
            ? "You'll receive a weekly portfolio summary by email."
            : 'Get a weekly overview of your portfolio sent to your inbox.'}
        </p>
      </div>
      <button onClick={toggle} disabled={saving} title={enabled ? 'Turn off' : 'Turn on'} style={{
        width: 44, height: 26, borderRadius: 13, border: 'none', cursor: saving ? 'default' : 'pointer',
        background: enabled ? 'var(--green)' : 'var(--bg3)',
        border: '1px solid ' + (enabled ? 'var(--green)' : 'var(--border2)'),
        position: 'relative', transition: 'background 0.2s, border-color 0.2s',
        flexShrink: 0, opacity: saving ? 0.6 : 1,
      }}>
        <div style={{
          width: 18, height: 18, borderRadius: '50%', background: '#fff',
          position: 'absolute', top: 3, left: enabled ? 23 : 3,
          transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }} />
      </button>
    </div>
  )
}

function EmptyState({ onAdd }) {
  return (
    <div className="fade-up" style={{
      background: 'var(--bg2)', borderRadius: 20, padding: '64px 32px',
      border: '1px solid var(--border)', textAlign: 'center', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,217,139,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ width: 72, height: 72, borderRadius: 20,
        background: 'linear-gradient(135deg, rgba(0,217,139,0.15), rgba(45,212,191,0.1))',
        border: '1px solid rgba(0,217,139,0.2)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 32, margin: '0 auto 24px' }}>💼</div>
      <h2 style={{ fontSize: 24, fontWeight: 600, fontFamily: 'var(--font-display)', letterSpacing: 0.3, marginBottom: 12 }}>
        Track your net worth
      </h2>
      <p style={{ fontSize: 15, color: 'var(--muted2)', fontFamily: 'var(--font-body)', fontWeight: 300,
        margin: '0 auto 32px', maxWidth: 380, lineHeight: 1.6 }}>
        Add your first asset — stocks, crypto, real estate, retirement accounts, or cash — and watch your wealth come to life.
      </p>
      <button onClick={onAdd} style={{
        background: 'linear-gradient(135deg, var(--green), var(--teal))',
        color: '#0a0a0f', padding: '12px 28px', borderRadius: 20,
        fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer',
        fontFamily: 'var(--font-display)', letterSpacing: 0.5,
        boxShadow: '0 0 30px rgba(0,217,139,0.25)', transition: 'opacity 0.15s',
      }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
      >+ Add your first asset</button>
      <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 16, fontFamily: 'var(--font-body)' }}>
        Free plan includes up to 5 assets
      </p>
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard({
  assets, isPro, user, showAddAsset, setShowAddAsset,
  saveAssets, freeLimit, setPage, netWorthHistory,
  currency, setCurrency, prefillAsset, onPrefillUsed,
}) {
  const [cryptoPrices, setCryptoPrices] = useState({})
  const { prices: stockPrices, lastUpdated: stockLastUpdated } = useStockPrices(assets)
  const [cryptoLastUpdated, setCryptoLastUpdated] = useState(null)
  const [clock, setClock] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const firstName = getFirstName(user)

  const total = assets.reduce((sum, a) => sum + (a.value || 0), 0)

  const history = netWorthHistory || []
  const chartData  = buildChartData(history, total)
  const monthChange = calcMonthChange(history, total)
  const sixMonthPct = calcSixMonthChange(history, total)

  // Combined "last updated" label
  const lastUpdated = stockLastUpdated || cryptoLastUpdated

  const pieData = Object.keys(CATEGORY_COLORS).map(cat => ({
    name: cat,
    value: assets.filter(a => a.category === cat).reduce((s, a) => s + (a.value || 0), 0),
  })).filter(d => d.value > 0)

  const topAssets = [...assets].sort((a, b) => b.value - a.value).slice(0, 5)

  useEffect(() => {
    const ids = assets.filter(a => a.category === 'Crypto' && a.ticker).map(a => a.ticker).join(',')
    if (!ids) return
    fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`)
      .then(r => r.json())
      .then(d => { setCryptoPrices(d); setCryptoLastUpdated(new Date()) })
      .catch(() => {})
  }, [assets])

  const cryptoChanges = assets
    .filter(a => a.category === 'Crypto' && a.ticker && cryptoPrices[a.ticker])
    .map(a => cryptoPrices[a.ticker].usd_24h_change)
  const avgCryptoChange = cryptoChanges.length
    ? cryptoChanges.reduce((s, c) => s + c, 0) / cryptoChanges.length : null

  const stockChanges = assets
    .filter(a => a.category === 'Stocks' && a.ticker && stockPrices[a.ticker])
    .map(a => stockPrices[a.ticker].change)
  const avgStockChange = stockChanges.length
    ? stockChanges.reduce((s, c) => s + c, 0) / stockChanges.length : null

  function getLiveChange(asset) {
    if (asset.category === 'Crypto' && asset.ticker && cryptoPrices[asset.ticker])
      return cryptoPrices[asset.ticker].usd_24h_change
    if (asset.category === 'Stocks' && asset.ticker && stockPrices[asset.ticker])
      return stockPrices[asset.ticker].change
    return null
  }

  function handleAddAsset(asset) { saveAssets([...assets, asset]) }

  // Chart tooltip — closure over currency
  const renderTooltip = useCallback(({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{ background: 'var(--bg3)', border: '1px solid var(--border2)',
        borderRadius: 12, padding: '12px 16px', backdropFilter: 'blur(10px)' }}>
        <p style={{ color: 'var(--muted)', marginBottom: 4, fontSize: 11, fontFamily: 'var(--font-body)', letterSpacing: 0.5 }}>{label}</p>
        <p style={{ fontWeight: 600, fontSize: 20, fontFamily: 'var(--font-display)', letterSpacing: 0.5 }}>
          {formatAmount(payload[0].value, currency)}
        </p>
      </div>
    )
  }, [currency])

  // ── Currency selector ────────────────────────────────────────────────────
  const currencySelector = (
    <select
      value={currency}
      onChange={e => setCurrency(e.target.value)}
      style={{
        background: 'var(--bg2)', color: 'var(--text)', border: '1px solid var(--border2)',
        borderRadius: 8, padding: '6px 10px', fontSize: 12, cursor: 'pointer',
        fontFamily: 'var(--font-body)', outline: 'none', appearance: 'none',
        WebkitAppearance: 'none',
      }}
    >
      {Object.entries(CURRENCIES).map(([k, v]) => (
        <option key={k} value={k}>{v.symbol} {k}</option>
      ))}
    </select>
  )

  // ── Upgrade / Pro badge ──────────────────────────────────────────────────
  const upgradeBtn = !isPro ? (
    <button
      onClick={() => startCheckout(user?.email)}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'linear-gradient(135deg, var(--green), var(--teal))',
        color: '#0a0a0f', padding: '7px 18px', borderRadius: 20,
        fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer',
        fontFamily: 'var(--font-display)', letterSpacing: 0.5,
        boxShadow: '0 0 18px rgba(0,217,139,0.25)', transition: 'opacity 0.15s',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
    >✦ Upgrade to Pro</button>
  ) : (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      background: 'rgba(0,217,139,0.08)', color: 'var(--green)',
      padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
      border: '1px solid rgba(0,217,139,0.2)', fontFamily: 'var(--font-body)',
      whiteSpace: 'nowrap',
    }}>✦ Pro</div>
  )

  // ── Last updated label ───────────────────────────────────────────────────
  const lastUpdatedLabel = lastUpdated
    ? '· Updated ' + lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : null

  const dateStr = clock.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const timeStr = clock.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  function handleCloseModal() {
    setShowAddAsset(false)
    onPrefillUsed?.()
  }

  // Empty state
  if (assets.length === 0) {
    return (
      <div style={{ maxWidth: 1100 }}>
        {showAddAsset && (
          <AddAssetModal onAdd={handleAddAsset} onClose={handleCloseModal}
            isPro={isPro} assetsCount={0} freeLimit={freeLimit} userEmail={user?.email}
            prefill={prefillAsset} key={prefillAsset?.ticker || 'modal'} />
        )}
        <div className="fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 36 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <p style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>{dateStr}</p>
              <p style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-body)', fontVariantNumeric: 'tabular-nums' }}>{timeStr}</p>
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 600, fontFamily: 'var(--font-display)', letterSpacing: 0.3 }}>
              {getGreeting(firstName)}
            </h1>
            <p style={{ fontSize: 14, color: 'var(--muted2)', marginTop: 8, fontFamily: 'var(--font-body)', fontWeight: 300 }}>
              Welcome to Wealthview — let's get started.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 4 }}>
            {currencySelector}{upgradeBtn}
          </div>
        </div>
        <EmptyState onAdd={() => setShowAddAsset(true)} />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1100 }}>

      {showAddAsset && (
        <AddAssetModal onAdd={handleAddAsset} onClose={handleCloseModal}
          isPro={isPro} assetsCount={assets.length} freeLimit={freeLimit} userEmail={user?.email}
          prefill={prefillAsset} key={prefillAsset?.ticker || 'modal'} />
      )}

      {/* ── Page header ── */}
      <div className="fade-up" style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%',
                background: 'var(--green)', animation: 'pulse-green 2s infinite' }} />
              <span style={{ fontSize: 10, color: 'var(--green)', fontWeight: 500,
                letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>Live</span>
              {lastUpdatedLabel && (
                <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>
                  {lastUpdatedLabel}
                </span>
              )}
              <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-body)', marginLeft: 4 }}>
                {dateStr}
              </span>
              <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-body)', fontVariantNumeric: 'tabular-nums' }}>
                · {timeStr}
              </span>
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 600, lineHeight: 1.1, fontFamily: 'var(--font-display)', letterSpacing: 0.3 }}>
              {getGreeting(firstName)}
            </h1>
            <p style={{ fontSize: 14, color: 'var(--muted2)', marginTop: 8, fontFamily: 'var(--font-body)', fontWeight: 300 }}>
              Here's your complete financial picture.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 4 }}>
            {currencySelector}{upgradeBtn}
          </div>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard
          label="Total net worth"
          value={formatAmount(total, currency)}
          sub={monthChange !== null
            ? (monthChange >= 0 ? '↑' : '↓') + ' ' + formatAmount(Math.abs(monthChange), currency) + ' this month'
            : 'Add more assets to track growth'}
          subColor={monthChange !== null ? (monthChange >= 0 ? 'var(--green)' : 'var(--red)') : 'var(--muted)'}
          delay={0} accent="var(--green)"
        />
        <StatCard
          label="Stocks 24h"
          value={avgStockChange != null ? (avgStockChange >= 0 ? '+' : '') + avgStockChange.toFixed(2) + '%' : '—'}
          sub={avgStockChange != null ? 'Avg. across your stocks' : 'Add stocks with tickers'}
          subColor={avgStockChange != null ? (avgStockChange >= 0 ? 'var(--green)' : 'var(--red)') : 'var(--muted)'}
          delay={80}
          accent={avgStockChange != null ? (avgStockChange >= 0 ? 'var(--green)' : 'var(--red)') : 'var(--blue)'}
        />
        <StatCard
          label="Crypto 24h"
          value={avgCryptoChange != null ? (avgCryptoChange >= 0 ? '+' : '') + avgCryptoChange.toFixed(2) + '%' : '—'}
          sub={avgCryptoChange != null ? 'Avg. across your crypto' : 'No crypto data yet'}
          subColor={avgCryptoChange != null ? (avgCryptoChange >= 0 ? 'var(--green)' : 'var(--red)') : 'var(--muted)'}
          delay={160}
          accent={avgCryptoChange != null ? (avgCryptoChange >= 0 ? 'var(--green)' : 'var(--red)') : 'var(--purple)'}
        />
      </div>

      {/* ── Chart + Allocation ── */}
      <div className="chart-grid" style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16, marginBottom: 24 }}>
        <div className="fade-up" style={{ background: 'var(--bg2)', borderRadius: 16, padding: '24px',
          border: '1px solid var(--border)', animationDelay: '200ms' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <div>
              <p style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1.5,
                fontWeight: 500, marginBottom: 6, fontFamily: 'var(--font-body)' }}>Net worth</p>
              <p style={{ fontSize: 24, fontWeight: 600, fontFamily: 'var(--font-display)', letterSpacing: 0.5 }}>
                {formatAmount(total, currency)}
              </p>
            </div>
            {sixMonthPct !== null && (
              <div style={{
                background: sixMonthPct >= 0 ? 'var(--green-dim)' : 'var(--red-dim)',
                color: sixMonthPct >= 0 ? 'var(--green)' : 'var(--red)',
                padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                border: `1px solid ${sixMonthPct >= 0 ? 'rgba(0,217,139,0.2)' : 'rgba(255,77,109,0.2)'}`,
                fontFamily: 'var(--font-body)',
              }}>
                {sixMonthPct >= 0 ? '+' : ''}{sixMonthPct.toFixed(1)}% 6mo
              </div>
            )}
          </div>

          {chartData ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 5, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#00d98b" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#00d98b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--muted)', fontFamily: 'Geologica' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip content={renderTooltip} />
                <Area type="monotone" dataKey="value" stroke="var(--green)" strokeWidth={2.5} fill="url(#chartGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
              <p style={{ fontSize: 13, color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>Chart populates as you track over time</p>
              <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-body)', opacity: 0.6 }}>Come back tomorrow to see your first data point</p>
            </div>
          )}
        </div>

        <div className="fade-up" style={{ background: 'var(--bg2)', borderRadius: 16, padding: '24px',
          border: '1px solid var(--border)', animationDelay: '250ms' }}>
          <p style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1.5,
            fontWeight: 500, marginBottom: 20, fontFamily: 'var(--font-body)' }}>Allocation</p>
          {pieData.length === 0 ? (
            <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 120, height: 120, borderRadius: '50%', border: '2px dashed var(--border2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-body)', textAlign: 'center', padding: 8 }}>No data yet</p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <PieChart width={160} height={160}>
                <Pie data={pieData} cx={75} cy={75} innerRadius={50} outerRadius={72} dataKey="value" strokeWidth={0} paddingAngle={3}>
                  {pieData.map(entry => <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name]} />)}
                </Pie>
              </PieChart>
            </div>
          )}
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pieData.map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: CATEGORY_COLORS[d.name], flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: 'var(--muted2)', flex: 1, fontFamily: 'var(--font-body)' }}>{d.name}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-display)', letterSpacing: 0.3 }}>
                  {Math.round(d.value / total * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Top holdings ── */}
      <div className="fade-up" style={{ background: 'var(--bg2)', borderRadius: 16,
        border: '1px solid var(--border)', overflow: 'hidden', animationDelay: '300ms' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontWeight: 600, fontSize: 16, fontFamily: 'var(--font-display)', letterSpacing: 0.3 }}>Top holdings</p>
          <button onClick={() => setPage('assets')} style={{
            fontSize: 12, color: 'var(--green)', background: 'transparent',
            border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 500 }}>
            View all →
          </button>
        </div>

        {topAssets.map((asset, i) => {
          const change = getLiveChange(asset)
          const pct = (asset.value / total * 100).toFixed(1)
          const livePrice = asset.category === 'Stocks' && asset.ticker && stockPrices[asset.ticker]
            ? stockPrices[asset.ticker].price : null
          return (
            <div key={asset.id} style={{ display: 'flex', alignItems: 'center', padding: '14px 24px',
              borderBottom: i < topAssets.length - 1 ? '1px solid var(--border)' : 'none',
              transition: 'background 0.15s', cursor: 'default' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{ width: 28, fontSize: 12, color: 'var(--muted)', fontWeight: 500, fontFamily: 'var(--font-display)' }}>#{i + 1}</div>
              <AssetLogo ticker={asset.ticker} category={asset.category} size={36} style={{ marginRight: 14 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 500, fontFamily: 'var(--font-body)' }}>{asset.name}</p>
                <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2, fontFamily: 'var(--font-body)' }}>
                  {asset.category}
                  {livePrice && <span style={{ marginLeft: 8, color: 'var(--muted2)' }}>
                    {formatAmount(livePrice, currency)} / share
                  </span>}
                </p>
              </div>
              <div style={{ textAlign: 'right', marginRight: 24 }}>
                <p style={{ fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-display)', letterSpacing: 0.3 }}>
                  {formatAmount(asset.value, currency)}
                </p>
                {change != null ? (
                  <p style={{ fontSize: 11, marginTop: 2, fontFamily: 'var(--font-body)', color: change >= 0 ? 'var(--green)' : 'var(--red)' }}>
                    {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(2)}%
                  </p>
                ) : (
                  <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2, fontFamily: 'var(--font-body)' }}>{pct}% of total</p>
                )}
              </div>
              <div className="holdings-bar" style={{ width: 80 }}>
                <div style={{ height: 4, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 2, width: pct + '%', background: CATEGORY_COLORS[asset.category], transition: 'width 1s ease' }} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Weekly summary card ── */}
      <WeeklySummaryCard user={user} />
    </div>
  )
}
