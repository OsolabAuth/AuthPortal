<script setup lang="ts">
const config = useRuntimeConfig()
const email = ref('')
const password = ref('')
const error = ref('')

async function submitLogin() {
  error.value = ''
  const form = new URLSearchParams({
    email: email.value,
    password: password.value
  })
  const response = await fetch(`${config.public.authApiBase}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    credentials: 'include',
    body: form
  })
  const body = await response.json()
  if (!response.ok) {
    error.value = body.error_description || 'login failed'
    return
  }
  window.location.href = body.redirect_url
}
</script>

<template>
  <main class="app-shell">
    <section class="panel auth-panel">
      <header class="page-header">
        <span class="brand-mark">OsolabAuth</span>
        <h1>Sign in</h1>
        <p class="page-copy">Use your OsolabAuth account to continue.</p>
      </header>
      <form class="form" @submit.prevent="submitLogin">
        <label>
          Email
          <input v-model="email" type="email" autocomplete="username" required>
        </label>
        <label>
          Password
          <input v-model="password" type="password" autocomplete="current-password" required>
        </label>
        <button type="submit">Continue</button>
      </form>

      <section class="section-block">
        <h2 class="section-title">Need help?</h2>
        <div class="link-grid">
          <NuxtLink class="nav-card" to="/signup">
            <strong>Create account</strong>
            <span>Register with email verification.</span>
          </NuxtLink>
          <NuxtLink class="nav-card" to="/password/reset">
            <strong>Reset password</strong>
            <span>Use your login email and birth date.</span>
          </NuxtLink>
        </div>
      </section>

      <div class="inline-links">
        <NuxtLink class="text-link" to="/">Back to portal home</NuxtLink>
      </div>
      <p v-if="error" class="error">{{ error }}</p>
    </section>
  </main>
</template>
