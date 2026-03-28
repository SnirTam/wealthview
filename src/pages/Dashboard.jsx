import { useEffect, useState, useCallback, useRef } from 'react'
import { useFxRates, CURRENCY_META, liveRates } from '../useFxRates'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useStockPrices } from '../useStockPrices'
import { startCheckout } from '../stripe'
import { supabase } from '../supabase'
import AssetLogo from '../components/AssetLogo'
import ShareCard from '../components/ShareCard'

const CATEGORY_COLORS = { Stocks:'#4d9fff', Crypto:'#ffb340', NFTs:'#06b6d4', 'Real Estate':'#00d98b', Retirement:'#a78bfa', Cash:'#6b6b80', Others:'#9b8ea8' }
const CATEGORY_ICONS  = { Stocks:'📈', Crypto:'₿', NFTs:'🖼️', 'Real Estate':'🏠', Retirement:'🏦', Cash:'💵', Others:'📦' }
const CHART_PERIODS = ['1W','1M','3M','6M','1Y','All']
const CHART_PERIOD_DAYS = { '1W':7,'1M':30,'3M':90,'6M':180,'1Y':365,'All':Infinity }
const POPULAR_STOCKS  = [
  {ticker:'AAPL',name:'Apple'},{ticker:'NVDA',name:'NVIDIA'},{ticker:'MSFT',name:'Microsoft'},
  {ticker:'GOOGL',name:'Google'},{ticker:'AMZN',name:'Amazon'},{ticker:'TSLA',name:'Tesla'},
  {ticker:'META',name:'Meta'},{ticker:'JPM',name:'JPMorgan'},{ticker:'V',name:'Visa'},
  {ticker:'SPY',name:'S&P 500 ETF'},{ticker:'QQQ',name:'Nasdaq ETF'},
]
const POPULAR_CRYPTO = [
  {ticker:'bitcoin',name:'Bitcoin'},{ticker:'ethereum',name:'Ethereum'},
  {ticker:'solana',name:'Solana'},{ticker:'ripple',name:'XRP'},
  {ticker:'dogecoin',name:'Dogecoin'},{ticker:'cardano',name:'Cardano'},
]
const CORS = 'https://corsproxy.io/?'

async function searchStocks(query) {
  const url = `${CORS}https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=7&newsCount=0&enableFuzzyQuery=false&lang=en-US`
  const res = await fetch(url)
  const data = await res.json()
  return (data?.quotes || [])
    .filter(q => q.symbol && q.longname || q.shortname)
    .slice(0, 6)
    .map(q => ({ ticker: q.symbol, name: q.longname || q.shortname, type: q.typeDisp || '' }))
}

async function searchCrypto(query) {
  const url = `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`
  const res = await fetch(url)
  const data = await res.json()
  return (data?.coins || [])
    .slice(0, 6)
    .map(c => ({ ticker: c.id, name: c.name, symbol: c.symbol?.toUpperCase(), thumb: c.thumb }))
}
const CATEGORIES = Object.keys(CATEGORY_COLORS)

// Keep CURRENCIES as compat export — now backed by live rates via liveRates module variable
export const CURRENCIES = new Proxy({}, {
  get(_, k) {
    const m = CURRENCY_META[k] || CURRENCY_META.USD
    return { symbol: m.symbol, rate: liveRates[k] || 1, label: k }
  },
  ownKeys() { return Object.keys(CURRENCY_META) },
  has(_, k) { return k in CURRENCY_META },
  getOwnPropertyDescriptor(t, k) { return k in CURRENCY_META ? { configurable: true, enumerable: true, value: t[k] } : undefined },
})
export function formatAmount(usd, currency = 'USD') {
  const symbol = CURRENCY_META[currency]?.symbol || '$'
  const rate = liveRates[currency] || 1
  return symbol + (usd * rate).toLocaleString(undefined, { maximumFractionDigits: 0 })
}

function getFirstName(user) {
  const m=user?.user_metadata
  if(m?.full_name) return m.full_name.split(' ')[0]
  if(m?.name) return m.name.split(' ')[0]
  if(user?.email) { const p=user.email.split('@')[0].split(/[._\-+]/)[0]; return p.charAt(0).toUpperCase()+p.slice(1) }
  return ''
}
function getGreeting(name='') {
  const h=new Date().getHours()
  const [base,emoji]=h>=5&&h<12?['Good morning','🌅']:h>=12&&h<18?['Good afternoon','☀️']:h>=18&&h<22?['Good evening','🌆']:['Good night','🌙']
  return name?`${base}, ${name} ${emoji}`:`${base} ${emoji}`
}

