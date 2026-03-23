import { useState, useRef, useEffect } from 'react'
import { supabase } from '../supabase'
import {
  isBiometricAvailable, getBiometricCredential,
  authenticateWithBiometric, getBiometricSession,
} from '../biometric'

/* 6-box OTP input */
function OtpInput({ value, onChange }) {
  const inputs = useRef([])

  function handleKey(i, e) {
    if (e.key === 'Backspace') {
      if (value[i]) {
        const next = value.split('')
        next[i] = ''
        onChange(next.join(''))
      } else if (i > 0) {
        inputs.current[i - 1]?.focus()
        const next = value.split('')
        next[i - 1] = ''
        onChange(next.join(''))
      }
      return
    }
    if (e.key === 'ArrowLeft' && i > 0) { inputs.current[i - 1]?.focus(); return }
    if (e.key === 'ArrowRight' && i < 5) { inputs.current[i + 1]?.focus(); return }
  }

  function handleChange(i, raw) {
    const digit = raw.replace(/\D/g, '').slice(-1)
    if (!digit) return
    const next = value.padEnd(6, ' ').split('')
    next[i] = digit
    onChange(next.join('').trimEnd())
    if (i < 5) inputs.current[i + 1]?.focus()
  }

  function handlePaste(e) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted) {
      onChange(pasted)
      inputs.current[Math.min(pasted.length, 5)]?.focus()
      e.preventDefault()
    }
  }

  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={el => inputs.current[i] = el}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKey(i, e)}
          onPaste={handlePaste}
          onFocus={e => e.target.select()}
          style={{
            width: 48, height: 56,
            borderRadius: 12,
            border: value[i] ? '2px solid var(--green)' : '1px solid var(--border2)',
            background: value[i] ? 'var(--green-dim)' : 'var(--bg3)',
            color: 'var(--text)',
            fontSize: 22, fontWeight: 700,
            fontFamily: 'var(--font-display)',
            textAlign: 'center',
            outline: 'none',
            transition: 'all 0.15s ease',
            caretColor: 'transparent',
          }}
        />
      ))}
    </div>
  )
}

