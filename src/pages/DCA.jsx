import { useState, useEffect, useMemo } from 'react'
import { formatAmount } from './Dashboard'

const FREQUENCIES = [
  { value: 'weekly',     label: 'Every week',     days: 7   },
  { value: 'biweekly',   label: 'Every 2 weeks',  days: 14  },
  { value: 'monthly',    label: 'Every month',    days: 30  },
  { value: 'quarterly',  label: 'Every 3 months', days: 91  },
]

const FREQ_MAP = Object.fromEntries(FREQUENCIES.map(f => [f.value, f]))

const SUGGESTIONS = [
  { emoji: '📈', name: 'S&P 500 ETF',   amount: 500  },
  { emoji: '₿',  name: 'Bitcoin',       amount: 200  },
  { emoji: '🌐', name: 'World ETF',     amount: 300  },
  { emoji: '💵', name: 'Cash savings',  amount: 1000 },
]

function getStorageKey(user) {
  return `wv_dca_${user?.id || 'local'}`
}

function calcStats(plan) {
  const freq = FREQ_MAP[plan.frequency]
  if (!plan.startDate || !freq) return { contributions: 0, totalInvested: 0, nextDate: null }

  const start = new Date(plan.startDate)
  const now = new Date()
  const msPerDay = 1000 * 60 * 60 * 24
  const daysSinceStart = Math.floor((now - start) / msPerDay)

  if (daysSinceStart < 0) {
    // Future start date
    return { contributions: 0, totalInvested: 0, nextDate: new Date(plan.startDate) }
  }

  const contributions = Math.floor(daysSinceStart / freq.days) + 1
  const totalInvested = contributions * plan.amount
  const nextDate = new Date(start.getTime() + contributions * freq.days * msPerDay)

  return { contributions, totalInvested, nextDate }
}

function formatNextDate(date) {
  if (!date) return '—'
  const now = new Date()
  const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24))
  const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  if (diffDays <= 0) return `${label} (today)`
  if (diffDays === 1) return `${label} (tomorrow)`
  if (diffDays <= 7) return `${label} (in ${diffDays}d)`
  return label
}

// ─── AddDCAModal ──────────────────────────────────────────────────────────────

