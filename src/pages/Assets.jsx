import { useState, useRef, useEffect } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatAmount } from './Dashboard'
import AssetLogo from '../components/AssetLogo'

const CATEGORY_COLORS = {
  Stocks: '#4d9fff', Crypto: '#ffb340', 'Real Estate': '#00d98b',
  Retirement: '#a78bfa', Cash: '#6b6b80', Others: '#9b8ea8',
}
const CATEGORIES = Object.keys(CATEGORY_COLORS)
const CATEGORY_ICONS = {
  Stocks: '📈', Crypto: '₿', 'Real Estate': '🏠', Retirement: '🏦', Cash: '💵', Others: '📦',
}
const CHAIN_COLORS = { ethereum: '#627EEA', bitcoin: '#F7931A', solana: '#9945FF' }
const CHAIN_LABELS = { ethereum: 'Ethereum', bitcoin: 'Bitcoin', solana: 'Solana' }
const CHAIN_ICONS  = { ethereum: '⟠', bitcoin: '₿', solana: '◎' }

// Auto-detect chain from address format
function detectChain(address) {
  if (/^0x[a-fA-F0-9]{40}$/.test(address)) return 'ethereum'
  if (/^(1|3|bc1)[a-zA-Z0-9]{25,61}$/.test(address)) return 'bitcoin'
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) return 'solana'
  return null
}

const shortenAddress = a => a.slice(0, 6) + '...' + a.slice(-4)

async function fetchCryptoPrices() {
  try {
    const cached = localStorage.getItem('crypto_prices_cache')
    if (cached) {
      const { data, ts } = JSON.parse(cached)
      if (Date.now() - ts < 5 * 60 * 1000) return data
    }
    const data = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin,solana&vs_currencies=usd').then(r => r.json())
    localStorage.setItem('crypto_prices_cache', JSON.stringify({ data, ts: Date.now() }))
    return data
  } catch { return {} }
}

async function fetchWalletBalance(chain, address) {
  const prices = await fetchCryptoPrices()
  if (chain === 'ethereum') {
    const data = await fetch(`https://api.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest&apikey=YourApiKeyToken`).then(r => r.json())
    const eth = parseInt(data.result) / 1e18
    return { balance: eth, symbol: 'ETH', usd: eth * (prices.ethereum?.usd || 0) }
  }
  if (chain === 'bitcoin') {
    const data = await fetch(`https://blockchain.info/rawaddr/${address}?cors=true`).then(r => r.json())
    const btc = data.final_balance / 1e8
    return { balance: btc, symbol: 'BTC', usd: btc * (prices.bitcoin?.usd || 0) }
  }
  if (chain === 'solana') {
    const data = await fetch('https://api.mainnet-beta.solana.com', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getBalance', params: [address] })
    }).then(r => r.json())
    const sol = (data.result?.value || 0) / 1e9
    return { balance: sol, symbol: 'SOL', usd: sol * (prices.solana?.usd || 0) }
  }
}