function buildChartData(history, total, period='1M') {
  if(!history.length) return null
  // Filter by period
  let filtered=history
  if(period!=='All') {
    const days=CHART_PERIOD_DAYS[period]
    const cutoff=new Date(); cutoff.setDate(cutoff.getDate()-days)
    filtered=history.filter(h=>new Date(h.recorded_at)>=cutoff)
  }
  if(!filtered.length) filtered=history.slice(-2)
  // Group: daily for ≤1M, weekly for ≤3M, monthly otherwise
  const useDays=CHART_PERIOD_DAYS[period]<=30
  const useWeeks=CHART_PERIOD_DAYS[period]<=90
  const byBucket={}
  filtered.forEach(({value,recorded_at})=>{
    let key
    if(useDays) key=recorded_at.slice(0,10)
    else if(useWeeks) {
      const d=new Date(recorded_at); d.setDate(d.getDate()-d.getDay()); key=d.toISOString().slice(0,10)
    } else key=recorded_at.slice(0,7)
    byBucket[key]=value
  })
  const buckets=Object.keys(byBucket).sort()
  const labelFmt=useDays||useWeeks
    ?(k=>new Date(k).toLocaleDateString('en-US',{month:'short',day:'numeric'}))
    :(k=>new Date(k+'-02').toLocaleDateString('en-US',{month:'short'}))
  const points=buckets.map(k=>({month:labelFmt(k),value:byBucket[k]}))
  // Replace or append "Now"
  const lastBucket=buckets[buckets.length-1]
  const nowKey=useDays?new Date().toISOString().slice(0,10):useWeeks?
    (()=>{const d=new Date();d.setDate(d.getDate()-d.getDay());return d.toISOString().slice(0,10)})()
    :new Date().toISOString().slice(0,7)
  lastBucket===nowKey?points[points.length-1]={month:'Now',value:total}:points.push({month:'Now',value:total})
  return points.length>=2?points:null
}
function generateDashboardSample(total, period='1M') {
  const base=total>0?total:88000
  if(period==='1W') return ['Mon','Tue','Wed','Thu','Fri','Now'].map((m,i)=>({month:m,value:Math.round(base*[0.97,0.975,0.98,0.985,0.992,1][i])}))
  if(period==='3M') return ['Jan','Feb','Mar','Now'].map((m,i)=>({month:m,value:Math.round(base*[0.88,0.92,0.96,1][i])}))
  if(period==='6M') return ['Sep','Oct','Nov','Dec','Jan','Now'].map((m,i)=>({month:m,value:Math.round(base*[0.82,0.87,0.91,0.94,0.97,1][i])}))
  if(period==='1Y') return ['Mar','May','Jul','Sep','Nov','Now'].map((m,i)=>({month:m,value:Math.round(base*[0.71,0.78,0.84,0.90,0.96,1][i])}))
  if(period==='All') return ['2022','2023','2024','Now'].map((m,i)=>({month:m,value:Math.round(base*[0.45,0.62,0.82,1][i])}))
  return ['Aug','Sep','Oct','Nov','Dec','Now'].map((month,i)=>({month,value:Math.round(base*[0.71,0.78,0.84,0.88,0.95,1][i])}))
}
function calcPeriodChange(history, total, period) {
  if(!history.length) return null
  const days=CHART_PERIOD_DAYS[period]
  const cutoff=new Date()
  if(days!==Infinity) cutoff.setDate(cutoff.getDate()-days)
  else cutoff.setFullYear(cutoff.getFullYear()-20)
  const older=history.filter(h=>new Date(h.recorded_at)<=cutoff)
  return older.length?total-older[older.length-1].value:null
}

