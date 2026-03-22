import { useEffect, useState } from 'react'

/* ── Animated counter ── */
function Counter({ target, prefix = '', suffix = '' }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let start = 0
    const step = target / 60
    const t = setInterval(() => {
      start += step
      if (start >= target) { setVal(target); clearInterval(t) }
      else setVal(Math.floor(start))
    }, 16)
    return () => clearInterval(t)
  }, [target])
  return <>{prefix}{val.toLocaleString()}{suffix}</>
}

/* ── Mini sparkline ── */
function MiniChart({ color = '#00d98b', points: rawPts }) {
  const pts = rawPts || [
    [0, 52], [14, 44], [28, 48], [42, 36], [56, 40],
    [70, 28], [84, 32], [98, 20], [112, 24], [126, 14],
    [140, 18], [154, 8], [168, 4],
  ]
  const toStr = arr => arr.map(([x, y]) => `${x},${y}`).join(' ')
  const filled = [...pts, [pts[pts.length - 1][0], 60], [0, 60]]
  return (
    <svg viewBox="0 0 168 60" style={{ width: '100%', height: 60, display: 'block' }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`fill-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={toStr(filled)} fill={`url(#fill-${color.replace('#', '')})`} />
      <polyline points={toStr(pts)} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3.5" fill={color} />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="6" fill={color} opacity="0.25" />
    </svg>
  )
}

/* ── Rich app mockup ── */
function AppMockup() {
  return (
    <div style={{
      background: 'linear-gradient(145deg, #0e0e16 0%, #13131d 100%)',
      border: '1px solid rgba(255,255,255,0.09)',
      borderRadius: 24,
      overflow: 'hidden',
      boxShadow: '0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,217,139,0.06), inset 0 1px 0 rgba(255,255,255,0.05)',
      width: '100%',
      maxWidth: 380,
      position: 'relative',
    }}>
      {/* top chrome bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(255,255,255,0.02)',
      }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {['rgba(255,80,80,0.7)', 'rgba(255,185,0,0.7)', 'rgba(0,200,100,0.7)'].map(c => (
            <div key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c }} />
          ))}
        </div>
        <div style={{
          fontSize: 10, color: '#00d98b', fontFamily: 'var(--font-body)',
          background: 'rgba(0,217,139,0.1)', padding: '3px 10px', borderRadius: 20,
          border: '1px solid rgba(0,217,139,0.18)', letterSpacing: 0.5,
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#00d98b', display: 'inline-block', flexShrink: 0 }} />
          LIVE
        </div>
        <div style={{ width: 48 }} />
      </div>

      <div style={{ padding: '20px 20px 24px' }}>
        {/* net worth */}
        <div style={{ marginBottom: 18 }}>
          <p style={{ fontSize: 10, color: '#5a5a70', fontFamily: 'var(--font-body)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>
            Total Net Worth
          </p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ fontSize: 36, fontWeight: 700, fontFamily: 'var(--font-display)', color: '#eeeef5', letterSpacing: -1.5, lineHeight: 1 }}>
              $248,930
            </span>
            <span style={{
              fontSize: 12, color: '#00d98b', fontWeight: 600, fontFamily: 'var(--font-body)',
              background: 'rgba(0,217,139,0.1)', padding: '2px 8px', borderRadius: 8,
              border: '1px solid rgba(0,217,139,0.15)',
            }}>+12.4%</span>
          </div>
          <p style={{ fontSize: 11, color: '#5a5a70', fontFamily: 'var(--font-body)', marginTop: 3 }}>↑ $27,460 this year</p>
        </div>

        {/* chart */}
        <div style={{ marginBottom: 18, borderRadius: 10, overflow: 'hidden' }}>
          <MiniChart />
        </div>

        {/* stat row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 18 }}>
          {[
            { label: 'Assets', val: '$274k', color: '#00d98b' },
            { label: 'Debt', val: '$25k', color: '#ff4d6d' },
            { label: 'Goals', val: '3/5', color: '#a78bfa' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 10, padding: '10px 10px',
              textAlign: 'center',
            }}>
              <p style={{ fontSize: 10, color: '#5a5a70', fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{s.label}</p>
              <p style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-display)', color: s.color }}>{s.val}</p>
            </div>
          ))}
        </div>

        {/* asset list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { abbr: 'AAPL', name: 'Apple Inc.', val: '$89,400', pct: 36, color: '#5b9cf6' },
            { abbr: 'BTC', name: 'Bitcoin', val: '$72,100', pct: 29, color: '#f7931a' },
            { abbr: '$', name: 'Cash & Savings', val: '$87,430', pct: 35, color: '#00d98b' },
          ].map(a => (
            <div key={a.abbr} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 30, height: 30, borderRadius: 9, flexShrink: 0,
                background: `${a.color}18`,
                border: `1px solid ${a.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, color: a.color, fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: -0.3,
              }}>{a.abbr.slice(0, 3)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <p style={{ fontSize: 11, color: '#ccccd8', fontFamily: 'var(--font-body)', fontWeight: 500 }}>{a.name}</p>
                  <p style={{ fontSize: 11, color: '#8888a0', fontFamily: 'var(--font-body)' }}>{a.val}</p>
                </div>
                <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${a.pct}%`, background: `linear-gradient(90deg, ${a.color}, ${a.color}bb)`, borderRadius: 2 }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Feature SVG icons ── */
const FeatureIcons = {
  chart: (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M3 16L8 11L12 14L19 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M19 6H14M19 6V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  balance: (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M11 3v16M6 7l5-4 5 4M6 15l5 4 5-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  target: (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
      <circle cx="11" cy="11" r="4" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
      <circle cx="11" cy="11" r="1.5" fill="currentColor"/>
    </svg>
  ),
  analytics: (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="3" y="12" width="3.5" height="7" rx="1" fill="currentColor" opacity="0.5"/>
      <rect x="9.25" y="7" width="3.5" height="12" rx="1" fill="currentColor" opacity="0.75"/>
      <rect x="15.5" y="3" width="3.5" height="16" rx="1" fill="currentColor"/>
    </svg>
  ),
  lock: (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="4" y="9" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2"/>
      <path d="M7 9V7a4 4 0 0 1 8 0v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="11" cy="14" r="1.5" fill="currentColor"/>
    </svg>
  ),
  bell: (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M11 3a7 7 0 0 0-7 7v3L2.5 15h17L18 13v-3a7 7 0 0 0-7-7z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      <path d="M8.5 15a2.5 2.5 0 0 0 5 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
}

const FEATURES = [
  { icon: 'chart',     color: '#00d98b', title: 'Live prices',          desc: 'Real-time stock & crypto prices pulled automatically. Never manually update a value again.' },
  { icon: 'balance',   color: '#5b9cf6', title: 'True net worth',       desc: 'Assets minus liabilities — the number that actually matters for your financial health.' },
  { icon: 'target',    color: '#a78bfa', title: 'Goals & milestones',   desc: 'Set savings targets, track progress, and get celebrated every time you hit a new milestone.' },
  { icon: 'analytics', color: '#f59e0b', title: 'Deep analytics',       desc: 'Allocation breakdown, growth trends, and performance charts that tell the full story.' },
  { icon: 'lock',      color: '#2dd4bf', title: 'Secure & private',     desc: 'Bank-level encryption. Your data is never sold, shared, or used for ads. Ever.' },
  { icon: 'bell',      color: '#ff4d6d', title: 'Price alerts',         desc: 'Get notified the moment an asset hits your target price. Never miss a move again.' },
]

const STEPS = [
  { n: '01', title: 'Add your assets', desc: 'Stocks, crypto, real estate, retirement, cash — add anything in seconds. Live prices auto-fill.' },
  { n: '02', title: 'Track liabilities', desc: 'Mortgages, loans, credit cards. Your real net worth is assets minus what you owe.' },
  { n: '03', title: 'Watch it grow', desc: 'Historical charts, goal tracking, and milestones celebrate every step of your journey.' },
]

const FREE_FEATURES = [
  'Up to 5 assets tracked',
  'Manual entry & editing',
  'Basic net worth chart',
  'Goals tracking (3 goals)',
  'Liabilities tracking',
]

const PRO_FEATURES = [
  'Unlimited assets',
  'Live stock & crypto prices',
  'Full historical analytics',
  'Unlimited goals & milestones',
  'PDF & CSV export',
  'Price alerts',
  'Portfolio share card',
]

export default function Landing({ onGetStarted, onSignIn }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth'
    return () => { document.documentElement.style.scrollBehavior = '' }
  }, [])

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 20) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#09090f',
      color: '#eeeef5',
      fontFamily: 'var(--font-body)',
      overflowX: 'hidden',
    }}>

      {/* ── NAV ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(20px, 5vw, 80px)',
        height: 64,
        background: scrolled ? 'rgba(9,9,15,0.92)' : 'rgba(9,9,15,0.4)',
        backdropFilter: 'blur(20px)',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
        transition: 'all 0.25s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'linear-gradient(135deg, #00d98b, #2dd4bf)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 17, fontWeight: 800, color: '#09090f',
            fontFamily: 'var(--font-display)', flexShrink: 0,
            boxShadow: '0 0 16px rgba(0,217,139,0.35)',
          }}>W</div>
          <span style={{
            fontFamily: 'var(--font-display)', fontWeight: 700,
            fontSize: 17, letterSpacing: 0.2, color: '#eeeef5',
          }}>Wealthview</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <NavBtn onClick={onSignIn}>Sign in</NavBtn>
          <GreenBtn onClick={onGetStarted}>Get started free</GreenBtn>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex', alignItems: 'center',
        padding: 'clamp(60px, 8vh, 100px) clamp(20px, 5vw, 80px)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* layered glows */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `
            radial-gradient(ellipse 60% 70% at 20% 50%, rgba(0,217,139,0.08) 0%, transparent 65%),
            radial-gradient(ellipse 50% 60% at 80% 40%, rgba(91,156,246,0.07) 0%, transparent 60%),
            radial-gradient(ellipse 50% 50% at 50% 0%,  rgba(167,139,250,0.05) 0%, transparent 55%)
          `,
        }} />

        {/* subtle grid */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.025,
          backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }} />

        <div style={{
          display: 'flex', alignItems: 'center',
          gap: 'clamp(40px, 6vw, 80px)',
          width: '100%', maxWidth: 1200, margin: '0 auto',
          flexWrap: 'wrap',
        }}>

          {/* text */}
          <div style={{ flex: '0 0 clamp(300px, 52%, 600px)', minWidth: 300 }}>
            {/* pill */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: 'rgba(0,217,139,0.08)',
              border: '1px solid rgba(0,217,139,0.22)',
              borderRadius: 100, padding: '6px 14px', marginBottom: 28,
              fontSize: 12, color: '#00d98b', fontWeight: 600,
              fontFamily: 'var(--font-body)', letterSpacing: 0.4,
            }}>
              <span style={{ fontSize: 10 }}>✦</span>
              Live prices · Real net worth · Privacy first
            </div>

            {/* headline */}
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(42px, 5.5vw, 68px)',
              fontWeight: 800,
              lineHeight: 1.06,
              letterSpacing: -2,
              marginBottom: 22,
              color: '#eeeef5',
            }}>
              Know exactly<br />
              <span style={{
                background: 'linear-gradient(130deg, #00d98b 0%, #2dd4bf 50%, #5b9cf6 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>where you stand</span>
            </h1>

            <p style={{
              fontSize: 'clamp(16px, 1.8vw, 20px)',
              color: '#8888a0',
              lineHeight: 1.7,
              marginBottom: 36,
              maxWidth: 460,
            }}>
              Track every asset, every liability, every price — all in one beautiful dashboard. Your real net worth, always up to date.
            </p>

            {/* CTA row */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28, alignItems: 'center' }}>
              <GreenBtn onClick={onGetStarted} large>Start for free</GreenBtn>
              <a href="#how-it-works" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                color: '#8888a0', fontSize: 14, fontFamily: 'var(--font-body)',
                fontWeight: 500, textDecoration: 'none', letterSpacing: 0.2,
                padding: '10px 4px',
                transition: 'color 0.18s',
              }}
                onMouseEnter={e => e.currentTarget.style.color = '#eeeef5'}
                onMouseLeave={e => e.currentTarget.style.color = '#8888a0'}
              >
                <span style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 30, height: 30, borderRadius: '50%',
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.04)',
                  flexShrink: 0,
                }}>
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                    <path d="M6 1v10M1 6l5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                See how it works
              </a>
            </div>

            <p style={{ fontSize: 12, color: '#5a5a70', letterSpacing: 0.3 }}>
              No credit card required · Free forever plan
            </p>
          </div>

          {/* mockup */}
          <div style={{
            flex: '1 1 300px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
            animation: 'fadeUp 0.7s ease both', animationDelay: '0.15s',
            position: 'relative',
          }}>
            {/* floating badges */}
            <div style={{
              position: 'absolute', top: -14, left: -14, zIndex: 2,
              background: 'linear-gradient(135deg, #0e0e18, #14141e)',
              border: '1px solid rgba(0,217,139,0.25)',
              borderRadius: 12, padding: '8px 12px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              animation: 'float 4s ease-in-out infinite',
            }}>
              <p style={{ fontSize: 9, color: '#5a5a70', fontFamily: 'var(--font-body)', marginBottom: 2, letterSpacing: 0.5 }}>NET WORTH</p>
              <p style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-display)', color: '#00d98b', letterSpacing: -0.5 }}>+$27,460</p>
            </div>
            <div style={{
              position: 'absolute', bottom: 40, right: -20, zIndex: 2,
              background: 'linear-gradient(135deg, #0e0e18, #14141e)',
              border: '1px solid rgba(91,156,246,0.25)',
              borderRadius: 12, padding: '8px 12px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              animation: 'float 4s ease-in-out infinite',
              animationDelay: '1.2s',
            }}>
              <p style={{ fontSize: 9, color: '#5a5a70', fontFamily: 'var(--font-body)', marginBottom: 2, letterSpacing: 0.5 }}>GOAL PROGRESS</p>
              <p style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-display)', color: '#5b9cf6', letterSpacing: -0.5 }}>68% there</p>
            </div>
            <AppMockup />
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.05)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        padding: '20px clamp(20px, 5vw, 80px)',
        display: 'flex', justifyContent: 'center',
        background: 'rgba(255,255,255,0.015)',
      }}>
        <div style={{
          display: 'flex', gap: 'clamp(24px, 5vw, 64px)',
          flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center',
        }}>
          {[
            { label: 'Users tracking wealth', val: 12400, suffix: '+' },
            { label: 'Assets tracked', val: 89000, suffix: '+' },
            { label: 'Free forever plan', val: '$0', raw: true },
            { label: 'Privacy by design', val: '100%', raw: true },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <p style={{
                fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700,
                color: '#eeeef5', letterSpacing: -0.5, lineHeight: 1,
              }}>
                {s.raw ? s.val : <Counter target={s.val} suffix={s.suffix} />}
              </p>
              <p style={{ fontSize: 11, color: '#5a5a70', fontFamily: 'var(--font-body)', marginTop: 4 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{
        padding: 'clamp(80px, 10vh, 120px) clamp(20px, 5vw, 80px)',
        position: 'relative',
      }}>
        <SectionLabel>How it works</SectionLabel>
        <h2 style={h2Style}>Up and running in 2 minutes</h2>

        <div style={{
          display: 'flex', gap: 'clamp(16px, 3vw, 40px)',
          maxWidth: 900, margin: '0 auto',
          flexWrap: 'wrap', justifyContent: 'center',
        }}>
          {STEPS.map((s, i) => (
            <div key={s.n} style={{
              flex: '1 1 220px', maxWidth: 280,
              position: 'relative',
            }}>
              {i < STEPS.length - 1 && (
                <div style={{
                  position: 'absolute', top: 22, left: 'calc(100% + 8px)',
                  width: 'clamp(8px, 3vw, 30px)', height: 1,
                  background: 'rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center',
                }} />
              )}
              <div style={{
                width: 44, height: 44, borderRadius: 14,
                background: 'rgba(0,217,139,0.08)',
                border: '1px solid rgba(0,217,139,0.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-display)', fontWeight: 800,
                fontSize: 13, color: '#00d98b', letterSpacing: 0.5,
                marginBottom: 18,
              }}>{s.n}</div>
              <h3 style={{
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17,
                color: '#eeeef5', marginBottom: 10, letterSpacing: -0.2,
              }}>{s.title}</h3>
              <p style={{ fontSize: 13, color: '#8888a0', lineHeight: 1.65 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{
        padding: 'clamp(80px, 10vh, 120px) clamp(20px, 5vw, 80px)',
        background: 'rgba(255,255,255,0.015)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <SectionLabel>Features</SectionLabel>
        <h2 style={h2Style}>Everything you need to build wealth</h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 18, maxWidth: 1100, margin: '0 auto',
        }}>
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.title} {...f} delay={i * 55} />
          ))}
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{
        padding: 'clamp(80px, 10vh, 120px) clamp(20px, 5vw, 80px)',
      }}>
        <SectionLabel>Pricing</SectionLabel>
        <h2 style={h2Style}>Simple, transparent pricing</h2>

        <div style={{
          display: 'flex', gap: 24, maxWidth: 820, margin: '0 auto',
          flexWrap: 'wrap', justifyContent: 'center',
        }}>
          <PricingCard
            title="Free" price="$0" period="/ month"
            features={FREE_FEATURES} ctaLabel="Get started free"
            onCta={onGetStarted}
          />
          <PricingCard
            title="Pro" price="$9.99" period="/ month"
            features={PRO_FEATURES} ctaLabel="Upgrade to Pro"
            onCta={onGetStarted} isPro
          />
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section style={{
        padding: 'clamp(80px, 10vh, 100px) clamp(20px, 5vw, 80px)',
        textAlign: 'center',
        position: 'relative', overflow: 'hidden',
        background: 'radial-gradient(ellipse 70% 80% at 50% 50%, rgba(0,217,139,0.06) 0%, transparent 70%)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          background: 'rgba(0,217,139,0.08)', border: '1px solid rgba(0,217,139,0.2)',
          borderRadius: 100, padding: '5px 14px', marginBottom: 22,
          fontSize: 11, color: '#00d98b', fontWeight: 600, letterSpacing: 0.5,
        }}>✦ Start today</div>
        <h2 style={{
          fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 4vw, 52px)',
          fontWeight: 800, letterSpacing: -1.5, lineHeight: 1.1, marginBottom: 16,
          color: '#eeeef5',
        }}>
          Your financial picture<br />starts now
        </h2>
        <p style={{ fontSize: 16, color: '#8888a0', marginBottom: 36, maxWidth: 420, margin: '0 auto 36px' }}>
          Free to start. No credit card needed. Your complete wealth dashboard in under 2 minutes.
        </p>
        <GreenBtn onClick={onGetStarted} large>Create your free account</GreenBtn>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: 'clamp(32px, 5vh, 48px) clamp(20px, 5vw, 80px)',
        display: 'flex', flexWrap: 'wrap', gap: 20,
        justifyContent: 'space-between', alignItems: 'center',
        maxWidth: 1200, margin: '0 auto', width: '100%', boxSizing: 'border-box',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'linear-gradient(135deg, #00d98b, #2dd4bf)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 800, color: '#09090f', fontFamily: 'var(--font-display)',
          }}>W</div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: '#eeeef5' }}>Wealthview</span>
        </div>

        <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            { label: 'Dashboard', action: onGetStarted },
            { label: 'Features', href: '#features' },
            { label: 'Pricing', href: '#pricing' },
            { label: 'Sign in', action: onSignIn },
          ].map(l => (
            l.href
              ? <a key={l.label} href={l.href} style={footerLinkStyle}
                  onMouseEnter={e => e.currentTarget.style.color = '#eeeef5'}
                  onMouseLeave={e => e.currentTarget.style.color = '#5a5a70'}
                >{l.label}</a>
              : <button key={l.label} onClick={l.action} style={{ ...footerLinkStyle, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  onMouseEnter={e => e.currentTarget.style.color = '#eeeef5'}
                  onMouseLeave={e => e.currentTarget.style.color = '#5a5a70'}
                >{l.label}</button>
          ))}
        </div>

        <p style={{ fontSize: 12, color: '#5a5a70', fontFamily: 'var(--font-body)', width: '100%', textAlign: 'center', marginTop: 4 }}>
          © 2026 Wealthview. Built for serious savers.
        </p>
      </footer>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  )
}