function WalletRow({ wallet, onRemove, onRefresh }) {
  const color = CHAIN_COLORS[wallet.chain]
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '14px 24px', borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, background: color + '22', border: '1px solid ' + color + '55', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, marginRight: 14 }}>
        {CHAIN_ICONS[wallet.chain]}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-body)' }}>{shortenAddress(wallet.address)}</p>
        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: color + '22', color, border: '1px solid ' + color + '44', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
          {CHAIN_LABELS[wallet.chain]}
        </span>
      </div>
      <div style={{ textAlign: 'right', marginRight: 16 }}>
        {wallet.loading ? (
          <p style={{ fontSize: 13, color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>Loading...</p>
        ) : wallet.error ? (
          <p style={{ fontSize: 12, color: 'var(--red)', fontFamily: 'var(--font-body)' }}>Failed to fetch</p>
        ) : (
          <>
            <p style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-display)' }}>${(wallet.usd || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
            <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>{(wallet.balance || 0).toFixed(4)} {wallet.symbol}</p>
          </>
        )}
      </div>
      {[
        { icon: '↻', title: 'Refresh', fn: () => onRefresh(wallet.address), hover: { borderColor: 'var(--blue)', color: 'var(--blue)' } },
        { icon: '×', title: 'Remove', fn: () => onRemove(wallet.address), hover: { background: 'var(--red-dim)', borderColor: 'var(--red)', color: 'var(--red)' } },
      ].map(btn => (
        <button key={btn.title} onClick={btn.fn} title={btn.title} style={{ width: 28, height: 28, borderRadius: 8, marginLeft: 6, background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
          onMouseEnter={e => Object.assign(e.currentTarget.style, btn.hover)}
          onMouseLeave={e => Object.assign(e.currentTarget.style, { background: 'transparent', borderColor: 'var(--border)', color: 'var(--muted)' })}
        >{btn.icon}</button>
      ))}
    </div>
  )
}

function EditValueModal({ asset, onSave, onClose }) {
  const [value, setValue] = useState(String(asset.value))
  const save = () => { const v = parseFloat(value); if (!isNaN(v) && v >= 0) { onSave(asset.id, v); onClose() } }
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg2)', borderRadius: 20, padding: '28px', border: '1px solid var(--border2)', width: '100%', maxWidth: 380 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <p style={{ fontWeight: 600, fontSize: 16, fontFamily: 'var(--font-display)', letterSpacing: 0.3 }}>Update value</p>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2, fontFamily: 'var(--font-body)' }}>{asset.name}</p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border2)', color: 'var(--text)', fontSize: 18, cursor: 'pointer', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>
        <input type="number" value={value} onChange={e => setValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && save()} autoFocus
          style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border2)', background: 'var(--bg3)', color: 'var(--text)', fontSize: 20, outline: 'none', fontFamily: 'var(--font-display)', marginBottom: 16, fontWeight: 600 }}
        />
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', color: 'var(--text)', border: '1px solid var(--border2)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 14 }}>Cancel</button>
          <button onClick={save} style={{ flex: 2, padding: '10px', borderRadius: 10, background: 'linear-gradient(135deg, var(--green), var(--teal))', color: '#0a0a0f', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700 }}>Save</button>
        </div>
      </div>
    </div>
  )
}

