import { useState, useEffect, useMemo } from 'react'
import { formatAmount } from './Dashboard'

const FREQUENCIES = [
  { value: 'weekly',    label: 'Weekly',    perYear: 52   },
  { value: 'monthly',   label: 'Monthly',   perYear: 12   },
  { value: 'quarterly', label: 'Quarterly', perYear: 4    },
  { value: 'annually',  label: 'Annually',  perYear: 1    },
]
const FREQ_MAP = Object.fromEntries(FREQUENCIES.map(f => [f.value, f]))

const CATEGORIES = [
  { value: 'Dividends',     emoji: '📈', color: '#5b9cf6' },
  { value: 'Rental',        emoji: '🏠', color: '#00d98b' },
  { value: 'Interest',      emoji: '🏦', color: '#a78bfa' },
  { value: 'Business',      emoji: '💼', color: '#f59e0b' },
  { value: 'Side income',   emoji: '💡', color: '#2dd4bf' },
  { value: 'Other',         emoji: '💵', color: '#9b8ea8' },
]
const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.value, c]))

const SUGGESTIONS = [
  { emoji: '📈', name: 'Stock dividends',    amount: 200,  frequency: 'quarterly', category: 'Dividends' },
  { emoji: '🏠', name: 'Rental income',      amount: 1500, frequency: 'monthly',   category: 'Rental'    },
  { emoji: '🏦', name: 'Savings interest',   amount: 50,   frequency: 'monthly',   category: 'Interest'  },
  { emoji: '💼', name: 'Business income',    amount: 800,  frequency: 'monthly',   category: 'Business'  },
]

function toMonthly(amount, frequency) {
  const f = FREQ_MAP[frequency]
  return f ? (amount * f.perYear) / 12 : 0
}
function toYearly(amount, frequency) {
  const f = FREQ_MAP[frequency]
  return f ? amount * f.perYear : 0
}

function getStorageKey(user) {
  return `wv_cashflow_${user?.id || 'local'}`
}

// ─── AddCashflowModal ─────────────────────────────────────────────────────────