/* ── Shared styles & sub-components ── */

const h2Style = {
  textAlign: 'center',
  fontFamily: 'var(--font-display)',
  fontSize: 'clamp(28px, 3.5vw, 44px)',
  fontWeight: 800,
  letterSpacing: -1,
  marginBottom: 52,
  color: '#eeeef5',
}

const footerLinkStyle = {
  fontSize: 13, color: '#5a5a70',
  fontFamily: 'var(--font-body)',
  transition: 'color 0.15s',
  textDecoration: 'none',
}

function SectionLabel({ children }) {
  return (
    <div style={{
      textAlign: 'center', marginBottom: 14,
      fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-body)',
      color: '#00d98b', letterSpacing: 2, textTransform: 'uppercase',
    }}>{children}</div>
  )
}

function GreenBtn({ children, onClick, large }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: 'linear-gradient(135deg, #00d98b, #2dd4bf)',
        color: '#09090f',
        border: 'none',
        borderRadius: large ? 14 : 10,
        padding: large ? '14px 28px' : '9px 18px',
        fontSize: large ? 16 : 13,
        fontWeight: 700,
        fontFamily: 'var(--font-body)',
        cursor: 'pointer',
        letterSpacing: 0.1,
        boxShadow: hov
          ? '0 0 36px rgba(0,217,139,0.5), 0 4px 16px rgba(0,0,0,0.3)'
          : '0 0 22px rgba(0,217,139,0.28), 0 4px 12px rgba(0,0,0,0.2)',
        transform: hov ? 'translateY(-1px)' : 'translateY(0)',
        transition: 'all 0.18s ease',
        whiteSpace: 'nowrap',
      }}
    >{children}</button>
  )
}

