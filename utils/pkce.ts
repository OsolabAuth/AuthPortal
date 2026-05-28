export function randomString(length = 64): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  const values = new Uint8Array(length)
  crypto.getRandomValues(values)
  return Array.from(values, value => chars[value % chars.length]).join('')
}

export async function s256Challenge(verifier: string): Promise<string> {
  const bytes = new TextEncoder().encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return base64Url(new Uint8Array(digest))
}

function base64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}
