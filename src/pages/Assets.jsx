import { useState } from 'react'

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

export default function Assets({ assets, setAssets }) {
  const [showAdd, setShowAdd] = useState(false)
  const [filter, setFilter] = useState('All')
  const [form, setForm] = useState({ name: '', category: 'Stocks', value: '', ticker: '' })

  const total = assets.reduce((s, a) => s + a.value, 0)
  const filtered = filter === 'All' ? assets : assets.filter(a => a.category === filter)

  function addAsset() {
    if (!form.name || !form.value) return
    setAssets([...assets, {
      id: Date.now(),
      name: form.name,
      category: form.category,
      value: parseFloat(form.value),
      ticker: form.ticker || null,
    }])
    setForm({ name: '', category: 'Stocks', value: '', ticker: '' })
    setShowAdd(false)
  }

  function removeAsset(id) {
    setAssets(assets.filter(a => a.id !== id))
  }

  return (
    <div style={{ maxWidth: 1100 }}>

      {/* Header */}
      <div className="fade-up" style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: 36
      }}>
        <div>
          <h1 style={{
            fontSize: 42, fontWeight: 600, lineHeight: 1.1,
            fontFamily: 'var(--font-display)', letterSpacing: 0.5,
          }}>
            Assets
          </h1>
          <p style={{
            fontSize: 14, color: 'var(--muted2)', marginTop: 8,
            fontFamily: 'var(--font-body)', fontWeight: 300,
          }}>
            Manage and track all your holdings
          </p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          style={{
            background: 'linear-gradient(135deg, var(--green), var(--teal))',
            color: '#0a0a0f', padding: '10px 22px', borderRadius: 10,
            fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-display)', letterSpacing: 0.5,
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          + Add asset
        </button>
      </div>

      {/* Summary strip */}
      <div className="fade-up" style={{
        display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 12, marginBottom: 24, animationDelay: '80ms',
      }}>
        {CATEGORIES.map(cat => {
          const catTotal = assets.filter(a => a.category === cat).reduce((s, a) => s + a.value, 0)
          const pct = total > 0 ? (catTotal / total * 100).toFixed(0) : 0
          const active = filter === cat
          return (
            <div
              key={cat}
              onClick={() => setFilter(active ? 'All' : cat)}
              style={{
                background: active ? CATEGORY_COLORS[cat] + '15' : 'var(--bg2)',
                borderRadius: 14, padding: '16px',
                border: active ? '1px solid ' + CATEGORY_COLORS[cat] + '50' : '1px solid var(--border)',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 8 }}>{CATEGORY_ICONS[cat]}</div>
              <p style={{
                fontSize: 10, color: 'var(--muted)', marginBottom: 6,
                fontFamily: 'var(--font-body)', letterSpacing: 1, textTransform: 'uppercase',
              }}>
                {cat}
              </p>
              <p style={{
                fontSize: 18, fontWeight: 600,
                fontFamily: 'var(--font-display)', letterSpacing: 0.3,
              }}>
                {catTotal > 0 ? '$' + catTotal.toLocaleString() : '—'}
              </p>
              <p style={{
                fontSize: 11, color: CATEGORY_COLORS[cat], marginTop: 4,
                fontWeight: 500, fontFamily: 'var(--font-body)',
              }}>
                {pct}% of portfolio
              </p>
            </div>
          )
        })}
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="fade-up" style={{
          background: 'var(--bg2)', borderRadius: 16, padding: '24px',
          border: '1px solid var(--border2)', marginBottom: 20,
        }}>
          <p style={{
            fontWeight: 600, marginBottom: 16, fontSize: 18,
            fontFamily: 'var(--font-display)', letterSpacing: 0.3,
          }}>
            New asset
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: 12 }}>
            {[
              { placeholder: 'Asset name', key: 'name', type: 'text' },
              { placeholder: 'Value ($)', key: 'value', type: 'number' },
              { placeholder: 'Ticker (optional)', key: 'ticker', type: 'text' },
            ].map(f => (
              <input
                key={f.key}
                placeholder={f.placeholder}
                type={f.type}
                value={form[f.key]}
                onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                style={{
                  padding: '10px 14px', borderRadius: 10,
                  border: '1px solid var(--border2)',
                  background: 'var(--bg3)', color: 'var(--text)',
                  fontSize: 13, outline: 'none',
                  fontFamily: 'var(--font-body)',
                }}
              />
            ))}
            <select
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
              style={{
                padding: '10px 14px', borderRadius: 10,
                border: '1px solid var(--border2)',
                background: 'var(--bg3)', color: 'var(--text)',
                fontSize: 13, outline: 'none',
                fontFamily: 'var(--font-body)',
              }}
            >
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <button
              onClick={addAsset}
              style={{
                background: 'linear-gradient(135deg, var(--green), var(--teal))',
                color: '#0a0a0f', padding: '10px 22px', borderRadius: 10,
                fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-display)', letterSpacing: 0.5,
              }}
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['All', ...CATEGORIES].map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            style={{
              padding: '5px 16px', borderRadius: 20, fontSize: 12,
              fontWeight: filter === cat ? 500 : 400,
              background: filter === cat ? 'var(--text)' : 'transparent',
              color: filter === cat ? 'var(--bg)' : 'var(--muted)',
              border: '1px solid ' + (filter === cat ? 'var(--text)' : 'var(--border)'),
              cursor: 'pointer', transition: 'all 0.15s',
              fontFamily: 'var(--font-body)',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Asset table */}
      <div className="fade-up" style={{
        background: 'var(--bg2)', borderRadius: 16,
        border: '1px solid var(--border)', overflow: 'hidden',
        animationDelay: '200ms',
      }}>
        {/* Table header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 130px 130px 100px 50px',
          padding: '12px 24px', borderBottom: '1px solid var(--border)',
          fontSize: 10, color: 'var(--muted)', fontWeight: 500,
          textTransform: 'uppercase', letterSpacing: 1.5,
          fontFamily: 'var(--font-body)',
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
              No assets in this category yet.
            </p>
          </div>
        )}

        {filtered.map((asset, i) => {
          const pct = (asset.value / total * 100)
          return (
            <div
              key={asset.id}
              style={{
                display: 'grid', gridTemplateColumns: '1fr 130px 130px 100px 50px',
                alignItems: 'center', padding: '16px 24px',
                borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {/* Name + icon */}
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
                  <p style={{ fontSize: 14, fontWeight: 500, fontFamily: 'var(--font-body)' }}>
                    {asset.name}
                  </p>
                  {asset.ticker && (
                    <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2, fontFamily: 'var(--font-body)' }}>
                      {asset.ticker.toUpperCase()}
                    </p>
                  )}
                </div>
              </div>

              {/* Category badge */}
              <span style={{
                fontSize: 11, padding: '4px 10px', borderRadius: 20,
                background: CATEGORY_COLORS[asset.category] + '18',
                color: CATEGORY_COLORS[asset.category],
                border: '1px solid ' + CATEGORY_COLORS[asset.category] + '35',
                fontWeight: 500, width: 'fit-content',
                fontFamily: 'var(--font-body)',
              }}>
                {asset.category}
              </span>

              {/* Value */}
              <p style={{
                fontSize: 16, fontWeight: 600, textAlign: 'right',
                fontFamily: 'var(--font-display)', letterSpacing: 0.3,
              }}>
                ${asset.value.toLocaleString()}
              </p>

              {/* Share bar */}
              <div style={{ paddingLeft: 10 }}>
                <p style={{
                  fontSize: 12, color: 'var(--muted2)', marginBottom: 4,
                  textAlign: 'right', fontFamily: 'var(--font-body)',
                }}>
                  {pct.toFixed(1)}%
                </p>
                <div style={{ height: 4, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 2, width: pct + '%',
                    background: CATEGORY_COLORS[asset.category],
                    transition: 'width 1s ease',
                  }} />
                </div>
              </div>

              {/* Delete */}
              <div style={{ textAlign: 'center' }}>
                <button
                  onClick={() => removeAsset(asset.id)}
                  style={{
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
          <p style={{
            fontSize: 13, color: 'var(--muted2)',
            fontFamily: 'var(--font-body)', fontWeight: 400, letterSpacing: 0.5,
          }}>
            {filter === 'All' ? 'Total' : filter + ' total'}
          </p>
          <span />
          <p style={{
            fontSize: 18, fontWeight: 600, textAlign: 'right',
            fontFamily: 'var(--font-display)', color: 'var(--green)', letterSpacing: 0.3,
          }}>
            ${filtered.reduce((s, a) => s + a.value, 0).toLocaleString()}
          </p>
          <span /><span />
        </div>
      </div>
    </div>
  )
}