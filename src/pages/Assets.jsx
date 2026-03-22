import { useState } from 'react'
import { formatAmount } from './Dashboard'
import AssetLogo from '../components/AssetLogo'

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

function EditValueModal({ asset, onSave, onClose }) {
  const [value, setValue] = useState(String(asset.value))

  function handleSave() {
    const parsed = parseFloat(value)
    if (isNaN(parsed) || parsed < 0) return
    onSave(asset.id, parsed)
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
        border: '1px solid var(--border2)', width: '100%', maxWidth: 380,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <p style={{ fontWeight: 600, fontSize: 16, fontFamily: 'var(--font-display)', letterSpacing: 0.3 }}>
              Update value
            </p>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2, fontFamily: 'var(--font-body)' }}>
              {asset.name}
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none', color: 'var(--muted)',
            fontSize: 20, cursor: 'pointer',
          }}>×</button>
        </div>
        <input
          type="number"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          autoFocus
          style={{
            width: '100%', padding: '12px 14px', borderRadius: 10,
            border: '1px solid var(--border2)',
            background: 'var(--bg3)', color: 'var(--text)',
            fontSize: 20, outline: 'none', fontFamily: 'var(--font-display)',
            marginBottom: 16, fontWeight: 600,
          }}
        />
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '10px', borderRadius: 10,
            background: 'var(--bg3)', color: 'var(--muted2)',
            border: '1px solid var(--border)', cursor: 'pointer',
            fontFamily: 'var(--font-body)', fontSize: 14,
          }}>
            Cancel
          </button>
          <button onClick={handleSave} style={{
            flex: 2, padding: '10px', borderRadius: 10,
            background: 'linear-gradient(135deg, var(--green), var(--teal))',
            color: '#0a0a0f', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700,
          }}>
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Assets({ assets, setAssets, isPro, freeLimit, currency = 'USD' }) {
  const [filter, setFilter] = useState('All')
  const [editingAsset, setEditingAsset] = useState(null)

  const total = assets.reduce((s, a) => s + (a.value || 0), 0)
  const filtered = filter === 'All' ? assets : assets.filter(a => a.category === filter)

  function removeAsset(id) {
    setAssets(assets.filter(a => a.id !== id))
  }

  function updateAssetValue(id, newValue) {
    setAssets(assets.map(a => a.id === id ? { ...a, value: newValue } : a))
  }

  return (
    <div style={{ maxWidth: 1600 }}>

      {editingAsset && (
        <EditValueModal
          asset={editingAsset}
          onSave={updateAssetValue}
          onClose={() => setEditingAsset(null)}
        />
      )}

      {/* Header */}
      <div className="fade-up" style={{ marginBottom: 36 }}>
        <h1 style={{ fontSize: 32, fontWeight: 600, lineHeight: 1.1, fontFamily: 'var(--font-display)', letterSpacing: 0.3 }}>
          Assets
        </h1>
        <p style={{ fontSize: 14, color: 'var(--muted2)', marginTop: 8, fontFamily: 'var(--font-body)', fontWeight: 300 }}>
          {isPro
            ? `${assets.length} assets — Pro plan`
            : `${assets.length} of ${freeLimit} assets — Free plan`}
        </p>
      </div>

      {/* Category breakdown cards */}
      <div className="summary-grid fade-up" style={{
        display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 12, marginBottom: 24, animationDelay: '80ms',
      }}>
        {CATEGORIES.map(cat => {
          const catTotal = assets.filter(a => a.category === cat).reduce((s, a) => s + (a.value || 0), 0)
          const pct = total > 0 ? (catTotal / total * 100).toFixed(0) : 0
          const active = filter === cat
          return (
            <div key={cat} onClick={() => setFilter(active ? 'All' : cat)} style={{
              background: active ? CATEGORY_COLORS[cat] + '15' : 'var(--bg2)',
              borderRadius: 14, padding: '16px',
              border: active ? '1px solid ' + CATEGORY_COLORS[cat] + '50' : '1px solid var(--border)',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = 'var(--border2)' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = 'var(--border)' }}
            >
              <div style={{ fontSize: 20, marginBottom: 8 }}>{CATEGORY_ICONS[cat]}</div>
              <p style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 6, fontFamily: 'var(--font-body)', letterSpacing: 1, textTransform: 'uppercase' }}>
                {cat}
              </p>
              <p style={{ fontSize: 16, fontWeight: 600, fontFamily: 'var(--font-display)', letterSpacing: 0.3 }}>
                {catTotal > 0 ? formatAmount(catTotal, currency) : '—'}
              </p>
              <p style={{ fontSize: 11, color: CATEGORY_COLORS[cat], marginTop: 4, fontWeight: 500, fontFamily: 'var(--font-body)' }}>
                {pct}% of portfolio
              </p>
            </div>
          )
        })}
      </div>

      {/* Free tier progress */}
      {!isPro && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>
              Free plan usage
            </span>
            <span style={{ fontSize: 11, color: assets.length >= freeLimit ? 'var(--red)' : 'var(--muted)', fontFamily: 'var(--font-body)' }}>
              {assets.length} / {freeLimit} assets
            </span>
          </div>
          <div style={{ height: 4, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 2,
              width: Math.min((assets.length / freeLimit) * 100, 100) + '%',
              background: assets.length >= freeLimit ? 'var(--red)' : 'linear-gradient(90deg, var(--green), var(--teal))',
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
          display: 'grid', gridTemplateColumns: '1fr 130px 150px 100px 90px',
          padding: '12px 24px', borderBottom: '1px solid var(--border)',
          fontSize: 10, color: 'var(--muted)', fontWeight: 500,
          textTransform: 'uppercase', letterSpacing: 1.5, fontFamily: 'var(--font-body)',
        }}>
          <span>Asset</span>
          <span>Category</span>
          <span style={{ textAlign: 'right' }}>Value</span>
          <span style={{ textAlign: 'right' }}>Share</span>
          <span style={{ textAlign: 'center' }}>Actions</span>
        </div>

        {filtered.length === 0 && (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--muted)' }}>
            <p style={{ fontSize: 15, fontFamily: 'var(--font-display)', letterSpacing: 0.3 }}>
              {filter === 'All' ? 'No assets yet.' : `No ${filter} assets.`}
            </p>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6, fontFamily: 'var(--font-body)' }}>
              Use the + Add asset button in the top bar to get started.
            </p>
          </div>
        )}

        {filtered.map((asset, i) => {
          const pct = total > 0 ? (asset.value / total * 100) : 0
          return (
            <div key={asset.id} className="asset-table-row" style={{
              display: 'grid', gridTemplateColumns: '1fr 130px 150px 100px 90px',
              alignItems: 'center', padding: '16px 24px',
              borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <AssetLogo ticker={asset.ticker} category={asset.category} size={38} />
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
                {formatAmount(asset.value, currency)}
              </p>

              <div className="share-bar" style={{ paddingLeft: 10 }}>
                <p style={{ fontSize: 12, color: 'var(--muted2)', marginBottom: 4, textAlign: 'right', fontFamily: 'var(--font-body)' }}>
                  {pct.toFixed(1)}%
                </p>
                <div style={{ height: 4, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 2, width: pct + '%', background: CATEGORY_COLORS[asset.category], transition: 'width 1s ease' }} />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {/* Edit button */}
                <button
                  onClick={() => setEditingAsset(asset)}
                  title="Edit value"
                  style={{
                    width: 30, height: 30, borderRadius: 8,
                    background: 'transparent', border: '1px solid var(--border)',
                    color: 'var(--muted)', fontSize: 13, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(77,159,255,0.1)'
                    e.currentTarget.style.borderColor = 'var(--blue)'
                    e.currentTarget.style.color = 'var(--blue)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.borderColor = 'var(--border)'
                    e.currentTarget.style.color = 'var(--muted)'
                  }}
                >
                  ✎
                </button>
                {/* Delete button */}
                <button
                  onClick={() => removeAsset(asset.id)}
                  title="Delete"
                  style={{
                    width: 30, height: 30, borderRadius: 8,
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
        {filtered.length > 0 && (
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 130px 150px 100px 90px',
            padding: '16px 24px', borderTop: '1px solid var(--border2)',
            background: 'var(--bg3)',
          }}>
            <p style={{ fontSize: 13, color: 'var(--muted2)', fontFamily: 'var(--font-body)', fontWeight: 400, letterSpacing: 0.5 }}>
              {filter === 'All' ? 'Total' : filter + ' total'}
            </p>
            <span />
            <p style={{ fontSize: 17, fontWeight: 600, textAlign: 'right', fontFamily: 'var(--font-display)', color: 'var(--green)', letterSpacing: 0.3 }}>
              {formatAmount(filtered.reduce((s, a) => s + (a.value || 0), 0), currency)}
            </p>
            <span /><span />
          </div>
        )}
      </div>
    </div>
  )
}