function NavBtn({ children, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? 'rgba(255,255,255,0.06)' : 'transparent',
        color: hov ? '#eeeef5' : '#8888a0',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 9,
        padding: '7px 16px',
        fontSize: 13,
        fontWeight: 500,
        fontFamily: 'var(--font-body)',
        cursor: 'pointer',
        letterSpacing: 0.1,
        transition: 'all 0.15s ease',
        whiteSpace: 'nowrap',
      }}
    >{children}</button>
  )
}

function FeatureCard({ icon, color, title, desc, delay }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${hov ? color + '30' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 16,
        padding: '24px 22px',
        transition: 'all 0.22s ease',
        transform: hov ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hov ? `0 12px 40px rgba(0,0,0,0.3), 0 0 0 1px ${color}18` : 'none',
        cursor: 'default',
        animation: 'fadeUp 0.5s ease both',
        animationDelay: `${delay}ms`,
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 13,
        background: `${color}15`,
        border: `1px solid ${color}28`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color, marginBottom: 16,
        transition: 'background 0.2s',
        ...(hov ? { background: `${color}22` } : {}),
      }}>
        {FeatureIcons[icon]}
      </div>
      <h3 style={{
        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15,
        color: '#eeeef5', marginBottom: 8, letterSpacing: -0.1,
      }}>{title}</h3>
      <p style={{ fontSize: 13, color: '#8888a0', lineHeight: 1.65 }}>{desc}</p>
    </div>
  )
}

