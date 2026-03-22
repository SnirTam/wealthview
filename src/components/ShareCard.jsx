import html2canvas from 'html2canvas'
import { formatAmount } from '../pages/Dashboard'

// Decorative SVG line chart — 6 points trending upward
function TrendLine() {
  const points = [
    [0, 60], [60, 48], [120, 52], [180, 32], [240, 22], [300, 8],
  ]
  const polylinePoints = points.map(p => p.join(',')).join(' ')

  return (
    <svg
      width="100%"
      viewBox="0 0 300 70"
      preserveAspectRatio="none"
      style={{ display: 'block', opacity: 0.4 }}
    >
      <defs>
        <linearGradient id="sc-line-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#00d98b" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="#2dd4bf" stopOpacity="1"/>
        </linearGradient>
        <linearGradient id="sc-fill-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00d98b" stopOpacity="0.18"/>
          <stop offset="100%" stopColor="#00d98b" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {/* Fill area */}
      <polygon
        points={`0,70 ${polylinePoints} 300,70`}
        fill="url(#sc-fill-grad)"
      />
      {/* Line */}
      <polyline
        points={polylinePoints}
        fill="none"
        stroke="url(#sc-line-grad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End dot */}
      <circle cx="300" cy="8" r="4" fill="#2dd4bf"/>
    </svg>
  )
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function ShareCard({ total, currency, user, onClose }) {
  const todayStr = formatDate(new Date())
  const formattedTotal = formatAmount(total, currency)

  async function handleDownload() {
    const canvas = await html2canvas(document.getElementById('share-card-preview'), {
      scale: 2,
      backgroundColor: '#0a0a0f',
      useCORS: true,
    })
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'my-net-worth.png'
      a.click()
      URL.revokeObjectURL(url)
    })
  }

  async function handleCopy() {
    const canvas = await html2canvas(document.getElementById('share-card-preview'), {
      scale: 2,
      backgroundColor: '#0a0a0f',
      useCORS: true,
    })
    canvas.toBlob(blob =>
      navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
    )
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 300,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg2)',
          borderRadius: 24,
          padding: 32,
          width: '100%',
          maxWidth: 480,
          border: '1px solid var(--border2)',
          animation: 'fadeUp 0.35s ease both',
        }}
      >
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{
            fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text)',
          }}>
            Share your net worth
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8,
              color: 'var(--muted2)', cursor: 'pointer', width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontFamily: 'var(--font-body)', flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        {/* Share card preview */}
        <div
          id="share-card-preview"
          style={{
            background: '#0a0a0f',
            borderRadius: 20,
            padding: 32,
            width: 400,
            maxWidth: '100%',
            margin: '0 auto',
            border: '1px solid rgba(255,255,255,0.07)',
            fontFamily: "'Geologica', sans-serif",
          }}
        >
          {/* Top: logo + wordmark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: 'linear-gradient(135deg, #00d98b, #2dd4bf)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 17, fontWeight: 700, color: '#0a0a0f', flexShrink: 0,
            }}>W</div>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#f0f0f5', letterSpacing: 0.3 }}>
              Wealthview
            </span>
          </div>

          {/* Label */}
          <p style={{ fontSize: 12, color: '#6b6b80', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
            My Net Worth
          </p>

          {/* Big number */}
          <div style={{
            fontSize: 42,
            fontWeight: 700,
            color: '#00d98b',
            marginBottom: 20,
            lineHeight: 1.1,
            letterSpacing: -1,
          }}>
            {formattedTotal}
          </div>

          {/* Trend chart */}
          <div style={{ marginBottom: 20 }}>
            <TrendLine />
          </div>

          {/* Date row */}
          <p style={{ fontSize: 12, color: '#9898aa', marginBottom: 20 }}>
            {todayStr}
          </p>

          {/* Watermark */}
          <p style={{ fontSize: 10, color: '#6b6b80', letterSpacing: 0.3 }}>
            Tracked with Wealthview · wealthview.app
          </p>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          <button
            onClick={handleDownload}
            style={{
              flex: 1,
              padding: '12px 0',
              borderRadius: 10,
              border: 'none',
              background: 'linear-gradient(135deg, var(--green), var(--teal))',
              color: '#0a0a0f',
              fontSize: 14,
              fontWeight: 700,
              fontFamily: 'var(--font-body)',
              cursor: 'pointer',
            }}
          >
            Download image
          </button>
          <button
            onClick={handleCopy}
            style={{
              flex: 1,
              padding: '12px 0',
              borderRadius: 10,
              border: '1px solid var(--border2)',
              background: 'var(--bg3)',
              color: 'var(--text)',
              fontSize: 14,
              fontWeight: 600,
              fontFamily: 'var(--font-body)',
              cursor: 'pointer',
            }}
          >
            Copy to clipboard
          </button>
        </div>
      </div>
    </div>
  )
}
