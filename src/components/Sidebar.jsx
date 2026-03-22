const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
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
        ),
      },
      {
        id: 'analytics',
        label: 'Analytics',
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1" y="9" width="3" height="6" rx="1" fill="currentColor" opacity="0.5"/>
            <rect x="6" y="5" width="3" height="10" rx="1" fill="currentColor" opacity="0.8"/>
            <rect x="11" y="1" width="3" height="14" rx="1" fill="currentColor"/>
          </svg>
        ),
      },
    ],
  },
  {
    label: 'Manage',
    items: [
      {
        id: 'assets',
        label: 'Assets',
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M8 4.5V8l2.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        ),
      },
      {
        id: 'liabilities',
        label: 'Liabilities',
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="4" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M5 4V3a3 3 0 0 1 6 0v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M8 8v2M7 9h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        ),
      },
      {
        id: 'goals',
        label: 'Goals',
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5"/>
            <circle cx="8" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.2" opacity="0.6"/>
            <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
          </svg>
        ),
      },
      {
        id: 'watchlist',
        label: 'Watchlist',
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M1 8C1 8 3.5 3 8 3s7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.5"/>
            <circle cx="8" cy="8" r="2" fill="currentColor" opacity="0.8"/>
          </svg>
        ),
      },
      {
        id: 'alerts',
        label: 'Alerts',
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 2a5 5 0 0 0-5 5v2.5L2 11h12l-1-1.5V7a5 5 0 0 0-5-5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M6.5 12a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        ),
      },
    ],
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

export default function Sidebar({ page, setPage, onSignOut, user, isPro, theme, setTheme }) {
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
      <div style={{ padding: '8px 12px', marginBottom: 32 }}>
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
              Your financial picture
            </p>
          </div>
        </div>
      </div>

      {/* Nav groups */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            <p style={{
              fontSize: 10, fontWeight: 500, color: 'var(--muted)',
              letterSpacing: 1.5, textTransform: 'uppercase',
              padding: '0 12px', marginBottom: 6, fontFamily: 'var(--font-body)',
            }}>
              {group.label}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {group.items.map(item => {
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
            </div>
          </div>
        ))}
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
              Starter
            </p>
            <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>
              Upgrade for unlimited assets
            </p>
          </div>
        )}

        {/* Theme toggle */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px', borderRadius: 10,
          border: '1px solid var(--border)',
          background: 'var(--bg3)',
          marginBottom: 8,
        }}>
          {[
            { value: 'light', icon: '☀️', label: 'Light' },
            { value: 'dark',  icon: '🌙', label: 'Dark'  },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 5, padding: '7px 0', borderRadius: 7, fontSize: 11, fontWeight: 500,
                fontFamily: 'var(--font-body)', cursor: 'pointer', transition: 'all 0.15s',
                border: theme === opt.value ? '1px solid var(--border2)' : '1px solid transparent',
                background: theme === opt.value ? 'var(--bg2)' : 'transparent',
                color: theme === opt.value ? 'var(--text)' : 'var(--muted)',
              }}
            >
              <span style={{ fontSize: 13 }}>{opt.icon}</span> {opt.label}
            </button>
          ))}
        </div>

        {/* User row */}
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
            fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: 0.5,
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
            style={{
              background: 'transparent', border: '1px solid var(--border2)',
              borderRadius: 7, cursor: 'pointer', padding: '5px 9px',
              fontSize: 11, fontWeight: 500, fontFamily: 'var(--font-body)',
              color: 'var(--muted)', transition: 'all 0.15s', flexShrink: 0,
              display: 'flex', alignItems: 'center', gap: 4,
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.borderColor = 'var(--red)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'var(--border2)' }}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path d="M6 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              <path d="M11 11l3-3-3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 8H6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
            Log out
          </button>
        </div>
      </div>
    </div>
  )
}
