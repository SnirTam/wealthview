import { useState, useMemo, useCallback } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from 'recharts'
import { formatAmount } from './Dashboard'

const CATEGORY_COLORS = { Stocks:'#4d9fff', Crypto:'#ffb340', 'Real Estate':'#00d98b', Retirement:'#a78bfa', Cash:'#6b6b80' }
const PERIODS = ['1W','1M','3M','6M','1Y','All']
const PERIOD_DAYS = { '1W':7,'1M':30,'3M':90,'6M':180,'1Y':365,'All':Infinity }

function generateSampleHistory(total, days) {
  const count=Math.min(days===Infinity?30:days,30), actualDays=days===Infinity?365:days
  const startRatio=actualDays<=7?0.96:actualDays<=30?0.88:actualDays<=90?0.8:0.6
  const startVal=total*startRatio
  return Array.from({length:count+1},(_,i)=>{
    const daysAgo=actualDays-Math.round(actualDays*i/count)
    const d=new Date(); d.setDate(d.getDate()-daysAgo)
    const base=startVal+(total-startVal)*Math.pow(i/count,0.85)
    const noise=(Math.random()-0.45)*total*0.025
    return {recorded_at:d.toISOString(),value:Math.max(1,i===count?total:base+noise)}
  })
}
function filterByPeriod(history,period) {
  if(period==='All'||!history.length) return history
  const cutoff=new Date(); cutoff.setDate(cutoff.getDate()-PERIOD_DAYS[period])
  return history.filter(h=>new Date(h.recorded_at)>=cutoff)
}
function formatLabel(isoStr,period) {
  const d=new Date(isoStr)
  return (period==='1W'||period==='1M')?d.toLocaleDateString('en-US',{month:'short',day:'numeric'}):d.toLocaleDateString('en-US',{month:'short',year:'2-digit'})
}
function sampleEvenly(arr,maxPts=12) {
  if(arr.length<=maxPts) return arr
  const step=(arr.length-1)/(maxPts-1)
  return Array.from({length:maxPts},(_,i)=>arr[Math.round(i*step)])
}

function ChartTooltip({active,payload,label,currency}) {
  if(!active||!payload?.length) return null
  return (
    <div style={{background:'var(--bg3)',border:'1px solid var(--border2)',borderRadius:12,padding:'12px 16px',backdropFilter:'blur(10px)'}}>
      <p style={{color:'var(--muted)',fontSize:11,marginBottom:4,fontFamily:'var(--font-body)',letterSpacing:0.5}}>{label}</p>
      {payload.map(p=>(
        <p key={p.dataKey} style={{fontWeight:600,fontSize:16,fontFamily:'var(--font-display)',color:p.color||'var(--text)'}}>
          {typeof p.value==='number'&&p.value>1000?formatAmount(p.value,currency):p.value?.toLocaleString?.()??p.value}
        </p>
      ))}
    </div>
  )
}

