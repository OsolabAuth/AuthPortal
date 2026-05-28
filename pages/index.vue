<script setup lang="ts">
import { randomString, s256Challenge } from '~/utils/pkce'

const config = useRuntimeConfig()
const error = ref('')

async function startLogin() {
  error.value = ''
  const verifier = randomString(64)
  const state = randomString(32)
  const nonce = randomString(32)
  const challenge = await s256Challenge(verifier)
  sessionStorage.setItem('code_verifier', verifier)
  sessionStorage.setItem('state', state)

  const redirectUri = `${window.location.origin}/callback`
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.public.authClientId,
    redirect_uri: redirectUri,
    scope: config.public.authScope,
    state,
    nonce,
    code_challenge_method: 'S256',
    code_challenge: challenge
  })
  const response = await fetch(`${config.public.authApiBase}/authorize?${params}`, {
    headers: { 'x-auth-ui-response-mode': 'json' },
    credentials: 'include'
  })
  const body = await response.json()
  if (!response.ok) {
    error.value = body.error_description || 'authorize failed'
    return
  }
  window.location.href = body.redirect_url
}
</script>

<template>
  <main class="app-shell">
    <section class="panel">
      <p class="eyebrow">OsolabAuth</p>
      <h1>AuthPortal rebuild</h1>
      <p>Minimal Authorization Code + PKCE flow is available for development.</p>
      <button type="button" @click="startLogin">Login with OsolabAuth</button>
      <p v-if="error" class="error">{{ error }}</p>
    </section>
  </main>
</template>
