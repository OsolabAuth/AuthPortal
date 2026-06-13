<script setup lang="ts">
const config = useRuntimeConfig()
const email = ref('')
const password = ref('')
const stepUpToken = ref('')
const result = ref('')
const error = ref('')

async function withdraw() {
  error.value = ''
  result.value = ''
  const response = await fetch(`${config.public.authApiBase}/account/withdrawal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email.value,
      password: password.value,
      step_up_token: stepUpToken.value
    })
  })
  const body = await response.json()
  if (!response.ok) {
    error.value = body.error_description || 'withdrawal failed'
    return
  }
  result.value = body.result
}
</script>

<template>
  <main class="app-shell">
    <section class="panel">
      <p class="eyebrow">OsolabAuth</p>
      <h1>Account withdrawal</h1>
      <form class="form" @submit.prevent="withdraw">
        <label>
          Email
          <input v-model="email" type="email" autocomplete="email" required>
        </label>
        <label>
          Password
          <input v-model="password" type="password" autocomplete="current-password" required>
        </label>
        <label>
          Step-up token
          <input v-model="stepUpToken" required>
        </label>
        <button type="submit">Withdraw account</button>
      </form>
      <NuxtLink class="text-link" to="/mfa">Get step-up token</NuxtLink>
      <p v-if="error" class="error">{{ error }}</p>
      <p v-if="result" class="success">{{ result }}</p>
    </section>
  </main>
</template>
