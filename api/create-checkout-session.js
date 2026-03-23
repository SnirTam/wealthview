export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const { email } = req.body
    const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        'Authorization': `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`
      },
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            checkout_data: { email },
            product_options: {
              redirect_url: 'https://wealthview.site/?upgraded=true'
            }
          },
          relationships: {
            store: { data: { type: 'stores', id: '324578' } },
            variant: { data: { type: 'variants', id: '1439079' } }
          }
        }
      })
    })
    const data = await response.json()
    const url = data?.data?.attributes?.url
    if (!url) return res.status(500).json({ error: 'No checkout URL returned' })
    res.status(200).json({ url })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
