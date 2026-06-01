export type TokenInspection = {
  label: string
  available: boolean
  error: string
  claims: Record<string, unknown>
  importantClaims: Array<{ name: string, value: string }>
  rawPayload: string
}

const IMPORTANT_CLAIMS = [
  'principal_type',
  'sub',
  'agent_id',
  'agent_name',
  'owner_sub',
  'delegation_id',
  'scope',
  'exp'
]

export function inspectJwt(label: string, token: unknown): TokenInspection {
  if (typeof token !== 'string' || token.length === 0) {
    return emptyInspection(label)
  }

  const parts = token.split('.')
  if (parts.length < 2) {
    return {
      ...emptyInspection(label),
      available: true,
      error: 'Token is not a JWT.'
    }
  }

  try {
    const payload = decodeBase64UrlJson(parts[1])
    const claims = JSON.parse(payload) as Record<string, unknown>
    return {
      label,
      available: true,
      error: '',
      claims,
      importantClaims: IMPORTANT_CLAIMS.map((name) => ({ name, value: formatClaim(claims[name]) })),
      rawPayload: JSON.stringify(claims, null, 2)
    }
  } catch (error) {
    return {
      ...emptyInspection(label),
      available: true,
      error: error instanceof Error ? error.message : 'Token payload decode failed.'
    }
  }
}

export function formatClaim(value: unknown): string {
  if (value === undefined || value === null || value === '') {
    return '-'
  }

  if (Array.isArray(value)) {
    return value.join(' ')
  }

  return String(value)
}

function emptyInspection(label: string): TokenInspection {
  return {
    label,
    available: false,
    error: '',
    claims: {},
    importantClaims: [],
    rawPayload: ''
  }
}

function decodeBase64UrlJson(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')
  const binary = globalThis.atob(padded)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}
