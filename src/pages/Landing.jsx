import { useEffect, useRef, useState } from 'react'

/* ── Scroll-reveal wrapper using IntersectionObserver ── */
function FadeIn({ children, delay = 0, style: extraStyle = {}, className = '' }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.unobserve(el) } },
      { threshold: 0.08 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(28px)',
        transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
        ...extraStyle,
      }}
    >
      {children}
    </div>
  )
}

/* ── Mini sparkline ── */
function MiniChart() {
  const pts = [
    [0, 52], [14, 44], [28, 48], [42, 36], [56, 40],
    [70, 28], [84, 32], [98, 20], [112, 24], [126, 14],
    [140, 18], [154, 8], [168, 4],
  ]
  const toStr = arr => arr.map(([x, y]) => `${x},${y}`).join(' ')
  const filled = [...pts, [pts[pts.length - 1][0], 60], [0, 60]]
  return (
    <svg viewBox="0 0 168 60" style={{ width: '100%', height: 60, display: 'block' }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00d98b" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#00d98b" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={toStr(filled)} fill="url(#chartFill)" />
      <polyline points={toStr(pts)} fill="none" stroke="#00d98b" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3.5" fill="#00d98b" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="6" fill="#00d98b" opacity="0.25" />
    </svg>
  )
}

/* ── App mockup ── */
function AppMockup() {
  return (
    <div style={{
      background: 'linear-gradient(145deg, #0e0e16 0%, #13131d 100%)',
      border: '1px solid rgba(255,255,255,0.09)',
      borderRadius: 24, overflow: 'hidden',
      boxShadow: '0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,217,139,0.06), inset 0 1px 0 rgba(255,255,255,0.05)',
      width: '100%', maxWidth: 380, position: 'relative',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)',
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
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#00d98b', display: 'inline-block' }} />
          LIVE
        </div>
        <div style={{ width: 48 }} />
      </div>
      <div style={{ padding: '20px 20px 24px' }}>
        <div style={{ marginBottom: 18 }}>
          <p style={{ fontSize: 10, color: '#5a5a70', fontFamily: 'var(--font-body)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>Total Net Worth</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ fontSize: 36, fontWeight: 700, fontFamily: 'var(--font-display)', color: '#eeeef5', letterSpacing: -1.5, lineHeight: 1 }}>$248,930</span>
            <span style={{ fontSize: 12, color: '#00d98b', fontWeight: 600, background: 'rgba(0,217,139,0.1)', padding: '2px 8px', borderRadius: 8, border: '1px solid rgba(0,217,139,0.15)' }}>+12.4%</span>
          </div>
          <p style={{ fontSize: 11, color: '#5a5a70', marginTop: 3 }}>↑ $27,460 this year</p>
        </div>
        <div style={{ marginBottom: 18, borderRadius: 10, overflow: 'hidden' }}><MiniChart /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 18 }}>
          {[
            { label: 'Assets', val: '$274k', color: '#00d98b' },
            { label: 'Debt', val: '$25k', color: '#ff4d6d' },
            { label: 'Goals', val: '3/5', color: '#a78bfa' },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '10px', textAlign: 'center' }}>
              <p style={{ fontSize: 10, color: '#5a5a70', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{s.label}</p>
              <p style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-display)', color: s.color }}>{s.val}</p>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { abbr: 'AAPL', name: 'Apple Inc.', val: '$89,400', pct: 36, color: '#5b9cf6' },
            { abbr: 'BTC',  name: 'Bitcoin',    val: '$72,100', pct: 29, color: '#f7931a' },
            { abbr: '$',    name: 'Cash',        val: '$87,430', pct: 35, color: '#00d98b' },
          ].map(a => (
            <div key={a.abbr} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, flexShrink: 0, background: `${a.color}18`, border: `1px solid ${a.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: a.color, fontWeight: 800, fontFamily: 'var(--font-display)' }}>{a.abbr.slice(0,3)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <p style={{ fontSize: 11, color: '#ccccd8', fontWeight: 500 }}>{a.name}</p>
                  <p style={{ fontSize: 11, color: '#8888a0' }}>{a.val}</p>
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
  chart: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M3 16L8 11L12 14L19 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M19 6H14M19 6V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  balance: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M11 3v16M6 7l5-4 5 4M6 15l5 4 5-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  target: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/><circle cx="11" cy="11" r="4" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/><circle cx="11" cy="11" r="1.5" fill="currentColor"/></svg>,
  analytics: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="3" y="12" width="3.5" height="7" rx="1" fill="currentColor" opacity="0.5"/><rect x="9.25" y="7" width="3.5" height="12" rx="1" fill="currentColor" opacity="0.75"/><rect x="15.5" y="3" width="3.5" height="16" rx="1" fill="currentColor"/></svg>,
  lock: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="4" y="9" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M7 9V7a4 4 0 0 1 8 0v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="11" cy="14" r="1.5" fill="currentColor"/></svg>,
  bell: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M11 3a7 7 0 0 0-7 7v3L2.5 15h17L18 13v-3a7 7 0 0 0-7-7z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M8.5 15a2.5 2.5 0 0 0 5 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  mobile: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="6" y="2" width="10" height="18" rx="3" stroke="currentColor" strokeWidth="2"/><circle cx="11" cy="17" r="1" fill="currentColor"/></svg>,
}

const FEATURES = [
  { icon: 'chart',     color: '#00d98b', title: 'Live prices',        desc: 'Real-time stock & crypto prices pulled automatically. Never manually update a value again.' },
  { icon: 'balance',   color: '#5b9cf6', title: 'True net worth',     desc: 'Assets minus liabilities — the number that actually matters for your financial health.' },
  { icon: 'target',    color: '#a78bfa', title: 'Goals & milestones', desc: 'Set savings targets, track progress, and get celebrated every time you hit a new milestone.' },
  { icon: 'analytics', color: '#f59e0b', title: 'Deep analytics',     desc: 'Allocation breakdown, growth trends, and performance charts that tell the full story.' },
  { icon: 'lock',      color: '#2dd4bf', title: 'Secure & private',   desc: 'Bank-level encryption. Your data is never sold, shared, or used for ads. Ever.' },
  { icon: 'mobile',    color: '#ff4d6d', title: 'Mobile ready',       desc: 'Access your wealth dashboard from any device, anywhere. Your portfolio in your pocket.' },
]

const STEPS = [
  { n: '01', title: 'Add your assets',     desc: 'Stocks, crypto, real estate, retirement, cash — add anything in seconds. Live prices auto-fill.' },
  { n: '02', title: 'Track liabilities',   desc: 'Mortgages, loans, credit cards. Your real net worth is assets minus what you owe.' },
  { n: '03', title: 'Watch it grow',       desc: 'Historical charts, goal tracking, and milestones celebrate every step of your journey.' },
]

const TESTIMONIALS = [
  { quote: 'Finally I know my real net worth after subtracting my mortgage. Game changer.', name: 'Sarah K.', age: 34 },
  { quote: 'The live crypto prices save me so much time. Everything in one place.',          name: 'Marcus T.', age: 28 },
  { quote: 'Set up in 5 minutes. Best financial decision I made this year.',                 name: 'David R.', age: 41 },
]

const ASSET_TYPES = [
  { label: 'Stocks',      icon: '📈', color: '#5b9cf6' },
  { label: 'Crypto',      icon: '₿',  color: '#f7931a' },
  { label: 'Real Estate', icon: '🏠', color: '#00d98b' },
  { label: 'Retirement',  icon: '🏦', color: '#a78bfa' },
  { label: 'Cash',        icon: '💵', color: '#6b9f6b' },
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
    <div style={{ minHeight: '100vh', background: '#09090f', color: '#eeeef5', fontFamily: 'var(--font-body)', overflowX: 'hidden' }}>

      {/* ── NAV ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(20px, 5vw, 80px)', height: 64,
        background: scrolled ? 'rgba(9,9,15,0.94)' : 'rgba(9,9,15,0.4)',
        backdropFilter: 'blur(20px)',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
        transition: 'all 0.25s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #00d98b, #2dd4bf)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 800, color: '#09090f', fontFamily: 'var(--font-display)', flexShrink: 0, boxShadow: '0 0 16px rgba(0,217,139,0.35)' }}>W</div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, letterSpacing: 0.2, color: '#eeeef5' }}>WealthView</span>
        </div>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }} className="nav-links">
          {[{ label: 'Features', href: '#features' }, { label: 'Pricing', href: '#pricing' }].map(l => (
            <a key={l.label} href={l.href} style={{ fontSize: 13, color: '#8888a0', fontFamily: 'var(--font-body)', fontWeight: 500, textDecoration: 'none', letterSpacing: 0.1, transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#eeeef5'}
              onMouseLeave={e => e.currentTarget.style.color = '#8888a0'}
            >{l.label}</a>
          ))}
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
        padding: 'clamp(24px, 3vh, 48px) clamp(20px, 5vw, 80px) clamp(48px, 6vh, 72px)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: `radial-gradient(ellipse 60% 70% at 20% 50%, rgba(0,217,139,0.08) 0%, transparent 65%), radial-gradient(ellipse 50% 60% at 80% 40%, rgba(91,156,246,0.07) 0%, transparent 60%), radial-gradient(ellipse 50% 50% at 50% 0%, rgba(167,139,250,0.05) 0%, transparent 55%)` }} />
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.025, backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(40px, 6vw, 80px)', width: '100%', maxWidth: 1200, margin: '0 auto', flexWrap: 'wrap' }}>
          <div style={{ flex: '0 0 clamp(300px, 52%, 600px)', minWidth: 300 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(0,217,139,0.08)', border: '1px solid rgba(0,217,139,0.22)', borderRadius: 100, padding: '6px 14px', marginBottom: 24, fontSize: 12, color: '#00d98b', fontWeight: 600, letterSpacing: 0.4 }}>
              <span style={{ fontSize: 10 }}>✦</span> Live prices · Real net worth · Privacy first
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(40px, 5.5vw, 66px)', fontWeight: 800, lineHeight: 1.06, letterSpacing: -2, marginBottom: 20, color: '#eeeef5' }}>
              Know exactly<br />
              <span style={{ background: 'linear-gradient(130deg, #00d98b 0%, #2dd4bf 50%, #5b9cf6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>where you stand</span>
            </h1>
            <p style={{ fontSize: 'clamp(15px, 1.8vw, 19px)', color: '#8888a0', lineHeight: 1.7, marginBottom: 32, maxWidth: 460 }}>
              Track every asset, every liability, every price — all in one beautiful dashboard. Your real net worth, always up to date.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24, alignItems: 'center' }}>
              <GreenBtn onClick={onGetStarted} large>Start for free</GreenBtn>
              <a href="#how-it-works" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#8888a0', fontSize: 14, fontWeight: 500, textDecoration: 'none', letterSpacing: 0.2, padding: '10px 4px', transition: 'color 0.18s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#eeeef5'}
                onMouseLeave={e => e.currentTarget.style.color = '#8888a0'}
              >
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.22)', background: 'rgba(255,255,255,0.1)', flexShrink: 0 }}>
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6l5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
                See how it works
              </a>
            </div>
            <p style={{ fontSize: 12, color: '#5a5a70', letterSpacing: 0.3 }}>No credit card required · Free forever plan</p>
          </div>

          <div style={{ flex: '1 1 300px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', animation: 'fadeUp 0.7s ease both', animationDelay: '0.15s', position: 'relative' }}>
            <div style={{ position: 'absolute', top: -14, left: -14, zIndex: 2, background: 'linear-gradient(135deg, #0e0e18, #14141e)', border: '1px solid rgba(0,217,139,0.25)', borderRadius: 12, padding: '8px 12px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', animation: 'float 4s ease-in-out infinite' }}>
              <p style={{ fontSize: 9, color: '#5a5a70', marginBottom: 2, letterSpacing: 0.5 }}>NET WORTH</p>
              <p style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-display)', color: '#00d98b', letterSpacing: -0.5 }}>+$27,460</p>
            </div>
            <div style={{ position: 'absolute', bottom: 40, right: -20, zIndex: 2, background: 'linear-gradient(135deg, #0e0e18, #14141e)', border: '1px solid rgba(91,156,246,0.25)', borderRadius: 12, padding: '8px 12px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', animation: 'float 4s ease-in-out infinite', animationDelay: '1.2s' }}>
              <p style={{ fontSize: 9, color: '#5a5a70', marginBottom: 2, letterSpacing: 0.5 }}>GOAL PROGRESS</p>
              <p style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-display)', color: '#5b9cf6', letterSpacing: -0.5 }}>68% there</p>
            </div>
            <AppMockup />
          </div>
        </div>
      </section>

      {/* ── TRUST PILLS ── */}
      <FadeIn>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '18px clamp(20px, 5vw, 80px)', background: 'rgba(255,255,255,0.015)' }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
            {['Free to start', 'No credit card', '2 minute setup', 'Cancel anytime'].map(label => (
              <div key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(0,217,139,0.07)', border: '1px solid rgba(0,217,139,0.18)', borderRadius: 100, padding: '7px 16px', fontSize: 12, color: '#00d98b', fontWeight: 500, letterSpacing: 0.2, whiteSpace: 'nowrap' }}>
                <span style={{ fontSize: 10 }}>✓</span> {label}
              </div>
            ))}
          </div>
        </div>
      </FadeIn>

      {/* ── WORKS WITH ── */}
      <FadeIn>
        <div style={{ padding: '28px clamp(20px, 5vw, 80px)', textAlign: 'center' }}>
          <p style={{ fontSize: 11, color: '#5a5a70', fontWeight: 500, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16 }}>Works with</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            {ASSET_TYPES.map(a => (
              <div key={a.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: `${a.color}10`, border: `1px solid ${a.color}28`, borderRadius: 100, padding: '7px 16px', fontSize: 13, color: '#ccccd8', fontWeight: 500, whiteSpace: 'nowrap' }}>
                <span style={{ fontSize: 14 }}>{a.icon}</span> {a.label}
              </div>
            ))}
          </div>
        </div>
      </FadeIn>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ padding: 'clamp(48px, 6vh, 72px) clamp(20px, 5vw, 80px)', position: 'relative' }}>
        <FadeIn><SectionLabel>How it works</SectionLabel></FadeIn>
        <FadeIn delay={80}><h2 style={h2Style}>Up and running in 2 minutes</h2></FadeIn>
        <div style={{ display: 'flex', gap: 'clamp(16px, 3vw, 40px)', maxWidth: 900, margin: '0 auto', flexWrap: 'wrap', justifyContent: 'center' }}>
          {STEPS.map((s, i) => (
            <FadeIn key={s.n} delay={i * 100} style={{ flex: '1 1 220px', maxWidth: 280 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(0,217,139,0.08)', border: '1px solid rgba(0,217,139,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, color: '#00d98b', letterSpacing: 0.5, marginBottom: 18 }}>{s.n}</div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: '#eeeef5', marginBottom: 10, letterSpacing: -0.2 }}>{s.title}</h3>
              <p style={{ fontSize: 13, color: '#8888a0', lineHeight: 1.65 }}>{s.desc}</p>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: 'clamp(48px, 6vh, 72px) clamp(20px, 5vw, 80px)', background: 'rgba(255,255,255,0.015)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <FadeIn><SectionLabel>Features</SectionLabel></FadeIn>
        <FadeIn delay={80}><h2 style={h2Style}>Everything you need to build wealth</h2></FadeIn>
        <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18, maxWidth: 1100, margin: '0 auto' }}>
          {FEATURES.map((f, i) => (
            <FadeIn key={f.title} delay={i * 60}>
              <FeatureCard {...f} />
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ padding: 'clamp(48px, 6vh, 72px) clamp(20px, 5vw, 80px)' }}>
        <FadeIn><SectionLabel>Testimonials</SectionLabel></FadeIn>
        <FadeIn delay={80}><h2 style={h2Style}>People who took control</h2></FadeIn>
        <div className="testimonials-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, maxWidth: 1000, margin: '0 auto' }}>
          {TESTIMONIALS.map((t, i) => (
            <FadeIn key={t.name} delay={i * 80}>
              <TestimonialCard {...t} />
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ padding: 'clamp(48px, 6vh, 72px) clamp(20px, 5vw, 80px)', background: 'rgba(255,255,255,0.015)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <FadeIn><SectionLabel>Pricing</SectionLabel></FadeIn>
        <FadeIn delay={80}><h2 style={h2Style}>Simple, transparent pricing</h2></FadeIn>
        <div style={{ display: 'flex', gap: 24, maxWidth: 820, margin: '0 auto', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'stretch' }}>
          <FadeIn delay={0} style={{ flex: '1 1 300px', maxWidth: 360, display: 'flex' }}>
            <PricingCard title="Free" price="$0" period="/ month" features={FREE_FEATURES} ctaLabel="Get started free" onCta={onGetStarted} />
          </FadeIn>
          <FadeIn delay={100} style={{ flex: '1 1 300px', maxWidth: 360, display: 'flex' }}>
            <PricingCard title="Pro" price="$9.99" period="/ month" features={PRO_FEATURES} ctaLabel="Upgrade to Pro" onCta={onGetStarted} isPro />
          </FadeIn>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section style={{ padding: 'clamp(56px, 7vh, 88px) clamp(20px, 5vw, 80px)', textAlign: 'center', position: 'relative', overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        {/* Green glow behind headline */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '60%', height: '80%', background: 'radial-gradient(ellipse 70% 70% at 50% 50%, rgba(0,217,139,0.12) 0%, rgba(0,217,139,0.04) 50%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <FadeIn>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(0,217,139,0.08)', border: '1px solid rgba(0,217,139,0.2)', borderRadius: 100, padding: '5px 14px', marginBottom: 20, fontSize: 11, color: '#00d98b', fontWeight: 600, letterSpacing: 0.5 }}>✦ Start today</div>
          </FadeIn>
          <FadeIn delay={80}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(30px, 4vw, 50px)', fontWeight: 800, letterSpacing: -1.5, lineHeight: 1.1, marginBottom: 16, color: '#eeeef5' }}>
              Your financial picture<br />starts now
            </h2>
          </FadeIn>
          <FadeIn delay={160}>
            <p style={{ fontSize: 16, color: '#8888a0', marginBottom: 32, maxWidth: 400, margin: '0 auto 32px' }}>
              Free to start. No credit card needed. Your complete wealth dashboard in under 2 minutes.
            </p>
          </FadeIn>
          <FadeIn delay={220}><GreenBtn onClick={onGetStarted} large>Create your free account</GreenBtn></FadeIn>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: 'clamp(28px, 4vh, 44px) clamp(20px, 5vw, 80px)', maxWidth: 1200, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #00d98b, #2dd4bf)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#09090f', fontFamily: 'var(--font-display)' }}>W</div>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: '#eeeef5' }}>WealthView</span>
            </div>
            <p style={{ fontSize: 12, color: '#5a5a70', maxWidth: 260, lineHeight: 1.5 }}>Built for people who take their finances seriously.</p>
          </div>

          <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'center' }}>
            {[
              { label: 'Dashboard', action: onGetStarted },
              { label: 'Features',  href: '#features' },
              { label: 'Pricing',   href: '#pricing' },
              { label: 'Sign in',   action: onSignIn },
            ].map(l => (
              l.href
                ? <a key={l.label} href={l.href} style={footerLinkStyle} onMouseEnter={e => e.currentTarget.style.color = '#eeeef5'} onMouseLeave={e => e.currentTarget.style.color = '#5a5a70'}>{l.label}</a>
                : <button key={l.label} onClick={l.action} style={{ ...footerLinkStyle, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onMouseEnter={e => e.currentTarget.style.color = '#eeeef5'} onMouseLeave={e => e.currentTarget.style.color = '#5a5a70'}>{l.label}</button>
            ))}

            {/* Social icons */}
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { href: '#', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.262 5.634 5.902-5.634zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>, label: 'X' },
                { href: '#', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>, label: 'Instagram' },
              ].map(s => (
                <a key={s.label} href={s.href} aria-label={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#8888a0', transition: 'all 0.15s', textDecoration: 'none' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#eeeef5'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#8888a0'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
                >{s.icon}</a>
              ))}
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 20, textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: '#5a5a70' }}>© 2026 WealthView. Built for people who take their finances seriously.</p>
        </div>
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
        @media (max-width: 900px) {
          .features-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .testimonials-grid { grid-template-columns: repeat(1, 1fr) !important; }
          .nav-links { display: none !important; }
        }
        @media (max-width: 600px) {
          .features-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

/* ── Shared styles ── */

const h2Style = {
  textAlign: 'center', fontFamily: 'var(--font-display)',
  fontSize: 'clamp(26px, 3.5vw, 42px)', fontWeight: 800,
  letterSpacing: -1, marginBottom: 44, color: '#eeeef5',
}

const footerLinkStyle = {
  fontSize: 13, color: '#5a5a70', fontFamily: 'var(--font-body)',
  transition: 'color 0.15s', textDecoration: 'none',
}

function SectionLabel({ children }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: 12, fontSize: 11, fontWeight: 600, color: '#00d98b', letterSpacing: 2, textTransform: 'uppercase' }}>
      {children}
    </div>
  )
}

function GreenBtn({ children, onClick, large }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
      background: 'linear-gradient(135deg, #00d98b, #2dd4bf)', color: '#09090f', border: 'none',
      borderRadius: large ? 14 : 10, padding: large ? '14px 28px' : '7px 18px',
      fontSize: large ? 16 : 13, fontWeight: 700, fontFamily: 'var(--font-body)',
      cursor: 'pointer', letterSpacing: 0.1,
      boxShadow: hov ? '0 0 36px rgba(0,217,139,0.5), 0 4px 16px rgba(0,0,0,0.3)' : '0 0 22px rgba(0,217,139,0.28), 0 4px 12px rgba(0,0,0,0.2)',
      transform: hov ? 'translateY(-1px)' : 'translateY(0)', transition: 'all 0.18s ease', whiteSpace: 'nowrap',
    }}>{children}</button>
  )
}

function NavBtn({ children, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
      background: hov ? 'rgba(255,255,255,0.06)' : 'transparent',
      color: hov ? '#eeeef5' : '#8888a0',
      border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9,
      padding: '7px 16px', fontSize: 13, fontWeight: 500,
      fontFamily: 'var(--font-body)', cursor: 'pointer', letterSpacing: 0.1,
      transition: 'all 0.15s ease', whiteSpace: 'nowrap',
    }}>{children}</button>
  )
}

function FeatureCard({ icon, color, title, desc }) {
  const [hov, setHov] = useState(false)
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
      background: hov ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.02)',
      border: `1px solid ${hov ? color + '30' : 'rgba(255,255,255,0.06)'}`,
      borderRadius: 16, padding: '24px 22px',
      transition: 'all 0.22s ease',
      transform: hov ? 'translateY(-3px)' : 'translateY(0)',
      boxShadow: hov ? `0 12px 40px rgba(0,0,0,0.3), 0 0 0 1px ${color}18` : 'none',
      cursor: 'default', height: '100%', boxSizing: 'border-box',
    }}>
      <div style={{ width: 44, height: 44, borderRadius: 13, background: `${color}15`, border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, marginBottom: 16 }}>
        {FeatureIcons[icon]}
      </div>
      <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: '#eeeef5', marginBottom: 8, letterSpacing: -0.1 }}>{title}</h3>
      <p style={{ fontSize: 13, color: '#8888a0', lineHeight: 1.65 }}>{desc}</p>
    </div>
  )
}

function TestimonialCard({ quote, name, age }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 16, padding: '24px', display: 'flex', flexDirection: 'column', gap: 16,
      transition: 'border-color 0.2s', cursor: 'default',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(0,217,139,0.2)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}
    >
      {/* Stars */}
      <div style={{ display: 'flex', gap: 3 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <svg key={i} width="14" height="14" viewBox="0 0 14 14" fill="#f59e0b"><path d="M7 1l1.6 3.3 3.6.5-2.6 2.5.6 3.6L7 9.3l-3.2 1.6.6-3.6L1.8 4.8l3.6-.5z"/></svg>
        ))}
      </div>
      {/* Quote */}
      <p style={{ fontSize: 14, color: '#ccccd8', lineHeight: 1.65, fontStyle: 'italic', flex: 1 }}>"{quote}"</p>
      {/* Author */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(0,217,139,0.3), rgba(91,156,246,0.3))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#eeeef5', flexShrink: 0 }}>
          {name[0]}
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#eeeef5' }}>{name}</p>
          <p style={{ fontSize: 11, color: '#5a5a70' }}>Age {age}</p>
        </div>
      </div>
    </div>
  )
}

function PricingCard({ title, price, period, features, ctaLabel, onCta, isPro }) {
  const [hov, setHov] = useState(false)
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
      width: '100%',
      background: isPro ? 'linear-gradient(160deg, rgba(0,217,139,0.07) 0%, rgba(9,9,15,0.95) 50%)' : 'rgba(255,255,255,0.02)',
      border: isPro ? '1px solid rgba(0,217,139,0.3)' : '1px solid rgba(255,255,255,0.07)',
      borderRadius: 20, padding: '32px 28px',
      position: 'relative', display: 'flex', flexDirection: 'column',
      boxShadow: isPro ? '0 0 60px rgba(0,217,139,0.12), 0 12px 40px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.2)',
      transition: 'transform 0.2s ease',
      transform: hov ? 'translateY(-5px)' : 'translateY(0)',
    }}>
      {isPro && (
        <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #00d98b, #2dd4bf)', color: '#09090f', fontSize: 10, fontWeight: 800, fontFamily: 'var(--font-body)', letterSpacing: 1.5, padding: '4px 14px', borderRadius: 100, textTransform: 'uppercase', whiteSpace: 'nowrap', boxShadow: '0 2px 14px rgba(0,217,139,0.4)' }}>Most popular</div>
      )}
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, marginBottom: 16, color: isPro ? '#00d98b' : '#eeeef5', letterSpacing: 0.2 }}>{title}</h3>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 28 }}>
        <span style={{ fontSize: 44, fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: -1.5, color: '#eeeef5' }}>{price}</span>
        <span style={{ fontSize: 13, color: '#5a5a70' }}>{period}</span>
      </div>
      <ul style={{ listStyle: 'none', marginBottom: 32, display: 'flex', flexDirection: 'column', gap: 11, flex: 1 }}>
        {features.map(f => (
          <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 1, background: isPro ? 'rgba(0,217,139,0.12)' : 'rgba(255,255,255,0.05)', border: isPro ? '1px solid rgba(0,217,139,0.28)' : '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: isPro ? '#00d98b' : '#eeeef5' }}>✓</span>
            <span style={{ fontSize: 13, color: '#8888a0', lineHeight: 1.5 }}>{f}</span>
          </li>
        ))}
      </ul>
      <button onClick={onCta} style={{
        width: '100%', padding: '13px 0', borderRadius: 12,
        border: isPro ? 'none' : '1.5px solid rgba(255,255,255,0.28)',
        background: isPro ? 'linear-gradient(135deg, #00d98b, #2dd4bf)' : 'transparent',
        color: isPro ? '#09090f' : '#eeeef5',
        fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-body)',
        cursor: 'pointer', letterSpacing: 0.2, transition: 'all 0.18s',
        boxShadow: isPro ? '0 0 24px rgba(0,217,139,0.3)' : 'none',
      }}
        onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; if (!isPro) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)' }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; if (!isPro) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.28)' }}
      >{ctaLabel}</button>
    </div>
  )
}
