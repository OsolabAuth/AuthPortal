<script setup lang="ts">
const config = useRuntimeConfig()
const route = useRoute()
const status = ref<'checking' | 'exchanging' | 'authenticated' | 'error'>('checking')
const tokenResponse = ref('')
const error = ref('')
const exchanged = ref(false)

const code = computed(() => String(route.query.code || ''))
const state = computed(() => String(route.query.state || ''))
const expectedState = computed(() => import.meta.client ? sessionStorage.getItem('state') || '' : '')
const stateMatches = computed(() => Boolean(state.value && expectedState.value && state.value === expectedState.value))

function decodeJwtPayload(token: string): Record<string, unknown> {
  const payload = token.split('.')[1]
  if (!payload) {
    throw new Error('id_token payload is missing')
  }
  const normalized = payload.replaceAll('-', '+').replaceAll('_', '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  return JSON.parse(atob(padded))
}

function maskToken(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value
  }
  if (value.length <= 16) {
    return value
  }
  return `${value.slice(0, 8)}...${value.slice(-8)}`
}

function maskTokenResponse(body: Record<string, unknown>): Record<string, unknown> {
  return {
    ...body,
    access_token: maskToken(body.access_token),
    id_token: maskToken(body.id_token)
  }
}

async function exchangeToken() {
  if (exchanged.value) {
    return
  }
  error.value = ''
  tokenResponse.value = ''
  status.value = 'checking'

  if (!code.value) {
    error.value = 'authorization code is missing'
    status.value = 'error'
    return
  }

  if (!stateMatches.value) {
    error.value = 'state mismatch'
    status.value = 'error'
    return
  }

  const verifier = sessionStorage.getItem('code_verifier') || ''
  if (!verifier) {
    error.value = 'PKCE verifier is missing'
    status.value = 'error'
    return
  }

  status.value = 'exchanging'
  exchanged.value = true
  const form = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: config.public.authClientId,
    code: code.value,
    code_verifier: verifier,
    redirect_uri: `${window.location.origin}/callback`
  })
  const response = await fetch(`${config.public.authApiBase}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form
  })
  const body = await response.json() as Record<string, unknown>
  if (!response.ok) {
    error.value = String(body.error_description || 'token exchange failed')
    status.value = 'error'
    exchanged.value = false
    return
  }

  const expectedNonce = sessionStorage.getItem('nonce') || ''
  const idToken = String(body.id_token || '')
  let payload: Record<string, unknown>
  try {
    payload = decodeJwtPayload(idToken)
  }
  catch {
    error.value = 'id_token is invalid'
    status.value = 'error'
    exchanged.value = false
    return
  }
  if (expectedNonce && payload.nonce !== expectedNonce) {
    error.value = 'nonce mismatch'
    status.value = 'error'
    exchanged.value = false
    return
  }

  sessionStorage.removeItem('code_verifier')
  sessionStorage.removeItem('state')
  sessionStorage.removeItem('nonce')
  tokenResponse.value = JSON.stringify(maskTokenResponse(body), null, 2)
  status.value = 'authenticated'
}

onMounted(() => {
  void exchangeToken()
})
</script>

<template>
  <main class="app-shell">
    <section class="panel">
      <p class="eyebrow">OsolabAuth</p>
      <h1>Callback</h1>
      <dl>
        <dt>Code</dt>
        <dd>{{ code ? 'received' : 'missing' }}</dd>
        <dt>State</dt>
        <dd>{{ stateMatches ? 'ok' : 'mismatch' }}</dd>
        <dt>Status</dt>
        <dd>{{ status }}</dd>
      </dl>
      <p v-if="status === 'checking'">Checking authorization response...</p>
      <p v-if="status === 'exchanging'">Exchanging authorization code...</p>
      <p v-if="status === 'authenticated'" class="success">Login complete. Token exchange succeeded.</p>
      <button v-if="status === 'error'" type="button" :disabled="!code || !stateMatches" @click="exchangeToken">Retry token exchange</button>
      <p v-if="error" class="error">{{ error }}</p>
      <pre v-if="tokenResponse">{{ tokenResponse }}</pre>
    </section>
  </main>
</template>
