import { useEffect, useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import { useStockPrices } from '../useStockPrices'
import { startCheckout } from '../stripe'

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
  { ticker: 'AAPL', name: 'Apple' }, { ticker: 'NVDA', name: 'NVIDIA' },
  { ticker: 'MSFT', name: 'Microsoft' }, { ticker: 'GOOGL', name: 'Google' },
  { ticker: 'AMZN', name: 'Amazon' }, { ticker: 'TSLA', name: 'Tesla' },
  { ticker: 'META', name: 'Meta' }, { ticker: 'JPM', name: 'JPMorgan' },
  { ticker: 'V', name: 'Visa' }, { ticker: 'SPY', name: 'S&P 500 ETF' },
  { ticker: 'QQQ', name: 'Nasdaq ETF' },
]

const POPULAR_CRYPTO = [
  { ticker: 'bitcoin', name: 'Bitcoin (BTC)' }, { ticker: 'ethereum', name: 'Ethereum (ETH)' },
  { ticker: 'solana', name: 'Solana (SOL)' }, { ticker: 'ripple', name: 'XRP' },
  { ticker: 'dogecoin', name: 'Dogecoin (DOGE)' }, { ticker: 'cardano', name: 'Cardano (ADA)' },
]

const HISTORY = [
  { month: 'Oct', value: 380000 }, { month: 'Nov', value: 392000 },
  { month: 'Dec', value: 388000 }, { month: 'Jan', value: 401000 },
  { month: 'Feb', value: 419000 }, { month: 'Mar', value: 404400 },
]

const CATEGORIES = Object.keys(CATEGORY_COLORS)

