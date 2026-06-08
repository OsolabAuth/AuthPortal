<script setup lang="ts">
const config = useRuntimeConfig()
const email = ref('')
const birthDate = ref('')
const newPassword = ref('')
const result = ref('')
const error = ref('')

async function resetPassword() {
  error.value = ''
  result.value = ''
  const response = await fetch(`${config.public.authApiBase}/password/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email.value,
      birth_date: birthDate.value,
      new_password: newPassword.value
    })
  })
  const body = await response.json()
  if (!response.ok) {
    error.value = body.error_description || 'password reset failed'
    return
  }
  result.value = body.result
}
</script>

<template>
  <main class="app-shell">
    <section class="panel">
      <p class="eyebrow">OsolabAuth</p>
      <h1>Reset password</h1>
      <form class="form" @submit.prevent="resetPassword">
        <label>
          Login email
          <input v-model="email" type="email" autocomplete="email" required>
        </label>
        <label>
          Birth date
          <input v-model="birthDate" type="date" required>
        </label>
        <label>
          New password
          <input v-model="newPassword" type="password" autocomplete="new-password" required>
        </label>
        <button type="submit">Reset password</button>
      </form>
      <p v-if="error" class="error">{{ error }}</p>
      <p v-if="result" class="success">{{ result }}</p>
    </section>
  </main>
</template>
