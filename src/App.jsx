import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'
import { startCheckout } from './stripe'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Assets from './pages/Assets'
import Liabilities from './pages/Liabilities'
import Analytics from './pages/Analytics'
import Goals from './pages/Goals'
import Watchlist from './pages/Watchlist'
import Alerts from './pages/Alerts'
import Login from './pages/Login'
import Landing from './pages/Landing'
import ErrorBoundary from './components/ErrorBoundary'
import OnboardingModal from './components/OnboardingModal'
import MilestoneModal from './components/MilestoneModal'
import Toast from './components/Toast'

const PAGE_TITLES = {
  dashboard: 'Dashboard',
  assets: 'Assets',
  liabilities: 'Liabilities',
  analytics: 'Analytics',
  goals: 'Goals',
  watchlist: 'Watchlist',
  alerts: 'Alerts',
}

const MILESTONES = [10000, 50000, 100000, 250000, 500000, 1000000, 5000000, 10000000]

function TopBar({ page, isPro, userEmail }) {
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 20,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 48px', height: 64,
      background: 'var(--bg2)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border)',
    }} className="desktop-topbar">
      <div>
        <p style={{ fontSize: 16, fontWeight: 600, fontFamily: 'var(--font-display)', letterSpacing: 0.3 }}>
          {PAGE_TITLES[page] || 'Dashboard'}
        </p>
        <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-body)', marginTop: 1 }}>
          {dateStr}
        </p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {!isPro ? (
          <button
            onClick={() => startCheckout(userEmail)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'linear-gradient(135deg, var(--green), var(--teal))',
              color: '#0a0a0f', padding: '7px 18px', borderRadius: 20,
              fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-display)', letterSpacing: 0.5,
              boxShadow: '0 0 18px rgba(0,217,139,0.25)', transition: 'opacity 0.15s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >✦ Upgrade to Pro</button>
        ) : (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(0,217,139,0.08)', color: 'var(--green)',
            padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
            border: '1px solid rgba(0,217,139,0.2)', fontFamily: 'var(--font-body)',
            whiteSpace: 'nowrap',
          }}>✦ Pro</div>
        )}
      </div>
    </div>
  )
}