function AddDCAModal({ onAdd, onClose }) {
  const [form, setForm] = useState({
    emoji: '📈', name: '', amount: '', frequency: 'monthly', startDate: '',
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

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--bg2)', borderRadius: 20, padding: '28px',
        border: '1px solid var(--border2)', width: '100%', maxWidth: 460,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <p style={{ fontWeight: 600, fontSize: 18, fontFamily: 'var(--font-display)', letterSpacing: 0.3 }}>
            New DCA plan
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
                onClick={() => setForm(f => ({ ...f, emoji: s.emoji, name: s.name, amount: String(s.amount) }))}
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
            <input placeholder="🎯" value={form.emoji}
              onChange={e => patch('emoji', e.target.value)}
              style={{ ...inputStyle, width: 72, textAlign: 'center', fontSize: 20, padding: '10px 8px' }} />
            <input placeholder="Asset or plan name (e.g. VOO, Bitcoin)" value={form.name}
              onChange={e => patch('name', e.target.value)}
              style={{ ...inputStyle, flex: 1 }} />
          </div>

          {/* Amount */}
          <input
            placeholder="Amount per contribution (USD)"
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

          {/* Start date */}
          <input
            placeholder="Start date (optional)"
            type="date" value={form.startDate}
            onChange={e => patch('startDate', e.target.value)}
            style={{ ...inputStyle, colorScheme: 'dark' }}
          />

          <button onClick={handleAdd} disabled={saving || !canSave} style={{
            background: 'linear-gradient(135deg, var(--green), var(--teal))',
            color: '#0a0a0f', padding: '12px', borderRadius: 10,
            fontSize: 14, fontWeight: 700, border: 'none',
            cursor: canSave && !saving ? 'pointer' : 'default',
            fontFamily: 'var(--font-display)', letterSpacing: 0.5,
            opacity: canSave ? 1 : 0.5, transition: 'opacity 0.15s',
          }}>
            {saving ? 'Saving…' : 'Create plan'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── DCACard ──────────────────────────────────────────────────────────────────

function DCACard({ plan, currency, onDelete }) {
  const { contributions, totalInvested, nextDate } = useMemo(() => calcStats(plan), [plan])
  const freq = FREQ_MAP[plan.frequency]

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
      {/* Top accent line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: 'linear-gradient(90deg, var(--green), transparent)', borderRadius: '16px 16px 0 0',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, fontSize: 20,
            background: 'var(--bg3)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            {plan.emoji}
          </div>
          <div>
            <p style={{ fontWeight: 600, fontSize: 15, fontFamily: 'var(--font-display)', letterSpacing: 0.2 }}>
              {plan.name}
            </p>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2, fontFamily: 'var(--font-body)' }}>
              {formatAmount(plan.amount, currency)} · {freq?.label ?? plan.frequency}
            </p>
          </div>
        </div>
        <button onClick={onDelete} title="Delete plan" style={{
          background: 'transparent', border: 'none', color: 'var(--muted)',
          fontSize: 18, cursor: 'pointer', padding: '2px 6px',
          transition: 'color 0.15s', flexShrink: 0,
        }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
        >×</button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <div style={{
          background: 'var(--bg3)', borderRadius: 10, padding: '12px',
          border: '1px solid var(--border)',
        }}>
          <p style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase', fontFamily: 'var(--font-body)', marginBottom: 6 }}>
            Total invested
          </p>
          <p style={{ fontSize: 17, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--green)', letterSpacing: -0.5 }}>
            {formatAmount(totalInvested, currency)}
          </p>
        </div>
        <div style={{
          background: 'var(--bg3)', borderRadius: 10, padding: '12px',
          border: '1px solid var(--border)',
        }}>
          <p style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase', fontFamily: 'var(--font-body)', marginBottom: 6 }}>
            Contributions
          </p>
          <p style={{ fontSize: 17, fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: -0.5 }}>
            {contributions}
          </p>
        </div>
        <div style={{
          background: 'var(--bg3)', borderRadius: 10, padding: '12px',
          border: '1px solid var(--border)',
        }}>
          <p style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase', fontFamily: 'var(--font-body)', marginBottom: 6 }}>
            Next date
          </p>
          <p style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)', color: 'var(--muted2)' }}>
            {formatNextDate(nextDate)}
          </p>
        </div>
      </div>

      {/* Yearly projection */}
      {plan.amount > 0 && freq && (
        <div style={{
          marginTop: 12, padding: '10px 14px', borderRadius: 10,
          background: 'rgba(0,217,139,0.05)', border: '1px solid rgba(0,217,139,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <p style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>
            Yearly contribution
          </p>
          <p style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--green)' }}>
            {formatAmount(Math.round((365 / freq.days) * plan.amount), currency)}
          </p>
        </div>
      )}
    </div>
  )
}

// ─── DCA ─────────────────────────────────────────────────────────────────────

export default function DCA({ user, currency = 'USD' }) {
  const [plans, setPlansState] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(getStorageKey(user))
      setPlansState(stored ? JSON.parse(stored) : [])
    } catch {
      setPlansState([])
    }
    setLoading(false)
  }, [user])

  function persist(updated) {
    setPlansState(updated)
    try { localStorage.setItem(getStorageKey(user), JSON.stringify(updated)) } catch {}
  }

  function addPlan(form) {
    persist([...plans, {
      id: Date.now(),
      emoji: form.emoji,
      name: form.name,
      amount: form.amount,
      frequency: form.frequency,
      startDate: form.startDate || new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
    }])
  }

  function deletePlan(id) {
    persist(plans.filter(p => p.id !== id))
  }

  const totalMonthly = useMemo(() => {
    return plans.reduce((sum, p) => {
      const freq = FREQ_MAP[p.frequency]
      if (!freq) return sum
      return sum + (p.amount * 30 / freq.days)
    }, 0)
  }, [plans])

  const totalYearly = useMemo(() => {
    return plans.reduce((sum, p) => {
      const freq = FREQ_MAP[p.frequency]
      if (!freq) return sum
      return sum + (p.amount * 365 / freq.days)
    }, 0)
  }, [plans])

  return (
    <div style={{ maxWidth: 1600 }}>
      {showModal && <AddDCAModal onAdd={addPlan} onClose={() => setShowModal(false)} />}

      {/* Header */}
      <div className="fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 600, fontFamily: 'var(--font-display)', letterSpacing: 0.3 }}>
            DCA Plans
          </h1>
          <p style={{ fontSize: 14, color: 'var(--muted2)', marginTop: 8, fontFamily: 'var(--font-body)', fontWeight: 300 }}>
            {plans.length > 0
              ? `${plans.length} active plan${plans.length > 1 ? 's' : ''} · investing automatically`
              : 'Track your recurring investment orders.'}
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
          + New plan
        </button>
      </div>

      {/* Summary bar */}
      {plans.length > 0 && (
        <div className="fade-up" style={{
          background: 'var(--bg2)', borderRadius: 12, padding: '14px 20px',
          border: '1px solid var(--border)', marginBottom: 24,
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 24,
          animationDelay: '60ms',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', animation: 'pulse-green 2s infinite', flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: 'var(--muted2)', fontFamily: 'var(--font-body)' }}>Monthly total:</span>
            <span style={{ fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--green)' }}>
              {formatAmount(Math.round(totalMonthly), currency)}
            </span>
          </div>
          <div style={{ width: 1, height: 18, background: 'var(--border)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--muted2)', fontFamily: 'var(--font-body)' }}>Yearly total:</span>
            <span style={{ fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-display)', letterSpacing: 0.2 }}>
              {formatAmount(Math.round(totalYearly), currency)}
            </span>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, var(--green), var(--teal))', animation: 'pulse-green 1.5s infinite' }} />
        </div>
      ) : plans.length === 0 ? (
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
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M6 26L6 18" stroke="#00d98b" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M13 26L13 12" stroke="#00d98b" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M20 26L20 16" stroke="#00d98b" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M27 26L27 8" stroke="#00d98b" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M4 10L10 6L17 10L24 4" stroke="#00d98b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
              <circle cx="24" cy="4" r="2" fill="#00d98b" opacity="0.8"/>
            </svg>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 600, fontFamily: 'var(--font-display)', letterSpacing: 0.3, marginBottom: 10 }}>
            No DCA plans yet
          </h2>
          <p style={{ fontSize: 14, color: 'var(--muted2)', fontFamily: 'var(--font-body)', fontWeight: 300,
            maxWidth: 360, margin: '0 auto 28px', lineHeight: 1.6 }}>
            Dollar-cost averaging is one of the most powerful wealth-building strategies. Set up a recurring investment order and let time do the work.
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
            + Add your first plan
          </button>
        </div>
      ) : (
        <div className="goals-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {plans.map((plan, i) => (
            <div key={plan.id} className="fade-up" style={{ animationDelay: i * 60 + 'ms' }}>
              <DCACard
                plan={plan}
                currency={currency}
                onDelete={() => deletePlan(plan.id)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
