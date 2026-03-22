import { useState } from 'react'
import { startCheckout } from '../stripe'

const CATEGORY_COLORS = {
  'Stocks':      '#4d9fff',
  'Crypto':      '#ffb340',
  'Real Estate': '#00d98b',
  'Retirement':  '#a78bfa',
  'Cash':        '#6b6b80',
}

const CATEGORIES = Object.keys(CATEGORY_COLORS)

const CATEGORY_ICONS = {
  'Stocks':      '📈',
  'Crypto':      '₿',
  'Real Estate': '🏠',
  'Retirement':  '🏦',
  'Cash':        '💵',
}

const POPULAR_STOCKS = [
  { ticker: 'AAPL',  name: 'Apple' },
  { ticker: 'NVDA',  name: 'NVIDIA' },
  { ticker: 'MSFT',  name: 'Microsoft' },
  { ticker: 'GOOGL', name: 'Google' },
  { ticker: 'AMZN',  name: 'Amazon' },
  { ticker: 'TSLA',  name: 'Tesla' },
  { ticker: 'META',  name: 'Meta' },
  { ticker: 'BRK.B', name: 'Berkshire Hathaway' },
  { ticker: 'JPM',   name: 'JPMorgan' },
  { ticker: 'V',     name: 'Visa' },
  { ticker: 'SPY',   name: 'S&P 500 ETF' },
  { ticker: 'QQQ',   name: 'Nasdaq ETF' },
]

const POPULAR_CRYPTO = [
  { ticker: 'bitcoin',  name: 'Bitcoin (BTC)' },
  { ticker: 'ethereum', name: 'Ethereum (ETH)' },
  { ticker: 'solana',   name: 'Solana (SOL)' },
  { ticker: 'ripple',   name: 'XRP' },
  { ticker: 'dogecoin', name: 'Dogecoin (DOGE)' },
  { ticker: 'cardano',  name: 'Cardano (ADA)' },
]

