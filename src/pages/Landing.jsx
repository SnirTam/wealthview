import { useEffect, useState } from 'react'

/* ── Tiny line-chart SVG for the mockup card ── */
function MiniChart() {
  const points = [
    [0, 52], [12, 44], [24, 48], [36, 36], [48, 40],
    [60, 28], [72, 32], [84, 20], [96, 24], [108, 14],
    [120, 18], [132, 8], [144, 12], [156, 4], [168, 0],
  ]
  const toSVG = pts => pts.map(([x, y]) => `${x},${y}`).join(' ')
  const filled = [...points, [168, 60], [0, 60]]

  return (
    <svg viewBox="0 0 168 60" style={{ width: '100%', height: 60, display: 'block' }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00d98b" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#00d98b" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={toSVG(filled)} fill="url(#chartFill)" />
      <polyline
        points={toSVG(points)}
        fill="none"
        stroke="#00d98b"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* glowing dot at end */}
      <circle cx="168" cy="0" r="3.5" fill="#00d98b" />
      <circle cx="168" cy="0" r="6" fill="rgba(0,217,139,0.25)" />
    </svg>
  )
}

/* ── Mock dashboard card shown in hero ── */
function MockCard() {
  const cardStyle = {
    background: 'linear-gradient(145deg, #111118 0%, #16161f 100%)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 24,
    padding: '28px 28px 24px',
    boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,217,139,0.08), inset 0 1px 0 rgba(255,255,255,0.06)',
    width: '100%',
    maxWidth: 340,
    position: 'relative',
    overflow: 'hidden',
  }

  return (
    <div style={cardStyle}>
      {/* subtle glow */}
      <div style={{
        position: 'absolute', top: -40, right: -40,
        width: 200, height: 200,
        background: 'radial-gradient(circle, rgba(0,217,139,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(255,255,255,0.15)' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(255,255,255,0.15)' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(255,255,255,0.15)' }} />
        </div>
        <div style={{
          fontSize: 10, color: '#00d98b', fontFamily: 'var(--font-body)',
          background: 'rgba(0,217,139,0.1)', padding: '3px 8px', borderRadius: 20,
          border: '1px solid rgba(0,217,139,0.2)',
        }}>● LIVE</div>
      </div>

      {/* net worth label */}
      <p style={{ fontSize: 11, color: '#6b6b80', fontFamily: 'var(--font-body)', marginBottom: 4, letterSpacing: 0.5, textTransform: 'uppercase' }}>
        Total Net Worth
      </p>

      {/* big number */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
        <span style={{
          fontSize: 38, fontWeight: 700, fontFamily: 'var(--font-display)',
          color: '#f0f0f5', letterSpacing: -1, lineHeight: 1,
        }}>$124,530</span>
        <span style={{
          fontSize: 13, color: '#00d98b', fontFamily: 'var(--font-body)',
          background: 'rgba(0,217,139,0.1)', padding: '2px 7px', borderRadius: 8, fontWeight: 600,
        }}>+6.8%</span>
      </div>
      <p style={{ fontSize: 11, color: '#6b6b80', fontFamily: 'var(--font-body)', marginBottom: 20 }}>
        vs last month
      </p>

      {/* chart */}
      <div style={{ marginBottom: 20 }}>
        <MiniChart />
      </div>

      {/* stat boxes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[
          { label: 'Stocks', val: '+2.4%', color: '#00d98b', bg: 'rgba(0,217,139,0.08)' },
          { label: 'Crypto', val: '-1.1%', color: '#ff4d6d', bg: 'rgba(255,77,109,0.08)' },
        ].map(s => (
          <div key={s.label} style={{
            background: s.bg,
            border: `1px solid ${s.color}22`,
            borderRadius: 12,
            padding: '10px 12px',
          }}>
            <p style={{ fontSize: 10, color: '#6b6b80', fontFamily: 'var(--font-body)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {s.label}
            </p>
            <p style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-display)', color: s.color }}>
              {s.val}
            </p>
          </div>
        ))}
      </div>

      {/* asset row */}
      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          { name: 'AAPL', full: 'Apple Inc.', val: '$41,200', pct: 33 },
          { name: 'BTC', full: 'Bitcoin', val: '$28,900', pct: 23 },
          { name: 'CASH', full: 'Cash', val: '$54,430', pct: 44 },
        ].map(a => (
          <div key={a.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8, flexShrink: 0,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, color: '#9898aa', fontWeight: 700, fontFamily: 'var(--font-display)',
            }}>{a.name[0]}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 11, color: '#f0f0f5', fontFamily: 'var(--font-body)', fontWeight: 600 }}>{a.full}</p>
              <div style={{
                marginTop: 3, height: 3, borderRadius: 2,
                background: 'rgba(255,255,255,0.06)', overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%', width: `${a.pct}%`,
                  background: 'linear-gradient(90deg, #00d98b, #2dd4bf)',
                  borderRadius: 2,
                }} />
              </div>
            </div>
            <p style={{ fontSize: 11, color: '#9898aa', fontFamily: 'var(--font-body)', flexShrink: 0 }}>{a.val}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

