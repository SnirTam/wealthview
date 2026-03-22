const NAV = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.9"/>
        <rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.5"/>
        <rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.5"/>
        <rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.9"/>
      </svg>
    )
  },
  {
    id: 'assets',
    label: 'Assets',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M8 4.5V8l2.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    )
  },
]

function getInitials(email) {
  if (!email) return '?'
  const local = email.split('@')[0]
  const parts = local.split(/[._\-+]/)
  if (parts.length >= 2 && parts[0].length > 0 && parts[1].length > 0) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return local.slice(0, 2).toUpperCase()
}

export default function Sidebar({ page, setPage, onSignOut, user, isPro }) {
  return (
    <div style={{
      width: 240,
      background: 'var(--bg2)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      padding: '28px 16px',
      height: '100vh', flexShrink: 0,
    }}>

      {/* Logo */}
      <div style={{ padding: '8px 12px', marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: 'linear-gradient(135deg, var(--green), var(--teal))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-display)',
            color: '#0a0a0f', flexShrink: 0,
          }}>W</div>
          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, letterSpacing: 0.3 }}>
              Wealthview
            </p>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1, fontFamily: 'var(--font-body)' }}>
              Net worth tracker
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <p style={{
          fontSize: 10, fontWeight: 500, color: 'var(--muted)',
          letterSpacing: 1.5, textTransform: 'uppercase',
          padding: '0 12px', marginBottom: 8, fontFamily: 'var(--font-body)',
        }}>
          Menu
        </p>
        {NAV.map(item => {
          const active = page === item.id
          return (
            <button key={item.id} onClick={() => setPage(item.id)} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 10,
              fontSize: 13, fontWeight: active ? 500 : 400,
              fontFamily: 'var(--font-body)',
              background: active ? 'rgba(0,217,139,0.1)' : 'transparent',
              color: active ? 'var(--green)' : 'var(--muted2)',
              border: active ? '1px solid rgba(0,217,139,0.2)' : '1px solid transparent',
              cursor: 'pointer', textAlign: 'left', width: '100%',
              transition: 'all 0.15s ease',
            }}>
              <span style={{ opacity: active ? 1 : 0.6 }}>{item.icon}</span>
              {item.label}
              {active && (
                <div style={{
                  marginLeft: 'auto', width: 6, height: 6,
                  borderRadius: '50%', background: 'var(--green)',
                  animation: 'pulse-green 2s infinite',
                }} />
              )}
            </button>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div style={{ marginTop: 'auto' }}>

        {/* Pro / Free card */}
        {isPro ? (
          <div style={{
            borderRadius: 14, padding: '16px',
            background: 'linear-gradient(135deg, rgba(0,217,139,0.1), rgba(45,212,191,0.1))',
            border: '1px solid rgba(0,217,139,0.3)',
            position: 'relative', overflow: 'hidden', marginBottom: 12,
          }}>
            <div style={{
              position: 'absolute', top: -20, right: -20,
              width: 80, height: 80, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(0,217,139,0.2), transparent)',
            }} />
            <p style={{ fontSize: 11, color: 'var(--green)', marginBottom: 4, fontFamily: 'var(--font-body)', letterSpacing: 0.5 }}>
              CURRENT PLAN
            </p>
            <p style={{ fontSize: 18, fontWeight: 600, fontFamily: 'var(--font-display)', letterSpacing: 0.3, color: 'var(--green)' }}>
              Pro ✦
            </p>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6, fontFamily: 'var(--font-body)' }}>
              Unlimited assets · Live prices
            </p>
          </div>
        ) : (
          <div style={{
            borderRadius: 14, padding: '16px',
            background: 'var(--bg3)', border: '1px solid var(--border)',
            position: 'relative', overflow: 'hidden', marginBottom: 12,
          }}>
            <div style={{
              position: 'absolute', top: -20, right: -20,
              width: 80, height: 80, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(0,217,139,0.15), transparent)',
            }} />
            <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4, fontFamily: 'var(--font-body)' }}>
              Current plan
            </p>
            <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 4, fontFamily: 'var(--font-display)', letterSpacing: 0.3 }}>
              Free tier
            </p>
            <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>
              Up to 5 assets
            </p>
          </div>
        )}

        {/* User + sign out */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '12px', borderRadius: 10,
          border: '1px solid var(--border)',
          background: 'var(--bg3)',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, var(--purple), var(--blue))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: '#fff',
            letterSpacing: 0.5,
          }}>
            {getInitials(user?.email)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 11, fontWeight: 500, fontFamily: 'var(--font-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email}
            </p>
            <p style={{ fontSize: 10, color: isPro ? 'var(--green)' : 'var(--muted)', fontFamily: 'var(--font-body)' }}>
              {isPro ? 'Pro plan ✦' : 'Free plan'}
            </p>
          </div>
          <button
            onClick={onSignOut}
            title="Sign out"
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--muted)', fontSize: 16, padding: '2px',
              transition: 'color 0.15s', flexShrink: 0,
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
          >
            ⏻
          </button>
        </div>
      </div>
    </div>
  )
}
