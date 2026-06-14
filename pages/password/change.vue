<script setup lang="ts">
const config = useRuntimeConfig()
const email = ref('')
const currentPassword = ref('')
const newPassword = ref('')
const stepUpToken = ref('')
const result = ref('')
const error = ref('')

async function changePassword() {
  error.value = ''
  result.value = ''
  const response = await fetch(`${config.public.authApiBase}/account/password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email.value,
      current_password: currentPassword.value,
      new_password: newPassword.value,
      step_up_token: stepUpToken.value
    })
  })
  const body = await response.json()
  if (!response.ok) {
    error.value = body.error_description || 'password change failed'
    return
  }
  result.value = body.result
}
</script>

<template>
  <main class="app-shell">
    <section class="panel auth-panel">
      <header class="page-header">
        <span class="brand-mark">OsolabAuth</span>
        <h1>Change password</h1>
        <p class="page-copy">A recent step-up token is required for this account operation.</p>
      </header>
      <form class="form" @submit.prevent="changePassword">
        <label>
          Email
          <input v-model="email" type="email" autocomplete="email" required>
        </label>
        <label>
          Current password
          <input v-model="currentPassword" type="password" autocomplete="current-password" required>
        </label>
        <label>
          New password
          <input v-model="newPassword" type="password" autocomplete="new-password" required>
        </label>
        <label>
          Step-up token
          <input v-model="stepUpToken" required>
        </label>
        <button type="submit">Change password</button>
      </form>
      <div class="inline-links">
        <NuxtLink class="text-link" to="/mfa">Get step-up token</NuxtLink>
        <NuxtLink class="text-link" to="/me">Back to my page</NuxtLink>
      </div>
      <p v-if="error" class="error">{{ error }}</p>
      <p v-if="result" class="success">{{ result }}</p>
    </section>
  </main>
</template>
