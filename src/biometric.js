const LS_CRED    = 'wv_biometric_cred'
const LS_SESSION = 'wv_biometric_session'

export function isBiometricSupported() {
  return !!(window.PublicKeyCredential && navigator.credentials)
}

export async function isBiometricAvailable() {
  if (!isBiometricSupported()) return false
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
  } catch {
    return false
  }
}

export function getBiometricCredential() {
  try { return JSON.parse(localStorage.getItem(LS_CRED) || 'null') } catch { return null }
}

export async function registerBiometric(userId, userEmail) {
  const challenge    = crypto.getRandomValues(new Uint8Array(32))
  const userIdBytes  = new TextEncoder().encode(userId.slice(0, 64))

  const credential = await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: 'WealthView', id: window.location.hostname },
      user: { id: userIdBytes, name: userEmail, displayName: userEmail },
      pubKeyCredParams: [
        { alg: -7,   type: 'public-key' }, // ES256
        { alg: -257, type: 'public-key' }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred',
      },
      timeout: 60000,
    },
  })

  const credId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)))
  localStorage.setItem(LS_CRED, JSON.stringify({ id: credId, userId, email: userEmail }))
  return credId
}

export async function authenticateWithBiometric() {
  const stored = getBiometricCredential()
  if (!stored) throw new Error('No biometric registered')

  const challenge   = crypto.getRandomValues(new Uint8Array(32))
  const credIdBytes = Uint8Array.from(atob(stored.id), c => c.charCodeAt(0))

  await navigator.credentials.get({
    publicKey: {
      challenge,
      rpId: window.location.hostname,
      allowCredentials: [{ type: 'public-key', id: credIdBytes }],
      userVerification: 'required',
      timeout: 60000,
    },
  })
  return true
}

export function saveBiometricSession(accessToken, refreshToken) {
  localStorage.setItem(LS_SESSION, JSON.stringify({ accessToken, refreshToken }))
}

export function getBiometricSession() {
  try { return JSON.parse(localStorage.getItem(LS_SESSION) || 'null') } catch { return null }
}

export function clearBiometric() {
  localStorage.removeItem(LS_CRED)
  localStorage.removeItem(LS_SESSION)
}
