import { loadStripe } from '@stripe/stripe-js'

export const stripePromise = loadStripe('pk_test_51TDnHXJxFIiqk8Ln8COX6Ui4fLo9WSjESgL7ZxhRhk2VabzfRxTHQkRs2DnT6Bb5nd3zmxlCXuUPDAFiVsV9W6Jl00w0yC9dRZ')

export async function startCheckout(email) {
  try {
    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email || '' }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else alert('Error: ' + JSON.stringify(data))
  } catch (err) {
    console.error('Checkout error:', err)
    alert('Error: ' + err.message)
  }
}