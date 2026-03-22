import { useState } from 'react'

const CATEGORY_COLORS = {
  'Stocks':      '#4d9fff',
  'Crypto':      '#ffb340',
  'Real Estate': '#00d98b',
  'Retirement':  '#a78bfa',
  'Cash':        '#6b6b80',
}

const CRYPTO_LOGOS = {
  bitcoin:          'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
  ethereum:         'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  solana:           'https://assets.coingecko.com/coins/images/4128/small/solana.png',
  ripple:           'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png',
  dogecoin:         'https://assets.coingecko.com/coins/images/5/small/dogecoin.png',
  cardano:          'https://assets.coingecko.com/coins/images/975/small/cardano.png',
  'shiba-inu':      'https://assets.coingecko.com/coins/images/11939/small/shiba.png',
  chainlink:        'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png',
  avalanche:        'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png',
  polkadot:         'https://assets.coingecko.com/coins/images/12171/small/polkadot.png',
  'matic-network':  'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png',
  uniswap:          'https://assets.coingecko.com/coins/images/12504/small/uniswap-uni.png',
  'wrapped-bitcoin':'https://assets.coingecko.com/coins/images/7598/small/wrapped_bitcoin_wbtc.png',
}

// For non-crypto: derive 1-3 letter abbreviation from ticker or name
function getInitials(ticker, category, name) {
  if (category === 'Real Estate') return 'RE'
  if (category === 'Retirement') return '401'
  if (category === 'Cash') return '$'
  if (ticker) return ticker.slice(0, 3).toUpperCase()
  if (name) return name.slice(0, 2).toUpperCase()
  return '?'
}

export function getLogoUrl(ticker, category) {
  if (!ticker) return null
  if (category === 'Crypto') {
    return CRYPTO_LOGOS[ticker.toLowerCase()] || null
  }
  return null
}

export default function AssetLogo({ ticker, category, name, size = 36, style: extraStyle = {} }) {
  const [error, setError] = useState(false)
  const color = CATEGORY_COLORS[category] || '#4d9fff'
  const radius = Math.round(size * 0.28)

  const containerStyle = {
    width: size, height: size,
    borderRadius: radius,
    flexShrink: 0,
    background: color + '1a',
    border: '1px solid ' + color + '3a',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
    ...extraStyle,
  }

  // Crypto: try logo image
  if (category === 'Crypto' && ticker) {
    const logoUrl = !error ? (CRYPTO_LOGOS[ticker.toLowerCase()] || null) : null
    if (logoUrl) {
      return (
        <div style={containerStyle}>
          <img
            src={logoUrl}
            alt={ticker}
            onError={() => setError(true)}
            style={{ width: '72%', height: '72%', objectFit: 'contain' }}
          />
        </div>
      )
    }
  }

  // All others: styled initials
  const initials = getInitials(ticker, category, name)
  const fontSize = initials.length > 2 ? Math.round(size * 0.28) : Math.round(size * 0.35)

  return (
    <div style={containerStyle}>
      <span style={{
        fontSize, fontWeight: 700, color,
        fontFamily: 'var(--font-display)',
        letterSpacing: initials.length > 2 ? -0.5 : 0,
        lineHeight: 1,
        userSelect: 'none',
      }}>
        {initials}
      </span>
    </div>
  )
}
