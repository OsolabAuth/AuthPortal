<script setup lang="ts">
const config = useRuntimeConfig()
const email = ref('')
const birthDate = ref('')
const emailCode = ref('')
const newPassword = ref('')
const newPasswordConfirm = ref('')
const result = ref('')
const error = ref('')

async function sendEmailCode() {
  error.value = ''
  result.value = ''
  const response = await fetch(`${config.public.authApiBase}/password/reset/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email.value,
      birth_date: birthDate.value
    })
  })
  const body = await response.json()
  if (!response.ok) {
    error.value = body.error_description || 'email challenge failed'
    return
  }

  result.value = body.result || 'reset_challenge_started'
}

async function resetPassword() {
  error.value = ''
  result.value = ''
  if (newPassword.value !== newPasswordConfirm.value) {
    error.value = 'new passwords do not match'
    return
  }

  const response = await fetch(`${config.public.authApiBase}/password/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email.value,
      birth_date: birthDate.value,
      email_code: emailCode.value,
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
        <div class="button-row">
          <button type="button" :disabled="!email || !birthDate" @click="sendEmailCode">Send email code</button>
        </div>
        <label>
          Email code
          <input v-model="emailCode" inputmode="numeric" autocomplete="one-time-code" required>
        </label>
        <label>
          New password
          <input v-model="newPassword" type="password" autocomplete="new-password" required>
        </label>
        <label>
          New password confirmation
          <input v-model="newPasswordConfirm" type="password" autocomplete="new-password" required>
        </label>
        <button type="submit">Reset password</button>
      </form>
      <p v-if="error" class="error">{{ error }}</p>
      <p v-if="result" class="success">{{ result }}</p>
    </section>
  </main>
</template>
