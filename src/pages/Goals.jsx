import { useState, useEffect } from 'react'
import { formatAmount } from './Dashboard'

const SUGGESTIONS = [
  { emoji: '💰', name: 'First $100k',     target: 100000 },
  { emoji: '🏠', name: 'Buy a house',     target: 500000 },
  { emoji: '🏖️', name: 'Retire early',   target: 2000000 },
  { emoji: '🛡️', name: 'Emergency fund', target: 25000 },
  { emoji: '🎯', name: 'First million',  target: 1000000 },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function estimateMonths(currentTotal, targetAmount, history) {
  if (currentTotal >= targetAmount) return null
  if (!history || history.length < 2) return null

  const sorted = [...history].sort((a, b) =>
    new Date(a.recorded_at) - new Date(b.recorded_at)
  )
  const oldest = sorted[0]
  const newest = sorted[sorted.length - 1]
  const spanMs = new Date(newest.recorded_at) - new Date(oldest.recorded_at)
  if (spanMs < 1000 * 60 * 60 * 24) return null

  const monthlyGrowth = (newest.value - oldest.value) / (spanMs / (1000 * 60 * 60 * 24 * 30))
  if (monthlyGrowth <= 0) return null

  return Math.ceil((targetAmount - currentTotal) / monthlyGrowth)
}

function formatMonths(months) {
  if (months === null) return null
  if (months < 1) return 'Less than a month'
  if (months < 12) return `~${months} month${months > 1 ? 's' : ''}`
  const y = Math.floor(months / 12)
  const m = months % 12
  return m === 0 ? `~${y} year${y > 1 ? 's' : ''}` : `~${y}y ${m}m`
}

// ─── AddGoalModal ─────────────────────────────────────────────────────────────

function AddGoalModal({ onAdd, onClose }) {
  const [form, setForm] = useState({ emoji: '🎯', name: '', target: '', date: '' })
  const [saving, setSaving] = useState(false)

  const inputStyle = {
    padding: '10px 14px', borderRadius: 10,
    border: '1px solid var(--border2)', background: 'var(--bg3)',
    color: 'var(--text)', fontSize: 14, outline: 'none',
    fontFamily: 'var(--font-body)', width: '100%',
  }

  function patch(key, val) { setForm(f => ({ ...f, [key]: val })) }

  async function handleAdd() {
    if (!form.name || !form.target) return
    setSaving(true)
    await onAdd({ ...form, target: parseFloat(form.target) })
    setSaving(false)
    onClose()
  }

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
            New goal
          </p>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border2)',
            color: 'var(--text)', fontSize: 18, cursor: 'pointer',
            width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        </div>

        {/* Suggestions */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8, fontFamily: 'var(--font-body)',
            letterSpacing: 1, textTransform: 'uppercase' }}>Quick pick</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {SUGGESTIONS.map(s => (
              <button key={s.name} onClick={() => setForm({ emoji: s.emoji, name: s.name, target: String(s.target), date: '' })}
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
          <div style={{ display: 'flex', gap: 10 }}>
            <input placeholder="Emoji" value={form.emoji}
              onChange={e => patch('emoji', e.target.value)}
              style={{ ...inputStyle, width: 72, textAlign: 'center', fontSize: 20, padding: '10px 8px' }} />
            <input placeholder="Goal name" value={form.name}
              onChange={e => patch('name', e.target.value)} style={{ ...inputStyle, flex: 1 }} />
          </div>
          <input placeholder="Target amount (USD)" type="number" value={form.target}
            onChange={e => patch('target', e.target.value)} style={inputStyle} />
          <input placeholder="Target date (optional)" type="date" value={form.date}
            onChange={e => patch('date', e.target.value)}
            style={{ ...inputStyle, colorScheme: 'dark' }} />
          <button onClick={handleAdd} disabled={saving || !form.name || !form.target} style={{
            background: 'linear-gradient(135deg, var(--green), var(--teal))',
            color: '#0a0a0f', padding: '12px', borderRadius: 10,
            fontSize: 14, fontWeight: 700, border: 'none', cursor: saving ? 'default' : 'pointer',
            fontFamily: 'var(--font-display)', letterSpacing: 0.5,
            opacity: !form.name || !form.target ? 0.5 : 1,
            transition: 'opacity 0.15s',
          }}>
            {saving ? 'Saving…' : 'Create goal'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── GoalCard ─────────────────────────────────────────────────────────────────

function GoalCard({ goal, currentTotal, history, currency, onDelete }) {
  const pct = Math.min(100, (currentTotal / goal.target_amount) * 100)
  const remaining = Math.max(0, goal.target_amount - currentTotal)
  const done = currentTotal >= goal.target_amount
  const months = estimateMonths(currentTotal, goal.target_amount, history)
  const eta = formatMonths(months)

  const daysLeft = goal.target_date
    ? Math.ceil((new Date(goal.target_date) - new Date()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div style={{
      background: 'var(--bg2)', borderRadius: 16,
      border: done ? '1px solid rgba(0,217,139,0.3)' : '1px solid var(--border)',
      padding: '20px 22px', position: 'relative', overflow: 'hidden',
      transition: 'border-color 0.2s, transform 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = done ? 'rgba(0,217,139,0.5)' : 'var(--border2)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = done ? 'rgba(0,217,139,0.3)' : 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)' }}
    >
      {done && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg, var(--green), var(--teal))', borderRadius: '16px 16px 0 0',
        }} />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, fontSize: 20,
            background: done ? 'rgba(0,217,139,0.12)' : 'var(--bg3)',
            border: done ? '1px solid rgba(0,217,139,0.25)' : '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            {done ? '✅' : goal.emoji}
          </div>
          <div>
            <p style={{ fontWeight: 600, fontSize: 15, fontFamily: 'var(--font-display)', letterSpacing: 0.2 }}>{goal.name}</p>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2, fontFamily: 'var(--font-body)' }}>
              Target: {formatAmount(goal.target_amount, currency)}
              {goal.target_date && ` · ${new Date(goal.target_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`}
            </p>
          </div>
        </div>
        <button onClick={onDelete} title="Delete goal" style={{
          background: 'transparent', border: 'none', color: 'var(--muted)',
          fontSize: 18, cursor: 'pointer', padding: '2px 6px',
          transition: 'color 0.15s', flexShrink: 0,
        }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
        >×</button>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ height: 8, background: 'var(--bg3)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 4,
            width: pct + '%',
            background: done
              ? 'linear-gradient(90deg, var(--green), var(--teal))'
              : pct > 60 ? 'var(--blue)' : 'var(--purple)',
            transition: 'width 1s ease',
          }} />
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 20 }}>
          <div>
            <p style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>Progress</p>
            <p style={{ fontSize: 16, fontWeight: 600, fontFamily: 'var(--font-display)', color: done ? 'var(--green)' : 'var(--text)', marginTop: 2 }}>
              {pct.toFixed(1)}%
            </p>
          </div>
          {!done && (
            <div>
              <p style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>Remaining</p>
              <p style={{ fontSize: 16, fontWeight: 600, fontFamily: 'var(--font-display)', marginTop: 2 }}>
                {formatAmount(remaining, currency)}
              </p>
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          {done ? (
            <span style={{
              fontSize: 11, fontWeight: 600, color: 'var(--green)',
              background: 'rgba(0,217,139,0.1)', border: '1px solid rgba(0,217,139,0.25)',
              padding: '3px 10px', borderRadius: 20, fontFamily: 'var(--font-body)',
            }}>Achieved ✦</span>
          ) : eta ? (
            <div>
              <p style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>Est. time</p>
              <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted2)', marginTop: 2, fontFamily: 'var(--font-body)' }}>{eta}</p>
            </div>
          ) : daysLeft != null ? (
            <div>
              <p style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>Deadline</p>
              <p style={{ fontSize: 13, fontWeight: 500, color: daysLeft < 30 ? 'var(--red)' : 'var(--muted2)', marginTop: 2, fontFamily: 'var(--font-body)' }}>
                {daysLeft > 0 ? `${daysLeft}d left` : 'Overdue'}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

// ─── Goals ────────────────────────────────────────────────────────────────────

function getStorageKey(user) {
  return `wv_goals_${user?.id || 'local'}`
}

export default function Goals({ assets, user, netWorthHistory, currency = 'USD' }) {
  const [goals, setGoalsState] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const total = assets.reduce((s, a) => s + (a.value || 0), 0)

  // Load goals from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(getStorageKey(user))
      setGoalsState(stored ? JSON.parse(stored) : [])
    } catch {
      setGoalsState([])
    }
    setLoading(false)
  }, [user])

  function persist(updated) {
    setGoalsState(updated)
    try {
      localStorage.setItem(getStorageKey(user), JSON.stringify(updated))
    } catch {}
  }

  function addGoal(form) {
    const newGoal = {
      id: Date.now(),
      user_id: user?.id,
      name: form.name,
      target_amount: form.target,
      target_date: form.date || null,
      emoji: form.emoji,
      created_at: new Date().toISOString(),
    }
    persist([...goals, newGoal])
  }

  function deleteGoal(id) {
    persist(goals.filter(g => g.id !== id))
  }

  return (
    <div style={{ maxWidth: 1600 }}>
      {showModal && <AddGoalModal onAdd={addGoal} onClose={() => setShowModal(false)} />}


      {/* Header */}
      <div className="fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 36 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 600, fontFamily: 'var(--font-display)', letterSpacing: 0.3 }}>
            Goals
          </h1>
          <p style={{ fontSize: 14, color: 'var(--muted2)', marginTop: 8, fontFamily: 'var(--font-body)', fontWeight: 300 }}>
            {goals.length > 0
              ? `${goals.filter(g => total >= g.target_amount).length} of ${goals.length} goals achieved`
              : 'Set financial targets and track your progress.'}
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
          + New goal
        </button>
      </div>

      {/* Current net worth indicator */}
      {total > 0 && (
        <div className="fade-up" style={{
          background: 'var(--bg2)', borderRadius: 12, padding: '14px 20px',
          border: '1px solid var(--border)', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 12,
          animationDelay: '60ms',
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', animation: 'pulse-green 2s infinite', flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: 'var(--muted2)', fontFamily: 'var(--font-body)' }}>
            Current net worth:
          </span>
          <span style={{ fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-display)', letterSpacing: 0.3, color: 'var(--green)' }}>
            {formatAmount(total, currency)}
          </span>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, var(--green), var(--teal))', animation: 'pulse-green 1.5s infinite' }} />
        </div>
      ) : goals.length === 0 ? (
        // Empty state
        <div className="fade-up" style={{
          background: 'var(--bg2)', borderRadius: 20, padding: '64px 32px',
          border: '1px solid var(--border)', textAlign: 'center',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            width: 400, height: 400, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(167,139,250,0.05) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: 'linear-gradient(135deg, rgba(167,139,250,0.15), rgba(77,159,255,0.1))',
            border: '1px solid rgba(167,139,250,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="13" stroke="#a78bfa" strokeWidth="2" opacity="0.9"/>
              <circle cx="16" cy="16" r="8" stroke="#a78bfa" strokeWidth="1.5" opacity="0.55"/>
              <circle cx="16" cy="16" r="3.5" fill="#a78bfa" opacity="0.9"/>
              <line x1="16" y1="1" x2="16" y2="6" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"/>
              <line x1="16" y1="26" x2="16" y2="31" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"/>
              <line x1="1" y1="16" x2="6" y2="16" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"/>
              <line x1="26" y1="16" x2="31" y2="16" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 600, fontFamily: 'var(--font-display)', letterSpacing: 0.3, marginBottom: 10 }}>
            No goals yet
          </h2>
          <p style={{ fontSize: 14, color: 'var(--muted2)', fontFamily: 'var(--font-body)', fontWeight: 300,
            maxWidth: 340, margin: '0 auto 28px', lineHeight: 1.6 }}>
            Every great financial journey starts with a clear target. Set your first goal and watch yourself move closer every day.
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
            + Create your first goal
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 16 }}>
          {goals.map((goal, i) => (
            <div key={goal.id} className="fade-up" style={{ animationDelay: i * 60 + 'ms' }}>
              <GoalCard
                goal={goal}
                currentTotal={total}
                history={netWorthHistory}
                currency={currency}
                onDelete={() => deleteGoal(goal.id)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