export default function Assets({ assets, setAssets, isPro, currency = 'USD', user }) {
  const [filter, setFilter] = useState('All')
  const [editingAsset, setEditingAsset] = useState(null)
  const [exportOpen, setExportOpen] = useState(false)
  const [wallets, setWallets] = useState(() => { try { return JSON.parse(localStorage.getItem('wealthview_wallets') || '[]') } catch { return [] } })
  const [showAddWallet, setShowAddWallet] = useState(false)
  const [walletAddress, setWalletAddress] = useState('')
  const [walletError, setWalletError] = useState('')
  const [walletLoading, setWalletLoading] = useState(false)
  const exportRef = useRef(null)

  const total = assets.reduce((s, a) => s + (a.value || 0), 0)
  const walletTotal = wallets.reduce((s, w) => s + (w.usd || 0), 0)
  const filtered = filter === 'All' ? assets : assets.filter(a => a.category === filter)

  // Detect chain live as user types
  const detectedChain = detectChain(walletAddress.trim())

  useEffect(() => {
    localStorage.setItem('wealthview_wallets', JSON.stringify(wallets))
  }, [wallets])

  async function loadBalance(chain, address) {
    setWallets(p => p.map(w => w.address === address ? { ...w, loading: true, error: false } : w))
    try {
      const result = await fetchWalletBalance(chain, address)
      setWallets(p => p.map(w => w.address === address ? { ...w, ...result, loading: false, updatedAt: Date.now() } : w))
    } catch {
      setWallets(p => p.map(w => w.address === address ? { ...w, loading: false, error: true } : w))
    }
  }

  async function handleAddWallet() {
    setWalletError('')
    const addr = walletAddress.trim()
    const chain = detectChain(addr)
    if (!chain) { setWalletError('Unrecognized wallet address — please check and try again'); return }
    if (wallets.find(w => w.address === addr)) { setWalletError('Wallet already linked'); return }
    setWalletLoading(true)
    setWallets(p => [...p, { chain, address: addr, loading: true, usd: 0 }])
    setShowAddWallet(false)
    setWalletAddress('')
    setWalletLoading(false)
    loadBalance(chain, addr)
  }

  function removeAsset(id) { setAssets(assets.filter(a => a.id !== id)) }
  function updateAssetValue(id, v) { setAssets(assets.map(a => a.id === id ? { ...a, value: v } : a)) }
  function removeWallet(address) { setWallets(p => p.filter(w => w.address !== address)) }

  function exportCSV() {
    const rows = [['Name','Category','Ticker','Value (USD)'], ...assets.map(a => [a.name, a.category, a.ticker||'', a.value||0])]
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = 'wealthview-assets.csv'; a.click()
    setExportOpen(false)
  }

  function exportPDF() {
    const doc = new jsPDF()
    doc.setFontSize(20); doc.setTextColor(0, 217, 139)
    doc.text('WealthView — Portfolio Summary', 14, 20)
    doc.setFontSize(10); doc.setTextColor(120, 120, 140)
    doc.text(`${user?.email || ''} · ${new Date().toLocaleDateString()}`, 14, 28)
    doc.setFontSize(14); doc.setTextColor(0, 0, 0)
    doc.text(`Total Net Worth: ${formatAmount(total, currency)}`, 14, 40)
    autoTable(doc, {
      startY: 48,
      head: [['Asset','Category','Ticker','Value']],
      body: assets.map(a => [a.name, a.category, a.ticker||'—', formatAmount(a.value||0, currency)]),
      headStyles: { fillColor: [0,40,30], textColor: [0,217,139] },
      alternateRowStyles: { fillColor: [245,245,250] },
    })
    doc.save('wealthview-portfolio.pdf')
    setExportOpen(false)
  }

  const btnStyle = (active) => ({
    padding: '5px 16px', borderRadius: 20, fontSize: 12,
    fontWeight: active ? 500 : 400,
    background: active ? 'var(--text)' : 'transparent',
    color: active ? 'var(--bg)' : 'var(--muted)',
    border: '1px solid ' + (active ? 'var(--text)' : 'var(--border)'),
    cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap',
  })

  return (
    <div style={{ maxWidth: 1600 }}>

      {editingAsset && <EditValueModal asset={editingAsset} onSave={updateAssetValue} onClose={() => setEditingAsset(null)} />}

      {/* Header */}
      <div className="fade-up" style={{ marginBottom: 36, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 600, lineHeight: 1.1, fontFamily: 'var(--font-display)', letterSpacing: 0.3 }}>Assets</h1>
          <p style={{ fontSize: 14, color: 'var(--muted2)', marginTop: 8, fontFamily: 'var(--font-body)', fontWeight: 300 }}>
            {assets.length} {assets.length === 1 ? 'asset' : 'assets'} tracked
          </p>
        </div>
        <div style={{ position: 'relative' }} ref={exportRef}>
          <button onClick={() => { if (!isPro) { alert('Export is a Pro feature.'); return } setExportOpen(o => !o) }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg2)', color: 'var(--text)', padding: '8px 16px', borderRadius: 8, marginTop: 8, fontSize: 12, fontWeight: 500, border: '1px solid var(--border2)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--bg2)'}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 2v9M5 8l3 3 3-3M3 13h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Export {!isPro && <span style={{ fontSize: 10, color: 'var(--green)', marginLeft: 2 }}>Pro</span>}
          </button>
          {exportOpen && (
            <div style={{ position: 'absolute', right: 0, top: '110%', zIndex: 30, background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 10, overflow: 'hidden', minWidth: 160, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
              {[{ label: 'Export as CSV', fn: exportCSV, icon: '📄' }, { label: 'Export as PDF', fn: exportPDF, icon: '📑' }].map(opt => (
                <button key={opt.label} onClick={opt.fn} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '11px 16px', background: 'transparent', border: 'none', color: 'var(--text)', fontSize: 13, fontFamily: 'var(--font-body)', cursor: 'pointer', textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                ><span>{opt.icon}</span> {opt.label}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Category cards */}
      <div className="summary-grid fade-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 24, animationDelay: '80ms' }}>
        {CATEGORIES.map(cat => {
          const catTotal = assets.filter(a => a.category === cat).reduce((s, a) => s + (a.value || 0), 0)
          const pct = total > 0 ? (catTotal / total * 100).toFixed(0) : 0
          const active = filter === cat
          return (
            <div key={cat} onClick={() => setFilter(active ? 'All' : cat)} style={{ background: active ? CATEGORY_COLORS[cat] + '15' : 'var(--bg2)', borderRadius: 14, padding: '16px', border: active ? '1px solid ' + CATEGORY_COLORS[cat] + '50' : '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = 'var(--border2)' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = 'var(--border)' }}
            >
              <div style={{ fontSize: 20, marginBottom: 8 }}>{CATEGORY_ICONS[cat]}</div>
              <p style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 6, fontFamily: 'var(--font-body)', letterSpacing: 1, textTransform: 'uppercase' }}>{cat}</p>
              <p style={{ fontSize: 16, fontWeight: 600, fontFamily: 'var(--font-display)', letterSpacing: 0.3 }}>{catTotal > 0 ? formatAmount(catTotal, currency) : '—'}</p>
              <p style={{ fontSize: 11, color: CATEGORY_COLORS[cat], marginTop: 4, fontWeight: 500, fontFamily: 'var(--font-body)' }}>{pct}% of portfolio</p>
            </div>
          )
        })}
      </div>

      {/* Filter pills */}
      <div className="filter-pills" style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {['All', ...CATEGORIES].map(cat => (
          <button key={cat} onClick={() => setFilter(cat)} style={btnStyle(filter === cat)}>{cat}</button>
        ))}
      </div>

      {/* Asset table */}
      <div className="fade-up" style={{ background: 'var(--bg2)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', animationDelay: '200ms' }}>
        <div className="asset-table-header" style={{ display: 'grid', gridTemplateColumns: '1fr 130px 150px 100px 90px', padding: '12px 24px', borderBottom: '1px solid var(--border)', fontSize: 10, color: 'var(--muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 1.5, fontFamily: 'var(--font-body)' }}>
          <span>Asset</span><span>Category</span>
          <span style={{ textAlign: 'right' }}>Value</span>
          <span style={{ textAlign: 'right' }}>Share</span>
          <span style={{ textAlign: 'center' }}>Actions</span>
        </div>

        {filtered.length === 0 && (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--muted)' }}>
            <p style={{ fontSize: 15, fontFamily: 'var(--font-display)', letterSpacing: 0.3 }}>{filter === 'All' ? 'No assets yet.' : `No ${filter} assets.`}</p>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6, fontFamily: 'var(--font-body)' }}>Use the + Add asset button in the top bar to get started.</p>
          </div>
        )}

        {filtered.map((asset, i) => {
          const pct = total > 0 ? (asset.value / total * 100) : 0
          return (
            <div key={asset.id} className="asset-table-row" style={{ display: 'grid', gridTemplateColumns: '1fr 130px 150px 100px 90px', alignItems: 'center', padding: '16px 24px', borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <AssetLogo ticker={asset.ticker} category={asset.category} size={38} />
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500, fontFamily: 'var(--font-body)' }}>{asset.name}</p>
                  {asset.ticker && <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2, fontFamily: 'var(--font-body)' }}>{asset.category === 'Stocks' ? asset.ticker.toUpperCase() : asset.ticker}</p>}
                </div>
              </div>

              <span className="category-badge" style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: CATEGORY_COLORS[asset.category] + '18', color: CATEGORY_COLORS[asset.category], border: '1px solid ' + CATEGORY_COLORS[asset.category] + '35', fontWeight: 500, width: 'fit-content', fontFamily: 'var(--font-body)' }}>
                {asset.category}
              </span>

              <p className="asset-value" style={{ fontSize: 15, fontWeight: 600, textAlign: 'right', fontFamily: 'var(--font-display)', letterSpacing: 0.3 }}>
                {formatAmount(asset.value, currency)}
              </p>

              <div className="share-bar" style={{ paddingLeft: 10 }}>
                <p style={{ fontSize: 12, color: 'var(--muted2)', marginBottom: 4, textAlign: 'right', fontFamily: 'var(--font-body)' }}>{pct.toFixed(1)}%</p>
                <div style={{ height: 4, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 2, width: pct + '%', background: CATEGORY_COLORS[asset.category], transition: 'width 1s ease' }} />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {[
                  { icon: '✎', title: 'Edit', fn: () => setEditingAsset(asset), hover: { background: 'rgba(77,159,255,0.1)', borderColor: 'var(--blue)', color: 'var(--blue)' } },
                  { icon: '×', title: 'Delete', fn: () => removeAsset(asset.id), hover: { background: 'var(--red-dim)', borderColor: 'var(--red)', color: 'var(--red)' } },
                ].map(btn => (
                  <button key={btn.title} onClick={btn.fn} title={btn.title} style={{ width: 30, height: 30, borderRadius: 8, background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', fontSize: btn.icon === '×' ? 16 : 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                    onMouseEnter={e => Object.assign(e.currentTarget.style, btn.hover)}
                    onMouseLeave={e => Object.assign(e.currentTarget.style, { background: 'transparent', borderColor: 'var(--border)', color: 'var(--muted)' })}
                  >{btn.icon}</button>
                ))}
              </div>
            </div>
          )
        })}

        {filtered.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px 150px 100px 90px', padding: '16px 24px', borderTop: '1px solid var(--border2)', background: 'var(--bg3)' }}>
            <p style={{ fontSize: 13, color: 'var(--muted2)', fontFamily: 'var(--font-body)', fontWeight: 400, letterSpacing: 0.5 }}>{filter === 'All' ? 'Total' : filter + ' total'}</p>
            <span /><p style={{ fontSize: 17, fontWeight: 600, textAlign: 'right', fontFamily: 'var(--font-display)', color: 'var(--green)', letterSpacing: 0.3 }}>{formatAmount(filtered.reduce((s, a) => s + (a.value || 0), 0), currency)}</p>
            <span /><span />
          </div>
        )}
      </div>

      {/* Linked Wallets */}
      <div className="fade-up" style={{ marginTop: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, fontFamily: 'var(--font-display)', letterSpacing: 0.3 }}>Linked wallets</h2>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, fontFamily: 'var(--font-body)' }}>Paste any wallet address — chain is detected automatically</p>
          </div>
          <button onClick={() => setShowAddWallet(o => !o)} style={{ background: 'linear-gradient(135deg, var(--green), var(--teal))', color: '#0a0a0f', padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-display)', letterSpacing: 0.3 }}>
            {showAddWallet ? '✕ Cancel' : '+ Link wallet'}
          </button>
        </div>

        {showAddWallet && (
          <div style={{ background: 'var(--bg2)', borderRadius: 14, padding: '20px', border: '1px solid var(--border2)', marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  placeholder="Paste any wallet address — ETH, BTC or SOL"
                  value={walletAddress}
                  onChange={e => { setWalletAddress(e.target.value); setWalletError('') }}
                  onKeyDown={e => e.key === 'Enter' && handleAddWallet()}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: walletError ? '1px solid var(--red)' : '1px solid var(--border2)', background: 'var(--bg3)', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'var(--font-body)' }}
                />
                {/* Live chain detection badge */}
                {detectedChain && (
                  <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, padding: '2px 8px', borderRadius: 10, background: CHAIN_COLORS[detectedChain] + '22', color: CHAIN_COLORS[detectedChain], border: '1px solid ' + CHAIN_COLORS[detectedChain] + '44', fontFamily: 'var(--font-body)', fontWeight: 600, pointerEvents: 'none' }}>
                    {CHAIN_ICONS[detectedChain]} {CHAIN_LABELS[detectedChain]}
                  </span>
                )}
              </div>
              <button onClick={handleAddWallet} disabled={walletLoading} style={{ background: 'linear-gradient(135deg, var(--green), var(--teal))', color: '#0a0a0f', padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-display)', opacity: walletLoading ? 0.7 : 1 }}>
                {walletLoading ? 'Linking...' : 'Link'}
              </button>
            </div>
            {walletError && <p style={{ fontSize: 12, color: 'var(--red)', marginTop: 8, fontFamily: 'var(--font-body)' }}>{walletError}</p>}
            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8, fontFamily: 'var(--font-body)' }}>
              Supports: Ethereum (0x...) · Bitcoin (1..., 3..., bc1...) · Solana (base58)
            </p>
          </div>
        )}

        {wallets.length === 0 ? (
          <div style={{ background: 'var(--bg2)', borderRadius: 14, padding: '40px', border: '1px solid var(--border)', textAlign: 'center' }}>
            <p style={{ fontSize: 24, marginBottom: 10 }}>🔗</p>
            <p style={{ fontSize: 14, color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>No wallets linked yet — paste any public wallet address above</p>
          </div>
        ) : (
          <div style={{ background: 'var(--bg2)', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden' }}>
            {wallets.map(wallet => (
              <WalletRow key={wallet.address} wallet={wallet} onRemove={removeWallet}
                onRefresh={addr => { const w = wallets.find(x => x.address === addr); if (w) loadBalance(w.chain, addr) }}
              />
            ))}
            <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border2)', background: 'var(--bg3)', display: 'flex', justifyContent: 'space-between' }}>
              <p style={{ fontSize: 13, color: 'var(--muted2)', fontFamily: 'var(--font-body)' }}>Wallet total</p>
              <p style={{ fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--green)' }}>${walletTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}