function StatCard({label,value,sub,subColor,delay=0,accent,valueColor}) {
  return (
    <div className="fade-up" style={{background:'var(--bg2)',borderRadius:16,padding:'16px 20px',border:'1px solid var(--border)',flex:1,position:'relative',overflow:'hidden',animationDelay:delay+'ms',transition:'border-color 0.2s, transform 0.2s',cursor:'default'}}
      onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--border2)';e.currentTarget.style.transform='translateY(-2px)'}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.transform='translateY(0)'}}>
      {accent&&<div style={{position:'absolute',top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${accent},transparent)`,borderRadius:'16px 16px 0 0'}}/>}
      <p style={{fontSize:10,color:'var(--muted)',marginBottom:10,letterSpacing:1.5,textTransform:'uppercase',fontWeight:500,fontFamily:'var(--font-body)'}}>{label}</p>
      <p style={{fontSize:24,fontWeight:600,lineHeight:1,fontFamily:'var(--font-display)',letterSpacing:0.5,color:valueColor||'var(--text)'}}>{value}</p>
      {sub&&<p style={{fontSize:12,color:subColor||'var(--muted)',marginTop:10,display:'flex',alignItems:'center',gap:4,fontFamily:'var(--font-body)'}}>{sub}</p>}
    </div>
  )
}

function WeeklySummaryCard({user}) {
  const [enabled,setEnabled]=useState(user?.user_metadata?.weekly_summary===true)
  const [saving,setSaving]=useState(false)
  async function toggle() {
    const next=!enabled; setEnabled(next); setSaving(true)
    try{await supabase.auth.updateUser({data:{weekly_summary:next}})}catch{}
    setSaving(false)
  }
  return (
    <div className="fade-up" style={{background:'var(--bg2)',borderRadius:16,padding:'20px 24px',border:'1px solid var(--border)',marginTop:16,animationDelay:'350ms',display:'flex',alignItems:'center',justifyContent:'space-between',gap:16}}>
      <div>
        <p style={{fontSize:14,fontWeight:500,fontFamily:'var(--font-display)',letterSpacing:0.2}}>📬 Weekly portfolio summary</p>
        <p style={{fontSize:12,color:'var(--muted)',marginTop:4,fontFamily:'var(--font-body)'}}>{enabled?"You'll receive a weekly portfolio summary by email.":'Get a weekly overview of your portfolio sent to your inbox.'}</p>
      </div>
      <button onClick={toggle} disabled={saving} style={{width:44,height:26,borderRadius:13,border:'1px solid '+(enabled?'var(--green)':'var(--border2)'),cursor:saving?'default':'pointer',background:enabled?'var(--green)':'var(--bg3)',position:'relative',transition:'background 0.2s',flexShrink:0,opacity:saving?0.6:1}}>
        <div style={{width:18,height:18,borderRadius:'50%',background:'#fff',position:'absolute',top:3,left:enabled?23:3,transition:'left 0.2s',boxShadow:'0 1px 3px rgba(0,0,0,0.3)'}}/>
      </button>
    </div>
  )
}

function EmptyState({onAdd}) {
  return (
    <div className="fade-up" style={{background:'var(--bg2)',borderRadius:20,padding:'64px 32px',border:'1px solid var(--border)',textAlign:'center',position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:400,height:400,borderRadius:'50%',background:'radial-gradient(circle,rgba(0,217,139,0.05) 0%,transparent 70%)',pointerEvents:'none'}}/>
      <div style={{width:72,height:72,borderRadius:20,background:'linear-gradient(135deg,rgba(0,217,139,0.15),rgba(45,212,191,0.1))',border:'1px solid rgba(0,217,139,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:32,margin:'0 auto 24px'}}>💼</div>
      <h2 style={{fontSize:24,fontWeight:600,fontFamily:'var(--font-display)',letterSpacing:0.3,marginBottom:12}}>Track your net worth</h2>
      <p style={{fontSize:15,color:'var(--muted2)',fontFamily:'var(--font-body)',fontWeight:300,margin:'0 auto 32px',maxWidth:380,lineHeight:1.6}}>Add your first asset — stocks, crypto, real estate, retirement accounts, or cash — and watch your wealth come to life.</p>
      <button onClick={onAdd} style={{background:'linear-gradient(135deg,var(--green),var(--teal))',color:'#0a0a0f',padding:'12px 28px',borderRadius:20,fontSize:15,fontWeight:700,border:'none',cursor:'pointer',fontFamily:'var(--font-display)',letterSpacing:0.5,boxShadow:'0 0 30px rgba(0,217,139,0.25)',transition:'opacity 0.15s'}}
        onMouseEnter={e=>e.currentTarget.style.opacity='0.85'} onMouseLeave={e=>e.currentTarget.style.opacity='1'}>+ Add your first asset</button>
      <p style={{fontSize:12,color:'var(--muted)',marginTop:16,fontFamily:'var(--font-body)'}}>Free plan includes up to 5 assets</p>
    </div>
  )
}

function AddAssetModal({onAdd,onClose,isPro,assetsCount,freeLimit,userEmail,prefill,currency='USD'}) {
  const [category,setCategory]=useState(prefill?.category||'Stocks')
  const [ticker,setTicker]=useState(prefill?.ticker||'')
  const [selectedName,setSelectedName]=useState(prefill?.name||'')
  const [name,setName]=useState(prefill?.name||'')
  const [value,setValue]=useState('')
  const [suggestions,setSuggestions]=useState([])
  const [searching,setSearching]=useState(false)
  const [inputCurrency,setInputCurrency]=useState(currency)
  const debounceRef=useRef(null)
  const atLimit=!isPro&&assetsCount>=freeLimit
  const inputStyle={padding:'10px 14px',borderRadius:10,border:'1px solid var(--border2)',background:'var(--bg3)',color:'var(--text)',fontSize:14,outline:'none',fontFamily:'var(--font-body)',width:'100%'}
  const currSymbol=CURRENCY_META[inputCurrency]?.symbol||'$'
  const currRate=liveRates[inputCurrency]||1

  function handleTickerInput(val) {
    setTicker(val)
    setSelectedName('')
    clearTimeout(debounceRef.current)
    if(!val.trim()) { setSuggestions(POPULAR_STOCKS); return }
    setSearching(true)
    debounceRef.current=setTimeout(async()=>{
      try { setSuggestions(await searchStocks(val)) } catch { setSuggestions([]) }
      setSearching(false)
    },350)
  }
  function handleCryptoInput(val) {
    setTicker(val)
    setSelectedName('')
    clearTimeout(debounceRef.current)
    if(!val.trim()) { setSuggestions(POPULAR_CRYPTO); return }
    setSearching(true)
    debounceRef.current=setTimeout(async()=>{
      try { setSuggestions(await searchCrypto(val)) } catch { setSuggestions([]) }
      setSearching(false)
    },350)
  }
  function selectSuggestion(s) { setTicker(s.ticker); setSelectedName(s.name); setSuggestions([]) }
  function handleAdd() {
    if(!value) return
    if(category==='Stocks'&&!ticker) return
    if(category==='Crypto'&&!ticker) return
    if(['Real Estate','Retirement','Cash','Others'].includes(category)&&!name) return
    const finalName=category==='Stocks'?(selectedName||ticker)+' ('+ticker+')':category==='Crypto'?(selectedName||ticker):name
    const usdValue=parseFloat(value)/(liveRates[inputCurrency]||1)
    onAdd({id:Date.now(),name:finalName,category,value:usdValue,ticker:['Stocks','Crypto'].includes(category)?ticker:null})
    onClose()
  }

  return (
    <div style={{position:'fixed',inset:0,zIndex:100,background:'rgba(0,0,0,0.7)',display:'flex',alignItems:'center',justifyContent:'center',padding:20}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:'var(--bg2)',borderRadius:20,padding:'28px',border:'1px solid var(--border2)',width:'100%',maxWidth:480,maxHeight:'90vh',overflowY:'auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <p style={{fontWeight:600,fontSize:18,fontFamily:'var(--font-display)',letterSpacing:0.3}}>Add asset</p>
          <button onClick={onClose} style={{background:'rgba(255,255,255,0.06)',border:'1px solid var(--border2)',color:'var(--text)',fontSize:18,cursor:'pointer',width:32,height:32,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center'}}>×</button>
        </div>
        {atLimit?(
          <div style={{textAlign:'center',padding:'20px 0'}}>
            <div style={{fontSize:32,marginBottom:12}}>✦</div>
            <p style={{fontSize:16,fontWeight:600,fontFamily:'var(--font-display)',marginBottom:8}}>Upgrade to Pro</p>
            <p style={{fontSize:13,color:'var(--muted2)',marginBottom:20,fontFamily:'var(--font-body)'}}>You've used all {freeLimit} free assets. Upgrade for unlimited.</p>
            <button onClick={()=>startCheckout(userEmail)} style={{background:'linear-gradient(135deg,var(--green),var(--teal))',color:'#0a0a0f',padding:'10px 24px',borderRadius:20,fontSize:14,fontWeight:700,border:'none',cursor:'pointer',fontFamily:'var(--font-display)'}}>Upgrade for $9.99/month →</button>
          </div>
        ):(
          <>
            <div className="modal-category-grid" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:20}}>
              {CATEGORIES.map(cat=>(
                <button key={cat} onClick={()=>{setCategory(cat);setTicker('');setName('');setSelectedName('');setSuggestions([])}} style={{padding:'10px 4px',borderRadius:10,fontSize:11,fontWeight:category===cat?600:400,background:category===cat?CATEGORY_COLORS[cat]+'20':'var(--bg3)',color:category===cat?CATEGORY_COLORS[cat]:'var(--muted)',border:category===cat?'1px solid '+CATEGORY_COLORS[cat]+'50':'1px solid var(--border)',cursor:'pointer',transition:'all 0.15s',fontFamily:'var(--font-body)',display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                  <span style={{fontSize:18}}>{CATEGORY_ICONS[cat]}</span>{cat}
                </button>
              ))}
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {category==='Stocks'&&(
                <div style={{position:'relative'}}>
                  <input placeholder="Search ticker or name (e.g. AAPL, Vanguard…)" value={ticker} onChange={e=>handleTickerInput(e.target.value)} onFocus={()=>!ticker&&setSuggestions(POPULAR_STOCKS)} style={inputStyle}/>
                  {searching&&<span style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',fontSize:11,color:'var(--muted)'}}>searching…</span>}
                  {!searching&&suggestions.length>0&&(
                    <div style={{position:'absolute',top:'100%',left:0,right:0,zIndex:10,background:'var(--bg2)',border:'1px solid var(--border2)',borderRadius:10,marginTop:4,overflow:'hidden',boxShadow:'0 8px 32px rgba(0,0,0,0.4)'}}>
                      {suggestions.map(s=>(
                        <div key={s.ticker} onClick={()=>selectSuggestion(s)} style={{padding:'9px 14px',cursor:'pointer',fontSize:13,display:'flex',justifyContent:'space-between',alignItems:'center',fontFamily:'var(--font-body)'}}
                          onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.05)'}
                          onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                          <div style={{display:'flex',alignItems:'center',gap:8}}>
                            <span style={{fontWeight:700,color:'var(--blue)',minWidth:60}}>{s.ticker}</span>
                            <span style={{color:'var(--text)',fontSize:12}}>{s.name}</span>
                          </div>
                          {s.type&&<span style={{fontSize:10,color:'var(--muted)',background:'rgba(255,255,255,0.06)',padding:'2px 7px',borderRadius:6}}>{s.type}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {category==='Crypto'&&(
                <div style={{position:'relative'}}>
                  <input placeholder="Search coin name or symbol (e.g. Bitcoin, SOL…)" value={ticker} onChange={e=>handleCryptoInput(e.target.value)} onFocus={()=>!ticker&&setSuggestions(POPULAR_CRYPTO)} style={inputStyle}/>
                  {searching&&<span style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',fontSize:11,color:'var(--muted)'}}>searching…</span>}
                  {!searching&&suggestions.length>0&&(
                    <div style={{position:'absolute',top:'100%',left:0,right:0,zIndex:10,background:'var(--bg2)',border:'1px solid var(--border2)',borderRadius:10,marginTop:4,overflow:'hidden',boxShadow:'0 8px 32px rgba(0,0,0,0.4)'}}>
                      {suggestions.map(s=>(
                        <div key={s.ticker} onClick={()=>selectSuggestion(s)} style={{padding:'9px 14px',cursor:'pointer',fontSize:13,display:'flex',justifyContent:'space-between',alignItems:'center',fontFamily:'var(--font-body)'}}
                          onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.05)'}
                          onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                          <div style={{display:'flex',alignItems:'center',gap:8}}>
                            {s.thumb&&<img src={s.thumb} alt="" style={{width:18,height:18,borderRadius:'50%'}}/>}
                            <span style={{color:'var(--text)',fontSize:12}}>{s.name}</span>
                          </div>
                          {s.symbol&&<span style={{fontSize:11,color:'var(--amber)',fontWeight:600}}>{s.symbol}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {['Real Estate','Retirement','Cash','Others'].includes(category)&&(
                <input placeholder={category==='Real Estate'?'Property description':category==='Retirement'?'Account name (e.g. Fidelity 401k)':category==='Others'?'What is it? (e.g. Jewelry, Car, Business...)':'Account name (e.g. Chase Checking)'} value={name} onChange={e=>setName(e.target.value)} style={inputStyle}/>
              )}
              <div style={{display:'flex',gap:8,alignItems:'flex-start'}}>
                <div style={{position:'relative',flex:1}}>
                  <span style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',fontSize:14,color:'var(--muted2)',fontFamily:'var(--font-display)',pointerEvents:'none',fontWeight:600}}>
                    {currSymbol}
                  </span>
                  <input
                    placeholder={'Value in '+inputCurrency}
                    type="number" value={value}
                    onChange={e=>setValue(e.target.value)}
                    onKeyDown={e=>e.key==='Enter'&&handleAdd()}
                    style={{...inputStyle,paddingLeft:currSymbol.length>1?currSymbol.length*10+14+'px':'28px'}}
                  />
                  {value&&inputCurrency!=='USD'&&(
                    <span style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',fontSize:11,color:'var(--muted)',fontFamily:'var(--font-body)',pointerEvents:'none'}}>
                      ≈ ${(parseFloat(value)/currRate||0).toLocaleString(undefined,{maximumFractionDigits:0})} USD
                    </span>
                  )}
                </div>
                <select
                  value={inputCurrency}
                  onChange={e=>setInputCurrency(e.target.value)}
                  style={{padding:'10px 10px',borderRadius:10,border:'1px solid var(--border2)',background:'var(--bg3)',color:'var(--text)',fontSize:13,outline:'none',fontFamily:'var(--font-body)',cursor:'pointer',flexShrink:0}}
                >
                  {Object.entries(CURRENCY_META).map(([code,meta])=>(
                    <option key={code} value={code}>{code} {meta.symbol}</option>
                  ))}
                </select>
              </div>
              <button onClick={handleAdd} style={{background:'linear-gradient(135deg,var(--green),var(--teal))',color:'#0a0a0f',padding:'12px',borderRadius:10,fontSize:14,fontWeight:700,border:'none',cursor:'pointer',fontFamily:'var(--font-display)',letterSpacing:0.5}}>Add asset</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function Dashboard({assets,liabilities=[],isPro,user,showAddAsset,setShowAddAsset,saveAssets,freeLimit,setPage,netWorthHistory,currency,setCurrency,prefillAsset,onPrefillUsed}) {
  useFxRates() // keeps liveRates fresh; triggers re-render when rates update
  const {prices:allPrices,lastUpdated:lastUpdated}=useStockPrices(assets)
  const stockPrices=allPrices  // stocks + crypto now unified
  const [clock,setClock]=useState(new Date())
  const [showShareCard,setShowShareCard]=useState(false)
  const [chartPeriod,setChartPeriod]=useState('1M')

  useEffect(()=>{ const t=setInterval(()=>setClock(new Date()),1000); return()=>clearInterval(t) },[])

  const firstName=getFirstName(user)
  const total=assets.reduce((s,a)=>s+(a.value||0),0)
  const totalLiabilities=liabilities.reduce((s,l)=>s+(l.balance||0),0)
  const netWorth=total-totalLiabilities
  const history=netWorthHistory||[]
  const chartData=buildChartData(history,total,chartPeriod)
  const periodChange=calcPeriodChange(history,total,chartPeriod)
  // lastUpdated comes from useStockPrices directly

  // Chart Y domain — start near min so growth looks dramatic
  const dashboardDisplayData=chartData||generateDashboardSample(total,chartPeriod)
  const chartMin=(() => {
    const vals=dashboardDisplayData.map(d=>d.value)
    const min=Math.min(...vals), max=Math.max(...vals)
    return Math.max(0,Math.floor((min-(max-min)*0.15)/1000)*1000)
  })()
  const chartFirst=dashboardDisplayData[0]?.value||0
  const chartLast=dashboardDisplayData[dashboardDisplayData.length-1]?.value||0
  const chartChg=chartLast-chartFirst
  const chartChgPct=chartFirst>0?(chartChg/chartFirst)*100:0
  const chartChgPos=chartChg>=0

  const pieData=[
    ...Object.keys(CATEGORY_COLORS).map(cat=>({
      name:cat,color:CATEGORY_COLORS[cat],
      value:assets.filter(a=>a.category===cat).reduce((s,a)=>s+(a.value||0),0),
    })).filter(d=>d.value>0),
    ...(totalLiabilities>0?[{name:'Liabilities',value:totalLiabilities,color:'#ff4d6d'}]:[]),
  ]

  const topAssets=[...assets].sort((a,b)=>b.value-a.value).slice(0,5)

  // Crypto and stock changes now come from unified useStockPrices hook (60s polling)
  const cryptoChanges=assets.filter(a=>a.category==='Crypto'&&a.ticker&&allPrices[a.ticker]).map(a=>allPrices[a.ticker].change)
  const avgCryptoChange=cryptoChanges.length?cryptoChanges.reduce((s,c)=>s+c,0)/cryptoChanges.length:null
  const stockChanges=assets.filter(a=>a.category==='Stocks'&&a.ticker&&allPrices[a.ticker]).map(a=>allPrices[a.ticker].change)
  const avgStockChange=stockChanges.length?stockChanges.reduce((s,c)=>s+c,0)/stockChanges.length:null
  const stockDollarChange=avgStockChange!=null?assets.filter(a=>a.category==='Stocks'&&a.ticker&&allPrices[a.ticker]).reduce((s,a)=>s+a.value*(allPrices[a.ticker].change/100),0):null
  const cryptoDollarChange=avgCryptoChange!=null?assets.filter(a=>a.category==='Crypto'&&a.ticker&&allPrices[a.ticker]).reduce((s,a)=>s+a.value*(allPrices[a.ticker].change/100),0):null

  function getLiveChange(asset) {
    if((asset.category==='Crypto'||asset.category==='Stocks')&&asset.ticker&&allPrices[asset.ticker]) return allPrices[asset.ticker].change
    return null
  }

  function handleAddAsset(asset) { saveAssets([...assets,asset]) }
  function handleCloseModal() { setShowAddAsset(false); onPrefillUsed?.() }

  const renderTooltip=useCallback(({active,payload,label})=>{
    if(!active||!payload?.length) return null
    return (
      <div style={{background:'var(--bg3)',border:'1px solid var(--border2)',borderRadius:12,padding:'12px 16px',backdropFilter:'blur(10px)'}}>
        <p style={{color:'var(--muted)',marginBottom:4,fontSize:11,fontFamily:'var(--font-body)',letterSpacing:0.5}}>{label}</p>
        <p style={{fontWeight:600,fontSize:20,fontFamily:'var(--font-display)',letterSpacing:0.5}}>{formatAmount(payload[0].value,currency)}</p>
      </div>
    )
  },[currency])

  const currencySelector=(
    <div style={{position:'relative',display:'inline-flex',alignItems:'center'}}>
      <select value={currency} onChange={e=>setCurrency(e.target.value)} style={{background:'var(--bg2)',color:'var(--muted2)',border:'1px solid var(--border2)',borderRadius:8,padding:'7px 28px 7px 12px',fontSize:12,cursor:'pointer',fontFamily:'var(--font-body)',outline:'none',appearance:'none',WebkitAppearance:'none',fontWeight:500}}>
        {Object.entries(CURRENCY_META).map(([k,v])=><option key={k} value={k}>{v.symbol} {k} — {v.name}</option>)}
      </select>
      <svg style={{position:'absolute',right:8,pointerEvents:'none',color:'var(--muted)'}} width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  )

  const dateStr=clock.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})
  const timeStr=clock.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',second:'2-digit'})
  const lastUpdatedLabel=lastUpdated?'· Updated '+lastUpdated.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}):null

  const headerButtons=(
    <div className="header-buttons" style={{display:'flex',alignItems:'center',gap:10,paddingTop:4}}>
      {currencySelector}
      <button onClick={()=>setShowShareCard(true)} style={{display:'flex',alignItems:'center',gap:5,background:'var(--bg2)',color:'var(--muted2)',padding:'7px 14px',borderRadius:8,fontSize:12,fontWeight:500,border:'1px solid var(--border2)',cursor:'pointer',fontFamily:'var(--font-body)',transition:'all 0.15s'}}
        onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.25)';e.currentTarget.style.background='var(--bg3)'}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border2)';e.currentTarget.style.background='var(--bg2)'}}>
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M12 10.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zm0 0L6 7.5m6-6.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zm0 0L6 7.5m-6 1a2.5 2.5 0 1 0 5 0 2.5 2.5 0 0 0-5 0z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
        Share
      </button>
      <button onClick={()=>setShowAddAsset(true)} style={{display:'flex',alignItems:'center',gap:6,background:'var(--bg2)',color:'var(--text)',padding:'7px 16px',borderRadius:8,fontSize:12,fontWeight:500,border:'1px solid var(--border2)',cursor:'pointer',fontFamily:'var(--font-body)',transition:'all 0.15s'}}
        onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.25)';e.currentTarget.style.background='var(--bg3)'}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border2)';e.currentTarget.style.background='var(--bg2)'}}>+ Add asset</button>
    </div>
  )

  if(assets.length===0) return (
    <div style={{maxWidth:1600}}>
      {showAddAsset&&<AddAssetModal onAdd={handleAddAsset} onClose={handleCloseModal} isPro={isPro} assetsCount={0} freeLimit={freeLimit} userEmail={user?.email} prefill={prefillAsset} currency={currency} key={prefillAsset?.ticker||'modal'}/>}
      <div className="fade-up dashboard-header" style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:36}}>
        <div>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:4}}>
            <p style={{fontSize:12,color:'var(--muted)',fontFamily:'var(--font-body)'}}>{dateStr}</p>
            <p style={{fontSize:12,color:'var(--muted)',fontFamily:'var(--font-body)',fontVariantNumeric:'tabular-nums'}}>{timeStr}</p>
          </div>
          <h1 className="dashboard-h1" style={{fontSize:32,fontWeight:600,fontFamily:'var(--font-display)',letterSpacing:0.3}}>{getGreeting(firstName)}</h1>
          <p style={{fontSize:14,color:'var(--muted2)',marginTop:8,fontFamily:'var(--font-body)',fontWeight:300}}>Welcome to WealthView — let's get started.</p>
        </div>
        {headerButtons}
      </div>
      <EmptyState onAdd={()=>setShowAddAsset(true)}/>
    </div>
  )

  return (
    <div style={{maxWidth:1600}}>
      {showAddAsset&&<AddAssetModal onAdd={handleAddAsset} onClose={handleCloseModal} isPro={isPro} assetsCount={assets.length} freeLimit={freeLimit} userEmail={user?.email} prefill={prefillAsset} key={prefillAsset?.ticker||'modal'}/>}

      {/* Header */}
      <div className="fade-up" style={{marginBottom:36}}>
        <div className="dashboard-header" style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8,flexWrap:'wrap'}}>
              <div style={{width:7,height:7,borderRadius:'50%',background:'var(--green)',animation:'pulse-green 2s infinite'}}/>
              <span style={{fontSize:10,color:'var(--green)',fontWeight:500,letterSpacing:1.5,textTransform:'uppercase',fontFamily:'var(--font-body)'}}>Live</span>
              {lastUpdatedLabel&&<span style={{fontSize:10,color:'var(--muted)',fontFamily:'var(--font-body)'}}>{lastUpdatedLabel}</span>}
              <span style={{fontSize:10,color:'var(--muted)',fontFamily:'var(--font-body)',marginLeft:4}}>{dateStr}</span>
              <span style={{fontSize:10,color:'var(--muted)',fontFamily:'var(--font-body)',fontVariantNumeric:'tabular-nums'}}>· {timeStr}</span>
            </div>
            <h1 className="dashboard-h1" style={{fontSize:32,fontWeight:600,lineHeight:1.1,fontFamily:'var(--font-display)',letterSpacing:0.3}}>{getGreeting(firstName)}</h1>
            <p style={{fontSize:14,color:'var(--muted2)',marginTop:8,fontFamily:'var(--font-body)',fontWeight:300}}>Here's your complete financial picture.</p>
          </div>
          {headerButtons}
        </div>
      </div>

      {/* Stat cards — Net Worth card now has NO sub since chart handles the change */}
      <div className="stat-grid" style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:14,marginBottom:24}}>
        <StatCard label="Net worth" value={formatAmount(netWorth,currency)}
          sub="Assets minus liabilities" subColor="var(--muted)"
          delay={0} accent={netWorth>=0?'var(--green)':'var(--red)'} valueColor={netWorth<0?'var(--red)':undefined}/>
        <StatCard label="Total assets" value={formatAmount(total,currency)}
          sub={`${assets.length} asset${assets.length!==1?'s':''}`} subColor="var(--muted)" delay={60} accent="var(--blue)"/>
        <StatCard label="Total liabilities" value={totalLiabilities>0?formatAmount(totalLiabilities,currency):'—'}
          sub={totalLiabilities>0?`${liabilities.length} debt${liabilities.length!==1?'s':''}` :'No debts tracked'}
          subColor={totalLiabilities>0?'var(--red)':'var(--muted)'}
          delay={120} accent={totalLiabilities>0?'var(--red)':'var(--border2)'} valueColor={totalLiabilities>0?'var(--red)':undefined}/>
        <StatCard label="Stocks 24h"
          value={avgStockChange!=null?(avgStockChange>=0?'+':'')+avgStockChange.toFixed(2)+'%':'—'}
          sub={avgStockChange!=null?(stockDollarChange>=0?'↑ +':'↓ ')+formatAmount(Math.abs(stockDollarChange),currency)+' today':'Add stocks with tickers'}
          subColor={avgStockChange!=null?(avgStockChange>=0?'var(--green)':'var(--red)'):'var(--muted)'}
          delay={180} accent={avgStockChange!=null?(avgStockChange>=0?'var(--green)':'var(--red)'):'var(--blue)'}/>
        <StatCard label="Crypto 24h"
          value={avgCryptoChange!=null?(avgCryptoChange>=0?'+':'')+avgCryptoChange.toFixed(2)+'%':'—'}
          sub={avgCryptoChange!=null?(cryptoDollarChange>=0?'↑ +':'↓ ')+formatAmount(Math.abs(cryptoDollarChange),currency)+' today':'No crypto data yet'}
          subColor={avgCryptoChange!=null?(avgCryptoChange>=0?'var(--green)':'var(--red)'):'var(--muted)'}
          delay={240} accent={avgCryptoChange!=null?(avgCryptoChange>=0?'var(--green)':'var(--red)'):'var(--purple)'}/>
      </div>

      {/* Net Worth Breakdown — Assets − Liabilities = Net Worth */}
      <div className="fade-up" style={{background:'var(--bg2)',borderRadius:14,border:'1px solid var(--border)',padding:'14px 20px',marginBottom:16,display:'flex',alignItems:'center',flexWrap:'wrap',gap:6,animationDelay:'180ms'}}>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          <span style={{fontSize:11,color:'var(--muted)',textTransform:'uppercase',letterSpacing:1,fontFamily:'var(--font-body)',fontWeight:500}}>Total assets</span>
          <span style={{fontSize:15,fontWeight:700,fontFamily:'var(--font-display)',color:'var(--green)'}}>{formatAmount(total,currency)}</span>
        </div>
        <span style={{fontSize:16,color:'var(--muted)',fontWeight:300,padding:'0 4px'}}>−</span>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          <span style={{fontSize:11,color:'var(--muted)',textTransform:'uppercase',letterSpacing:1,fontFamily:'var(--font-body)',fontWeight:500}}>Liabilities</span>
          <span style={{fontSize:15,fontWeight:700,fontFamily:'var(--font-display)',color:totalLiabilities>0?'var(--red)':'var(--muted)'}}>{totalLiabilities>0?formatAmount(totalLiabilities,currency):'$0'}</span>
        </div>
        <span style={{fontSize:16,color:'var(--muted)',fontWeight:300,padding:'0 4px'}}>=</span>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          <span style={{fontSize:11,color:'var(--muted)',textTransform:'uppercase',letterSpacing:1,fontFamily:'var(--font-body)',fontWeight:500}}>Net worth</span>
          <span style={{fontSize:15,fontWeight:700,fontFamily:'var(--font-display)',color:netWorth>=0?'var(--text)':'var(--red)'}}>{formatAmount(netWorth,currency)}</span>
        </div>
        <div style={{marginLeft:'auto'}}>
          <button onClick={()=>setPage('liabilities')} style={{fontSize:11,color:'var(--muted)',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:8,padding:'5px 12px',cursor:'pointer',fontFamily:'var(--font-body)',transition:'all 0.15s'}}
            onMouseEnter={e=>{e.currentTarget.style.color='var(--red)';e.currentTarget.style.borderColor='rgba(255,77,109,0.4)'}}
            onMouseLeave={e=>{e.currentTarget.style.color='var(--muted)';e.currentTarget.style.borderColor='var(--border)'}}>
            {totalLiabilities>0?'Manage liabilities →':'+ Add liability'}
          </button>
        </div>
      </div>

      {/* Chart + Allocation */}
      <div className="chart-grid" style={{display:'grid',gridTemplateColumns:'3fr 2fr',gap:16,marginBottom:24}}>
        <div className="fade-up" style={{background:'var(--bg2)',borderRadius:16,padding:'24px',border:'1px solid var(--border)',animationDelay:'200ms'}}>

          {/* ── Chart header: value + change + period selector ── */}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20,flexWrap:'wrap',gap:10}}>
            <div>
              <p style={{fontSize:10,color:'var(--muted)',textTransform:'uppercase',letterSpacing:1.5,fontWeight:500,marginBottom:8,fontFamily:'var(--font-body)'}}>Net worth over time</p>
              <p style={{fontSize:26,fontWeight:600,fontFamily:'var(--font-display)',letterSpacing:0.3,color:netWorth<0?'var(--red)':'var(--text)',lineHeight:1,marginBottom:8}}>
                {formatAmount(netWorth,currency)}
              </p>
              <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                <span style={{fontSize:15,fontWeight:700,fontFamily:'var(--font-display)',color:chartChgPos?'var(--green)':'var(--red)'}}>
                  {chartChgPos?'+':''}{formatAmount(Math.abs(Math.round(chartChg)),currency)}
                </span>
                <span style={{fontSize:12,fontWeight:700,padding:'3px 10px',borderRadius:20,fontFamily:'var(--font-body)',background:chartChgPos?'rgba(0,217,139,0.12)':'rgba(255,77,109,0.12)',color:chartChgPos?'var(--green)':'var(--red)',border:`1px solid ${chartChgPos?'rgba(0,217,139,0.25)':'rgba(255,77,109,0.25)'}`}}>
                  {chartChgPos?'▲':'▼'} {chartChgPos?'+':''}{chartChgPct.toFixed(2)}%
                </span>
                <span style={{fontSize:11,color:'var(--muted)',fontFamily:'var(--font-body)'}}>in {chartPeriod}</span>
              </div>
            </div>
            <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
              {CHART_PERIODS.map(p=>(
                <button key={p} onClick={()=>setChartPeriod(p)} style={{
                  padding:'4px 10px',borderRadius:7,fontSize:11,
                  fontWeight:chartPeriod===p?600:400,
                  background:chartPeriod===p?'var(--green)':'transparent',
                  color:chartPeriod===p?'#0a0a0f':'var(--muted)',
                  border:chartPeriod===p?'1px solid var(--green)':'1px solid transparent',
                  cursor:'pointer',transition:'all 0.15s',fontFamily:'var(--font-body)',
                }}>{p}</button>
              ))}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={dashboardDisplayData} margin={{top:5,right:0,bottom:0,left:0}}>
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00d98b" stopOpacity={0.25}/>
                  <stop offset="100%" stopColor="#00d98b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{fontSize:11,fill:'var(--muted)',fontFamily:'Geologica'}} axisLine={false} tickLine={false}/>
              <YAxis hide domain={[chartMin,'auto']}/>
              <Tooltip content={renderTooltip}/>
              <Area type="monotone" dataKey="value" stroke="var(--green)" strokeWidth={2.5} fill="url(#chartGrad)" dot={false} activeDot={{r:4,fill:'var(--green)',strokeWidth:0}}/>
            </AreaChart>
          </ResponsiveContainer>
          {!chartData&&<p style={{fontSize:10,color:'var(--muted)',fontFamily:'var(--font-body)',marginTop:8,opacity:0.6,letterSpacing:0.5}}>Sample preview · tracks automatically as you add assets</p>}
        </div>

        <div className="fade-up" style={{background:'var(--bg2)',borderRadius:16,padding:'24px',border:'1px solid var(--border)',animationDelay:'250ms'}}>
          <p style={{fontSize:10,color:'var(--muted)',textTransform:'uppercase',letterSpacing:1.5,fontWeight:500,marginBottom:20,fontFamily:'var(--font-body)'}}>Allocation</p>
          {pieData.length===0?(
            <div style={{height:160,display:'flex',alignItems:'center',justifyContent:'center'}}>
              <div style={{width:120,height:120,borderRadius:'50%',border:'2px dashed var(--border2)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <p style={{fontSize:11,color:'var(--muted)',fontFamily:'var(--font-body)',textAlign:'center',padding:8}}>No data yet</p>
              </div>
            </div>
          ):(
            <div style={{display:'flex',justifyContent:'center'}}>
              <PieChart width={160} height={160}>
                <Pie data={pieData} cx={75} cy={75} innerRadius={50} outerRadius={72} dataKey="value" strokeWidth={0} paddingAngle={3}>
                  {pieData.map(entry=><Cell key={entry.name} fill={entry.color}/>)}
                </Pie>
              </PieChart>
            </div>
          )}
          <div style={{marginTop:16,display:'flex',flexDirection:'column',gap:10}}>
            {pieData.map(d=>{
              const grandTotal=pieData.reduce((s,x)=>s+x.value,0)
              return (
                <div key={d.name} style={{display:'flex',alignItems:'center',gap:10}}>
                  <div style={{width:8,height:8,borderRadius:2,background:d.color,flexShrink:0}}/>
                  <span style={{fontSize:12,color:'var(--muted2)',flex:1,fontFamily:'var(--font-body)'}}>{d.name}</span>
                  <span style={{fontSize:13,fontWeight:600,color:d.name==='Liabilities'?'var(--red)':'var(--text)',fontFamily:'var(--font-display)',letterSpacing:0.3}}>
                    {Math.round(d.value/grandTotal*100)}%
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Top holdings */}
      <div className="fade-up" style={{background:'var(--bg2)',borderRadius:16,border:'1px solid var(--border)',overflow:'hidden',animationDelay:'300ms'}}>
        <div style={{padding:'20px 24px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <p style={{fontWeight:600,fontSize:16,fontFamily:'var(--font-display)',letterSpacing:0.3}}>Top holdings</p>
          <button onClick={()=>setPage('assets')} style={{fontSize:12,color:'var(--green)',background:'transparent',border:'none',cursor:'pointer',fontFamily:'var(--font-body)',fontWeight:500}}>View all →</button>
        </div>
        {topAssets.map((asset,i)=>{
          const change=getLiveChange(asset)
          const pct=(asset.value/total*100).toFixed(1)
          const livePrice=asset.ticker&&allPrices[asset.ticker]?allPrices[asset.ticker].price:null
          const dollarChange=change!=null?asset.value*(change/100):null
          return (
            <div key={asset.id} className="holdings-row" style={{display:'flex',alignItems:'center',padding:'14px 24px',borderBottom:i<topAssets.length-1?'1px solid var(--border)':'none',transition:'background 0.15s',cursor:'default'}}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.02)'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <div className="holdings-rank" style={{width:28,fontSize:12,color:'var(--muted)',fontWeight:500,fontFamily:'var(--font-display)'}}>#{i+1}</div>
              <AssetLogo ticker={asset.ticker} category={asset.category} size={36} style={{marginRight:14}}/>
              <div style={{flex:1}}>
                <p style={{fontSize:14,fontWeight:500,fontFamily:'var(--font-body)'}}>{asset.name}</p>
                <p style={{fontSize:11,color:'var(--muted)',marginTop:2,fontFamily:'var(--font-body)'}}>
                  {asset.category}
                  {livePrice&&<span style={{marginLeft:8,color:'var(--muted2)'}}>{formatAmount(livePrice,currency)} / share</span>}
                </p>
              </div>
              <div className="holdings-value" style={{textAlign:'right',marginRight:24}}>
                <p style={{fontSize:15,fontWeight:600,fontFamily:'var(--font-display)',letterSpacing:0.3}}>{formatAmount(asset.value,currency)}</p>
                {change!=null?(
                  <p style={{fontSize:11,marginTop:2,fontFamily:'var(--font-body)',color:change>=0?'var(--green)':'var(--red)'}}>
                    {change>=0?'↑':'↓'} {Math.abs(change).toFixed(2)}% · {change>=0?'+':''}{formatAmount(dollarChange,currency)}
                  </p>
                ):(
                  <p style={{fontSize:11,color:'var(--muted)',marginTop:2,fontFamily:'var(--font-body)'}}>{pct}% of total</p>
                )}
              </div>
              <div className="holdings-bar" style={{width:80}}>
                <div style={{height:4,background:'var(--bg3)',borderRadius:2,overflow:'hidden'}}>
                  <div style={{height:'100%',borderRadius:2,width:pct+'%',background:CATEGORY_COLORS[asset.category],transition:'width 1s ease'}}/>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <WeeklySummaryCard user={user}/>
      {showShareCard&&<ShareCard total={netWorth} currency={currency} user={user} onClose={()=>setShowShareCard(false)}/>}
    </div>
  )
}