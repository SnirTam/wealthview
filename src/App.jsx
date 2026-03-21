import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Assets from './pages/Assets'
import Login from './pages/Login'

export default function App() {
  const [page, setPage] = useState('dashboard')
  const [assets, setAssets] = useState([])
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)

  // Listen for auth changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Load assets from Supabase when user logs in
  useEffect(() => {
    if (!user) return
    supabase
      .from('assets')
      .select('*')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (data && data.length > 0) setAssets(data)
        else setAssets([])
      })
  }, [user])

  // Save assets to Supabase whenever they change
  async function saveAssets(newAssets) {
    setAssets(newAssets)
    if (!user) return
    await supabase.from('assets').delete().eq('user_id', user.id)
    if (newAssets.length > 0) {
      await supabase.from('assets').insert(
        newAssets.map(a => ({ ...a, user_id: user.id }))
      )
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    setAssets([])
    setPage('dashboard')
  }

  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: 'linear-gradient(135deg, var(--green), var(--teal))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, fontWeight: 700, color: '#0a0a0f',
          fontFamily: 'var(--font-display)',
          animation: 'pulse-green 1.5s infinite',
        }}>W</div>
      </div>
    )
  }

  if (!user) return <Login />

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      {/* Mobile overlay */}
      {menuOpen && (
        <div onClick={() => setMenuOpen(false)} style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.6)', zIndex: 40,
        }} />
      )}

      {/* Mobile sidebar */}
      <div style={{
        position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 50,
        transform: menuOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.25s ease',
      }} className="mobile-sidebar">
        <Sidebar page={page} setPage={p => { setPage(p); setMenuOpen(false) }} onSignOut={handleSignOut} user={user} />
      </div>

      {/* Desktop sidebar */}
      <div className="desktop-sidebar">
        <Sidebar page={page} setPage={setPage} onSignOut={handleSignOut} user={user} />
      </div>

      <main style={{
        flex: 1, overflowY: 'auto',
        background: `
          radial-gradient(ellipse 80% 50% at 20% -10%, rgba(0,217,139,0.06) 0%, transparent 60%),
          radial-gradient(ellipse 60% 40% at 80% 110%, rgba(77,159,255,0.05) 0%, transparent 60%),
          var(--bg)
        `
      }}>
        {/* Mobile top bar */}
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
          <div style={{ width: 30 }} />
        </div>

        <div className="main-content">
          {page === 'dashboard' && <Dashboard assets={assets} />}
          {page === 'assets'    && <Assets assets={assets} setAssets={saveAssets} />}
        </div>
      </main>
    </div>
  )
}