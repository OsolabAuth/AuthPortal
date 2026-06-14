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
  sessionStorage.setItem('nonce', nonce)

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
    <section class="panel auth-panel">
      <header class="page-header">
        <div class="brand-line">
          <span class="brand-mark">OsolabAuth</span>
        </div>
        <h1>Sign in to Osolab</h1>
        <p class="page-copy">
          Manage your account, security settings, and delegated AI agents from one place.
        </p>
      </header>

      <div class="action-row">
        <button type="button" @click="startLogin">Sign in with OsolabAuth</button>
        <NuxtLink class="secondary-action" to="/login">Use email and password</NuxtLink>
      </div>

      <section class="section-block">
        <h2 class="section-title">Account tools</h2>
        <div class="link-grid">
          <NuxtLink class="nav-card" to="/me">
            <strong>My page</strong>
            <span>Review profile and account actions.</span>
          </NuxtLink>
          <NuxtLink class="nav-card" to="/agent">
            <strong>AI agents</strong>
            <span>Manage delegated agent credentials.</span>
          </NuxtLink>
        </div>
      </section>

      <section class="section-block">
        <h2 class="section-title">Related products</h2>
        <div class="product-grid">
          <a class="product-card" href="https://osolab.jp" target="_blank" rel="noreferrer">
            <strong>Osolab</strong>
            <span>Portfolio and service hub.</span>
          </a>
          <a class="product-card" href="https://taiga.osolab.jp" target="_blank" rel="noreferrer">
            <strong>Taiga</strong>
            <span>Project and task management.</span>
          </a>
          <a class="product-card" href="https://github.com/OsolabAuth" target="_blank" rel="noreferrer">
            <strong>GitHub</strong>
            <span>Source code and design history.</span>
          </a>
        </div>
      </section>
      <p v-if="error" class="error">{{ error }}</p>
    </section>
  </main>
</template>
