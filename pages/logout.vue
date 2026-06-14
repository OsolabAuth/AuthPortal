<script setup lang="ts">
const config = useRuntimeConfig()
const result = ref('')
const error = ref('')

async function logout() {
  error.value = ''
  result.value = ''
  const response = await fetch(`${config.public.authApiBase}/logout`, {
    method: 'POST',
    credentials: 'include'
  })
  const body = await response.json()
  if (!response.ok) {
    error.value = body.error_description || 'logout failed'
    return
  }
  sessionStorage.removeItem('auth_access_token')
  sessionStorage.removeItem('auth_id_token')
  sessionStorage.removeItem('code_verifier')
  sessionStorage.removeItem('state')
  sessionStorage.removeItem('nonce')
  result.value = body.result
}
</script>

<template>
  <main class="app-shell">
    <section class="panel">
      <p class="eyebrow">OsolabAuth</p>
      <h1>Logout</h1>
      <button type="button" @click="logout">Logout</button>
      <NuxtLink class="text-link" to="/">Home</NuxtLink>
      <p v-if="error" class="error">{{ error }}</p>
      <p v-if="result" class="success">{{ result }}</p>
    </section>
  </main>
</template>
