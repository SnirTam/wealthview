import { useState, useEffect } from 'react'

const ALERT_TYPES = [
  { id: 'above',       label: 'Price above' },
  { id: 'below',       label: 'Price below' },
  { id: 'change_up',   label: '24h change above' },
  { id: 'change_down', label: '24h change below' },
]

const LS_KEY = 'wv_alerts'

function loadAlerts() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '[]')
  } catch {
    return []
  }
}

function saveAlerts(alerts) {
  localStorage.setItem(LS_KEY, JSON.stringify(alerts))
}

function describeAlert(alert) {
  const isPct = alert.type === 'change_up' || alert.type === 'change_down'
  const sign  = alert.type === 'change_down' && alert.threshold > 0 ? '-' : ''
  const val   = isPct ? `${sign}${alert.threshold}%` : `$${Number(alert.threshold).toLocaleString()}`
  switch (alert.type) {
    case 'above':       return `Price above ${val}`
    case 'below':       return `Price below ${val}`
    case 'change_up':   return `24h change above +${val}`
    case 'change_down': return `24h change below ${val}`
    default:            return `Threshold ${val}`
  }
}

function AddAlertModal({ onAdd, onClose }) {
  const [ticker, setTicker]       = useState('')
  const [name, setName]           = useState('')
  const [type, setType]           = useState(ALERT_TYPES[0].id)
  const [threshold, setThreshold] = useState('')

  function handleSubmit() {
    if (!ticker.trim() || !threshold) return
    onAdd({
      id: Date.now(),
      ticker: ticker.trim().toUpperCase(),
      name: name.trim() || ticker.trim().toUpperCase(),
      type,
      threshold: parseFloat(threshold),
      fired: false,
      created_at: new Date().toISOString(),
    })
    onClose()
  }

  const inputStyle = {
    width: '100%', padding: '11px 14px', borderRadius: 10,
    border: '1px solid var(--border2)',
    background: 'var(--bg3)', color: 'var(--text)',
    fontSize: 14, outline: 'none', fontFamily: 'var(--font-body)',
    marginBottom: 12, boxSizing: 'border-box',
  }

  const labelStyle = {
    fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-body)',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5,
    display: 'block',
  }

  const isPct = type === 'change_up' || type === 'change_down'

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--bg2)', borderRadius: 20, padding: '28px',
        border: '1px solid var(--border2)', width: '100%', maxWidth: 400,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <div>
            <p style={{ fontWeight: 600, fontSize: 16, fontFamily: 'var(--font-display)', letterSpacing: 0.3 }}>
              New Alert
            </p>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2, fontFamily: 'var(--font-body)' }}>
              Get notified when your target is hit
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border2)',
            color: 'var(--text)', fontSize: 18, cursor: 'pointer',
            width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        </div>

        <label style={labelStyle}>Ticker / Symbol</label>
        <input
          type="text"
          placeholder="e.g. AAPL, BTC"
          value={ticker}
          onChange={e => setTicker(e.target.value)}
          autoFocus
          style={inputStyle}
        />

        <label style={labelStyle}>Asset Name (optional)</label>
        <input
          type="text"
          placeholder="e.g. Apple Inc."
          value={name}
          onChange={e => setName(e.target.value)}
          style={inputStyle}
        />

        <label style={labelStyle}>Alert Type</label>
        <select
          value={type}
          onChange={e => setType(e.target.value)}
          style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
        >
          {ALERT_TYPES.map(t => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>

        <label style={labelStyle}>
          {isPct ? 'Threshold (%)' : 'Threshold ($)'}
        </label>
        <input
          type="number"
          placeholder={isPct ? 'e.g. 5' : 'e.g. 150'}
          value={threshold}
          onChange={e => setThreshold(e.target.value)}
          style={{ ...inputStyle, marginBottom: 20 }}
          min="0"
          step={isPct ? '0.1' : '0.01'}
        />

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '11px', borderRadius: 10,
            background: 'rgba(255,255,255,0.06)', color: 'var(--text)',
            border: '1px solid var(--border2)', cursor: 'pointer',
            fontFamily: 'var(--font-body)', fontSize: 14,
          }}>
            Cancel
          </button>
          <button onClick={handleSubmit} style={{
            flex: 2, padding: '11px', borderRadius: 10,
            background: 'linear-gradient(135deg, var(--green), var(--teal))',
            color: '#0a0a0f', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700,
          }}>
            Create Alert
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Alerts({ isPro, assets }) {
  const [alerts, setAlerts]   = useState(loadAlerts)
  const [showAdd, setShowAdd] = useState(false)

  useEffect(() => {
    saveAlerts(alerts)
  }, [alerts])

  function addAlert(alert) {
    setAlerts(prev => [...prev, alert])
  }

  function removeAlert(id) {
    setAlerts(prev => prev.filter(a => a.id !== id))
  }

  // ── Free-user upgrade wall ──────────────────────────────────────────────────
  if (!isPro) {
    return (
      <div style={{
        maxWidth: 480, margin: '80px auto', textAlign: 'center', padding: '0 20px',
      }}>
        <div style={{
          background: 'var(--bg2)', borderRadius: 24,
          border: '1px solid var(--border2)', padding: '48px 36px',
        }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>🔔</div>
          <h2 style={{
            fontSize: 24, fontWeight: 600, fontFamily: 'var(--font-display)',
            letterSpacing: 0.3, marginBottom: 12,
          }}>
            Price Alerts
          </h2>
          <p style={{
            fontSize: 15, color: 'var(--muted2)', fontFamily: 'var(--font-body)',
            lineHeight: 1.6, marginBottom: 32,
          }}>
            Get notified when prices hit your targets. Set unlimited alerts for stocks, crypto, and more.
          </p>
          <button
            style={{
              padding: '13px 32px', borderRadius: 20, fontSize: 15, fontWeight: 700,
              background: 'linear-gradient(135deg, var(--green), var(--teal))',
              color: '#0a0a0f', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-display)', letterSpacing: 0.3,
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Upgrade to Pro
          </button>
        </div>
      </div>
    )
  }

  // ── Pro view ────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 900 }}>

      {showAdd && (
        <AddAlertModal onAdd={addAlert} onClose={() => setShowAdd(false)} />
      )}

      {/* Header */}
      <div className="fade-up" style={{
        marginBottom: 36, display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
      }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 600, lineHeight: 1.1, fontFamily: 'var(--font-display)', letterSpacing: 0.3 }}>
            Alerts
          </h1>
          <p style={{ fontSize: 14, color: 'var(--muted2)', marginTop: 8, fontFamily: 'var(--font-body)', fontWeight: 300 }}>
            {alerts.length} {alerts.length === 1 ? 'alert' : 'alerts'} configured
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          style={{
            padding: '10px 20px', borderRadius: 20, fontSize: 13, fontWeight: 500,
            background: 'linear-gradient(135deg, var(--green), var(--teal))',
            color: '#0a0a0f', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-display)', letterSpacing: 0.3,
            transition: 'opacity 0.15s', whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          + New alert
        </button>
      </div>

      {/* Empty state */}
      {alerts.length === 0 && (
        <div className="fade-up" style={{
          background: 'var(--bg2)', borderRadius: 16, border: '1px solid var(--border)',
          padding: '64px 24px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🔔</div>
          <p style={{ fontSize: 16, fontFamily: 'var(--font-display)', letterSpacing: 0.3, marginBottom: 8 }}>
            No alerts yet
          </p>
          <p style={{ fontSize: 13, color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>
            Get notified when prices move. Click "+ New alert" to get started.
          </p>
        </div>
      )}

      {/* Alert cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {alerts.map((alert, i) => {
          const isPct     = alert.type === 'change_up' || alert.type === 'change_down'
          const isFired   = alert.fired
          const typeColor = alert.type === 'above' || alert.type === 'change_up' ? 'var(--green)' : 'var(--red)'

          return (
            <div
              key={alert.id}
              className="fade-up"
              style={{
                background: 'var(--bg2)', borderRadius: 14,
                border: '1px solid var(--border)',
                padding: '18px 22px',
                display: 'flex', alignItems: 'center', gap: 16,
                animationDelay: `${i * 40}ms`,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--bg2)'}
            >
              {/* Bell icon */}
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: isFired ? 'rgba(107,107,128,0.15)' : (typeColor === 'var(--green)' ? 'rgba(0,217,139,0.12)' : 'rgba(255,77,109,0.12)'),
                border: '1px solid ' + (isFired ? 'var(--border)' : typeColor + '40'),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18,
              }}>
                {isFired ? '🔕' : '🔔'}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-display)', letterSpacing: 0.3 }}>
                    {alert.name}
                  </span>
                  <span style={{
                    fontSize: 10, padding: '2px 8px', borderRadius: 20,
                    background: 'var(--bg3)', color: 'var(--muted)',
                    border: '1px solid var(--border)', fontFamily: 'var(--font-body)',
                    fontWeight: 600, letterSpacing: 0.8, textTransform: 'uppercase',
                  }}>
                    {alert.ticker}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--muted2)', fontFamily: 'var(--font-body)' }}>
                  {describeAlert(alert)}
                </p>
              </div>

              {/* Status badge */}
              <span style={{
                fontSize: 11, padding: '4px 12px', borderRadius: 20, flexShrink: 0,
                background: isFired ? 'rgba(107,107,128,0.15)' : 'rgba(0,217,139,0.12)',
                color: isFired ? 'var(--muted)' : 'var(--green)',
                border: '1px solid ' + (isFired ? 'var(--border)' : 'rgba(0,217,139,0.30)'),
                fontWeight: 500, fontFamily: 'var(--font-body)',
              }}>
                {isFired ? 'Triggered' : 'Active'}
              </span>

              {/* Delete */}
              <button
                onClick={() => removeAlert(alert.id)}
                title="Delete alert"
                style={{
                  width: 30, height: 30, borderRadius: 8, flexShrink: 0,
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
          )
        })}
      </div>
    </div>
  )
}