function AddAssetModal({ onAdd, onClose, isPro, assetsCount, freeLimit }) {
  const [category, setCategory] = useState('Stocks')
  const [ticker, setTicker] = useState('')
  const [name, setName] = useState('')
  const [value, setValue] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const atLimit = !isPro && assetsCount >= freeLimit

  const inputStyle = {
    padding: '10px 14px', borderRadius: 10,
    border: '1px solid var(--border2)',
    background: 'var(--bg3)', color: 'var(--text)',
    fontSize: 14, outline: 'none', fontFamily: 'var(--font-body)', width: '100%',
  }

  function handleTickerInput(val) {
    setTicker(val.toUpperCase())
    const matches = POPULAR_STOCKS.filter(s =>
      s.ticker.startsWith(val.toUpperCase()) || s.name.toLowerCase().startsWith(val.toLowerCase())
    )
    setSuggestions(matches.slice(0, 4))
  }

  function handleCryptoInput(val) {
    setTicker(val)
    const matches = POPULAR_CRYPTO.filter(s =>
      s.name.toLowerCase().includes(val.toLowerCase()) || s.ticker.toLowerCase().startsWith(val.toLowerCase())
    )
    setSuggestions(matches.slice(0, 4))
  }

  function selectSuggestion(s) {
    setTicker(s.ticker)
    setName(s.name)
    setSuggestions([])
  }

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

    onAdd({
      id: Date.now(), name: finalName, category,
      value: parseFloat(value),
      ticker: ['Stocks', 'Crypto'].includes(category) ? ticker : null,
    })
    onClose()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--bg2)', borderRadius: 20, padding: '28px',
        border: '1px solid var(--border2)', width: '100%', maxWidth: 480,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <p style={{ fontWeight: 600, fontSize: 18, fontFamily: 'var(--font-display)', letterSpacing: 0.3 }}>
            Add asset
          </p>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none', color: 'var(--muted)',
            fontSize: 20, cursor: 'pointer',
          }}>×</button>
        </div>

        {atLimit ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>✦</div>
            <p style={{ fontSize: 16, fontWeight: 600, fontFamily: 'var(--font-display)', marginBottom: 8 }}>
              Upgrade to Pro
            </p>
            <p style={{ fontSize: 13, color: 'var(--muted2)', marginBottom: 20, fontFamily: 'var(--font-body)' }}>
              You've used all {freeLimit} free assets. Upgrade for unlimited.
            </p>
            <button onClick={() => startCheckout()} style={{
              background: 'linear-gradient(135deg, var(--green), var(--teal))',
              color: '#0a0a0f', padding: '10px 24px', borderRadius: 10,
              fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-display)',
            }}>
              Upgrade for $9.99/month →
            </button>
          </div>
        ) : (
          <>
            {/* Category selector */}
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
                  <span style={{ fontSize: 18 }}>{CATEGORY_ICONS[cat]}</span>
                  {cat}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {category === 'Stocks' && (
                <div style={{ position: 'relative' }}>
                  <input placeholder="Ticker (e.g. AAPL)" value={ticker}
                    onChange={e => handleTickerInput(e.target.value)} style={inputStyle} />
                  {suggestions.length > 0 && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                      background: 'var(--bg3)', border: '1px solid var(--border2)',
                      borderRadius: 10, marginTop: 4, overflow: 'hidden',
                    }}>
                      {suggestions.map(s => (
                        <div key={s.ticker} onClick={() => selectSuggestion(s)} style={{
                          padding: '10px 14px', cursor: 'pointer', fontSize: 13,
                          display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-body)',
                        }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
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
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                      background: 'var(--bg3)', border: '1px solid var(--border2)',
                      borderRadius: 10, marginTop: 4, overflow: 'hidden',
                    }}>
                      {suggestions.map(s => (
                        <div key={s.ticker} onClick={() => selectSuggestion(s)} style={{
                          padding: '10px 14px', cursor: 'pointer', fontSize: 13,
                          display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-body)',
                        }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <span style={{ fontWeight: 600, color: 'var(--amber)' }}>{s.name}</span>
                          <span style={{ color: 'var(--muted)' }}>{s.ticker}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {['Real Estate', 'Retirement', 'Cash'].includes(category) && (
                <input
                  placeholder={
                    category === 'Real Estate' ? 'Property description' :
                    category === 'Retirement' ? 'Account name (e.g. Fidelity 401k)' :
                    'Account name (e.g. Chase Checking)'
                  }
                  value={name} onChange={e => setName(e.target.value)} style={inputStyle}
                />
              )}

              <input
                placeholder="Value ($)" type="number" value={value}
                onChange={e => setValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                style={inputStyle}
              />

              <button onClick={handleAdd} style={{
                background: 'linear-gradient(135deg, var(--green), var(--teal))',
                color: '#0a0a0f', padding: '12px', borderRadius: 10,
                fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-display)', letterSpacing: 0.5,
              }}>
                Add asset
              </button>
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
      background: 'var(--bg2)', borderRadius: 16,
      padding: '22px 24px', border: '1px solid var(--border)',
      flex: 1, position: 'relative', overflow: 'hidden',
      animationDelay: delay + 'ms',
      transition: 'border-color 0.2s, transform 0.2s',
      cursor: 'default',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--border2)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {accent && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, ${accent}, transparent)`,
          borderRadius: '16px 16px 0 0',
        }} />
      )}
      <p style={{
        fontSize: 10, color: 'var(--muted)', marginBottom: 10,
        letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 500,
        fontFamily: 'var(--font-body)',
      }}>
        {label}
      </p>
      <p style={{
        fontSize: 28, fontWeight: 600, lineHeight: 1,
        fontFamily: 'var(--font-display)', letterSpacing: 0.5,
      }}>
        {value}
      </p>
      {sub && (
        <p style={{
          fontSize: 12, color: subColor || 'var(--muted)', marginTop: 10,
          display: 'flex', alignItems: 'center', gap: 4,
          fontFamily: 'var(--font-body)',
        }}>
          {sub}
        </p>
      )}
    </div>
  )
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg3)', border: '1px solid var(--border2)',
      borderRadius: 12, padding: '12px 16px', backdropFilter: 'blur(10px)',
    }}>
      <p style={{ color: 'var(--muted)', marginBottom: 4, fontSize: 11, fontFamily: 'var(--font-body)', letterSpacing: 0.5 }}>
        {label}
      </p>
      <p style={{ fontWeight: 600, fontSize: 20, fontFamily: 'var(--font-display)', letterSpacing: 0.5 }}>
        ${payload[0].value.toLocaleString()}
      </p>
    </div>
  )
}

export default function Dashboard({ assets, isPro, user, showAddAsset, setShowAddAsset, saveAssets, freeLimit, setPage }) {
  const [cryptoPrices, setCryptoPrices] = useState({})
  const stockPrices = useStockPrices(assets)

  const total = assets.reduce((sum, a) => sum + a.value, 0)
  const chartData = [...HISTORY.slice(0, -1), { month: 'Now', value: total }]

  const pieData = Object.keys(CATEGORY_COLORS).map(cat => ({
    name: cat,
    value: assets.filter(a => a.category === cat).reduce((s, a) => s + a.value, 0)
  })).filter(d => d.value > 0)

  const topAssets = [...assets].sort((a, b) => b.value - a.value).slice(0, 5)

  useEffect(() => {
    const ids = assets.filter(a => a.category === 'Crypto' && a.ticker).map(a => a.ticker).join(',')
    if (!ids) return
    fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`)
      .then(r => r.json()).then(setCryptoPrices).catch(() => {})
  }, [assets])

  const cryptoChanges = assets
    .filter(a => a.category === 'Crypto' && a.ticker && cryptoPrices[a.ticker])
    .map(a => cryptoPrices[a.ticker].usd_24h_change)

  const avgCryptoChange = cryptoChanges.length
    ? cryptoChanges.reduce((s, c) => s + c, 0) / cryptoChanges.length
    : null

  const stockChanges = assets
    .filter(a => a.category === 'Stocks' && a.ticker && stockPrices[a.ticker])
    .map(a => stockPrices[a.ticker].change)

  const avgStockChange = stockChanges.length
    ? stockChanges.reduce((s, c) => s + c, 0) / stockChanges.length
    : null

  function getLiveChange(asset) {
    if (asset.category === 'Crypto' && asset.ticker && cryptoPrices[asset.ticker]) {
      return cryptoPrices[asset.ticker].usd_24h_change
    }
    if (asset.category === 'Stocks' && asset.ticker && stockPrices[asset.ticker]) {
      return stockPrices[asset.ticker].change
    }
    return null
  }

  function handleAddAsset(asset) {
    saveAssets([...assets, asset])
  }

  return (
    <div style={{ maxWidth: 1100 }}>

      {/* Add asset modal */}
      {showAddAsset && (
        <AddAssetModal
          onAdd={handleAddAsset}
          onClose={() => setShowAddAsset(false)}
          isPro={isPro}
          assetsCount={assets.length}
          freeLimit={freeLimit}
        />
      )}

      {/* Page header */}
      <div className="fade-up" style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: 'var(--green)', animation: 'pulse-green 2s infinite',
            }} />
            <span style={{
              fontSize: 10, color: 'var(--green)', fontWeight: 500,
              letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'var(--font-body)',
            }}>
              Live
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Add asset button */}
            <button
              onClick={() => setShowAddAsset(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'var(--bg2)', color: 'var(--text)',
                padding: '8px 16px', borderRadius: 20,
                fontSize: 12, fontWeight: 500, border: '1px solid var(--border2)',
                cursor: 'pointer', fontFamily: 'var(--font-body)',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border2)'}
            >
              + Add asset
            </button>

            {/* Upgrade button */}
            {!isPro && (
              <button
                onClick={() => startCheckout(user?.email)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'linear-gradient(135deg, var(--green), var(--teal))',
                  color: '#0a0a0f', padding: '8px 18px', borderRadius: 20,
                  fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font-display)', letterSpacing: 0.5,
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                ✦ Upgrade to Pro — $9.99/mo
              </button>
            )}

            {/* Pro badge */}
            {isPro && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(0,217,139,0.1)', color: 'var(--green)',
                padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                border: '1px solid rgba(0,217,139,0.2)', fontFamily: 'var(--font-body)',
              }}>
                ✦ Pro plan
              </div>
            )}
          </div>
        </div>

        <h1 style={{ fontSize: 36, fontWeight: 600, lineHeight: 1.1, fontFamily: 'var(--font-display)', letterSpacing: 0.5 }}>
          Good day 👋
        </h1>
        <p style={{ fontSize: 14, color: 'var(--muted2)', marginTop: 8, fontFamily: 'var(--font-body)', fontWeight: 300 }}>
          Here's your complete financial picture.
        </p>
      </div>

      {/* Stat cards */}
      <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard
          label="Total net worth"
          value={"$" + total.toLocaleString()}
          sub="↑ $24,400 this month"
          subColor="var(--green)" delay={0} accent="var(--green)"
        />
        <StatCard
          label="Stocks 24h"
          value={avgStockChange != null ? (avgStockChange >= 0 ? '+' : '') + avgStockChange.toFixed(2) + '%' : '—'}
          sub={avgStockChange != null ? "Avg. across your stocks" : "Add stocks with tickers"}
          subColor={avgStockChange != null ? (avgStockChange >= 0 ? 'var(--green)' : 'var(--red)') : 'var(--muted)'}
          delay={80}
          accent={avgStockChange != null ? (avgStockChange >= 0 ? 'var(--green)' : 'var(--red)') : 'var(--blue)'}
        />
        <StatCard
          label="Crypto 24h"
          value={avgCryptoChange != null ? (avgCryptoChange >= 0 ? '+' : '') + avgCryptoChange.toFixed(2) + '%' : '—'}
          sub={avgCryptoChange != null ? "Avg. across your crypto" : "No crypto data yet"}
          subColor={avgCryptoChange != null ? (avgCryptoChange >= 0 ? 'var(--green)' : 'var(--red)') : 'var(--muted)'}
          delay={160}
          accent={avgCryptoChange != null ? (avgCryptoChange >= 0 ? 'var(--green)' : 'var(--red)') : 'var(--purple)'}
        />
      </div>

      {/* Chart + Allocation */}
      <div className="chart-grid" style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16, marginBottom: 24 }}>
        <div className="fade-up" style={{
          background: 'var(--bg2)', borderRadius: 16, padding: '24px',
          border: '1px solid var(--border)', animationDelay: '200ms',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <div>
              <p style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 500, marginBottom: 6, fontFamily: 'var(--font-body)' }}>
                Net worth
              </p>
              <p style={{ fontSize: 24, fontWeight: 600, fontFamily: 'var(--font-display)', letterSpacing: 0.5 }}>
                ${total.toLocaleString()}
              </p>
            </div>
            <div style={{
              background: 'var(--green-dim)', color: 'var(--green)',
              padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
              border: '1px solid rgba(0,217,139,0.2)', fontFamily: 'var(--font-body)',
            }}>
              +6.4% 6mo
            </div>
          </div>
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
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="value" stroke="var(--green)" strokeWidth={2.5} fill="url(#chartGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="fade-up" style={{
          background: 'var(--bg2)', borderRadius: 16, padding: '24px',
          border: '1px solid var(--border)', animationDelay: '250ms',
        }}>
          <p style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 500, marginBottom: 20, fontFamily: 'var(--font-body)' }}>
            Allocation
          </p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <PieChart width={160} height={160}>
              <Pie data={pieData} cx={75} cy={75} innerRadius={50} outerRadius={72} dataKey="value" strokeWidth={0} paddingAngle={3}>
                {pieData.map(entry => <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name]} />)}
              </Pie>
            </PieChart>
          </div>
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

      {/* Top assets */}
      <div className="fade-up" style={{
        background: 'var(--bg2)', borderRadius: 16,
        border: '1px solid var(--border)', overflow: 'hidden', animationDelay: '300ms',
      }}>
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <p style={{ fontWeight: 600, fontSize: 16, fontFamily: 'var(--font-display)', letterSpacing: 0.3 }}>
            Top holdings
          </p>
          <button
            onClick={() => setPage('assets')}
            style={{
              fontSize: 12, color: 'var(--green)', background: 'transparent',
              border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)',
              fontWeight: 500,
            }}
          >
            View all →
          </button>
        </div>

        {topAssets.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: 'var(--muted)', fontFamily: 'var(--font-body)', marginBottom: 16 }}>
              No assets yet. Add your first one!
            </p>
            <button onClick={() => setShowAddAsset(true)} style={{
              background: 'linear-gradient(135deg, var(--green), var(--teal))',
              color: '#0a0a0f', padding: '10px 24px', borderRadius: 10,
              fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-display)',
            }}>
              + Add your first asset
            </button>
          </div>
        )}

        {topAssets.map((asset, i) => {
          const change = getLiveChange(asset)
          const pct = (asset.value / total * 100).toFixed(1)
          const livePrice = asset.category === 'Stocks' && asset.ticker && stockPrices[asset.ticker]
            ? stockPrices[asset.ticker].price
            : null

          return (
            <div key={asset.id} style={{
              display: 'flex', alignItems: 'center', padding: '14px 24px',
              borderBottom: i < topAssets.length - 1 ? '1px solid var(--border)' : 'none',
              transition: 'background 0.15s', cursor: 'default',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ width: 28, fontSize: 12, color: 'var(--muted)', fontWeight: 500, fontFamily: 'var(--font-display)' }}>
                #{i + 1}
              </div>
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: CATEGORY_COLORS[asset.category] + '22',
                border: '1px solid ' + CATEGORY_COLORS[asset.category] + '44',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, marginRight: 14,
              }}>
                {CATEGORY_ICONS[asset.category]}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 500, fontFamily: 'var(--font-body)' }}>{asset.name}</p>
                <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2, fontFamily: 'var(--font-body)' }}>
                  {asset.category}
                  {livePrice && (
                    <span style={{ marginLeft: 8, color: 'var(--muted2)' }}>
                      ${livePrice.toLocaleString()} / share
                    </span>
                  )}
                </p>
              </div>
              <div style={{ textAlign: 'right', marginRight: 24 }}>
                <p style={{ fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-display)', letterSpacing: 0.3 }}>
                  ${asset.value.toLocaleString()}
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
    </div>
  )
}