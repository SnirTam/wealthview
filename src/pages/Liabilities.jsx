import { useState } from 'react'
import { formatAmount } from './Dashboard'

const LIABILITY_CATEGORIES = ['Mortgage', 'Car Loan', 'Student Loan', 'Credit Card', 'Personal Loan', 'Other']

const LIABILITY_ICONS = {
  'Mortgage':      '🏠',
  'Car Loan':      '🚗',
  'Student Loan':  '🎓',
  'Credit Card':   '💳',
  'Personal Loan': '💸',
  'Other':         '📋',
}

const LIABILITY_COLORS = {
  'Mortgage':      '#ff4d6d',
  'Car Loan':      '#ff8c42',
  'Student Loan':  '#a78bfa',
  'Credit Card':   '#4d9fff',
  'Personal Loan': '#ffb340',
  'Other':         '#6b6b80',
}

function AddLiabilityModal({ onAdd, onClose }) {
  const [name, setName]               = useState('')
  const [category, setCategory]       = useState(LIABILITY_CATEGORIES[0])
  const [balance, setBalance]         = useState('')
  const [interestRate, setInterestRate] = useState('')

  function handleSubmit() {
    if (!name.trim() || !balance) return
    onAdd({
      id: Date.now(),
      name: name.trim(),
      category,
      balance: parseFloat(balance),
      interest_rate: parseFloat(interestRate) || 0,
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
              Add Liability
            </p>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2, fontFamily: 'var(--font-body)' }}>
              Track a new debt or obligation
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border2)',
            color: 'var(--text)', fontSize: 18, cursor: 'pointer',
            width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        </div>

        <label style={labelStyle}>Name</label>
        <input
          type="text"
          placeholder="e.g. Home mortgage"
          value={name}
          onChange={e => setName(e.target.value)}
          autoFocus
          style={inputStyle}
        />

        <label style={labelStyle}>Category</label>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
        >
          {LIABILITY_CATEGORIES.map(c => (
            <option key={c} value={c}>{LIABILITY_ICONS[c]} {c}</option>
          ))}
        </select>

        <label style={labelStyle}>Balance (USD)</label>
        <input
          type="number"
          placeholder="0"
          value={balance}
          onChange={e => setBalance(e.target.value)}
          style={inputStyle}
          min="0"
        />

        <label style={labelStyle}>Interest Rate (% — optional)</label>
        <input
          type="number"
          placeholder="e.g. 6.5"
          value={interestRate}
          onChange={e => setInterestRate(e.target.value)}
          style={{ ...inputStyle, marginBottom: 20 }}
          min="0"
          max="100"
          step="0.01"
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
            Save Liability
          </button>
        </div>
      </div>
    </div>
  )
}

