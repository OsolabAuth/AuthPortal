<script setup lang="ts">
const config = useRuntimeConfig()
const email = ref('demo@example.com')
const emailCode = ref('')
const developmentCode = ref('')
const authenticatorCode = ref('')
const authenticatorSecret = ref('')
const authenticatorUri = ref('')
const stepUpToken = ref('')
const error = ref('')

async function startEmail() {
  error.value = ''
  const response = await fetch(`${config.public.authApiBase}/mfa/email/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.value })
  })
  const body = await response.json()
  if (!response.ok) {
    error.value = body.error_description || 'email challenge failed'
    return
  }
  developmentCode.value = body.code
  emailCode.value = body.code
}

async function verifyEmail() {
  await verify('/mfa/email/verify', emailCode.value)
}

async function setupAuthenticator() {
  error.value = ''
  const response = await fetch(`${config.public.authApiBase}/mfa/authenticator/setup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.value })
  })
  const body = await response.json()
  if (!response.ok) {
    error.value = body.error_description || 'authenticator setup failed'
    return
  }
  authenticatorSecret.value = body.secret
  authenticatorUri.value = body.otpauth_uri
}

async function verifyAuthenticator() {
  await verify('/mfa/authenticator/verify', authenticatorCode.value)
}

async function verify(path: string, code: string) {
  error.value = ''
  stepUpToken.value = ''
  const response = await fetch(`${config.public.authApiBase}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.value, code })
  })
  const body = await response.json()
  if (!response.ok) {
    error.value = body.error_description || 'verification failed'
    return
  }
  stepUpToken.value = body.step_up_token
}
</script>

<template>
  <main class="app-shell">
    <section class="panel">
      <p class="eyebrow">OsolabAuth</p>
      <h1>MFA</h1>
      <label>
        Email
        <input v-model="email" type="email">
      </label>

      <div class="stack">
        <button type="button" @click="startEmail">Send email code</button>
        <p v-if="developmentCode">Development code: {{ developmentCode }}</p>
        <label>
          Email code
          <input v-model="emailCode" inputmode="numeric">
        </label>
        <button type="button" @click="verifyEmail">Verify email code</button>
      </div>

      <div class="stack">
        <button type="button" @click="setupAuthenticator">Setup authenticator</button>
        <p v-if="authenticatorSecret">Secret: {{ authenticatorSecret }}</p>
        <pre v-if="authenticatorUri">{{ authenticatorUri }}</pre>
        <label>
          Authenticator code
          <input v-model="authenticatorCode" inputmode="numeric">
        </label>
        <button type="button" @click="verifyAuthenticator">Verify authenticator</button>
      </div>

      <p v-if="error" class="error">{{ error }}</p>
      <pre v-if="stepUpToken">{{ stepUpToken }}</pre>
    </section>
  </main>
</template>