export default function Login() {
  const [mode, setMode] = useState('login') // 'login' | 'signup' | 'forgot' | 'verify'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const [biometricReady, setBiometricReady] = useState(false)
  const [biometricLoading, setBiometricLoading] = useState(false)

  // Check if Face ID is available + enrolled on this device
  useEffect(() => {
    const cred = getBiometricCredential()
    if (!cred) return
    isBiometricAvailable().then(ok => setBiometricReady(ok))
  }, [])

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  // Auto-submit when all 6 digits filled
  useEffect(() => {
    if (otp.length === 6 && mode === 'verify') {
      handleVerify()
    }
  }, [otp])

  async function handleSubmit() {
    setLoading(true)
    setError('')
    setMessage('')

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else if (mode === 'signup') {
      const full_name = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ')
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name } },
      })
      if (error) setError(error.message)
      else {
        setMode('verify')
        setResendCooldown(60)
      }
    } else if (mode === 'forgot') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/`,
      })
      if (error) setError(error.message)
      else setMessage('Password reset link sent — check your email!')
    }
    setLoading(false)
  }

  async function handleVerify() {
    if (otp.length < 6) return
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.verifyOtp({
      email, token: otp, type: 'signup',
    })
    if (error) {
      setError('Invalid or expired code. Please try again.')
      setOtp('')
    }
    setLoading(false)
  }

  async function handleResend() {
    if (resendCooldown > 0) return
    setLoading(true)
    setError('')
    const full_name = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ')
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name } },
    })
    if (error) setError(error.message)
    else {
      setResendCooldown(60)
      setOtp('')
    }
    setLoading(false)
  }

  async function handleBiometricLogin() {
    setBiometricLoading(true)
    setError('')
    try {
      await authenticateWithBiometric()
      const session = getBiometricSession()
      if (!session) throw new Error('No session stored')
      // Try to restore session; fall back to refresh if access token expired
      let result = await supabase.auth.setSession({
        access_token: session.accessToken,
        refresh_token: session.refreshToken,
      })
      if (result.error) {
        result = await supabase.auth.refreshSession({ refresh_token: session.refreshToken })
      }
      if (result.error) {
        setError('Session expired. Please sign in with your password to re-enable Face ID.')
      }
    } catch (err) {
      if (err?.name !== 'NotAllowedError') {
        setError('Face ID failed. Please sign in with your password.')
      }
    }
    setBiometricLoading(false)
  }

  function switchMode(m) {
    setMode(m)
    setError('')
    setMessage('')
    setOtp('')
  }

  const inputStyle = {
    width: '100%', padding: '11px 14px', borderRadius: 10,
    border: '1px solid var(--border2)',
    background: 'var(--bg3)', color: 'var(--text)',
    fontSize: 14, outline: 'none', fontFamily: 'var(--font-body)',
    transition: 'border-color 0.15s',
  }

  /* ── Verify screen ── */
  if (mode === 'verify') {
    return (
      <div style={{
        minHeight: '100vh',
        background: `
          radial-gradient(ellipse 80% 50% at 20% -10%, rgba(0,217,139,0.06) 0%, transparent 60%),
          radial-gradient(ellipse 60% 40% at 80% 110%, rgba(77,159,255,0.05) 0%, transparent 60%),
          var(--bg)
        `,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}>
        <div style={{ width: '100%', maxWidth: 420, animation: 'fadeUp 0.4s ease both' }}>

          {/* Icon */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 20, margin: '0 auto 20px',
              background: 'var(--green-dim)',
              border: '1px solid rgba(0,217,139,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 40px rgba(0,217,139,0.15)',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                  stroke="var(--green)" strokeWidth="1.8" strokeLinejoin="round"/>
                <polyline points="22,6 12,13 2,6" stroke="var(--green)" strokeWidth="1.8"
                  strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700,
              letterSpacing: -0.5, marginBottom: 10,
            }}>Check your email</h2>
            <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, maxWidth: 320, margin: '0 auto' }}>
              We sent a 6-digit verification code to<br />
              <span style={{ color: 'var(--text)', fontWeight: 600 }}>{email}</span>
            </p>
          </div>

          {/* Card */}
          <div style={{
            background: 'var(--bg2)', borderRadius: 20,
            padding: '32px', border: '1px solid var(--border)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
          }}>
            <p style={{
              fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-body)',
              letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center',
              marginBottom: 20,
            }}>Enter verification code</p>

            <OtpInput value={otp} onChange={setOtp} />

            {error && (
              <div style={{
                background: 'var(--red-dim)', border: '1px solid var(--red)',
                borderRadius: 8, padding: '10px 14px', marginTop: 20,
                fontSize: 13, color: 'var(--red)', fontFamily: 'var(--font-body)',
                textAlign: 'center',
              }}>{error}</div>
            )}

            <button
              onClick={handleVerify}
              disabled={otp.length < 6 || loading}
              style={{
                width: '100%', padding: '13px',
                marginTop: 24,
                background: otp.length === 6
                  ? 'linear-gradient(135deg, var(--green), var(--teal))'
                  : 'rgba(255,255,255,0.06)',
                color: otp.length === 6 ? '#0a0a0f' : 'var(--text)',
                fontWeight: 700, fontSize: 14,
                border: otp.length === 6 ? 'none' : '1px solid var(--border2)',
                borderRadius: 10,
                cursor: otp.length === 6 && !loading ? 'pointer' : 'not-allowed',
                fontFamily: 'var(--font-display)', letterSpacing: 0.3,
                transition: 'all 0.2s ease',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Verifying…' : 'Verify email'}
            </button>

            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>
                Didn't receive a code?
              </p>
              <button
                onClick={handleResend}
                disabled={resendCooldown > 0 || loading}
                style={{
                  background: 'none', border: 'none',
                  cursor: resendCooldown > 0 ? 'default' : 'pointer',
                  color: resendCooldown > 0 ? 'var(--muted)' : 'var(--green)',
                  fontSize: 13, fontFamily: 'var(--font-body)', fontWeight: 600,
                }}
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
              </button>
            </div>
          </div>

          <button
            onClick={() => switchMode('signup')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--muted)', fontSize: 12, marginTop: 16,
              width: '100%', fontFamily: 'var(--font-body)', textAlign: 'center',
              display: 'block', transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
          >
            ← Back to sign up
          </button>

          <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--muted)', marginTop: 16 }}>
            Code expires in 10 minutes · Check your spam folder if needed
          </p>
        </div>
      </div>
    )
  }

  /* ── Login / Signup / Forgot screen ── */
  return (
    <div style={{
      minHeight: '100vh',
      background: `
        radial-gradient(ellipse 80% 50% at 20% -10%, rgba(0,217,139,0.06) 0%, transparent 60%),
        radial-gradient(ellipse 60% 40% at 80% 110%, rgba(77,159,255,0.05) 0%, transparent 60%),
        var(--bg)
      `,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
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
            WealthView
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

          {/* Mode toggle */}
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
            {mode === 'signup' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6, letterSpacing: 0.5, fontFamily: 'var(--font-body)' }}>FIRST NAME</p>
                  <input type="text" placeholder="Jane" value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    style={inputStyle} />
                </div>
                <div>
                  <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6, letterSpacing: 0.5, fontFamily: 'var(--font-body)' }}>LAST NAME</p>
                  <input type="text" placeholder="Doe" value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    style={inputStyle} />
                </div>
              </div>
            )}
            <div>
              <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6, letterSpacing: 0.5, fontFamily: 'var(--font-body)' }}>EMAIL</p>
              <input type="email" placeholder="you@example.com" value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                style={inputStyle} />
            </div>
            {mode !== 'forgot' && (
              <div>
                <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6, letterSpacing: 0.5, fontFamily: 'var(--font-body)' }}>PASSWORD</p>
                <input type="password" placeholder="••••••••" value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  style={inputStyle} />
              </div>
            )}
          </div>

          {error && (
            <div style={{
              background: 'var(--red-dim)', border: '1px solid var(--red)',
              borderRadius: 8, padding: '10px 14px', marginBottom: 16,
              fontSize: 13, color: 'var(--red)', fontFamily: 'var(--font-body)',
            }}>{error}</div>
          )}
          {message && (
            <div style={{
              background: 'var(--green-dim)', border: '1px solid var(--green)',
              borderRadius: 8, padding: '10px 14px', marginBottom: 16,
              fontSize: 13, color: 'var(--green)', fontFamily: 'var(--font-body)',
            }}>{message}</div>
          )}

          {/* Face ID button — only shown on login screen when enrolled */}
          {mode === 'login' && biometricReady && (
            <>
              <button
                onClick={handleBiometricLogin}
                disabled={biometricLoading}
                style={{
                  width: '100%', padding: '12px',
                  background: 'var(--bg3)',
                  color: 'var(--text)', fontWeight: 600, fontSize: 14,
                  border: '1px solid var(--border2)', borderRadius: 10,
                  cursor: biometricLoading ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-body)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  opacity: biometricLoading ? 0.7 : 1, transition: 'opacity 0.15s',
                  marginBottom: 10,
                }}
              >
                <svg width="20" height="20" viewBox="0 0 52 52" fill="none">
                  <rect x="1" y="1" width="50" height="50" rx="13" stroke="currentColor" strokeWidth="2.5"/>
                  <circle cx="18" cy="22" r="2.5" fill="currentColor"/>
                  <circle cx="34" cy="22" r="2.5" fill="currentColor"/>
                  <path d="M26 22v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M18 33c2 3 14 3 16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M8 16V10a2 2 0 0 1 2-2h6M44 16V10a2 2 0 0 0-2-2h-6M8 36v6a2 2 0 0 0 2 2h6M44 36v6a2 2 0 0 1-2 2h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                {biometricLoading ? 'Verifying…' : 'Sign in with Face ID'}
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>or</span>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              </div>
            </>
          )}

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
            {loading ? 'Please wait…'
              : mode === 'forgot' ? 'Send reset link'
              : mode === 'login'  ? 'Sign in'
              : 'Create account →'}
          </button>

          {mode === 'login' && (
            <button onClick={() => switchMode('forgot')} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--muted)', fontSize: 12, marginTop: 14,
              width: '100%', fontFamily: 'var(--font-body)', transition: 'color 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
            >Forgot your password?</button>
          )}

          {mode === 'forgot' && (
            <button onClick={() => switchMode('login')} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--muted)', fontSize: 12, marginTop: 14,
              width: '100%', fontFamily: 'var(--font-body)', transition: 'color 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
            >← Back to sign in</button>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted)', marginTop: 20, fontFamily: 'var(--font-body)' }}>
          Your data is private and encrypted.
        </p>
      </div>
    </div>
  )
}
