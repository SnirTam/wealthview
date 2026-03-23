export async function startCheckout(email) {
  try {
    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else alert('Something went wrong. Please try again.')
  } catch {
    alert('Something went wrong. Please try again.')
  }
}
