<script setup lang="ts">
const config = useRuntimeConfig()
const route = useRoute()
const status = ref<'checking' | 'exchanging' | 'authenticated' | 'error'>('checking')
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

async function exchangeToken() {
  if (exchanged.value) {
    return
  }
  error.value = ''
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
  sessionStorage.setItem('auth_access_token', String(body.access_token || ''))
  sessionStorage.setItem('auth_id_token', idToken)
  status.value = 'authenticated'
  await navigateTo('/me', { replace: true })
}

onMounted(() => {
  void exchangeToken()
})
</script>

<template>
  <main class="app-shell">
    <section class="panel auth-panel">
      <header class="page-header">
        <span class="brand-mark">OsolabAuth</span>
        <h1>Completing sign in</h1>
        <p class="page-copy">You will be redirected to your account page when sign in finishes.</p>
      </header>
      <p v-if="status === 'checking'" class="notice">Checking authorization response...</p>
      <p v-if="status === 'exchanging'" class="notice">Signing you in...</p>
      <p v-if="status === 'authenticated'" class="success">Signed in. Opening your account page...</p>
      <div v-if="status === 'error'" class="form-actions">
        <button type="button" :disabled="!code || !stateMatches" @click="exchangeToken">Try again</button>
        <NuxtLink class="secondary-action" to="/">Back to portal home</NuxtLink>
      </div>
      <p v-if="error" class="error">{{ error }}</p>
    </section>
  </main>
</template>
