<script setup lang="ts">
const config = useRuntimeConfig()
const email = ref('')
const emailCode = ref('')
const authenticatorCode = ref('')
const authenticatorSecret = ref('')
const authenticatorUri = ref('')
const stepUpToken = ref('')
const error = ref('')
const sendingEmail = ref(false)
const verifyingEmail = ref(false)
const settingUpAuthenticator = ref(false)
const verifyingAuthenticator = ref(false)

async function startEmail() {
  error.value = ''
  sendingEmail.value = true
  try {
    const response = await fetch(`${config.public.authApiBase}/mfa/email/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value })
    })
    const body = await response.json()
    if (!response.ok) {
      error.value = body.error_description || 'email challenge failed'
    }
  }
  finally {
    sendingEmail.value = false
  }
}

async function verifyEmail() {
  verifyingEmail.value = true
  try {
    await verify('/mfa/email/verify', emailCode.value)
  }
  finally {
    verifyingEmail.value = false
  }
}

async function setupAuthenticator() {
  error.value = ''
  settingUpAuthenticator.value = true
  try {
    const response = await fetch(`${config.public.authApiBase}/mfa/authenticator/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.value,
        step_up_token: stepUpToken.value
      })
    })
    const body = await response.json()
    if (!response.ok) {
      error.value = body.error_description || 'authenticator setup failed'
      return
    }
    authenticatorSecret.value = body.secret
    authenticatorUri.value = body.otpauth_uri
  }
  finally {
    settingUpAuthenticator.value = false
  }
}

async function verifyAuthenticator() {
  verifyingAuthenticator.value = true
  try {
    await verify('/mfa/authenticator/verify', authenticatorCode.value)
  }
  finally {
    verifyingAuthenticator.value = false
  }
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
    <section class="panel auth-panel">
      <header class="page-header">
        <span class="brand-mark">OsolabAuth</span>
        <h1>MFA</h1>
        <p class="page-copy">Verify your identity before changing sensitive account settings.</p>
      </header>
      <label>
        Email
        <input v-model="email" type="email" autocomplete="email" required>
      </label>

      <div class="stack">
        <button type="button" :disabled="!email || sendingEmail" @click="startEmail">
          {{ sendingEmail ? 'Sending...' : 'Send email code' }}
        </button>
        <label>
          Email code
          <input v-model="emailCode" inputmode="numeric" autocomplete="one-time-code" required>
        </label>
        <button type="button" :disabled="!email || !emailCode || verifyingEmail" @click="verifyEmail">
          {{ verifyingEmail ? 'Verifying...' : 'Verify email code' }}
        </button>
      </div>

      <div class="stack">
        <button type="button" :disabled="!email || !stepUpToken || settingUpAuthenticator" @click="setupAuthenticator">
          {{ settingUpAuthenticator ? 'Setting up...' : 'Setup authenticator' }}
        </button>
        <p class="notice">Authenticator setup requires a recent step-up token.</p>
        <p v-if="authenticatorSecret">Secret: {{ authenticatorSecret }}</p>
        <pre v-if="authenticatorUri">{{ authenticatorUri }}</pre>
        <label>
          Authenticator code
          <input v-model="authenticatorCode" inputmode="numeric" autocomplete="one-time-code" required>
        </label>
        <button type="button" :disabled="!email || !authenticatorCode || verifyingAuthenticator" @click="verifyAuthenticator">
          {{ verifyingAuthenticator ? 'Verifying...' : 'Verify authenticator' }}
        </button>
      </div>

      <p v-if="error" class="error">{{ error }}</p>
      <pre v-if="stepUpToken">{{ stepUpToken }}</pre>
      <div class="inline-links">
        <NuxtLink class="text-link" to="/me">Back to my page</NuxtLink>
      </div>
    </section>
  </main>
</template>
