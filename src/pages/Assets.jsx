import { useState, useRef, useEffect } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatAmount } from './Dashboard'
import AssetLogo from '../components/AssetLogo'

const CATEGORY_COLORS = {
  Stocks: '#4d9fff', Crypto: '#ffb340', NFTs: '#06b6d4', 'Real Estate': '#00d98b',
  Retirement: '#a78bfa', Cash: '#6b6b80', Others: '#9b8ea8',
}
const CATEGORIES = Object.keys(CATEGORY_COLORS)
const CATEGORY_ICONS = {
  Stocks: '📈', Crypto: '₿', NFTs: '🖼️', 'Real Estate': '🏠', Retirement: '🏦', Cash: '💵', Others: '📦',
}
const CHAIN_COLORS = { ethereum: '#627EEA', polygon: '#8247E5', bitcoin: '#F7931A', solana: '#9945FF' }
const CHAIN_LABELS = { ethereum: 'Ethereum', polygon: 'Polygon', bitcoin: 'Bitcoin', solana: 'Solana' }
const CHAIN_ICONS  = { ethereum: '⟠', polygon: '⬡', bitcoin: '₿', solana: '◎' }
const EVM_CHAINS   = ['ethereum', 'polygon']

// Auto-detect chain from address format
// 0x addresses could be ETH or Polygon — returns 'evm' for the toggle UI
function detectAddressType(address) {
  if (/^0x[a-fA-F0-9]{40}$/.test(address)) return 'evm'
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
      if (Date.now() - ts < 60 * 1000) return data
    }
    const data = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin,solana,matic-network&vs_currencies=usd').then(r => r.json())
    localStorage.setItem('crypto_prices_cache', JSON.stringify({ data, ts: Date.now() }))
    return data
  } catch { return {} }
}

async function fetchNativeBalance(chain, address) {
  const prices = await fetchCryptoPrices()
  if (chain === 'ethereum') {
    // Use public Cloudflare gateway (no key required)
    const data = await fetch('https://cloudflare-eth.com', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_getBalance', params: [address, 'latest'] })
    }).then(r => r.json())
    const eth = parseInt(data.result, 16) / 1e18
    return { balance: eth, symbol: 'ETH', usd: eth * (prices.ethereum?.usd || 0) }
  }
  if (chain === 'polygon') {
    const data = await fetch('https://polygon-rpc.com', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_getBalance', params: [address, 'latest'] })
    }).then(r => r.json())
    const matic = parseInt(data.result, 16) / 1e18
    return { balance: matic, symbol: 'MATIC', usd: matic * (prices['matic-network']?.usd || 0) }
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
  return { balance: 0, symbol: '?', usd: 0 }
}

async function fetchERC20Tokens(chain, address, alchemyKey) {
  if (!alchemyKey) return []
  const network = chain === 'polygon' ? 'polygon-mainnet' : 'eth-mainnet'
  const url = `https://${network}.g.alchemy.com/v2/${alchemyKey}`
  try {
    const balRes = await fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'alchemy_getTokenBalances', params: [address, 'erc20'] })
    }).then(r => r.json())

    const ZERO = '0x0000000000000000000000000000000000000000000000000000000000000000'
    const nonZero = (balRes.result?.tokenBalances || []).filter(t => t.tokenBalance !== ZERO).slice(0, 20)
    if (!nonZero.length) return []

    const metas = await Promise.allSettled(nonZero.map(t =>
      fetch(url, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'alchemy_getTokenMetadata', params: [t.contractAddress] })
      }).then(r => r.json())
    ))

    const prices = await fetchCryptoPrices()
    const results = []
    for (let i = 0; i < nonZero.length; i++) {
      const meta = metas[i].status === 'fulfilled' ? metas[i].value.result : null
      if (!meta?.decimals || !meta?.symbol) continue
      const balance = parseInt(nonZero[i].tokenBalance, 16) / (10 ** meta.decimals)
      if (balance < 0.0001) continue
      results.push({ symbol: meta.symbol, name: meta.name || meta.symbol, balance, logo: meta.logo, contractAddress: nonZero[i].contractAddress })
    }
    return results
  } catch { return [] }
}