function AddCashflowModal({ onAdd, onClose }) {
  const [form, setForm] = useState({
    emoji: '💵', name: '', amount: '', frequency: 'monthly', category: 'Other',
  })
  const [saving, setSaving] = useState(false)

  const inputStyle = {
    padding: '10px 14px', borderRadius: 10,
    border: '1px solid var(--border2)', background: 'var(--bg3)',
    color: 'var(--text)', fontSize: 14, outline: 'none',
    fontFamily: 'var(--font-body)', width: '100%', boxSizing: 'border-box',
  }

  function patch(key, val) { setForm(f => ({ ...f, [key]: val })) }

  async function handleAdd() {
    if (!form.name || !form.amount) return
    setSaving(true)
    await onAdd({ ...form, amount: parseFloat(form.amount) })
    setSaving(false)
    onClose()
  }

  const canSave = form.name && form.amount && parseFloat(form.amount) > 0

  const preview = canSave ? {
    monthly: toMonthly(parseFloat(form.amount), form.frequency),
    yearly: toYearly(parseFloat(form.amount), form.frequency),
  } : null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--bg2)', borderRadius: 20, padding: '28px',
        border: '1px solid var(--border2)', width: '100%', maxWidth: 480,
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <p style={{ fontWeight: 600, fontSize: 18, fontFamily: 'var(--font-display)', letterSpacing: 0.3 }}>
            New income source
          </p>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border2)',
            color: 'var(--text)', fontSize: 18, cursor: 'pointer',
            width: 32, height: 32, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        </div>

        {/* Quick picks */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8,
            fontFamily: 'var(--font-body)', letterSpacing: 1, textTransform: 'uppercase' }}>Quick pick</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {SUGGESTIONS.map(s => (
              <button key={s.name}
                onClick={() => setForm(f => ({ ...f, emoji: s.emoji, name: s.name, amount: String(s.amount), frequency: s.frequency, category: s.category }))}
                style={{
                  padding: '6px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                  background: form.name === s.name ? 'rgba(0,217,139,0.12)' : 'var(--bg3)',
                  color: form.name === s.name ? 'var(--green)' : 'var(--muted2)',
                  border: form.name === s.name ? '1px solid rgba(0,217,139,0.3)' : '1px solid var(--border)',
                  fontFamily: 'var(--font-body)', transition: 'all 0.15s',
                }}>
                {s.emoji} {s.name}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Emoji + name */}
          <div style={{ display: 'flex', gap: 10 }}>
            <input placeholder="💵" value={form.emoji}
              onChange={e => patch('emoji', e.target.value)}
              style={{ ...inputStyle, width: 72, textAlign: 'center', fontSize: 20, padding: '10px 8px' }} />
            <input placeholder="Income source name" value={form.name}
              onChange={e => patch('name', e.target.value)}
              style={{ ...inputStyle, flex: 1 }} />
          </div>

          {/* Amount */}
          <input
            placeholder="Amount per period (USD)"
            type="number" min="0" value={form.amount}
            onChange={e => patch('amount', e.target.value)}
            style={inputStyle}
          />

          {/* Frequency */}
          <div>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8, fontFamily: 'var(--font-body)', letterSpacing: 1, textTransform: 'uppercase' }}>
              Frequency
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {FREQUENCIES.map(f => (
                <button key={f.value} onClick={() => patch('frequency', f.value)} style={{
                  padding: '10px 12px', borderRadius: 10, fontSize: 13, cursor: 'pointer',
                  fontFamily: 'var(--font-body)', textAlign: 'center', transition: 'all 0.15s',
                  background: form.frequency === f.value ? 'rgba(0,217,139,0.1)' : 'var(--bg3)',
                  color: form.frequency === f.value ? 'var(--green)' : 'var(--muted2)',
                  border: form.frequency === f.value ? '1px solid rgba(0,217,139,0.3)' : '1px solid var(--border)',
                  fontWeight: form.frequency === f.value ? 600 : 400,
                }}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8, fontFamily: 'var(--font-body)', letterSpacing: 1, textTransform: 'uppercase' }}>
              Category
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {CATEGORIES.map(c => (
                <button key={c.value} onClick={() => { patch('category', c.value); patch('emoji', c.emoji) }} style={{
                  padding: '9px 8px', borderRadius: 10, fontSize: 12, cursor: 'pointer',
                  fontFamily: 'var(--font-body)', textAlign: 'center', transition: 'all 0.15s',
                  background: form.category === c.value ? `${c.color}18` : 'var(--bg3)',
                  color: form.category === c.value ? c.color : 'var(--muted2)',
                  border: form.category === c.value ? `1px solid ${c.color}50` : '1px solid var(--border)',
                  fontWeight: form.category === c.value ? 600 : 400,
                }}>
                  {c.emoji} {c.value}
                </button>
              ))}
            </div>
          </div>

          {/* Live preview */}
          {preview && (
            <div style={{
              padding: '12px 16px', borderRadius: 10,
              background: 'rgba(0,217,139,0.06)', border: '1px solid rgba(0,217,139,0.2)',
              display: 'flex', gap: 20,
            }}>
              <div>
                <p style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase', fontFamily: 'var(--font-body)', marginBottom: 4 }}>Per month</p>
                <p style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--green)' }}>
                  {formatAmount(Math.round(preview.monthly), 'USD')}
                </p>
              </div>
              <div style={{ width: 1, background: 'var(--border)' }} />
              <div>
                <p style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase', fontFamily: 'var(--font-body)', marginBottom: 4 }}>Per year</p>
                <p style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
                  {formatAmount(Math.round(preview.yearly), 'USD')}
                </p>
              </div>
            </div>
          )}

          <button onClick={handleAdd} disabled={saving || !canSave} style={{
            background: 'linear-gradient(135deg, var(--green), var(--teal))',
            color: '#0a0a0f', padding: '12px', borderRadius: 10,
            fontSize: 14, fontWeight: 700, border: 'none',
            cursor: canSave && !saving ? 'pointer' : 'default',
            fontFamily: 'var(--font-display)', letterSpacing: 0.5,
            opacity: canSave ? 1 : 0.5, transition: 'opacity 0.15s',
          }}>
            {saving ? 'Saving…' : 'Add income source'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── IncomeCard ───────────────────────────────────────────────────────────────

function IncomeCard({ source, currency, onDelete }) {
  const monthly = toMonthly(source.amount, source.frequency)
  const yearly = toYearly(source.amount, source.frequency)
  const freq = FREQ_MAP[source.frequency]
  const cat = CAT_MAP[source.category] || CAT_MAP['Other']

  return (
    <div style={{
      background: 'var(--bg2)', borderRadius: 16,
      border: '1px solid var(--border)',
      padding: '20px 22px', position: 'relative', overflow: 'hidden',
      transition: 'border-color 0.2s, transform 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)' }}
    >
      {/* Category color accent */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${cat.color}, transparent)`,
        borderRadius: '16px 16px 0 0',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, fontSize: 20,
            background: `${cat.color}15`, border: `1px solid ${cat.color}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            {source.emoji}
          </div>
          <div>
            <p style={{ fontWeight: 600, fontSize: 15, fontFamily: 'var(--font-display)', letterSpacing: 0.2 }}>
              {source.name}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                background: `${cat.color}18`, color: cat.color,
                border: `1px solid ${cat.color}30`, fontFamily: 'var(--font-body)',
              }}>{source.category}</span>
              <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>
                · {freq?.label ?? source.frequency}
              </span>
            </div>
          </div>
        </div>
        <button onClick={onDelete} title="Remove" style={{
          background: 'transparent', border: 'none', color: 'var(--muted)',
          fontSize: 18, cursor: 'pointer', padding: '2px 6px',
          transition: 'color 0.15s', flexShrink: 0,
        }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
        >×</button>
      </div>

      {/* Amount row */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}>
        <div style={{
          flex: 1, background: 'var(--bg3)', borderRadius: 10, padding: '12px',
          border: '1px solid var(--border)',
        }}>
          <p style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase', fontFamily: 'var(--font-body)', marginBottom: 5 }}>
            Per month
          </p>
          <p style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--green)', letterSpacing: -0.5 }}>
            {formatAmount(Math.round(monthly), currency)}
          </p>
        </div>
        <div style={{
          flex: 1, background: 'var(--bg3)', borderRadius: 10, padding: '12px',
          border: '1px solid var(--border)',
        }}>
          <p style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase', fontFamily: 'var(--font-body)', marginBottom: 5 }}>
            Per year
          </p>
          <p style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: -0.5 }}>
            {formatAmount(Math.round(yearly), currency)}
          </p>
        </div>
        <div style={{
          background: 'var(--bg3)', borderRadius: 10, padding: '12px',
          border: '1px solid var(--border)', minWidth: 90,
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
        }}>
          <p style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase', fontFamily: 'var(--font-body)', marginBottom: 5 }}>
            Amount
          </p>
          <p style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--muted2)' }}>
            {formatAmount(source.amount, currency)}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── CategoryBar ─────────────────────────────────────────────────────────────