const FEATURES = [
  { icon: '📈', title: 'Live prices', desc: 'Real-time stock & crypto prices, updated automatically' },
  { icon: '⚖️', title: 'Real net worth', desc: 'Assets minus liabilities — your true financial picture' },
  { icon: '🎯', title: 'Goals & milestones', desc: 'Set targets and celebrate every breakthrough' },
  { icon: '📊', title: 'Portfolio analytics', desc: 'Deep insights into allocation, growth, and performance' },
  { icon: '🔒', title: 'Secure & private', desc: 'Your data is encrypted and never sold' },
  { icon: '📱', title: 'Mobile ready', desc: 'Access your portfolio from any device, anywhere' },
]

const FREE_FEATURES = [
  'Up to 5 assets',
  'Manual entry',
  'Basic charts',
  'Goals tracking',
]

const PRO_FEATURES = [
  'Unlimited assets',
  'Live stock & crypto prices',
  'Advanced analytics',
  'Goals & milestones',
  'Export PDF & CSV',
  'Price alerts',
]

export default function Landing({ onGetStarted, onSignIn }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    // Enable smooth scroll
    document.documentElement.style.scrollBehavior = 'smooth'
    return () => { document.documentElement.style.scrollBehavior = '' }
  }, [])

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 20) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* ── button helpers ── */
  function BtnGreen({ children, onClick, large }) {
    const [hov, setHov] = useState(false)
    return (
      <button
        onClick={onClick}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          background: 'linear-gradient(135deg, #00d98b, #2dd4bf)',
          color: '#0a0a0f',
          border: 'none',
          borderRadius: large ? 14 : 10,
          padding: large ? '15px 32px' : '10px 20px',
          fontSize: large ? 17 : 14,
          fontWeight: 700,
          fontFamily: 'var(--font-display)',
          cursor: 'pointer',
          letterSpacing: 0.3,
          boxShadow: hov
            ? '0 0 32px rgba(0,217,139,0.45), 0 4px 16px rgba(0,0,0,0.3)'
            : '0 0 20px rgba(0,217,139,0.25), 0 4px 12px rgba(0,0,0,0.2)',
          transform: hov ? 'translateY(-1px)' : 'translateY(0)',
          transition: 'all 0.18s ease',
          whiteSpace: 'nowrap',
        }}
      >
        {children}
      </button>
    )
  }

  function BtnOutline({ children, onClick, href }) {
    const [hov, setHov] = useState(false)
    const baseStyle = {
      background: hov ? 'rgba(255,255,255,0.06)' : 'transparent',
      color: 'var(--muted2)',
      border: '1px solid var(--border2)',
      borderRadius: 10,
      padding: '10px 20px',
      fontSize: 14,
      fontWeight: 600,
      fontFamily: 'var(--font-display)',
      cursor: 'pointer',
      letterSpacing: 0.2,
      transition: 'all 0.18s ease',
      textDecoration: 'none',
      display: 'inline-block',
    }
    if (href) {
      return (
        <a href={href} style={baseStyle}
          onMouseEnter={() => setHov(true)}
          onMouseLeave={() => setHov(false)}
        >{children}</a>
      )
    }
    return (
      <button
        onClick={onClick}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={baseStyle}
      >{children}</button>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      color: 'var(--text)',
      fontFamily: 'var(--font-body)',
      overflowX: 'hidden',
    }}>

      {/* ── 1. NAV ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(20px, 5vw, 80px)',
        height: 64,
        background: scrolled ? 'rgba(10,10,15,0.88)' : 'rgba(10,10,15,0.5)',
        backdropFilter: 'blur(18px)',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.07)' : '1px solid transparent',
        transition: 'all 0.25s ease',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'linear-gradient(135deg, #00d98b, #2dd4bf)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 17, fontWeight: 800, color: '#0a0a0f',
            fontFamily: 'var(--font-display)',
            flexShrink: 0,
            boxShadow: '0 0 14px rgba(0,217,139,0.3)',
          }}>W</div>
          <span style={{
            fontFamily: 'var(--font-display)', fontWeight: 700,
            fontSize: 17, letterSpacing: 0.2,
            background: 'linear-gradient(135deg, #f0f0f5 0%, #9898aa 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>Wealthview</span>
        </div>

        {/* CTA buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BtnOutline onClick={onSignIn}>Sign in</BtnOutline>
          <BtnGreen onClick={onGetStarted}>Get started free</BtnGreen>
        </div>
      </nav>

      {/* ── 2. HERO ── */}
      <section style={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex', alignItems: 'center',
        padding: 'clamp(60px, 8vh, 120px) clamp(20px, 5vw, 80px)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* background glows */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `
            radial-gradient(ellipse 70% 60% at 15% 40%, rgba(0,217,139,0.07) 0%, transparent 60%),
            radial-gradient(ellipse 50% 50% at 85% 60%, rgba(77,159,255,0.06) 0%, transparent 60%),
            radial-gradient(ellipse 40% 40% at 50% 0%, rgba(167,139,250,0.04) 0%, transparent 50%)
          `,
        }} />

        <div style={{
          display: 'flex', alignItems: 'center',
          gap: 'clamp(40px, 6vw, 80px)',
          width: '100%', maxWidth: 1200, margin: '0 auto',
          flexWrap: 'wrap',
        }}>

          {/* Left: text */}
          <div style={{ flex: '0 0 clamp(280px, 55%, 640px)', minWidth: 280 }}>
            {/* pill badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(0,217,139,0.08)',
              border: '1px solid rgba(0,217,139,0.2)',
              borderRadius: 100, padding: '6px 14px', marginBottom: 28,
              fontSize: 12, color: '#00d98b', fontWeight: 600,
              fontFamily: 'var(--font-body)',
              letterSpacing: 0.3,
            }}>
              <span>✦</span>
              <span>Live prices · Real net worth</span>
            </div>

            {/* headline */}
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(40px, 5.5vw, 64px)',
              fontWeight: 700,
              lineHeight: 1.08,
              letterSpacing: -1.5,
              marginBottom: 22,
              background: 'linear-gradient(160deg, #f0f0f5 30%, #6b6b80 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Know your real<br />net worth
            </h1>

            {/* sub-headline */}
            <p style={{
              fontSize: 'clamp(16px, 2vw, 20px)',
              color: 'var(--muted2)',
              lineHeight: 1.6,
              marginBottom: 36,
              fontFamily: 'var(--font-body)',
              maxWidth: 480,
            }}>
              Track every asset, every liability, every price — all in one place.
            </p>

            {/* CTA buttons */}
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 20 }}>
              <BtnGreen onClick={onGetStarted} large>Get started free</BtnGreen>
              <BtnOutline href="#features">See how it works</BtnOutline>
            </div>

            {/* trust text */}
            <p style={{
              fontSize: 12, color: 'var(--muted)',
              fontFamily: 'var(--font-body)', letterSpacing: 0.3,
            }}>
              Free to start · No credit card required
            </p>
          </div>

          {/* Right: mockup */}
          <div style={{
            flex: '1 1 280px', display: 'flex', justifyContent: 'center',
            animation: 'fadeUp 0.7s ease both', animationDelay: '0.15s',
          }}>
            <MockCard />
          </div>

        </div>
      </section>

      {/* ── 3. FEATURES ── */}
      <section id="features" style={{
        padding: 'clamp(80px, 10vh, 120px) clamp(20px, 5vw, 80px)',
        position: 'relative',
      }}>
        {/* thin top rule */}
        <div style={{
          width: 60, height: 2, margin: '0 auto 24px',
          background: 'linear-gradient(90deg, #00d98b, #2dd4bf)',
          borderRadius: 2,
        }} />

        <h2 style={{
          textAlign: 'center',
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(28px, 3.5vw, 42px)',
          fontWeight: 700,
          letterSpacing: -0.8,
          marginBottom: 56,
          maxWidth: 560, margin: '0 auto 56px',
        }}>
          Everything you need to grow your wealth
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 20,
          maxWidth: 1100, margin: '0 auto',
        }}>
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.title} {...f} delay={i * 60} />
          ))}
        </div>
      </section>

      {/* ── 4. PRICING ── */}
      <section id="pricing" style={{
        padding: 'clamp(80px, 10vh, 120px) clamp(20px, 5vw, 80px)',
        position: 'relative',
      }}>
        <div style={{
          width: 60, height: 2, margin: '0 auto 24px',
          background: 'linear-gradient(90deg, #00d98b, #2dd4bf)',
          borderRadius: 2,
        }} />

        <h2 style={{
          textAlign: 'center',
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(28px, 3.5vw, 42px)',
          fontWeight: 700,
          letterSpacing: -0.8,
          marginBottom: 56,
          maxWidth: 480, margin: '0 auto 56px',
        }}>
          Simple, transparent pricing
        </h2>

        <div style={{
          display: 'flex',
          gap: 24,
          maxWidth: 800, margin: '0 auto',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          {/* Free */}
          <PricingCard
            title="Free"
            price="$0"
            period="/ month"
            features={FREE_FEATURES}
            ctaLabel="Get started free"
            onCta={onGetStarted}
          />
          {/* Pro */}
          <PricingCard
            title="Pro"
            price="$9.99"
            period="/ month"
            features={PRO_FEATURES}
            ctaLabel="Start Pro"
            onCta={onGetStarted}
            isPro
          />
        </div>
      </section>

      {/* ── 5. FOOTER ── */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: 'clamp(40px, 6vh, 60px) clamp(20px, 5vw, 80px)',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 24,
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: 1200,
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
      }}>
        {/* brand */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 6 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'linear-gradient(135deg, #00d98b, #2dd4bf)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 800, color: '#0a0a0f',
              fontFamily: 'var(--font-display)',
            }}>W</div>
            <span style={{
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15,
              color: 'var(--text)',
            }}>Wealthview</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>
            Your financial picture
          </p>
        </div>

        {/* links */}
        <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            { label: 'Dashboard', action: onGetStarted },
            { label: 'Pricing', href: '#pricing' },
            { label: 'Sign in', action: onSignIn },
          ].map(l => (
            l.href
              ? <a key={l.label} href={l.href} style={{ fontSize: 13, color: 'var(--muted2)', fontFamily: 'var(--font-body)', transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--muted2)'}
                >{l.label}</a>
              : <button key={l.label} onClick={l.action} style={{
                  fontSize: 13, color: 'var(--muted2)', background: 'none',
                  border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'color 0.15s', padding: 0,
                }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--muted2)'}
                >{l.label}</button>
          ))}
        </div>

        {/* copyright */}
        <p style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-body)', width: '100%', textAlign: 'center', marginTop: 8 }}>
          © 2025 Wealthview. Built for serious savers.
        </p>
      </footer>

      {/* responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          /* hero stack handled by flex-wrap */
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

/* ── Feature card sub-component ── */
function FeatureCard({ icon, title, desc, delay }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: 'var(--bg2)',
        border: `1px solid ${hov ? 'rgba(0,217,139,0.2)' : 'var(--border)'}`,
        borderRadius: 16,
        padding: '28px 24px',
        transition: 'all 0.22s ease',
        transform: hov ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hov ? '0 8px 32px rgba(0,0,0,0.25)' : 'none',
        cursor: 'default',
        animation: 'fadeUp 0.5s ease both',
        animationDelay: `${delay}ms`,
      }}
    >
      <div style={{ fontSize: 28, marginBottom: 14 }}>{icon}</div>
      <h3 style={{
        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15,
        color: 'var(--text)', marginBottom: 8, letterSpacing: 0.1,
      }}>{title}</h3>
      <p style={{
        fontSize: 13, color: 'var(--muted2)', lineHeight: 1.6,
        fontFamily: 'var(--font-body)',
      }}>{desc}</p>
    </div>
  )
}

/* ── Pricing card sub-component ── */
function PricingCard({ title, price, period, features, ctaLabel, onCta, isPro }) {
  const [hov, setHov] = useState(false)
  return (
    <div style={{
      flex: '1 1 300px', maxWidth: 360,
      background: isPro
        ? 'linear-gradient(160deg, rgba(0,217,139,0.06) 0%, var(--bg2) 40%)'
        : 'var(--bg2)',
      border: isPro
        ? '1px solid rgba(0,217,139,0.28)'
        : '1px solid var(--border)',
      borderRadius: 20,
      padding: '32px 28px',
      position: 'relative',
      boxShadow: isPro ? '0 0 40px rgba(0,217,139,0.1), 0 8px 32px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.15)',
      transition: 'transform 0.2s ease',
      transform: hov ? 'translateY(-4px)' : 'translateY(0)',
    }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {isPro && (
        <div style={{
          position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, #00d98b, #2dd4bf)',
          color: '#0a0a0f', fontSize: 11, fontWeight: 800,
          fontFamily: 'var(--font-display)', letterSpacing: 1,
          padding: '4px 14px', borderRadius: 100,
          textTransform: 'uppercase', whiteSpace: 'nowrap',
          boxShadow: '0 2px 12px rgba(0,217,139,0.35)',
        }}>Most popular</div>
      )}

      <h3 style={{
        fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700,
        marginBottom: 16, color: isPro ? '#00d98b' : 'var(--text)',
      }}>{title}</h3>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 28 }}>
        <span style={{
          fontSize: 42, fontWeight: 800, fontFamily: 'var(--font-display)',
          letterSpacing: -1, color: 'var(--text)',
        }}>{price}</span>
        <span style={{ fontSize: 14, color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>{period}</span>
      </div>

      <ul style={{ listStyle: 'none', marginBottom: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {features.map(f => (
          <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
              background: isPro ? 'rgba(0,217,139,0.15)' : 'rgba(255,255,255,0.06)',
              border: isPro ? '1px solid rgba(0,217,139,0.3)' : '1px solid rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, color: isPro ? '#00d98b' : '#9898aa',
            }}>✓</span>
            <span style={{ fontSize: 13, color: 'var(--muted2)', fontFamily: 'var(--font-body)' }}>{f}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={onCta}
        style={{
          width: '100%',
          padding: '14px 0',
          borderRadius: 12,
          border: isPro ? 'none' : '1px solid var(--border2)',
          background: isPro
            ? 'linear-gradient(135deg, #00d98b, #2dd4bf)'
            : 'rgba(255,255,255,0.04)',
          color: isPro ? '#0a0a0f' : 'var(--text)',
          fontSize: 15, fontWeight: 700,
          fontFamily: 'var(--font-display)',
          cursor: 'pointer',
          letterSpacing: 0.3,
          transition: 'opacity 0.18s',
          boxShadow: isPro ? '0 0 20px rgba(0,217,139,0.25)' : 'none',
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
      >
        {ctaLabel}
      </button>
    </div>
  )
}
