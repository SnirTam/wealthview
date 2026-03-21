import { useEffect, useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'

const CATEGORY_COLORS = {
  'Stocks':      '#4d9fff',
  'Crypto':      '#ffb340',
  'Real Estate': '#00d98b',
  'Retirement':  '#a78bfa',
  'Cash':        '#6b6b80',
}

const HISTORY = [
  { month: 'Oct', value: 380000 },
  { month: 'Nov', value: 392000 },
  { month: 'Dec', value: 388000 },
  { month: 'Jan', value: 401000 },
  { month: 'Feb', value: 419000 },
  { month: 'Mar', value: 404400 },
]

function StatCard({ label, value, sub, subColor, delay = 0, accent }) {
  return (
    <div className="fade-up" style={{
      background: 'var(--bg2)', borderRadius: 16,
      padding: '22px 24px', border: '1px solid var(--border)',
      flex: 1, position: 'relative', overflow: 'hidden',
      animationDelay: delay + 'ms',
      transition: 'border-color 0.2s, transform 0.2s',
      cursor: 'default',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--border2)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {accent && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, ${accent}, transparent)`,
          borderRadius: '16px 16px 0 0',
        }} />
      )}
      <p style={{
        fontSize: 10, color: 'var(--muted)', marginBottom: 10,
        letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 500,
        fontFamily: 'var(--font-body)',
      }}>
        {label}
      </p>
      <p style={{
        fontSize: 28, fontWeight: 600, lineHeight: 1,
        fontFamily: 'var(--font-display)', letterSpacing: 0.5,
      }}>
        {value}
      </p>
      {sub && (
        <p style={{
          fontSize: 12, color: subColor || 'var(--muted)', marginTop: 10,
          display: 'flex', alignItems: 'center', gap: 4,
          fontFamily: 'var(--font-body)',
        }}>
          {sub}
        </p>
      )}
    </div>
  )
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg3)', border: '1px solid var(--border2)',
      borderRadius: 12, padding: '12px 16px',
      backdropFilter: 'blur(10px)',
    }}>
      <p style={{ color: 'var(--muted)', marginBottom: 4, fontSize: 11, fontFamily: 'var(--font-body)', letterSpacing: 0.5 }}>
        {label}
      </p>
      <p style={{ fontWeight: 600, fontSize: 20, fontFamily: 'var(--font-display)', letterSpacing: 0.5 }}>
        ${payload[0].value.toLocaleString()}
      </p>
    </div>
  )
}

export default function Dashboard({ assets }) {
  const [cryptoPrices, setCryptoPrices] = useState({})

  const total = assets.reduce((sum, a) => sum + a.value, 0)
  const chartData = [...HISTORY.slice(0, -1), { month: 'Now', value: total }]

  const pieData = Object.keys(CATEGORY_COLORS).map(cat => ({
    name: cat,
    value: assets.filter(a => a.category === cat).reduce((s, a) => s + a.value, 0)
  })).filter(d => d.value > 0)

  const topAssets = [...assets].sort((a, b) => b.value - a.value).slice(0, 5)

  useEffect(() => {
    const ids = assets.filter(a => a.category === 'Crypto' && a.ticker).map(a => a.ticker).join(',')
    if (!ids) return
    fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`)
      .then(r => r.json()).then(setCryptoPrices).catch(() => {})
  }, [assets])

  const cryptoChanges = assets
    .filter(a => a.category === 'Crypto' && a.ticker && cryptoPrices[a.ticker])
    .map(a => cryptoPrices[a.ticker].usd_24h_change)

  const avgChange = cryptoChanges.length
    ? cryptoChanges.reduce((s, c) => s + c, 0) / cryptoChanges.length
    : null

  return (
    <div style={{ maxWidth: 1100 }}>

      {/* Page header */}
      <div className="fade-up" style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: 'var(--green)', animation: 'pulse-green 2s infinite',
          }} />
          <span style={{
            fontSize: 10, color: 'var(--green)', fontWeight: 500,
            letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'var(--font-body)',
          }}>
            Live
          </span>
        </div>
        <h1 style={{ fontSize: 36, fontWeight: 600, lineHeight: 1.1, fontFamily: 'var(--font-display)', letterSpacing: 0.5 }}>
          Good day 👋
        </h1>
        <p style={{ fontSize: 14, color: 'var(--muted2)', marginTop: 8, fontFamily: 'var(--font-body)', fontWeight: 300 }}>
          Here's your complete financial picture.
        </p>
      </div>

      {/* Stat cards */}
      <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard
          label="Total net worth"
          value={"$" + total.toLocaleString()}
          sub="↑ $24,400 this month"
          subColor="var(--green)" delay={0} accent="var(--green)"
        />
        <StatCard
          label="Biggest holding"
          value={assets.length ? assets.reduce((a, b) => a.value > b.value ? a : b).name : '—'}
          sub={"$" + (assets.length ? Math.max(...assets.map(a => a.value)).toLocaleString() : '0')}
          subColor="var(--muted2)" delay={80} accent="var(--blue)"
        />
        <StatCard
          label="Crypto 24h"
          value={avgChange != null ? (avgChange >= 0 ? '+' : '') + avgChange.toFixed(2) + '%' : '—'}
          sub={avgChange != null ? "Avg. across your crypto" : "No crypto data yet"}
          subColor={avgChange != null ? (avgChange >= 0 ? 'var(--green)' : 'var(--red)') : 'var(--muted)'}
          delay={160}
          accent={avgChange != null ? (avgChange >= 0 ? 'var(--green)' : 'var(--red)') : 'var(--purple)'}
        />
      </div>

      {/* Chart + Allocation */}
      <div className="chart-grid" style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16, marginBottom: 24 }}>
        <div className="fade-up" style={{
          background: 'var(--bg2)', borderRadius: 16, padding: '24px',
          border: '1px solid var(--border)', animationDelay: '200ms',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <div>
              <p style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 500, marginBottom: 6, fontFamily: 'var(--font-body)' }}>
                Net worth
              </p>
              <p style={{ fontSize: 24, fontWeight: 600, fontFamily: 'var(--font-display)', letterSpacing: 0.5 }}>
                ${total.toLocaleString()}
              </p>
            </div>
            <div style={{
              background: 'var(--green-dim)', color: 'var(--green)',
              padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
              border: '1px solid rgba(0,217,139,0.2)', fontFamily: 'var(--font-body)',
            }}>
              +6.4% 6mo
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 5, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#00d98b" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#00d98b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--muted)', fontFamily: 'Geologica' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="value" stroke="var(--green)" strokeWidth={2.5} fill="url(#chartGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="fade-up" style={{
          background: 'var(--bg2)', borderRadius: 16, padding: '24px',
          border: '1px solid var(--border)', animationDelay: '250ms',
        }}>
          <p style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 500, marginBottom: 20, fontFamily: 'var(--font-body)' }}>
            Allocation
          </p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <PieChart width={160} height={160}>
              <Pie data={pieData} cx={75} cy={75} innerRadius={50} outerRadius={72} dataKey="value" strokeWidth={0} paddingAngle={3}>
                {pieData.map(entry => <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name]} />)}
              </Pie>
            </PieChart>
          </div>
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pieData.map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: CATEGORY_COLORS[d.name], flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: 'var(--muted2)', flex: 1, fontFamily: 'var(--font-body)' }}>{d.name}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-display)', letterSpacing: 0.3 }}>
                  {Math.round(d.value / total * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top assets */}
      <div className="fade-up" style={{
        background: 'var(--bg2)', borderRadius: 16,
        border: '1px solid var(--border)', overflow: 'hidden', animationDelay: '300ms',
      }}>
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <p style={{ fontWeight: 600, fontSize: 16, fontFamily: 'var(--font-display)', letterSpacing: 0.3 }}>Top holdings</p>
          <span style={{ fontSize: 11, color: 'var(--muted)', background: 'var(--bg3)', padding: '3px 10px', borderRadius: 20, border: '1px solid var(--border)', fontFamily: 'var(--font-body)' }}>
            {assets.length} assets
          </span>
        </div>

        {topAssets.map((asset, i) => {
          const liveData = asset.ticker ? cryptoPrices[asset.ticker] : null
          const change = liveData?.usd_24h_change
          const pct = (asset.value / total * 100).toFixed(1)
          return (
            <div key={asset.id} style={{
              display: 'flex', alignItems: 'center', padding: '14px 24px',
              borderBottom: i < topAssets.length - 1 ? '1px solid var(--border)' : 'none',
              transition: 'background 0.15s', cursor: 'default',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ width: 28, fontSize: 12, color: 'var(--muted)', fontWeight: 500, fontFamily: 'var(--font-display)' }}>
                #{i + 1}
              </div>
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: CATEGORY_COLORS[asset.category] + '22',
                border: '1px solid ' + CATEGORY_COLORS[asset.category] + '44',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, marginRight: 14,
              }}>
                {asset.category === 'Stocks' ? '📈' : asset.category === 'Crypto' ? '₿' : asset.category === 'Real Estate' ? '🏠' : asset.category === 'Retirement' ? '🏦' : '💵'}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 500, fontFamily: 'var(--font-body)' }}>{asset.name}</p>
                <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2, fontFamily: 'var(--font-body)' }}>{asset.category}</p>
              </div>
              <div style={{ textAlign: 'right', marginRight: 24 }}>
                <p style={{ fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-display)', letterSpacing: 0.3 }}>
                  ${asset.value.toLocaleString()}
                </p>
                {change != null ? (
                  <p style={{ fontSize: 11, marginTop: 2, fontFamily: 'var(--font-body)', color: change >= 0 ? 'var(--green)' : 'var(--red)' }}>
                    {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(2)}%
                  </p>
                ) : (
                  <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2, fontFamily: 'var(--font-body)' }}>{pct}% of total</p>
                )}
              </div>
              <div className="holdings-bar" style={{ width: 80 }}>
                <div style={{ height: 4, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 2, width: pct + '%', background: CATEGORY_COLORS[asset.category], transition: 'width 1s ease' }} />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}