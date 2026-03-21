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

  useEffect(() => {
    localStorage.setItem('wealthview_assets', JSON.stringify(assets))
  }, [assets])

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar page={page} setPage={setPage} />
      <main style={{
        flex: 1,
        padding: '40px 48px',
        overflowY: 'auto',
        background: `
          radial-gradient(ellipse 80% 50% at 20% -10%, rgba(0,217,139,0.06) 0%, transparent 60%),
          radial-gradient(ellipse 60% 40% at 80% 110%, rgba(77,159,255,0.05) 0%, transparent 60%),
          var(--bg)
        `
      }}>
        {page === 'dashboard' && <Dashboard assets={assets} />}
        {page === 'assets'    && <Assets assets={assets} setAssets={setAssets} />}
      </main>
    </div>
  )
}