function AddForm({ onAdd, onClose }) {
  const [category, setCategory] = useState('Stocks')
  const [ticker, setTicker] = useState('')
  const [name, setName] = useState('')
  const [value, setValue] = useState('')
  const [suggestions, setSuggestions] = useState([])

  const inputStyle = {
    padding: '10px 14px', borderRadius: 10,
    border: '1px solid var(--border2)',
    background: 'var(--bg3)', color: 'var(--text)',
    fontSize: 14, outline: 'none', fontFamily: 'var(--font-body)',
    width: '100%',
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
      id: Date.now(),
      name: finalName,
      category,
      value: parseFloat(value),
      ticker: ['Stocks', 'Crypto'].includes(category) ? ticker : null,
    })

    setTicker('')
    setName('')
    setValue('')
    setSuggestions([])
    onClose()
  }

  return (
    <div className="fade-up" style={{
      background: 'var(--bg2)', borderRadius: 16, padding: '24px',
      border: '1px solid var(--border2)', marginBottom: 20,
    }}>
      <p style={{ fontWeight: 600, marginBottom: 20, fontSize: 16, fontFamily: 'var(--font-display)', letterSpacing: 0.3 }}>
        New asset
      </p>

      {/* Category selector */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 20 }}>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => { setCategory(cat); setTicker(''); setName(''); setSuggestions([]) }} style={{
            padding: '10px 8px', borderRadius: 10, fontSize: 12,
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

      {/* Dynamic fields */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12 }}>

        {/* Stocks */}
        {category === 'Stocks' && (
          <div style={{ position: 'relative' }}>
            <input
              placeholder="Ticker (e.g. AAPL)"
              value={ticker}
              onChange={e => handleTickerInput(e.target.value)}
              style={inputStyle}
            />
            {suggestions.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                background: 'var(--bg3)', border: '1px solid var(--border2)',
                borderRadius: 10, marginTop: 4, overflow: 'hidden',
              }}>
                {suggestions.map(s => (
                  <div key={s.ticker} onClick={() => selectSuggestion(s)} style={{
                    padding: '10px 14px', cursor: 'pointer', fontSize: 13,
                    display: 'flex', justifyContent: 'space-between',
                    fontFamily: 'var(--font-body)', transition: 'background 0.1s',
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

        {/* Crypto */}
        {category === 'Crypto' && (
          <div style={{ position: 'relative' }}>
            <input
              placeholder="Search crypto (e.g. Bitcoin)"
              value={ticker}
              onChange={e => handleCryptoInput(e.target.value)}
              style={inputStyle}
            />
            {suggestions.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                background: 'var(--bg3)', border: '1px solid var(--border2)',
                borderRadius: 10, marginTop: 4, overflow: 'hidden',
              }}>
                {suggestions.map(s => (
                  <div key={s.ticker} onClick={() => selectSuggestion(s)} style={{
                    padding: '10px 14px', cursor: 'pointer', fontSize: 13,
                    display: 'flex', justifyContent: 'space-between',
                    fontFamily: 'var(--font-body)', transition: 'background 0.1s',
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

        {/* Other categories */}
        {['Real Estate', 'Retirement', 'Cash'].includes(category) && (
          <input
            placeholder={
              category === 'Real Estate' ? 'Property description' :
              category === 'Retirement' ? 'Account name (e.g. Fidelity 401k)' :
              'Account name (e.g. Chase Checking)'
            }
            value={name}
            onChange={e => setName(e.target.value)}
            style={inputStyle}
          />
        )}

        <input
          placeholder="Value ($)"
          type="number"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          style={inputStyle}
        />

        <button onClick={handleAdd} style={{
          background: 'linear-gradient(135deg, var(--green), var(--teal))',
          color: '#0a0a0f', padding: '10px 22px', borderRadius: 10,
          fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
          fontFamily: 'var(--font-display)', letterSpacing: 0.5, whiteSpace: 'nowrap',
        }}>
          Save
        </button>
      </div>
    </div>
  )
}

function UpgradeWall({ userEmail }) {
  return (
    <div style={{
      background: 'var(--bg2)', borderRadius: 16, padding: '40px 32px',
      border: '1px solid rgba(0,217,139,0.2)', marginBottom: 20,
      textAlign: 'center', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)',
        width: 200, height: 200, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,217,139,0.08), transparent)',
        pointerEvents: 'none',
      }} />
      <div style={{ fontSize: 36, marginBottom: 12 }}>✦</div>
      <h2 style={{ fontSize: 22, fontWeight: 600, fontFamily: 'var(--font-display)', marginBottom: 8 }}>
        Upgrade to Pro
      </h2>
      <p style={{ fontSize: 14, color: 'var(--muted2)', marginBottom: 24, fontFamily: 'var(--font-body)', maxWidth: 360, margin: '0 auto 24px' }}>
        You've reached the 5 asset limit on the free plan. Upgrade to Pro for unlimited assets, live stock prices, and more.
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 20 }}>
        {['Unlimited assets', 'Live stock prices', 'Crypto tracking', 'Priority support'].map(f => (
          <div key={f} style={{
            fontSize: 12, padding: '5px 12px', borderRadius: 20,
            background: 'rgba(0,217,139,0.1)', color: 'var(--green)',
            border: '1px solid rgba(0,217,139,0.2)', fontFamily: 'var(--font-body)',
          }}>
            ✓ {f}
          </div>
        ))}
      </div>
      <button
        onClick={() => startCheckout(userEmail)}
        style={{
          background: 'linear-gradient(135deg, var(--green), var(--teal))',
          color: '#0a0a0f', padding: '12px 32px', borderRadius: 10,
          fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer',
          fontFamily: 'var(--font-display)', letterSpacing: 0.5,
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
      >
        Upgrade for $9.99/month →
      </button>
      <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 12, fontFamily: 'var(--font-body)' }}>
        Cancel anytime. No hidden fees.
      </p>
    </div>
  )
}

export default function Assets({ assets, setAssets, isPro, freeLimit }) {
  const [showAdd, setShowAdd] = useState(false)
  const [filter, setFilter] = useState('All')

  const total = assets.reduce((s, a) => s + a.value, 0)
  const filtered = filter === 'All' ? assets : assets.filter(a => a.category === filter)
  const atLimit = !isPro && assets.length >= freeLimit

  function addAsset(asset) {
    if (atLimit) return
    setAssets([...assets, asset])
    setShowAdd(false)
  }

  function removeAsset(id) {
    setAssets(assets.filter(a => a.id !== id))
  }

  return (
    <div style={{ maxWidth: 1100 }}>

      {/* Header */}
      <div className="fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 36 }}>
        <div>
          <h1 style={{ fontSize: 36, fontWeight: 600, lineHeight: 1.1, fontFamily: 'var(--font-display)', letterSpacing: 0.5 }}>
            Assets
          </h1>
          <p style={{ fontSize: 14, color: 'var(--muted2)', marginTop: 8, fontFamily: 'var(--font-body)', fontWeight: 300 }}>
            {isPro ? 'Unlimited assets — Pro plan' : `${assets.length} of ${freeLimit} assets used — Free plan`}
          </p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          style={{
            background: atLimit && !showAdd
              ? 'var(--bg3)'
              : 'linear-gradient(135deg, var(--green), var(--teal))',
            color: atLimit && !showAdd ? 'var(--muted)' : '#0a0a0f',
            padding: '10px 22px', borderRadius: 10,
            fontSize: 14, fontWeight: 600, border: atLimit && !showAdd ? '1px solid var(--border)' : 'none',
            cursor: 'pointer', fontFamily: 'var(--font-display)',
            letterSpacing: 0.5, transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => { if (!atLimit) e.currentTarget.style.opacity = '0.85' }}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          {showAdd ? '✕ Cancel' : atLimit ? '⚡ Upgrade to add more' : '+ Add asset'}
        </button>
      </div>

      {/* Summary strip */}
      <div className="summary-grid fade-up" style={{
        display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 12, marginBottom: 24, animationDelay: '80ms',
      }}>
        {CATEGORIES.map(cat => {
          const catTotal = assets.filter(a => a.category === cat).reduce((s, a) => s + a.value, 0)
          const pct = total > 0 ? (catTotal / total * 100).toFixed(0) : 0
          const active = filter === cat
          return (
            <div key={cat} onClick={() => setFilter(active ? 'All' : cat)} style={{
              background: active ? CATEGORY_COLORS[cat] + '15' : 'var(--bg2)',
              borderRadius: 14, padding: '16px',
              border: active ? '1px solid ' + CATEGORY_COLORS[cat] + '50' : '1px solid var(--border)',
              cursor: 'pointer', transition: 'all 0.15s',
            }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>{CATEGORY_ICONS[cat]}</div>
              <p style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 6, fontFamily: 'var(--font-body)', letterSpacing: 1, textTransform: 'uppercase' }}>
                {cat}
              </p>
              <p style={{ fontSize: 16, fontWeight: 600, fontFamily: 'var(--font-display)', letterSpacing: 0.3 }}>
                {catTotal > 0 ? '$' + catTotal.toLocaleString() : '—'}
              </p>
              <p style={{ fontSize: 11, color: CATEGORY_COLORS[cat], marginTop: 4, fontWeight: 500, fontFamily: 'var(--font-body)' }}>
                {pct}% of portfolio
              </p>
            </div>
          )
        })}
      </div>

      {/* Add form or upgrade wall */}
      {showAdd && (
        atLimit
          ? <UpgradeWall />
          : <AddForm onAdd={addAsset} onClose={() => setShowAdd(false)} />
      )}

      {/* Free tier progress bar */}
      {!isPro && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>
              Free plan usage
            </span>
            <span style={{ fontSize: 11, color: atLimit ? 'var(--red)' : 'var(--muted)', fontFamily: 'var(--font-body)' }}>
              {assets.length} / {freeLimit} assets
            </span>
          </div>
          <div style={{ height: 4, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 2,
              width: Math.min((assets.length / freeLimit) * 100, 100) + '%',
              background: atLimit ? 'var(--red)' : 'linear-gradient(90deg, var(--green), var(--teal))',
              transition: 'width 0.5s ease',
            }} />
          </div>
        </div>
      )}

      {/* Filter pills */}
      <div className="filter-pills" style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {['All', ...CATEGORIES].map(cat => (
          <button key={cat} onClick={() => setFilter(cat)} style={{
            padding: '5px 16px', borderRadius: 20, fontSize: 12,
            fontWeight: filter === cat ? 500 : 400,
            background: filter === cat ? 'var(--text)' : 'transparent',
            color: filter === cat ? 'var(--bg)' : 'var(--muted)',
            border: '1px solid ' + (filter === cat ? 'var(--text)' : 'var(--border)'),
            cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'var(--font-body)',
            whiteSpace: 'nowrap',
          }}>
            {cat}
          </button>
        ))}
      </div>

      {/* Asset table */}
      <div className="fade-up" style={{
        background: 'var(--bg2)', borderRadius: 16,
        border: '1px solid var(--border)', overflow: 'hidden', animationDelay: '200ms',
      }}>
        <div className="asset-table-header" style={{
          display: 'grid', gridTemplateColumns: '1fr 130px 130px 100px 50px',
          padding: '12px 24px', borderBottom: '1px solid var(--border)',
          fontSize: 10, color: 'var(--muted)', fontWeight: 500,
          textTransform: 'uppercase', letterSpacing: 1.5, fontFamily: 'var(--font-body)',
        }}>
          <span>Asset</span>
          <span>Category</span>
          <span style={{ textAlign: 'right' }}>Value</span>
          <span style={{ textAlign: 'right' }}>Share</span>
          <span></span>
        </div>

        {filtered.length === 0 && (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--muted)' }}>
            <p style={{ fontSize: 16, fontFamily: 'var(--font-display)', letterSpacing: 0.3 }}>
              No assets yet. Click + Add asset to get started.
            </p>
          </div>
        )}

        {filtered.map((asset, i) => {
          const pct = (asset.value / total * 100)
          return (
            <div key={asset.id} className="asset-table-row" style={{
              display: 'grid', gridTemplateColumns: '1fr 130px 130px 100px 50px',
              alignItems: 'center', padding: '16px 24px',
              borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                  background: CATEGORY_COLORS[asset.category] + '18',
                  border: '1px solid ' + CATEGORY_COLORS[asset.category] + '35',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                }}>
                  {CATEGORY_ICONS[asset.category]}
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500, fontFamily: 'var(--font-body)' }}>{asset.name}</p>
                  {asset.ticker && (
                    <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2, fontFamily: 'var(--font-body)' }}>
                      {asset.category === 'Stocks' ? asset.ticker.toUpperCase() : asset.ticker}
                    </p>
                  )}
                </div>
              </div>

              <span className="category-badge" style={{
                fontSize: 11, padding: '4px 10px', borderRadius: 20,
                background: CATEGORY_COLORS[asset.category] + '18',
                color: CATEGORY_COLORS[asset.category],
                border: '1px solid ' + CATEGORY_COLORS[asset.category] + '35',
                fontWeight: 500, width: 'fit-content', fontFamily: 'var(--font-body)',
              }}>
                {asset.category}
              </span>

              <p className="asset-value" style={{
                fontSize: 15, fontWeight: 600, textAlign: 'right',
                fontFamily: 'var(--font-display)', letterSpacing: 0.3,
              }}>
                ${asset.value.toLocaleString()}
              </p>

              <div className="share-bar" style={{ paddingLeft: 10 }}>
                <p style={{ fontSize: 12, color: 'var(--muted2)', marginBottom: 4, textAlign: 'right', fontFamily: 'var(--font-body)' }}>
                  {pct.toFixed(1)}%
                </p>
                <div style={{ height: 4, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 2, width: pct + '%', background: CATEGORY_COLORS[asset.category], transition: 'width 1s ease' }} />
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <button onClick={() => removeAsset(asset.id)} style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: 'transparent', border: '1px solid var(--border)',
                  color: 'var(--muted)', fontSize: 16, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'var(--red-dim)'
                    e.currentTarget.style.borderColor = 'var(--red)'
                    e.currentTarget.style.color = 'var(--red)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.borderColor = 'var(--border)'
                    e.currentTarget.style.color = 'var(--muted)'
                  }}
                >
                  ×
                </button>
              </div>
            </div>
          )
        })}

        {/* Total row */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 130px 130px 100px 50px',
          padding: '16px 24px', borderTop: '1px solid var(--border2)',
          background: 'var(--bg3)',
        }}>
          <p style={{ fontSize: 13, color: 'var(--muted2)', fontFamily: 'var(--font-body)', fontWeight: 400, letterSpacing: 0.5 }}>
            {filter === 'All' ? 'Total' : filter + ' total'}
          </p>
          <span />
          <p style={{ fontSize: 17, fontWeight: 600, textAlign: 'right', fontFamily: 'var(--font-display)', color: 'var(--green)', letterSpacing: 0.3 }}>
            ${filtered.reduce((s, a) => s + a.value, 0).toLocaleString()}
          </p>
          <span /><span />
        </div>
      </div>
    </div>
  )
}