<script setup lang="ts">
const config = useRuntimeConfig()
const email = ref('')
const password = ref('')
const name = ref('')
const birthDate = ref('')
const termsAccepted = ref(false)
const terms = ref<{ title: string, body: string, version: string } | null>(null)
const result = ref('')
const error = ref('')

onMounted(async () => {
  const response = await fetch(`${config.public.authApiBase}/terms/current`)
  if (response.ok) {
    terms.value = await response.json()
  }
})

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
      birth_date: birthDate.value,
      terms_accepted: termsAccepted.value
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
        <section v-if="terms" class="terms-box">
          <h2>{{ terms.title }}</h2>
          <p>{{ terms.body }}</p>
          <small>Version {{ terms.version }}</small>
        </section>
        <label class="checkbox-row">
          <input v-model="termsAccepted" type="checkbox" required>
          I agree to the OsolabAuth terms.
        </label>
        <button type="submit">Create account</button>
      </form>
      <NuxtLink class="text-link" to="/login">Back to login</NuxtLink>
      <p v-if="error" class="error">{{ error }}</p>
      <p v-if="result" class="success">{{ result }}</p>
    </section>
  </main>
</template>