function EditLiabilityModal({ liability, onSave, onClose }) {
  const [balance, setBalance]         = useState(String(liability.balance))
  const [interestRate, setInterestRate] = useState(String(liability.interest_rate || ''))

  function handleSave() {
    const parsed = parseFloat(balance)
    if (isNaN(parsed) || parsed < 0) return
    onSave(liability.id, parsed, parseFloat(interestRate) || 0)
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
              Update liability
            </p>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2, fontFamily: 'var(--font-body)' }}>
              {liability.name}
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border2)',
            color: 'var(--text)', fontSize: 18, cursor: 'pointer',
            width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        </div>

        <label style={labelStyle}>Balance (USD)</label>
        <input
          type="number"
          value={balance}
          onChange={e => setBalance(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          autoFocus
          style={{ ...inputStyle, fontSize: 20, fontFamily: 'var(--font-display)', fontWeight: 600 }}
        />

        <label style={labelStyle}>Interest Rate (%)</label>
        <input
          type="number"
          value={interestRate}
          onChange={e => setInterestRate(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          style={{ ...inputStyle, marginBottom: 16 }}
          min="0"
          max="100"
          step="0.01"
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

export default function Liabilities({ liabilities, setLiabilities, user, currency = 'USD' }) {
  const [filter, setFilter]           = useState('All')
  const [showAdd, setShowAdd]         = useState(false)
  const [editingItem, setEditingItem] = useState(null)

  const total    = liabilities.reduce((s, l) => s + (l.balance || 0), 0)
  const filtered = filter === 'All' ? liabilities : liabilities.filter(l => l.category === filter)

  function addLiability(item) {
    setLiabilities([...liabilities, item])
  }

  function removeLiability(id) {
    setLiabilities(liabilities.filter(l => l.id !== id))
  }

  function updateLiability(id, newBalance, newRate) {
    setLiabilities(liabilities.map(l => l.id === id ? { ...l, balance: newBalance, interest_rate: newRate } : l))
  }

  // Summary stats
  const monthlyInterest = liabilities.reduce((s, l) => {
    return s + (l.balance || 0) * (l.interest_rate || 0) / 12 / 100
  }, 0)

  const highestInterest = liabilities.reduce((best, l) => {
    if (!best || (l.interest_rate || 0) > (best.interest_rate || 0)) return l
    return best
  }, null)

  // Initials icon from category
  function getCategoryInitials(category) {
    return category.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  }

  return (
    <div style={{ maxWidth: 1600 }}>

      {showAdd && (
        <AddLiabilityModal onAdd={addLiability} onClose={() => setShowAdd(false)} />
      )}

      {editingItem && (
        <EditLiabilityModal
          liability={editingItem}
          onSave={updateLiability}
          onClose={() => setEditingItem(null)}
        />
      )}

      {/* Header */}
      <div className="fade-up" style={{ marginBottom: 36, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 600, lineHeight: 1.1, fontFamily: 'var(--font-display)', letterSpacing: 0.3 }}>
            Liabilities
          </h1>
          <p style={{ fontSize: 14, color: 'var(--muted2)', marginTop: 8, fontFamily: 'var(--font-body)', fontWeight: 300 }}>
            {liabilities.length} {liabilities.length === 1 ? 'liability' : 'liabilities'} tracked
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          style={{
            padding: '10px 20px', borderRadius: 20, fontSize: 13, fontWeight: 500,
            background: 'var(--red-dim)', color: 'var(--red)',
            border: '1px solid rgba(255, 77, 109, 0.30)',
            cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 0.15s',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,77,109,0.18)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--red-dim)' }}
        >
          + Add liability
        </button>
      </div>

      {/* Category summary cards */}
      <div className="fade-up summary-grid" style={{
        display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)',
        gap: 12, marginBottom: 24, animationDelay: '80ms',
      }}>
        {LIABILITY_CATEGORIES.map(cat => {
          const catTotal = liabilities.filter(l => l.category === cat).reduce((s, l) => s + (l.balance || 0), 0)
          const pct      = total > 0 ? (catTotal / total * 100).toFixed(0) : 0
          const active   = filter === cat
          const color    = LIABILITY_COLORS[cat]
          return (
            <div
              key={cat}
              onClick={() => setFilter(active ? 'All' : cat)}
              style={{
                background: active ? color + '15' : 'var(--bg2)',
                borderRadius: 14, padding: '16px',
                border: active ? '1px solid ' + color + '50' : '1px solid var(--border)',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = 'var(--border2)' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = 'var(--border)' }}
            >
              <div style={{ fontSize: 20, marginBottom: 8 }}>{LIABILITY_ICONS[cat]}</div>
              <p style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 6, fontFamily: 'var(--font-body)', letterSpacing: 1, textTransform: 'uppercase' }}>
                {cat}
              </p>
              <p style={{ fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-display)', letterSpacing: 0.3, color: catTotal > 0 ? 'var(--red)' : 'var(--muted)' }}>
                {catTotal > 0 ? formatAmount(catTotal, currency) : '—'}
              </p>
              <p style={{ fontSize: 11, color: color, marginTop: 4, fontWeight: 500, fontFamily: 'var(--font-body)' }}>
                {pct}% of debt
              </p>
            </div>
          )
        })}
      </div>

      {/* Summary stats bar */}
      {liabilities.length > 0 && (
        <div className="fade-up" style={{
          display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap',
          animationDelay: '120ms',
        }}>
          <div style={{
            background: 'var(--bg2)', borderRadius: 12, padding: '14px 20px',
            border: '1px solid var(--border)', flex: '1 1 160px',
          }}>
            <p style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
              Total Debt
            </p>
            <p style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--red)', letterSpacing: 0.3 }}>
              {formatAmount(total, currency)}
            </p>
          </div>

          {highestInterest && highestInterest.interest_rate > 0 && (
            <div style={{
              background: 'var(--bg2)', borderRadius: 12, padding: '14px 20px',
              border: '1px solid var(--border)', flex: '1 1 200px',
            }}>
              <p style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                Highest Interest
              </p>
              <p style={{ fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-display)', letterSpacing: 0.3 }}>
                {highestInterest.name}
              </p>
              <p style={{ fontSize: 12, color: '#ff8c42', fontFamily: 'var(--font-body)', marginTop: 2 }}>
                {highestInterest.interest_rate.toFixed(2)}% APR
              </p>
            </div>
          )}

          {monthlyInterest > 0 && (
            <div style={{
              background: 'var(--bg2)', borderRadius: 12, padding: '14px 20px',
              border: '1px solid var(--border)', flex: '1 1 180px',
            }}>
              <p style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                Est. Monthly Interest
              </p>
              <p style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-display)', color: '#ffb340', letterSpacing: 0.3 }}>
                {formatAmount(monthlyInterest, currency)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {['All', ...LIABILITY_CATEGORIES].map(cat => (
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

      {/* Liabilities table */}
      <div className="fade-up table-scroll" style={{
        background: 'var(--bg2)', borderRadius: 16,
        border: '1px solid var(--border)', overflow: 'hidden', animationDelay: '200ms',
      }}>
        {/* Table header */}
        <div className="liabilities-table-header" style={{
          display: 'grid', gridTemplateColumns: '1fr 140px 150px 120px 100px 90px',
          padding: '12px 24px', borderBottom: '1px solid var(--border)',
          fontSize: 10, color: 'var(--muted)', fontWeight: 500,
          textTransform: 'uppercase', letterSpacing: 1.5, fontFamily: 'var(--font-body)',
        }}>
          <span>Liability</span>
          <span>Category</span>
          <span style={{ textAlign: 'right' }}>Balance</span>
          <span style={{ textAlign: 'right' }}>Interest Rate</span>
          <span style={{ textAlign: 'right' }}>Share</span>
          <span style={{ textAlign: 'center' }}>Actions</span>
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--muted)' }}>
            <p style={{ fontSize: 15, fontFamily: 'var(--font-display)', letterSpacing: 0.3 }}>
              {filter === 'All'
                ? 'No liabilities tracked — debt-free? Add one to start tracking'
                : `No ${filter} liabilities.`}
            </p>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6, fontFamily: 'var(--font-body)' }}>
              Click "+ Add liability" to get started.
            </p>
          </div>
        )}

        {/* Rows */}
        {filtered.map((item, i) => {
          const pct   = total > 0 ? (item.balance / total * 100) : 0
          const color = LIABILITY_COLORS[item.category] || '#6b6b80'
          const initials = getCategoryInitials(item.category)
          return (
            <div
              key={item.id}
              className="liabilities-table-row"
              style={{
                display: 'grid', gridTemplateColumns: '1fr 140px 150px 120px 100px 90px',
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
                  width: 38, height: 38, borderRadius: 10,
                  background: color + '22',
                  border: '1px solid ' + color + '40',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, color: color,
                  fontFamily: 'var(--font-display)', flexShrink: 0,
                }}>
                  {initials}
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500, fontFamily: 'var(--font-body)' }}>{item.name}</p>
                  <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2, fontFamily: 'var(--font-body)' }}>
                    {item.category}
                  </p>
                </div>
              </div>

              {/* Category badge */}
              <span style={{
                fontSize: 11, padding: '4px 10px', borderRadius: 20,
                background: color + '18',
                color: color,
                border: '1px solid ' + color + '35',
                fontWeight: 500, width: 'fit-content', fontFamily: 'var(--font-body)',
              }}>
                {LIABILITY_ICONS[item.category]} {item.category}
              </span>

              {/* Balance */}
              <p style={{
                fontSize: 15, fontWeight: 600, textAlign: 'right',
                fontFamily: 'var(--font-display)', letterSpacing: 0.3,
                color: 'var(--red)',
              }}>
                {formatAmount(item.balance, currency)}
              </p>

              {/* Interest rate */}
              <p style={{
                fontSize: 13, textAlign: 'right',
                fontFamily: 'var(--font-body)',
                color: item.interest_rate > 0 ? '#ffb340' : 'var(--muted)',
              }}>
                {item.interest_rate > 0 ? item.interest_rate.toFixed(2) + '%' : '—'}
              </p>

              {/* Share bar */}
              <div style={{ paddingLeft: 10 }}>
                <p style={{ fontSize: 12, color: 'var(--muted2)', marginBottom: 4, textAlign: 'right', fontFamily: 'var(--font-body)' }}>
                  {pct.toFixed(1)}%
                </p>
                <div style={{ height: 4, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 2, width: pct + '%',
                    background: 'linear-gradient(90deg, var(--red), #ff8c42)',
                    transition: 'width 1s ease',
                  }} />
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <button
                  onClick={() => setEditingItem(item)}
                  title="Edit"
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
                <button
                  onClick={() => removeLiability(item.id)}
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
            display: 'grid', gridTemplateColumns: '1fr 140px 150px 120px 100px 90px',
            padding: '16px 24px', borderTop: '1px solid var(--border2)',
            background: 'var(--bg3)',
          }}>
            <p style={{ fontSize: 13, color: 'var(--muted2)', fontFamily: 'var(--font-body)', fontWeight: 400, letterSpacing: 0.5 }}>
              {filter === 'All' ? 'Total debt' : filter + ' total'}
            </p>
            <span />
            <p style={{ fontSize: 17, fontWeight: 600, textAlign: 'right', fontFamily: 'var(--font-display)', color: 'var(--red)', letterSpacing: 0.3 }}>
              {formatAmount(filtered.reduce((s, l) => s + (l.balance || 0), 0), currency)}
            </p>
            <span /><span /><span />
          </div>
        )}
      </div>
    </div>
  )
}
