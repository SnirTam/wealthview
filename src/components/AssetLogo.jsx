import { useState } from 'react'

const CATEGORY_COLORS = {
  'Stocks':      '#4d9fff',
  'Crypto':      '#ffb340',
  'Real Estate': '#00d98b',
  'Retirement':  '#a78bfa',
  'Cash':        '#6b6b80',
}

const CATEGORY_ICONS = {
  'Stocks': '📈', 'Crypto': '₿', 'Real Estate': '🏠', 'Retirement': '🏦', 'Cash': '💵',
}

// CoinGecko static CDN — no API key needed
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

export function getLogoUrl(ticker, category) {
  if (!ticker) return null
  if (category === 'Stocks') {
    return `https://assets.parqet.com/logos/symbol/${ticker.toUpperCase()}?format=png`
  }
  if (category === 'Crypto') {
    return CRYPTO_LOGOS[ticker.toLowerCase()] || null
  }
  return null
}

export default function AssetLogo({ ticker, category, size = 36, style: extraStyle = {} }) {
  const [error, setError] = useState(false)
  const logoUrl = !error ? getLogoUrl(ticker, category) : null
  const color = CATEGORY_COLORS[category] || '#4d9fff'

  const containerStyle = {
    width: size, height: size,
    borderRadius: Math.round(size * 0.28),
    flexShrink: 0, overflow: 'hidden',
    background: color + '22',
    border: '1px solid ' + color + '44',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: Math.round(size * 0.45),
    ...extraStyle,
  }

  if (logoUrl) {
    return (
      <div style={containerStyle}>
        <img
          src={logoUrl}
          alt={ticker || category}
          onError={() => setError(true)}
          style={{ width: '80%', height: '80%', objectFit: 'contain' }}
        />
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      {CATEGORY_ICONS[category] || '💰'}
    </div>
  )
}
