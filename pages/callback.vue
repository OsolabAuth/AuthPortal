<script setup lang="ts">
const config = useRuntimeConfig()
const route = useRoute()
const tokenResponse = ref('')
const error = ref('')

const code = computed(() => String(route.query.code || ''))
const state = computed(() => String(route.query.state || ''))
const expectedState = computed(() => import.meta.client ? sessionStorage.getItem('state') || '' : '')
const stateMatches = computed(() => Boolean(state.value && expectedState.value && state.value === expectedState.value))

async function exchangeToken() {
  error.value = ''
  const verifier = sessionStorage.getItem('code_verifier') || ''
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
  const body = await response.json()
  tokenResponse.value = JSON.stringify(body, null, 2)
  if (!response.ok) {
    error.value = body.error_description || 'token exchange failed'
  }
}
</script>

<template>
  <main class="app-shell">
    <section class="panel">
      <p class="eyebrow">OsolabAuth</p>
      <h1>Callback</h1>
      <dl>
        <dt>Code</dt>
        <dd>{{ code }}</dd>
        <dt>State</dt>
        <dd>{{ stateMatches ? 'ok' : 'mismatch' }}</dd>
      </dl>
      <button type="button" :disabled="!code || !stateMatches" @click="exchangeToken">Exchange token</button>
      <p v-if="error" class="error">{{ error }}</p>
      <pre v-if="tokenResponse">{{ tokenResponse }}</pre>
    </section>
  </main>
</template>