function CategoryBreakdown({ sources, currency }) {
  const byCategory = useMemo(() => {
    const map = {}
    sources.forEach(s => {
      const monthly = toMonthly(s.amount, s.frequency)
      map[s.category] = (map[s.category] || 0) + monthly
    })
    return Object.entries(map)
      .map(([cat, monthly]) => ({ cat, monthly, yearly: monthly * 12, meta: CAT_MAP[cat] || CAT_MAP['Other'] }))
      .sort((a, b) => b.monthly - a.monthly)
  }, [sources])

  const totalMonthly = byCategory.reduce((s, c) => s + c.monthly, 0)

  if (!byCategory.length) return null

  return (
    <div style={{
      background: 'var(--bg2)', borderRadius: 16, padding: '20px 22px',
      border: '1px solid var(--border)', marginBottom: 24,
    }} className="fade-up">
      <p style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 500, marginBottom: 16, fontFamily: 'var(--font-body)' }}>
        By category
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {byCategory.map(({ cat, monthly, yearly, meta }) => {
          const pct = totalMonthly > 0 ? (monthly / totalMonthly) * 100 : 0
          return (
            <div key={cat}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontSize: 14 }}>{meta.emoji}</span>
                  <span style={{ fontSize: 13, fontFamily: 'var(--font-body)', color: 'var(--muted2)' }}>{cat}</span>
                </div>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-display)', color: meta.color }}>
                    {formatAmount(Math.round(monthly), currency)}<span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 400 }}>/mo</span>
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-body)', minWidth: 70, textAlign: 'right' }}>
                    {formatAmount(Math.round(yearly), currency)}/yr
                  </span>
                </div>
              </div>
              <div style={{ height: 4, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 2,
                  width: `${pct}%`, background: meta.color,
                  transition: 'width 0.8s ease',
                }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Cashflow ─────────────────────────────────────────────────────────────────

export default function Cashflow({ user, currency = 'USD' }) {
  const [sources, setSourcesState] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(getStorageKey(user))
      setSourcesState(stored ? JSON.parse(stored) : [])
    } catch {
      setSourcesState([])
    }
    setLoading(false)
  }, [user])

  function persist(updated) {
    setSourcesState(updated)
    try { localStorage.setItem(getStorageKey(user), JSON.stringify(updated)) } catch {}
  }

  function addSource(form) {
    persist([...sources, {
      id: Date.now(),
      emoji: form.emoji,
      name: form.name,
      amount: form.amount,
      frequency: form.frequency,
      category: form.category,
      createdAt: new Date().toISOString(),
    }])
  }

  function deleteSource(id) {
    persist(sources.filter(s => s.id !== id))
  }

  const totalMonthly = useMemo(() => sources.reduce((s, x) => s + toMonthly(x.amount, x.frequency), 0), [sources])
  const totalYearly = useMemo(() => sources.reduce((s, x) => s + toYearly(x.amount, x.frequency), 0), [sources])

  const cardStyle = { background: 'var(--bg2)', borderRadius: 16, border: '1px solid var(--border)', padding: '22px 24px', position: 'relative', overflow: 'hidden' }

  return (
    <div style={{ maxWidth: 1600 }}>
      {showModal && <AddCashflowModal onAdd={addSource} onClose={() => setShowModal(false)} />}

      {/* Header */}
      <div className="fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 600, fontFamily: 'var(--font-display)', letterSpacing: 0.3 }}>
            Cashflow
          </h1>
          <p style={{ fontSize: 14, color: 'var(--muted2)', marginTop: 8, fontFamily: 'var(--font-body)', fontWeight: 300 }}>
            {sources.length > 0
              ? `${sources.length} income source${sources.length > 1 ? 's' : ''} tracked`
              : 'Track your recurring passive income.'}
          </p>
        </div>
        <button onClick={() => setShowModal(true)} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'linear-gradient(135deg, var(--green), var(--teal))',
          color: '#0a0a0f', padding: '9px 18px', borderRadius: 20,
          fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer',
          fontFamily: 'var(--font-display)', letterSpacing: 0.5,
          boxShadow: '0 0 18px rgba(0,217,139,0.25)', transition: 'opacity 0.15s',
          whiteSpace: 'nowrap', marginTop: 6,
        }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          + Add source
        </button>
      </div>

      {/* Summary stat cards */}
      {sources.length > 0 && (
        <div className="stat-grid fade-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 24, animationDelay: '60ms' }}>
          {[
            {
              label: 'Monthly income', accent: 'var(--green)',
              value: formatAmount(Math.round(totalMonthly), currency),
              sub: `${formatAmount(Math.round(totalMonthly / 30), currency)} per day`,
              subColor: 'var(--muted)',
            },
            {
              label: 'Yearly income', accent: 'var(--blue)',
              value: formatAmount(Math.round(totalYearly), currency),
              sub: `${sources.length} source${sources.length > 1 ? 's' : ''}`,
              subColor: 'var(--muted)',
            },
          ].map(s => (
            <div key={s.label} style={{ ...cardStyle, cursor: 'default', transition: 'border-color 0.2s, transform 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${s.accent}, transparent)`, borderRadius: '16px 16px 0 0' }} />
              <p style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 500, marginBottom: 10, fontFamily: 'var(--font-body)' }}>{s.label}</p>
              <p style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: -0.5, lineHeight: 1.1, color: s.accent }}>{s.value}</p>
              <p style={{ fontSize: 12, color: s.subColor, marginTop: 10, fontFamily: 'var(--font-body)' }}>{s.sub}</p>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, var(--green), var(--teal))', animation: 'pulse-green 1.5s infinite' }} />
        </div>
      ) : sources.length === 0 ? (
        // Empty state
        <div className="fade-up" style={{
          background: 'var(--bg2)', borderRadius: 20, padding: '64px 32px',
          border: '1px solid var(--border)', textAlign: 'center',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            width: 400, height: 400, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,217,139,0.05) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: 'linear-gradient(135deg, rgba(0,217,139,0.15), rgba(45,212,191,0.1))',
            border: '1px solid rgba(0,217,139,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
              <circle cx="17" cy="17" r="12" stroke="#00d98b" strokeWidth="2" opacity="0.3"/>
              <path d="M17 10v7l4 4" stroke="#00d98b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 6l3 3M26 6l-3 3M8 28l3-3M26 28l-3-3" stroke="#00d98b" strokeWidth="1.8" strokeLinecap="round" opacity="0.5"/>
            </svg>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 600, fontFamily: 'var(--font-display)', letterSpacing: 0.3, marginBottom: 10 }}>
            No income sources yet
          </h2>
          <p style={{ fontSize: 14, color: 'var(--muted2)', fontFamily: 'var(--font-body)', fontWeight: 300,
            maxWidth: 380, margin: '0 auto 28px', lineHeight: 1.6 }}>
            Add dividends, rental income, interest, or any recurring income to see your total monthly and yearly cashflow.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 28 }}>
            {SUGGESTIONS.map(s => (
              <button key={s.name} onClick={() => setShowModal(true)} style={{
                padding: '7px 14px', borderRadius: 20, fontSize: 12,
                background: 'var(--bg3)', color: 'var(--muted2)',
                border: '1px solid var(--border)', cursor: 'pointer',
                fontFamily: 'var(--font-body)', transition: 'all 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.color = 'var(--text)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted2)' }}
              >
                {s.emoji} {s.name}
              </button>
            ))}
          </div>
          <button onClick={() => setShowModal(true)} style={{
            background: 'linear-gradient(135deg, var(--green), var(--teal))',
            color: '#0a0a0f', padding: '11px 26px', borderRadius: 20,
            fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-display)', letterSpacing: 0.5,
            boxShadow: '0 0 24px rgba(0,217,139,0.2)', transition: 'opacity 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            + Add first income source
          </button>
        </div>
      ) : (
        <>
          {/* Category breakdown */}
          <CategoryBreakdown sources={sources} currency={currency} />

          {/* Income cards */}
          <div className="goals-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {sources.map((source, i) => (
              <div key={source.id} className="fade-up" style={{ animationDelay: i * 60 + 'ms' }}>
                <IncomeCard
                  source={source}
                  currency={currency}
                  onDelete={() => deleteSource(source.id)}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
