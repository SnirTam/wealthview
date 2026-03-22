import { useState } from 'react'

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  zIndex: 200,
  background: 'rgba(0,0,0,0.85)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 20,
}

const cardStyle = {
  background: 'var(--bg2)',
  borderRadius: 24,
  padding: 48,
  width: '100%',
  maxWidth: 500,
  border: '1px solid var(--border2)',
  position: 'relative',
}

const inputStyle = {
  padding: '10px 14px',
  borderRadius: 10,
  border: '1px solid var(--border2)',
  background: 'var(--bg3)',
  color: 'var(--text)',
  fontSize: 14,
  outline: 'none',
  fontFamily: 'var(--font-body)',
  width: '100%',
}

const btnGreen = {
  width: '100%',
  padding: '14px 0',
  borderRadius: 12,
  border: 'none',
  background: 'linear-gradient(135deg, var(--green), var(--teal))',
  color: '#0a0a0f',
  fontSize: 15,
  fontWeight: 700,
  fontFamily: 'var(--font-body)',
  cursor: 'pointer',
  letterSpacing: 0.3,
}

const skipStyle = {
  display: 'block',
  textAlign: 'center',
  marginTop: 14,
  fontSize: 13,
  color: 'var(--muted)',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
}

function getFirstName(user) {
  const meta = user?.user_metadata
  if (meta?.full_name) return meta.full_name.split(' ')[0]
  if (meta?.name) return meta.name.split(' ')[0]
  if (user?.email) {
    const local = user.email.split('@')[0]
    const part = local.split(/[._\-+]/)[0]
    return part.charAt(0).toUpperCase() + part.slice(1)
  }
  return 'there'
}

// ─── Step 1 ──────────────────────────────────────────────────────────────────

function Step1({ firstName, onNext, onSkip }) {
  const features = [
    { icon: '📈', text: 'Track stocks, crypto & real estate' },
    { icon: '⚖️', text: 'True net worth: assets minus liabilities' },
    { icon: '🎯', text: 'Set goals and celebrate milestones' },
  ]

  return (
    <div style={cardStyle}>
      {/* W logo */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18,
          background: 'linear-gradient(135deg, var(--green), var(--teal))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 36, fontWeight: 700, fontFamily: 'var(--font-display)',
          color: '#0a0a0f',
        }}>W</div>
      </div>

      <h2 style={{
        textAlign: 'center', fontSize: 24, fontFamily: 'var(--font-display)',
        fontWeight: 700, marginBottom: 10, color: 'var(--text)',
      }}>
        Welcome to Wealthview, {firstName}!
      </h2>
      <p style={{ textAlign: 'center', color: 'var(--muted2)', fontSize: 15, marginBottom: 32, lineHeight: 1.5 }}>
        Let's build your complete financial picture in 2 minutes.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 36 }}>
        {features.map(f => (
          <div key={f.text} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            background: 'var(--bg3)', borderRadius: 12, padding: '14px 16px',
            border: '1px solid var(--border)',
          }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>{f.icon}</span>
            <span style={{ fontSize: 14, color: 'var(--text)', fontFamily: 'var(--font-body)' }}>{f.text}</span>
          </div>
        ))}
      </div>

      <button style={btnGreen} onClick={onNext}>Get started</button>
      <button style={skipStyle} onClick={onSkip}>Skip for now</button>
    </div>
  )
}

// ─── Step 2 ──────────────────────────────────────────────────────────────────