function PricingCard({ title, price, period, features, ctaLabel, onCta, isPro }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        flex: '1 1 300px', maxWidth: 360,
        background: isPro
          ? 'linear-gradient(160deg, rgba(0,217,139,0.07) 0%, rgba(9,9,15,0.95) 50%)'
          : 'rgba(255,255,255,0.02)',
        border: isPro ? '1px solid rgba(0,217,139,0.3)' : '1px solid rgba(255,255,255,0.07)',
        borderRadius: 20, padding: '32px 28px',
        position: 'relative',
        boxShadow: isPro
          ? '0 0 60px rgba(0,217,139,0.12), 0 12px 40px rgba(0,0,0,0.4)'
          : '0 4px 20px rgba(0,0,0,0.2)',
        transition: 'transform 0.2s ease',
        transform: hov ? 'translateY(-5px)' : 'translateY(0)',
      }}
    >
      {isPro && (
        <div style={{
          position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, #00d98b, #2dd4bf)',
          color: '#09090f', fontSize: 10, fontWeight: 800,
          fontFamily: 'var(--font-body)', letterSpacing: 1.5,
          padding: '4px 14px', borderRadius: 100, textTransform: 'uppercase',
          whiteSpace: 'nowrap', boxShadow: '0 2px 14px rgba(0,217,139,0.4)',
        }}>Most popular</div>
      )}

      <h3 style={{
        fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700,
        marginBottom: 16, color: isPro ? '#00d98b' : '#eeeef5',
        letterSpacing: 0.2,
      }}>{title}</h3>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 28 }}>
        <span style={{
          fontSize: 44, fontWeight: 800, fontFamily: 'var(--font-display)',
          letterSpacing: -1.5, color: '#eeeef5',
        }}>{price}</span>
        <span style={{ fontSize: 13, color: '#5a5a70', fontFamily: 'var(--font-body)' }}>{period}</span>
      </div>

      <ul style={{ listStyle: 'none', marginBottom: 32, display: 'flex', flexDirection: 'column', gap: 11 }}>
        {features.map(f => (
          <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{
              width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 1,
              background: isPro ? 'rgba(0,217,139,0.12)' : 'rgba(255,255,255,0.05)',
              border: isPro ? '1px solid rgba(0,217,139,0.28)' : '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, color: isPro ? '#00d98b' : '#8888a0',
            }}>✓</span>
            <span style={{ fontSize: 13, color: '#8888a0', lineHeight: 1.5 }}>{f}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={onCta}
        style={{
          width: '100%', padding: '13px 0', borderRadius: 12,
          border: isPro ? 'none' : '1px solid rgba(255,255,255,0.1)',
          background: isPro
            ? 'linear-gradient(135deg, #00d98b, #2dd4bf)'
            : 'rgba(255,255,255,0.04)',
          color: isPro ? '#09090f' : '#eeeef5',
          fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-body)',
          cursor: 'pointer', letterSpacing: 0.2,
          transition: 'opacity 0.18s',
          boxShadow: isPro ? '0 0 24px rgba(0,217,139,0.3)' : 'none',
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
      >{ctaLabel}</button>
    </div>
  )
}
