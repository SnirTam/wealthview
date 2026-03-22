import { useEffect } from 'react'
import confetti from 'canvas-confetti'

const MILESTONES = [
  {
    threshold: 10000000,
    emoji: '🌟',
    label: '$10,000,000',
    message: 'Ten million. Elite territory. Incredible journey.',
  },
  {
    threshold: 5000000,
    emoji: '⭐',
    label: '$5,000,000',
    message: "Five million. You've made it to financial freedom.",
  },
  {
    threshold: 1000000,
    emoji: '👑',
    label: '$1,000,000',
    message: "You're a millionaire. Only 3% of people get here.",
  },
  {
    threshold: 500000,
    emoji: '💎',
    label: '$500,000',
    message: "Half a million dollars. You're building generational wealth.",
  },
  {
    threshold: 250000,
    emoji: '🚀',
    label: '$250,000',
    message: 'A quarter million. Financial independence is in sight.',
  },
  {
    threshold: 100000,
    emoji: '🏆',
    label: '$100,000',
    message: "Six figures! You're in the top 10% of savers. Keep going!",
  },
  {
    threshold: 50000,
    emoji: '📈',
    label: '$50,000',
    message: "Fifty thousand strong. You're ahead of 80% of your peers.",
  },
  {
    threshold: 10000,
    emoji: '💰',
    label: '$10,000',
    message: "You've built your first $10,000 — the hardest part is starting!",
  },
]

function getMilestoneData(milestone) {
  const found = MILESTONES.find(m => m.threshold === milestone)
  if (found) return found
  // fallback for any value
  return {
    emoji: '🎉',
    label: '$' + milestone.toLocaleString(),
    message: `You've reached $${milestone.toLocaleString()}. Keep growing!`,
  }
}

export default function MilestoneModal({ milestone, onClose }) {
  const data = getMilestoneData(milestone)

  useEffect(() => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#00d98b', '#2dd4bf', '#4d9fff', '#a78bfa'],
    })
  }, [])

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
    }}>
      <div style={{
        background: 'var(--bg2)',
        borderRadius: 24,
        padding: 48,
        width: '100%',
        maxWidth: 440,
        border: '1px solid var(--border2)',
        textAlign: 'center',
        animation: 'fadeUp 0.4s ease both',
      }}>

        {/* Big emoji */}
        <div style={{ fontSize: 64, lineHeight: 1, marginBottom: 20 }}>
          {data.emoji}
        </div>

        {/* "Milestone reached!" badge */}
        <p style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          color: 'var(--green)',
          fontFamily: 'var(--font-body)',
          marginBottom: 16,
        }}>
          🎉 Milestone reached!
        </p>

        {/* Amount */}
        <div style={{
          fontSize: 48,
          fontWeight: 700,
          fontFamily: 'var(--font-display)',
          marginBottom: 18,
          background: 'linear-gradient(135deg, var(--green), var(--teal))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          lineHeight: 1.1,
        }}>
          {data.label}
        </div>

        {/* Motivational message */}
        <p style={{
          color: 'var(--muted2)',
          fontSize: 16,
          lineHeight: 1.6,
          marginBottom: 36,
          fontFamily: 'var(--font-body)',
        }}>
          {data.message}
        </p>

        {/* CTA */}
        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '14px 0',
            borderRadius: 12,
            border: 'none',
            background: 'linear-gradient(135deg, var(--green), var(--teal))',
            color: '#0a0a0f',
            fontSize: 15,
            fontWeight: 700,
            fontFamily: 'var(--font-body)',
            cursor: 'pointer',
            letterSpacing: 0.3,
          }}
        >
          Keep growing →
        </button>
      </div>
    </div>
  )
}
