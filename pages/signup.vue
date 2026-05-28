<script setup lang="ts">
const config = useRuntimeConfig()
const email = ref('')
const password = ref('')
const name = ref('')
const birthDate = ref('')
const result = ref('')
const error = ref('')

async function signup() {
  error.value = ''
  result.value = ''
  const response = await fetch(`${config.public.authApiBase}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email.value,
      password: password.value,
      name: name.value,
      birth_date: birthDate.value
    })
  })
  const body = await response.json()
  if (!response.ok) {
    error.value = body.error_description || 'signup failed'
    return
  }

  result.value = `Created ${body.email}`
}
</script>

<template>
  <main class="app-shell">
    <section class="panel">
      <p class="eyebrow">OsolabAuth</p>
      <h1>Create account</h1>
      <form class="form" @submit.prevent="signup">
        <label>
          Email
          <input v-model="email" type="email" autocomplete="email" required>
        </label>
        <label>
          Password
          <input v-model="password" type="password" autocomplete="new-password" required>
        </label>
        <label>
          Name
          <input v-model="name" autocomplete="name" required>
        </label>
        <label>
          Birth date
          <input v-model="birthDate" type="date" required>
        </label>
        <button type="submit">Create account</button>
      </form>
      <NuxtLink class="text-link" to="/login">Back to login</NuxtLink>
      <p v-if="error" class="error">{{ error }}</p>
      <p v-if="result" class="success">{{ result }}</p>
    </section>
  </main>
</template>