export default function App() {
  const [page, setPage] = useState('dashboard')
  const [assets, setAssets] = useState([])
  const [liabilities, setLiabilitiesState] = useState([])
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [assetsLoading, setAssetsLoading] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [isPro, setIsPro] = useState(false)
  const [showAddAsset, setShowAddAsset] = useState(false)
  const [currency, setCurrencyState] = useState(() => localStorage.getItem('wv_currency') || 'USD')
  const [netWorthHistory, setNetWorthHistory] = useState([])
  const [watchlistPrefill, setWatchlistPrefill] = useState(null)
  const [theme, setThemeState] = useState(() => localStorage.getItem('wv_theme') || 'dark')
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [milestone, setMilestone] = useState(null)
  const [toasts, setToasts] = useState([])
  const [showLogin, setShowLogin] = useState(false)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  function setTheme(t) {
    setThemeState(t)
    localStorage.setItem('wv_theme', t)
  }

  function setCurrency(c) {
    setCurrencyState(c)
    localStorage.setItem('wv_currency', c)
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const u = session?.user ?? null
      setUser(u)

      if (u) {
        const proFromMeta = u.user_metadata?.is_pro === true
        const proFromStorage = localStorage.getItem('wealthview_pro') === 'true'
        let proStatus = proFromMeta || proFromStorage

        const params = new URLSearchParams(window.location.search)
        if (params.get('upgraded') === 'true') {
          window.history.replaceState({}, '', '/')
          await supabase.auth.updateUser({ data: { is_pro: true } })
          localStorage.setItem('wealthview_pro', 'true')
          proStatus = true
        }

        setIsPro(proStatus)
      }

      setAuthLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) {
        const proFromMeta = u.user_metadata?.is_pro === true
        const proFromStorage = localStorage.getItem('wealthview_pro') === 'true'
        setIsPro(proFromMeta || proFromStorage)
      } else {
        setIsPro(false)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  // ── Load assets + liabilities + history ──────────────────────────────────
  useEffect(() => {
    if (!user) return
    setAssetsLoading(true)

    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 12)

    Promise.all([
      supabase.from('assets').select('*').eq('user_id', user.id),
      supabase.from('net_worth_history')
        .select('value, recorded_at')
        .eq('user_id', user.id)
        .gte('recorded_at', sixMonthsAgo.toISOString())
        .order('recorded_at', { ascending: true }),
      supabase.from('liabilities').select('*').eq('user_id', user.id),
    ]).then(([assetsRes, historyRes, liabRes]) => {
      const loadedAssets = assetsRes.error ? [] : (assetsRes.data || [])
      if (!assetsRes.error) setAssets(loadedAssets)
      if (!historyRes.error) setNetWorthHistory(historyRes.data || [])
      if (!liabRes.error) setLiabilitiesState(liabRes.data || [])

      // Show onboarding for brand-new users
      if (loadedAssets.length === 0 && !user.user_metadata?.onboarding_done) {
        setShowOnboarding(true)
      }

      setAssetsLoading(false)
    })
  }, [user])

  // ── Milestone check ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!user || assets.length === 0) return
    const totalAssets = assets.reduce((s, a) => s + (a.value || 0), 0)
    const totalLiab = liabilities.reduce((s, l) => s + (l.balance || 0), 0)
    const netWorth = totalAssets - totalLiab
    if (netWorth <= 0) return

    const celebratedKey = `wv_milestones_${user.id}`
    const raw = localStorage.getItem(celebratedKey)
    const celebrated = JSON.parse(raw || '[]')

    // First time seeing this user — silently mark all already-passed milestones
    // so we only congratulate on future crossings
    if (!raw) {
      const alreadyPassed = MILESTONES.filter(m => netWorth >= m)
      localStorage.setItem(celebratedKey, JSON.stringify(alreadyPassed))
      return
    }

    for (const m of MILESTONES) {
      if (netWorth >= m && !celebrated.includes(m)) {
        celebrated.push(m)
        localStorage.setItem(celebratedKey, JSON.stringify(celebrated))
        setMilestone(m)
        break
      }
    }
  }, [assets, liabilities, user])

  // ── Save assets ───────────────────────────────────────────────────────────
  async function saveAssets(newAssets) {
    setAssets(newAssets)
    if (!user) return
    try {
      await supabase.from('assets').delete().eq('user_id', user.id)
      if (newAssets.length > 0) {
        const { error } = await supabase.from('assets').insert(
          newAssets.map(a => ({ ...a, user_id: user.id }))
        )
        if (error) throw error
      }
      const total = newAssets.reduce((s, a) => s + (a.value || 0), 0)
      if (total > 0) {
        const { data } = await supabase.from('net_worth_history').insert(
          [{ user_id: user.id, value: total }]
        ).select('value, recorded_at')
        if (data?.[0]) setNetWorthHistory(prev => [...prev, data[0]])
      }
    } catch (err) {
      console.error('Failed to save assets:', err)
    }
  }

  // ── Save liabilities ──────────────────────────────────────────────────────
  async function saveLiabilities(newLiabilities) {
    setLiabilitiesState(newLiabilities)
    if (!user) return
    try {
      await supabase.from('liabilities').delete().eq('user_id', user.id)
      if (newLiabilities.length > 0) {
        const { error } = await supabase.from('liabilities').insert(
          newLiabilities.map(l => ({
            user_id: user.id,
            name: l.name,
            category: l.category,
            balance: l.balance,
            interest_rate: l.interest_rate || 0,
          }))
        )
        if (error) throw error
      }
    } catch (err) {
      console.error('Failed to save liabilities:', err)
    }
  }

  // ── Toast helpers ─────────────────────────────────────────────────────────
  const addToast = useCallback((title, message, type = 'success') => {
    const id = Date.now()
    setToasts(t => [...t, { id, title, message, type }])
  }, [])

  function removeToast(id) {
    setToasts(t => t.filter(x => x.id !== id))
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    setAssets([])
    setLiabilitiesState([])
    setIsPro(false)
    setPage('dashboard')
    setShowLogin(false)
  }

  // ── Onboarding helpers ────────────────────────────────────────────────────
  function handleOnboardingComplete() {
    setShowOnboarding(false)
    supabase.auth.updateUser({ data: { onboarding_done: true } }).catch(() => {})
  }

  function handleOnboardingSkip() {
    setShowOnboarding(false)
    supabase.auth.updateUser({ data: { onboarding_done: true } }).catch(() => {})
  }

  function handleOnboardingAddAsset(asset) {
    saveAssets([...assets, asset])
  }

  // ── Loading splash ────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 16,
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: 'linear-gradient(135deg, var(--green), var(--teal))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, fontWeight: 700, color: '#0a0a0f',
          fontFamily: 'var(--font-display)',
          animation: 'pulse-green 1.5s infinite',
        }}>W</div>
        <p style={{ fontSize: 13, color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>
          Loading WealthView…
        </p>
      </div>
    )
  }

  // ── Not logged in: Landing or Login ──────────────────────────────────────
  if (!user) {
    if (showLogin) return <Login />
    return <Landing onGetStarted={() => setShowLogin(true)} onSignIn={() => setShowLogin(true)} />
  }

  const FREE_LIMIT = 5

  return (
    <ErrorBoundary>
      <div style={{ display: 'flex', minHeight: '100vh' }}>

        {menuOpen && (
          <div onClick={() => setMenuOpen(false)} style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.6)', zIndex: 40,
          }} />
        )}

        {/* Mobile slide-in sidebar */}
        <div style={{
          position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 50,
          transform: menuOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s ease',
        }} className="mobile-sidebar">
          <Sidebar
            page={page}
            setPage={p => { setPage(p); setMenuOpen(false) }}
            onSignOut={handleSignOut}
            user={user}
            isPro={isPro}
            theme={theme}
            setTheme={setTheme}
          />
        </div>

        {/* Desktop permanent sidebar */}
        <div className="desktop-sidebar">
          <Sidebar
            page={page}
            setPage={setPage}
            onSignOut={handleSignOut}
            user={user}
            isPro={isPro}
            theme={theme}
            setTheme={setTheme}
          />
        </div>

        <main style={{
          flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column',
          background: `
            radial-gradient(ellipse 80% 50% at 20% -10%, rgba(0,217,139,0.06) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 80% 110%, rgba(77,159,255,0.05) 0%, transparent 60%),
            var(--bg)
          `
        }}>
          {/* Mobile topbar */}
          <div className="mobile-topbar">
            <button onClick={() => setMenuOpen(true)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '4px',
              display: 'flex', flexDirection: 'column', gap: 5,
            }}>
              <span style={{ display: 'block', width: 22, height: 2, background: '#f0f0f5', borderRadius: 2 }} />
              <span style={{ display: 'block', width: 22, height: 2, background: '#f0f0f5', borderRadius: 2 }} />
              <span style={{ display: 'block', width: 22, height: 2, background: '#f0f0f5', borderRadius: 2 }} />
            </button>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: '#f0f0f5' }}>WealthView</p>
            {isPro ? (
              <button
                onClick={() => setShowAddAsset(true)}
                style={{
                  background: 'linear-gradient(135deg, var(--green), var(--teal))',
                  color: '#0a0a0f', border: 'none', borderRadius: 8,
                  padding: '6px 14px', fontSize: 12, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'var(--font-display)',
                }}
              >+ Add</button>
            ) : (
              <button
                onClick={() => startCheckout(user?.email)}
                style={{
                  background: 'linear-gradient(135deg, var(--green), var(--teal))',
                  color: '#0a0a0f', border: 'none', borderRadius: 8,
                  padding: '6px 12px', fontSize: 11, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'var(--font-display)',
                  whiteSpace: 'nowrap',
                }}
              >✦ Upgrade</button>
            )}
          </div>

          {/* Desktop sticky topbar */}
          <TopBar page={page} isPro={isPro} userEmail={user?.email} />

          {/* Page content */}
          <div className="main-content page-transition" key={page}>
            {assetsLoading ? (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                minHeight: 300, flexDirection: 'column', gap: 12,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'linear-gradient(135deg, var(--green), var(--teal))',
                  animation: 'pulse-green 1.5s infinite',
                }} />
                <p style={{ fontSize: 13, color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>
                  Loading your portfolio…
                </p>
              </div>
            ) : (
              <>
                {page === 'dashboard' && (
                  <Dashboard
                    assets={assets}
                    liabilities={liabilities}
                    isPro={isPro}
                    user={user}
                    showAddAsset={showAddAsset}
                    setShowAddAsset={setShowAddAsset}
                    saveAssets={saveAssets}
                    freeLimit={FREE_LIMIT}
                    setPage={setPage}
                    netWorthHistory={netWorthHistory}
                    currency={currency}
                    setCurrency={setCurrency}
                    prefillAsset={watchlistPrefill}
                    onPrefillUsed={() => setWatchlistPrefill(null)}
                  />
                )}
                {page === 'assets' && (
                  <Assets
                    assets={assets}
                    setAssets={saveAssets}
                    isPro={isPro}
                    freeLimit={FREE_LIMIT}
                    currency={currency}
                    user={user}
                  />
                )}
                {page === 'liabilities' && (
                  <Liabilities
                    liabilities={liabilities}
                    setLiabilities={saveLiabilities}
                    user={user}
                    currency={currency}
                  />
                )}
                {page === 'analytics' && (
                  <Analytics
                    assets={assets}
                    netWorthHistory={netWorthHistory}
                    currency={currency}
                  />
                )}
                {page === 'goals' && (
                  <Goals
                    assets={assets}
                    user={user}
                    netWorthHistory={netWorthHistory}
                    currency={currency}
                  />
                )}
                {page === 'watchlist' && (
                  <Watchlist
                    currency={currency}
                    onAddToPortfolio={item => {
                      setWatchlistPrefill(item)
                      setPage('dashboard')
                      setShowAddAsset(true)
                    }}
                  />
                )}
                {page === 'alerts' && (
                  <Alerts
                    isPro={isPro}
                    assets={assets}
                    addToast={addToast}
                  />
                )}
              </>
            )}
          </div>
        </main>

        {/* Onboarding modal */}
        {showOnboarding && (
          <OnboardingModal
            user={user}
            onComplete={handleOnboardingComplete}
            onSkip={handleOnboardingSkip}
            onAddAsset={handleOnboardingAddAsset}
          />
        )}

        {/* Milestone modal */}
        {milestone && (
          <MilestoneModal
            milestone={milestone}
            onClose={() => setMilestone(null)}
          />
        )}

        {/* Toast notifications */}
        <Toast toasts={toasts} removeToast={removeToast} />

      </div>
    </ErrorBoundary>
  )
}