async function fetchWalletNFTs(chain, address, alchemyKey) {
  if (!alchemyKey || !EVM_CHAINS.includes(chain)) return []
  const network = chain === 'polygon' ? 'polygon-mainnet' : 'eth-mainnet'
  try {
    const data = await fetch(
      `https://${network}.g.alchemy.com/nft/v3/${alchemyKey}/getNFTsForOwner?owner=${address}&withMetadata=true&pageSize=20`
    ).then(r => r.json())
    return (data.ownedNfts || []).map(nft => ({
      tokenId: nft.tokenId,
      name: nft.name || `#${nft.tokenId}`,
      collection: nft.collection?.name || nft.contract?.name || 'Unknown Collection',
      image: nft.image?.thumbnailUrl || nft.image?.originalUrl,
      contractAddress: nft.contract?.address,
      chain,
      walletAddress: address,
    }))
  } catch { return [] }
}

async function fetchSolanaNFTs(address, heliusKey) {
  if (!heliusKey) return []
  try {
    const res = await fetch(`https://mainnet.helius-rpc.com/?api-key=${heliusKey}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0', id: 1, method: 'getAssetsByOwner',
        params: { ownerAddress: address, page: 1, limit: 20, displayOptions: { showFungible: false } }
      })
    }).then(r => r.json())
    return (res.result?.items || []).map(item => ({
      tokenId: item.id,
      name: item.content?.metadata?.name || item.id.slice(0, 8),
      collection: item.grouping?.find(g => g.group_key === 'collection')?.group_value || 'Solana NFT',
      image: item.content?.links?.image,
      contractAddress: item.id,
      chain: 'solana',
      walletAddress: address,
    }))
  } catch { return [] }
}

function WalletRow({ wallet, onRemove, onRefresh }) {
  const [expanded, setExpanded] = useState(false)
  const color = CHAIN_COLORS[wallet.chain]
  const tokens = wallet.tokens || []
  const tokenUsd = tokens.reduce((s, t) => s + (t.usd || 0), 0)
  const totalUsd = (wallet.usd || 0) + tokenUsd

  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 24px', transition: 'background 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, background: color + '22', border: '1px solid ' + color + '55', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, marginRight: 14 }}>
          {CHAIN_ICONS[wallet.chain]}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-body)' }}>{shortenAddress(wallet.address)}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: color + '22', color, border: '1px solid ' + color + '44', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
              {CHAIN_ICONS[wallet.chain]} {CHAIN_LABELS[wallet.chain]}
            </span>
            {tokens.length > 0 && (
              <button onClick={() => setExpanded(e => !e)} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: 'var(--bg3)', color: 'var(--muted2)', border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                {tokens.length} token{tokens.length !== 1 ? 's' : ''} {expanded ? '▲' : '▼'}
              </button>
            )}
          </div>
        </div>
        <div style={{ textAlign: 'right', marginRight: 16 }}>
          {wallet.loading ? (
            <p style={{ fontSize: 13, color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>Loading…</p>
          ) : wallet.error ? (
            <p style={{ fontSize: 12, color: 'var(--red)', fontFamily: 'var(--font-body)' }}>Failed to fetch</p>
          ) : (
            <>
              <p style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-display)' }}>
                ${totalUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
              <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>
                {(wallet.balance || 0).toFixed(4)} {wallet.symbol}
                {tokens.length > 0 && <span style={{ color: 'var(--muted2)' }}> + {tokens.length} tokens</span>}
              </p>
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

      {/* ERC-20 token breakdown */}
      {expanded && tokens.length > 0 && (
        <div style={{ background: 'var(--bg3)', borderTop: '1px solid var(--border)', padding: '8px 24px 8px 74px' }}>
          {tokens.map((t, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < tokens.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {t.logo
                  ? <img src={t.logo} style={{ width: 20, height: 20, borderRadius: '50%' }} onError={e => { e.target.style.display = 'none' }} alt="" />
                  : <div style={{ width: 20, height: 20, borderRadius: '50%', background: color + '33', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color }}>{t.symbol.slice(0, 2)}</div>
                }
                <div>
                  <p style={{ fontSize: 12, fontWeight: 500, fontFamily: 'var(--font-body)' }}>{t.symbol}</p>
                  <p style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>{t.name}</p>
                </div>
              </div>
              <p style={{ fontSize: 12, fontFamily: 'var(--font-body)', color: 'var(--muted2)' }}>
                {t.balance < 0.001 ? t.balance.toFixed(6) : t.balance.toFixed(4)} {t.symbol}
              </p>
            </div>
          ))}
        </div>
      )}
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
  const [nfts, setNfts] = useState(() => { try { return JSON.parse(localStorage.getItem('wv_nfts') || '[]') } catch { return [] } })
  const [showAddWallet, setShowAddWallet] = useState(false)
  const [walletAddress, setWalletAddress] = useState('')
  const [evmChain, setEvmChain] = useState('ethereum')  // toggle for 0x addresses
  const [walletError, setWalletError] = useState('')
  const [walletLoading, setWalletLoading] = useState(false)
  const [alchemyKey, setAlchemyKey] = useState(() => localStorage.getItem('wv_alchemy_key') || '')
  const [heliusKey, setHeliusKey]   = useState(() => localStorage.getItem('wv_helius_key')  || '')
  const [showApiKeys, setShowApiKeys] = useState(false)
  const exportRef = useRef(null)

  const total = assets.reduce((s, a) => s + (a.value || 0), 0)
  const walletTotal = wallets.reduce((s, w) => s + (w.usd || 0) + (w.tokens || []).reduce((t, tok) => t + (tok.usd || 0), 0), 0)
  const filtered = filter === 'All' ? assets : assets.filter(a => a.category === filter)

  // Detect address type live as user types
  const detectedType = detectAddressType(walletAddress.trim())

  useEffect(() => {
    localStorage.setItem('wealthview_wallets', JSON.stringify(wallets))
  }, [wallets])

  useEffect(() => {
    localStorage.setItem('wv_nfts', JSON.stringify(nfts))
  }, [nfts])

  async function loadWalletData(chain, address) {
    const key = address + ':' + chain
    setWallets(p => p.map(w => w.key === key ? { ...w, loading: true, error: false } : w))
    try {
      const nativeResult = await fetchNativeBalance(chain, address)
      setWallets(p => p.map(w => w.key === key ? { ...w, ...nativeResult, loading: false, updatedAt: Date.now() } : w))

      // ERC-20 tokens (Alchemy)
      if (EVM_CHAINS.includes(chain) && alchemyKey) {
        const tokens = await fetchERC20Tokens(chain, address, alchemyKey)
        setWallets(p => p.map(w => w.key === key ? { ...w, tokens } : w))
      }

      // NFTs
      if (EVM_CHAINS.includes(chain) && alchemyKey) {
        const walletNfts = await fetchWalletNFTs(chain, address, alchemyKey)
        setNfts(prev => {
          const filtered = prev.filter(n => !(n.walletAddress === address && n.chain === chain))
          return [...filtered, ...walletNfts]
        })
      }
      if (chain === 'solana' && heliusKey) {
        const solNfts = await fetchSolanaNFTs(address, heliusKey)
        setNfts(prev => {
          const filtered = prev.filter(n => !(n.walletAddress === address && n.chain === 'solana'))
          return [...filtered, ...solNfts]
        })
      }
    } catch {
      setWallets(p => p.map(w => w.key === key ? { ...w, loading: false, error: true } : w))
    }
  }

  async function handleAddWallet() {
    setWalletError('')
    const addr = walletAddress.trim()
    const addrType = detectAddressType(addr)
    if (!addrType) { setWalletError('Unrecognized address — paste a valid ETH/Polygon (0x…), Bitcoin or Solana address'); return }

    const chain = addrType === 'evm' ? evmChain : addrType
    const key = addr + ':' + chain

    if (wallets.find(w => w.key === key)) { setWalletError('This wallet is already linked on ' + CHAIN_LABELS[chain]); return }
    setWalletLoading(true)
    setWallets(p => [...p, { key, chain, address: addr, loading: true, usd: 0, tokens: [] }])
    setShowAddWallet(false)
    setWalletAddress('')
    setWalletLoading(false)
    loadWalletData(chain, addr)
  }

  function removeAsset(id) { setAssets(assets.filter(a => a.id !== id)) }
  function updateAssetValue(id, v) { setAssets(assets.map(a => a.id === id ? { ...a, value: v } : a)) }
  function removeWallet(address) {
    setWallets(p => p.filter(w => w.address !== address))
    setNfts(prev => prev.filter(n => n.walletAddress !== address))
  }
  function saveApiKeys() {
    localStorage.setItem('wv_alchemy_key', alchemyKey)
    localStorage.setItem('wv_helius_key', heliusKey)
    setShowApiKeys(false)
  }

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
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, fontFamily: 'var(--font-body)' }}>
              ETH · Polygon · Bitcoin · Solana — native + ERC-20 tokens + NFTs
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowApiKeys(o => !o)} style={{ background: 'var(--bg2)', color: 'var(--muted2)', padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, border: '1px solid var(--border2)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
              🔑 API Keys {alchemyKey || heliusKey ? '✓' : ''}
            </button>
            <button onClick={() => setShowAddWallet(o => !o)} style={{ background: 'linear-gradient(135deg, var(--green), var(--teal))', color: '#0a0a0f', padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-display)', letterSpacing: 0.3 }}>
              {showAddWallet ? '✕ Cancel' : '+ Link wallet'}
            </button>
          </div>
        </div>

        {/* API Keys panel */}
        {showApiKeys && (
          <div style={{ background: 'var(--bg2)', borderRadius: 14, padding: '20px', border: '1px solid var(--border2)', marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-display)', marginBottom: 4 }}>API Keys <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 400 }}>(stored locally only — never sent to any server)</span></p>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 14, fontFamily: 'var(--font-body)', lineHeight: 1.5 }}>
              Without keys: native balances only (ETH, MATIC, BTC, SOL). Add keys to unlock ERC-20 tokens + NFTs.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Alchemy API Key', placeholder: 'Unlocks ERC-20 tokens + NFTs on ETH/Polygon (free at alchemy.com)', val: alchemyKey, set: setAlchemyKey, lsKey: 'wv_alchemy_key' },
                { label: 'Helius API Key', placeholder: 'Unlocks Solana NFTs (free at helius.dev)', val: heliusKey, set: setHeliusKey, lsKey: 'wv_helius_key' },
              ].map(field => (
                <div key={field.label}>
                  <p style={{ fontSize: 11, color: 'var(--muted2)', marginBottom: 5, fontFamily: 'var(--font-body)', fontWeight: 500 }}>{field.label}</p>
                  <input type="password" value={field.val} onChange={e => field.set(e.target.value)} placeholder={field.placeholder}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border2)', background: 'var(--bg3)', color: 'var(--text)', fontSize: 12, outline: 'none', fontFamily: 'monospace' }}
                  />
                </div>
              ))}
              <button onClick={saveApiKeys} style={{ alignSelf: 'flex-start', padding: '8px 20px', borderRadius: 8, background: 'linear-gradient(135deg, var(--green), var(--teal))', color: '#0a0a0f', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-display)' }}>
                Save keys
              </button>
            </div>
          </div>
        )}

        {showAddWallet && (
          <div style={{ background: 'var(--bg2)', borderRadius: 14, padding: '20px', border: '1px solid var(--border2)', marginBottom: 16 }}>
            <input
              placeholder="Paste any wallet address — ETH/Polygon (0x…), Bitcoin or Solana"
              value={walletAddress}
              onChange={e => { setWalletAddress(e.target.value); setWalletError('') }}
              onKeyDown={e => e.key === 'Enter' && handleAddWallet()}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: walletError ? '1px solid var(--red)' : '1px solid var(--border2)', background: 'var(--bg3)', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'var(--font-body)', marginBottom: 10 }}
            />

            {/* Chain picker for EVM addresses */}
            {detectedType === 'evm' && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <p style={{ fontSize: 12, color: 'var(--muted2)', fontFamily: 'var(--font-body)', alignSelf: 'center', marginRight: 4 }}>Network:</p>
                {['ethereum', 'polygon'].map(c => (
                  <button key={c} onClick={() => setEvmChain(c)} style={{
                    padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: evmChain === c ? 600 : 400,
                    background: evmChain === c ? CHAIN_COLORS[c] + '22' : 'transparent',
                    color: evmChain === c ? CHAIN_COLORS[c] : 'var(--muted)',
                    border: '1px solid ' + (evmChain === c ? CHAIN_COLORS[c] + '66' : 'var(--border)'),
                    cursor: 'pointer', fontFamily: 'var(--font-body)',
                  }}>
                    {CHAIN_ICONS[c]} {CHAIN_LABELS[c]}
                  </button>
                ))}
              </div>
            )}

            {/* Detection badge for BTC/SOL */}
            {detectedType && detectedType !== 'evm' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 10, background: CHAIN_COLORS[detectedType] + '22', color: CHAIN_COLORS[detectedType], border: '1px solid ' + CHAIN_COLORS[detectedType] + '44', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
                  {CHAIN_ICONS[detectedType]} {CHAIN_LABELS[detectedType]} detected
                </span>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleAddWallet} disabled={walletLoading || !detectedType} style={{ background: detectedType ? 'linear-gradient(135deg, var(--green), var(--teal))' : 'var(--bg3)', color: detectedType ? '#0a0a0f' : 'var(--muted)', padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, border: 'none', cursor: detectedType ? 'pointer' : 'not-allowed', fontFamily: 'var(--font-display)', opacity: walletLoading ? 0.7 : 1 }}>
                {walletLoading ? 'Linking…' : detectedType === 'evm' ? `Link on ${CHAIN_LABELS[evmChain]}` : 'Link wallet'}
              </button>
            </div>
            {walletError && <p style={{ fontSize: 12, color: 'var(--red)', marginTop: 8, fontFamily: 'var(--font-body)' }}>{walletError}</p>}
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
              <WalletRow key={wallet.key || wallet.address} wallet={wallet} onRemove={removeWallet}
                onRefresh={addr => { const w = wallets.find(x => x.address === addr); if (w) loadWalletData(w.chain, addr) }}
              />
            ))}
            <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border2)', background: 'var(--bg3)', display: 'flex', justifyContent: 'space-between' }}>
              <p style={{ fontSize: 13, color: 'var(--muted2)', fontFamily: 'var(--font-body)' }}>Wallet total</p>
              <p style={{ fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--green)' }}>${walletTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
            </div>
          </div>
        )}
      </div>

      {/* NFT Gallery */}
      {nfts.length > 0 && (
        <div className="fade-up" style={{ marginTop: 32 }}>
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, fontFamily: 'var(--font-display)', letterSpacing: 0.3 }}>NFTs</h2>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, fontFamily: 'var(--font-body)' }}>{nfts.length} NFT{nfts.length !== 1 ? 's' : ''} across your wallets</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            {nfts.map((nft, i) => {
              const color = CHAIN_COLORS[nft.chain] || '#888'
              return (
                <div key={i} style={{ background: 'var(--bg2)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden', transition: 'border-color 0.15s, transform 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  <div style={{ aspectRatio: '1', background: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {nft.image
                      ? <img src={nft.image} alt={nft.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none' }} />
                      : <span style={{ fontSize: 32 }}>🖼️</span>
                    }
                  </div>
                  <div style={{ padding: '10px 12px' }}>
                    <p style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nft.name}</p>
                    <p style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-body)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nft.collection}</p>
                    <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 10, background: color + '22', color, border: '1px solid ' + color + '44', fontFamily: 'var(--font-body)', fontWeight: 600, display: 'inline-block', marginTop: 6 }}>
                      {CHAIN_ICONS[nft.chain]} {CHAIN_LABELS[nft.chain]}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}