export default function Analytics({assets,netWorthHistory,currency='USD'}) {
  const [period,setPeriod]=useState('1M')
  const total=assets.reduce((s,a)=>s+(a.value||0),0)

  const rawHistory=useMemo(()=>{
    if(netWorthHistory?.length>=2) return netWorthHistory
    return generateSampleHistory(total||100000,PERIOD_DAYS[period]===Infinity?365:PERIOD_DAYS[period])
  },[netWorthHistory,total,period])

  const isSample=!netWorthHistory?.length||netWorthHistory.length<2
  const filtered=useMemo(()=>filterByPeriod(rawHistory,period),[rawHistory,period])

  const barData=useMemo(()=>Object.keys(CATEGORY_COLORS).map(cat=>({
    name:cat, value:assets.filter(a=>a.category===cat).reduce((s,a)=>s+(a.value||0),0),
  })).filter(d=>d.value>0),[assets])

  const lineData=useMemo(()=>{
    const catTotals={}
    Object.keys(CATEGORY_COLORS).forEach(cat=>{ catTotals[cat]=assets.filter(a=>a.category===cat).reduce((s,a)=>s+(a.value||0),0) })
    const grandTotal=Object.values(catTotals).reduce((s,v)=>s+v,0)||1
    return sampleEvenly(filtered,10).map(h=>{
      const row={label:formatLabel(h.recorded_at,period)}
      Object.keys(CATEGORY_COLORS).forEach(cat=>{ row[cat]=Math.round(h.value*(catTotals[cat]/grandTotal)) })
      return row
    })
  },[filtered,period,assets])

  const allTimeHigh=useMemo(()=>Math.max(total,...rawHistory.map(h=>h.value)),[rawHistory,total])
  const bestCat=barData.length?barData.reduce((best,d)=>d.value>best.value?d:best,barData[0]):null

  const renderTooltip=useCallback(props=><ChartTooltip {...props} currency={currency}/>,[currency])
  const cardStyle={background:'var(--bg2)',borderRadius:16,border:'1px solid var(--border)',padding:'22px 24px'}

  return (
    <div style={{maxWidth:1600}}>

      {/* Header */}
      <div className="fade-up" style={{marginBottom:32,display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:12}}>
        <div>
          <h1 style={{fontSize:32,fontWeight:600,fontFamily:'var(--font-display)',letterSpacing:0.3}}>Analytics</h1>
          <p style={{fontSize:14,color:'var(--muted2)',marginTop:8,fontFamily:'var(--font-body)',fontWeight:300}}>Deep-dive into your wealth over time.</p>
          {isSample&&<p style={{fontSize:11,color:'var(--muted)',fontFamily:'var(--font-body)',marginTop:8,opacity:0.7}}>Showing sample data · updates automatically as you track daily</p>}
        </div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          {PERIODS.map(p=>(
            <button key={p} onClick={()=>setPeriod(p)} style={{
              padding:'5px 12px',borderRadius:8,fontSize:12,
              fontWeight:period===p?600:400,
              background:period===p?'var(--green)':'var(--bg2)',
              color:period===p?'#0a0a0f':'var(--muted)',
              border:period===p?'1px solid var(--green)':'1px solid var(--border2)',
              cursor:'pointer',transition:'all 0.15s',fontFamily:'var(--font-body)',
            }}>{p}</button>
          ))}
        </div>
      </div>

      {/* 2 stat cards — removed Total Growth since chart handles it */}
      <div className="stat-grid fade-up" style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:16,marginBottom:24,animationDelay:'60ms'}}>
        {[
          {
            label:'All-time high', accent:'var(--green)',
            value:formatAmount(allTimeHigh,currency),
            sub:allTimeHigh===total?'← current value':formatAmount(total,currency)+' currently',
            subColor:'var(--muted)',
          },
          {
            label:'Best category', accent:bestCat?CATEGORY_COLORS[bestCat.name]:'var(--blue)',
            value:bestCat?.name||'—',
            sub:bestCat?formatAmount(bestCat.value,currency):'Add assets to see',
            subColor:bestCat?CATEGORY_COLORS[bestCat.name]:'var(--muted)',
          },
        ].map(s=>(
          <div key={s.label} style={{...cardStyle,position:'relative',overflow:'hidden',cursor:'default',transition:'border-color 0.2s, transform 0.2s'}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--border2)';e.currentTarget.style.transform='translateY(-2px)'}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.transform='translateY(0)'}}>
            <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${s.accent},transparent)`,borderRadius:'16px 16px 0 0'}}/>
            <p style={{fontSize:10,color:'var(--muted)',letterSpacing:1.5,textTransform:'uppercase',fontWeight:500,marginBottom:10,fontFamily:'var(--font-body)'}}>{s.label}</p>
            <p style={{fontSize:26,fontWeight:600,fontFamily:'var(--font-display)',letterSpacing:0.3,lineHeight:1.1}}>{s.value}</p>
            <p style={{fontSize:12,color:s.subColor,marginTop:10,fontFamily:'var(--font-body)'}}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Bar + Line charts */}
      <div className="chart-grid fade-up" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:24,animationDelay:'200ms'}}>
        <div style={cardStyle}>
          <p style={{fontSize:10,color:'var(--muted)',textTransform:'uppercase',letterSpacing:1.5,fontWeight:500,marginBottom:20,fontFamily:'var(--font-body)'}}>Value by category</p>
          {barData.length?(
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} margin={{top:0,right:0,bottom:24,left:0}} barSize={22}>
                <XAxis dataKey="name" tick={{fontSize:10,fill:'var(--muted)',fontFamily:'Geologica'}} axisLine={false} tickLine={false}/>
                <YAxis hide/>
                <Tooltip content={renderTooltip}/>
                <Bar dataKey="value" radius={[6,6,0,0]}>
                  {barData.map(entry=><Cell key={entry.name} fill={CATEGORY_COLORS[entry.name]} fillOpacity={0.85}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ):(
            <div style={{height:200,display:'flex',alignItems:'center',justifyContent:'center'}}>
              <p style={{fontSize:13,color:'var(--muted)',fontFamily:'var(--font-body)'}}>No assets yet</p>
            </div>
          )}
        </div>

        <div style={cardStyle}>
          <p style={{fontSize:10,color:'var(--muted)',textTransform:'uppercase',letterSpacing:1.5,fontWeight:500,marginBottom:20,fontFamily:'var(--font-body)'}}>Category performance</p>
          {lineData.length>=2?(
            <>
              <ResponsiveContainer width="100%" height={178}>
                <LineChart data={lineData} margin={{top:0,right:0,bottom:0,left:0}}>
                  <XAxis dataKey="label" tick={{fontSize:10,fill:'var(--muted)',fontFamily:'Geologica'}} axisLine={false} tickLine={false}/>
                  <YAxis hide/>
                  <Tooltip content={renderTooltip}/>
                  {Object.keys(CATEGORY_COLORS).filter(cat=>barData.some(d=>d.name===cat&&d.value>0)).map(cat=>(
                    <Line key={cat} type="monotone" dataKey={cat} stroke={CATEGORY_COLORS[cat]} strokeWidth={2} dot={false} activeDot={{r:3,strokeWidth:0}}/>
                  ))}
                </LineChart>
              </ResponsiveContainer>
              <div style={{display:'flex',flexWrap:'wrap',gap:'6px 12px',marginTop:10}}>
                {Object.keys(CATEGORY_COLORS).filter(cat=>barData.some(d=>d.name===cat&&d.value>0)).map(cat=>(
                  <div key={cat} style={{display:'flex',alignItems:'center',gap:5}}>
                    <div style={{width:8,height:8,borderRadius:2,background:CATEGORY_COLORS[cat]}}/>
                    <span style={{fontSize:11,color:'var(--muted2)',fontFamily:'var(--font-body)'}}>{cat}</span>
                  </div>
                ))}
              </div>
            </>
          ):(
            <div style={{height:200,display:'flex',alignItems:'center',justifyContent:'center'}}>
              <p style={{fontSize:13,color:'var(--muted)',fontFamily:'var(--font-body)'}}>Add assets to see trends</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}