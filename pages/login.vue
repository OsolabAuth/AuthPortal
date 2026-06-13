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
    <section class="panel">
      <p class="eyebrow">OsolabAuth</p>
      <h1>Login</h1>
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
      <NuxtLink class="text-link" to="/signup">Create account</NuxtLink>
      <NuxtLink class="text-link" to="/password/reset">Forgot password</NuxtLink>
      <p v-if="error" class="error">{{ error }}</p>
    </section>
  </main>
</template>
