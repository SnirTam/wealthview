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

export default function Sidebar({ page, setPage }) {
  return (
    <div style={{
      width: 240,
      background: 'var(--bg2)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '28px 16px',
      position: 'sticky',
      top: 0,
      height: '100vh',
      flexShrink: 0,
    }}>

      {/* Logo */}
      <div style={{ padding: '8px 12px', marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: 'linear-gradient(135deg, var(--green), var(--teal))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 700,
            fontFamily: 'var(--font-display)',
            color: '#0a0a0f',
            flexShrink: 0,
          }}>W</div>
          <div>
            <p style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700, fontSize: 18, letterSpacing: 0.3,
            }}>
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
          padding: '0 12px', marginBottom: 8,
          fontFamily: 'var(--font-body)',
        }}>
          Menu
        </p>
        {NAV.map(item => {
          const active = page === item.id
          return (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 10,
                fontSize: 13, fontWeight: active ? 500 : 400,
                fontFamily: 'var(--font-body)',
                background: active ? 'rgba(0,217,139,0.1)' : 'transparent',
                color: active ? 'var(--green)' : 'var(--muted2)',
                border: active ? '1px solid rgba(0,217,139,0.2)' : '1px solid transparent',
                cursor: 'pointer', textAlign: 'left', width: '100%',
                transition: 'all 0.15s ease',
              }}
            >
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

      {/* Bottom upgrade card */}
      <div style={{ marginTop: 'auto' }}>
        <div style={{
          borderRadius: 14, padding: '16px',
          background: 'var(--bg3)', border: '1px solid var(--border)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: -20, right: -20,
            width: 80, height: 80, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,217,139,0.15), transparent)',
          }} />
          <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4, fontFamily: 'var(--font-body)' }}>
            Current plan
          </p>
          <p style={{
            fontSize: 18, fontWeight: 600, marginBottom: 12,
            fontFamily: 'var(--font-display)', letterSpacing: 0.3,
          }}>
            Free tier
          </p>
          <button style={{
            width: '100%', padding: '8px', borderRadius: 8,
            background: 'linear-gradient(135deg, var(--green), var(--teal))',
            color: '#0a0a0f', fontWeight: 600, fontSize: 12,
            border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-display)', letterSpacing: 0.5,
            fontSize: 14,
          }}>
            Upgrade to Pro →
          </button>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '16px 12px 4px',
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--purple), var(--blue))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 600, color: '#fff',
            fontFamily: 'var(--font-display)',
          }}>U</div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-body)' }}>User</p>
            <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>Free plan</p>
          </div>
        </div>
      </div>
    </div>
  )
}