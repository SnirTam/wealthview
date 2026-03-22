import { useState } from 'react'
import { supabase } from '../supabase'

export default function Login() {
  const [mode, setMode] = useState('login') // 'login' | 'signup' | 'forgot'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function handleSubmit() {
    setLoading(true)
    setError('')
    setMessage('')

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setMessage('Check your email to confirm your account!')
    } else if (mode === 'forgot') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/`,
      })
      if (error) setError(error.message)
      else setMessage('Password reset link sent — check your email!')
    }
    setLoading(false)
  }

  function switchMode(m) {
    setMode(m)
    setError('')
    setMessage('')
  }

  const inputStyle = {
    width: '100%', padding: '11px 14px', borderRadius: 10,
    border: '1px solid var(--border2)',
    background: 'var(--bg3)', color: 'var(--text)',
    fontSize: 14, outline: 'none', fontFamily: 'var(--font-body)',
    transition: 'border-color 0.15s',
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: `
        radial-gradient(ellipse 80% 50% at 20% -10%, rgba(0,217,139,0.06) 0%, transparent 60%),
        radial-gradient(ellipse 60% 40% at 80% 110%, rgba(77,159,255,0.05) 0%, transparent 60%),
        var(--bg)
      `,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'linear-gradient(135deg, var(--green), var(--teal))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, fontWeight: 700, color: '#0a0a0f',
            fontFamily: 'var(--font-display)',
            margin: '0 auto 16px',
            boxShadow: '0 0 40px rgba(0,217,139,0.2)',
          }}>W</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: 0.3 }}>
            Wealthview
          </h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6, fontFamily: 'var(--font-body)' }}>
            {mode === 'forgot' ? 'Reset your password' : mode === 'login' ? 'Sign in to your account' : 'Create your free account'}
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--bg2)', borderRadius: 20,
          padding: '32px', border: '1px solid var(--border)',
        }}>

          {/* Mode toggle — only for login/signup */}
          {mode !== 'forgot' && (
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr',
              background: 'var(--bg3)', borderRadius: 10, padding: 4,
              marginBottom: 24,
            }}>
              {['login', 'signup'].map(m => (
                <button key={m} onClick={() => switchMode(m)} style={{
                  padding: '8px', borderRadius: 8, fontSize: 13,
                  fontWeight: mode === m ? 600 : 400,
                  background: mode === m ? 'var(--bg2)' : 'transparent',
                  color: mode === m ? 'var(--text)' : 'var(--muted)',
                  border: mode === m ? '1px solid var(--border2)' : '1px solid transparent',
                  cursor: 'pointer', transition: 'all 0.15s',
                  fontFamily: 'var(--font-body)',
                }}>
                  {m === 'login' ? 'Sign in' : 'Sign up'}
                </button>
              ))}
            </div>
          )}

          {/* Inputs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
            <div>
              <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6, letterSpacing: 0.5, fontFamily: 'var(--font-body)' }}>
                EMAIL
              </p>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                style={inputStyle}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--border2)'}
              />
            </div>
            {mode !== 'forgot' && (
              <div>
                <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6, letterSpacing: 0.5, fontFamily: 'var(--font-body)' }}>
                  PASSWORD
                </p>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  style={inputStyle}
                />
              </div>
            )}
          </div>

          {/* Error / success */}
          {error && (
            <div style={{
              background: 'var(--red-dim)', border: '1px solid var(--red)',
              borderRadius: 8, padding: '10px 14px', marginBottom: 16,
              fontSize: 13, color: 'var(--red)', fontFamily: 'var(--font-body)',
            }}>
              {error}
            </div>
          )}
          {message && (
            <div style={{
              background: 'var(--green-dim)', border: '1px solid var(--green)',
              borderRadius: 8, padding: '10px 14px', marginBottom: 16,
              fontSize: 13, color: 'var(--green)', fontFamily: 'var(--font-body)',
            }}>
              {message}
            </div>
          )}

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: '100%', padding: '12px',
              background: 'linear-gradient(135deg, var(--green), var(--teal))',
              color: '#0a0a0f', fontWeight: 700, fontSize: 14,
              border: 'none', borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-display)', letterSpacing: 0.5,
              opacity: loading ? 0.7 : 1, transition: 'opacity 0.15s',
            }}
          >
            {loading
              ? 'Please wait...'
              : mode === 'forgot'
                ? 'Send reset link'
                : mode === 'login'
                  ? 'Sign in'
                  : 'Create account'}
          </button>

          {/* Forgot password link */}
          {mode === 'login' && (
            <button
              onClick={() => switchMode('forgot')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--muted)', fontSize: 12, marginTop: 14,
                width: '100%', fontFamily: 'var(--font-body)',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
            >
              Forgot your password?
            </button>
          )}

          {/* Back to login from forgot */}
          {mode === 'forgot' && (
            <button
              onClick={() => switchMode('login')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--muted)', fontSize: 12, marginTop: 14,
                width: '100%', fontFamily: 'var(--font-body)',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
            >
              ← Back to sign in
            </button>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted)', marginTop: 20, fontFamily: 'var(--font-body)' }}>
          Your data is private and encrypted.
        </p>
      </div>
    </div>
  )
}
