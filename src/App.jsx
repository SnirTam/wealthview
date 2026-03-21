import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Assets from './pages/Assets'

const INITIAL_ASSETS = [
  { id: 1, name: 'Apple (AAPL)',    category: 'Stocks',      value: 12400,  ticker: null },
  { id: 2, name: 'Bitcoin (BTC)',   category: 'Crypto',      value: 8200,   ticker: 'bitcoin' },
  { id: 3, name: 'Ethereum (ETH)',  category: 'Crypto',      value: 4100,   ticker: 'ethereum' },
  { id: 4, name: 'Main property',  category: 'Real Estate', value: 320000, ticker: null },
  { id: 5, name: 'Fidelity 401k',  category: 'Retirement',  value: 54000,  ticker: null },
  { id: 6, name: 'Chase Checking', category: 'Cash',        value: 9800,   ticker: null },
  { id: 7, name: 'NVIDIA (NVDA)',   category: 'Stocks',      value: 18600,  ticker: null },
]

function loadAssets() {
  try {
    const saved = localStorage.getItem('wealthview_assets')
    return saved ? JSON.parse(saved) : INITIAL_ASSETS
  } catch {
    return INITIAL_ASSETS
  }
}

export default function App() {
  const [page, setPage] = useState('dashboard')
  const [assets, setAssets] = useState(loadAssets)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem('wealthview_assets', JSON.stringify(assets))
  }, [assets])

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      {/* Mobile overlay */}
      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 40,
          }}
        />
      )}

      {/* Sidebar — hidden on mobile unless menuOpen */}
      <div style={{
        position: 'fixed', top: 0, left: 0, height: '100vh',
        zIndex: 50,
        transform: menuOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.25s ease',
      }}
        className="mobile-sidebar"
      >
        <Sidebar page={page} setPage={p => { setPage(p); setMenuOpen(false) }} />
      </div>

      {/* Desktop sidebar */}
      <div className="desktop-sidebar">
        <Sidebar page={page} setPage={setPage} />
      </div>

      {/* Main content */}
      <main style={{
        flex: 1,
        overflowY: 'auto',
        background: `
          radial-gradient(ellipse 80% 50% at 20% -10%, rgba(0,217,139,0.06) 0%, transparent 60%),
          radial-gradient(ellipse 60% 40% at 80% 110%, rgba(77,159,255,0.05) 0%, transparent 60%),
          var(--bg)
        `
      }}>
        {/* Mobile top bar */}
        <div className="mobile-topbar">
          <button
            onClick={() => setMenuOpen(true)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text)', padding: '4px',
              display: 'flex', flexDirection: 'column', gap: 5,
            }}
          >
            <span style={{ display: 'block', width: 22, height: 2, background: 'var(--text)', borderRadius: 2 }} />
            <span style={{ display: 'block', width: 22, height: 2, background: 'var(--text)', borderRadius: 2 }} />
            <span style={{ display: 'block', width: 22, height: 2, background: 'var(--text)', borderRadius: 2 }} />
          </button>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18 }}>Wealthview</p>
          <div style={{ width: 30 }} />
        </div>

        <div className="main-content">
          {page === 'dashboard' && <Dashboard assets={assets} />}
          {page === 'assets'    && <Assets assets={assets} setAssets={setAssets} />}
        </div>
      </main>
    </div>
  )
}