function Step2({ onSubmit, onBack, onSkip }) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Stocks')
  const [value, setValue] = useState('')
  const [ticker, setTicker] = useState('')

  function handleAdd() {
    if (!name || !value) return
    onSubmit({ id: Date.now(), name, category, value: parseFloat(value), ticker: ticker || null })
  }

  return (
    <div style={cardStyle}>
      {/* Back arrow */}
      <button
        onClick={onBack}
        style={{
          position: 'absolute', top: 20, left: 20,
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--muted2)', display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 13, fontFamily: 'var(--font-body)', padding: '4px 8px',
          borderRadius: 8,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Back
      </button>

      <h3 style={{
        fontSize: 22, fontFamily: 'var(--font-display)', fontWeight: 700,
        marginBottom: 8, marginTop: 20, color: 'var(--text)',
      }}>
        Add your first asset
      </h3>
      <p style={{ color: 'var(--muted2)', fontSize: 14, marginBottom: 28, lineHeight: 1.5 }}>
        Start with something simple — a stock, your savings, or any investment.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
        <input
          style={inputStyle}
          type="text"
          placeholder="e.g. Apple Stock, Savings Account"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <select
          style={{ ...inputStyle, appearance: 'none' }}
          value={category}
          onChange={e => setCategory(e.target.value)}
        >
          {['Stocks', 'Crypto', 'Real Estate', 'Retirement', 'Cash'].map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <input
          style={inputStyle}
          type="number"
          placeholder="Current value in USD"
          value={value}
          onChange={e => setValue(e.target.value)}
          min="0"
        />
        <input
          style={inputStyle}
          type="text"
          placeholder="e.g. AAPL (optional)"
          value={ticker}
          onChange={e => setTicker(e.target.value.toUpperCase())}
        />
      </div>

      <button
        style={{ ...btnGreen, opacity: !name || !value ? 0.5 : 1 }}
        onClick={handleAdd}
        disabled={!name || !value}
      >
        Add asset
      </button>
      <button style={skipStyle} onClick={onSkip}>Skip for now</button>
    </div>
  )
}

// ─── Step 3 ──────────────────────────────────────────────────────────────────

function Step3({ assetName, assetValue, onComplete }) {
  const formattedValue = '$' + (assetValue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })

  const nextSteps = ['Try adding a liability', 'Set a goal', 'Explore analytics']

  return (
    <div style={cardStyle}>
      {/* Animated checkmark */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
        <svg width="80" height="80" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="36" fill="rgba(0,217,139,0.12)" stroke="var(--green)" strokeWidth="3"/>
          <polyline
            points="24,42 35,53 56,30"
            fill="none"
            stroke="var(--green)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: 50,
              strokeDashoffset: 0,
              animation: 'checkDraw 0.5s ease forwards',
            }}
          />
          <style>{`
            @keyframes checkDraw {
              from { stroke-dashoffset: 50; opacity: 0; }
              to   { stroke-dashoffset: 0;  opacity: 1; }
            }
          `}</style>
        </svg>
      </div>

      <h2 style={{
        textAlign: 'center', fontSize: 26, fontFamily: 'var(--font-display)',
        fontWeight: 700, marginBottom: 12, color: 'var(--text)',
      }}>
        You're all set!
      </h2>
      <p style={{
        textAlign: 'center', color: 'var(--muted2)', fontSize: 15,
        marginBottom: 32, lineHeight: 1.6,
      }}>
        Your portfolio is live with <strong style={{ color: 'var(--text)' }}>{assetName || 'your first asset'}</strong>.
        {' '}Your net worth: <strong style={{ color: 'var(--green)' }}>{formattedValue}</strong>.
      </p>

      <button style={btnGreen} onClick={onComplete}>Go to dashboard</button>

      {/* Next steps row */}
      <div style={{
        display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap', justifyContent: 'center',
      }}>
        {nextSteps.map(s => (
          <span key={s} style={{
            fontSize: 11, color: 'var(--muted)', background: 'var(--bg3)',
            border: '1px solid var(--border)', borderRadius: 20,
            padding: '4px 10px', fontFamily: 'var(--font-body)',
          }}>
            {s}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function OnboardingModal({ user, onComplete, onSkip, onAddAsset }) {
  const [step, setStep] = useState(1)
  const [addedAsset, setAddedAsset] = useState(null)
  const firstName = getFirstName(user)

  function handleAddAsset(asset) {
    setAddedAsset(asset)
    if (onAddAsset) onAddAsset(asset)
    setStep(3)
  }

  return (
    <div style={overlayStyle}>
      {step === 1 && (
        <Step1
          firstName={firstName}
          onNext={() => setStep(2)}
          onSkip={onSkip}
        />
      )}
      {step === 2 && (
        <Step2
          onSubmit={handleAddAsset}
          onBack={() => setStep(1)}
          onSkip={onSkip}
        />
      )}
      {step === 3 && (
        <Step3
          assetName={addedAsset?.name}
          assetValue={addedAsset?.value}
          onComplete={onComplete}
        />
      )}
    </div>
  )
}
