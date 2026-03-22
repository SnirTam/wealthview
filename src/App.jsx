import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Assets from './pages/Assets'
import Analytics from './pages/Analytics'
import Goals from './pages/Goals'
import Watchlist from './pages/Watchlist'
import Login from './pages/Login'
import ErrorBoundary from './components/ErrorBoundary'

const PAGE_TITLES = {
  dashboard: 'Dashboard',
  assets: 'Assets',
  analytics: 'Analytics',
  goals: 'Goals',
  watchlist: 'Watchlist',
}

function TopBar({ page, setShowAddAsset }) {
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 20,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 48px', height: 64,
      background: 'rgba(10,10,15,0.88)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border)',
    }} className="desktop-topbar">
      <div>
        <p style={{ fontSize: 16, fontWeight: 600, fontFamily: 'var(--font-display)', letterSpacing: 0.3 }}>
          {PAGE_TITLES[page]}
        </p>
        <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-body)', marginTop: 1 }}>
          {dateStr}
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          onClick={() => setShowAddAsset(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'var(--bg2)', color: 'var(--text)',
            padding: '7px 16px', borderRadius: 8,
            fontSize: 12, fontWeight: 500, border: '1px solid var(--border2)',
            cursor: 'pointer', fontFamily: 'var(--font-body)',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.background = 'var(--bg3)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.background = 'var(--bg2)' }}
        >
          + Add asset
        </button>
      </div>
    </div>
  )
}

export default function App() {
  const [page, setPage] = useState('dashboard')
  const [assets, setAssets] = useState([])
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [assetsLoading, setAssetsLoading] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [isPro, setIsPro] = useState(false)
  const [showAddAsset, setShowAddAsset] = useState(false)
  const [currency, setCurrencyState] = useState(() => localStorage.getItem('wv_currency') || 'USD')
  const [netWorthHistory, setNetWorthHistory] = useState([])
  const [watchlistPrefill, setWatchlistPrefill] = useState(null)

  function setCurrency(c) {
    setCurrencyState(c)
    localStorage.setItem('wv_currency', c)
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const u = session?.user ?? null
      setUser(u)

      if (u) {
        // Determine Pro status: Supabase metadata takes precedence, localStorage as fallback
        const proFromMeta = u.user_metadata?.is_pro === true
        const proFromStorage = localStorage.getItem('wealthview_pro') === 'true'
        let proStatus = proFromMeta || proFromStorage

        // Handle post-upgrade redirect
        const params = new URLSearchParams(window.location.search)
        if (params.get('upgraded') === 'true') {
          window.history.replaceState({}, '', '/')
          // Persist to Supabase metadata
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
    ]).then(([assetsRes, historyRes]) => {
      if (!assetsRes.error) setAssets(assetsRes.data || [])
      if (!historyRes.error) setNetWorthHistory(historyRes.data || [])
      setAssetsLoading(false)
    })
  }, [user])

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
      // Record net worth snapshot
      const total = newAssets.reduce((s, a) => s + (a.value || 0), 0)
      if (total > 0) {
        const { data } = await supabase.from('net_worth_history').insert(
          [{ user_id: user.id, value: total }]
        ).select('value, recorded_at')
        if (data?.[0]) {
          setNetWorthHistory(prev => [...prev, data[0]])
        }
      }
    } catch (err) {
      console.error('Failed to save assets:', err)
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    setAssets([])
    setIsPro(false)
    setPage('dashboard')
  }

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
          Loading Wealthview…
        </p>
      </div>
    )
  }

  if (!user) return <Login />

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
              color: 'var(--text)', padding: '4px',
              display: 'flex', flexDirection: 'column', gap: 5,
            }}>
              <span style={{ display: 'block', width: 22, height: 2, background: 'var(--text)', borderRadius: 2 }} />
              <span style={{ display: 'block', width: 22, height: 2, background: 'var(--text)', borderRadius: 2 }} />
              <span style={{ display: 'block', width: 22, height: 2, background: 'var(--text)', borderRadius: 2 }} />
            </button>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18 }}>Wealthview</p>
            <button
              onClick={() => setShowAddAsset(true)}
              style={{
                background: 'linear-gradient(135deg, var(--green), var(--teal))',
                color: '#0a0a0f', border: 'none', borderRadius: 8,
                padding: '6px 12px', fontSize: 12, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'var(--font-display)',
              }}
            >
              + Add
            </button>
          </div>

          {/* Desktop sticky topbar */}
          <TopBar
            page={page}
            setShowAddAsset={setShowAddAsset}
          />

          {/* Page content with fade transition */}
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
              </>
            )}
          </div>
        </main>
      </div>
    </ErrorBoundary>
  )
}
