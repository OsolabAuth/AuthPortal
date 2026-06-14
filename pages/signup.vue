<script setup lang="ts">
const config = useRuntimeConfig()
const email = ref('')
const emailCode = ref('')
const password = ref('')
const name = ref('')
const birthDate = ref('')
const termsAccepted = ref(false)
const terms = ref<{ terms_id?: string, title: string, body: string, version: string } | null>(null)
const result = ref('')
const error = ref('')
const sendingEmail = ref(false)
const verifyingEmail = ref(false)
const creatingAccount = ref(false)

function formBody(values: Record<string, string | boolean | undefined>) {
  const body = new URLSearchParams()
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) {
      body.set(key, String(value))
    }
  }
  return body
}

onMounted(async () => {
  const response = await fetch(`${config.public.authApiBase}/terms/current`)
  if (response.ok) {
    terms.value = await response.json()
  }
})

async function sendSignupEmail() {
  error.value = ''
  result.value = ''
  sendingEmail.value = true
  try {
    const response = await fetch(`${config.public.authApiBase}/signup/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      credentials: 'include',
      body: formBody({ email: email.value })
    })
    const body = await response.json()
    if (!response.ok) {
      error.value = body.error_description || 'email verification failed'
      return
    }

    result.value = 'Verification code sent.'
  }
  finally {
    sendingEmail.value = false
  }
}

async function verifySignupEmail() {
  error.value = ''
  result.value = ''
  verifyingEmail.value = true
  try {
    const response = await fetch(`${config.public.authApiBase}/signup/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      credentials: 'include',
      body: formBody({
        code: emailCode.value
      })
    })
    const body = await response.json()
    if (!response.ok) {
      error.value = body.error_description || 'verification failed'
      return
    }

    result.value = 'Email verified.'
  }
  finally {
    verifyingEmail.value = false
  }
}

async function createAccount() {
  error.value = ''
  result.value = ''
  creatingAccount.value = true
  try {
    const response = await fetch(`${config.public.authApiBase}/signup/account`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      credentials: 'include',
      body: formBody({
        password: password.value,
        name: name.value,
        birthdate: birthDate.value,
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
  finally {
    creatingAccount.value = false
  }
}
</script>

<template>
  <main class="app-shell">
    <section class="panel auth-panel">
      <header class="page-header">
        <span class="brand-mark">OsolabAuth</span>
        <h1>Create account</h1>
        <p class="page-copy">Verify your email, then register your profile and password.</p>
      </header>
      <form class="form" @submit.prevent="createAccount">
        <label>
          Email
          <input v-model="email" type="email" autocomplete="email" required>
        </label>
        <div class="button-row">
          <button type="button" :disabled="!email || sendingEmail" @click="sendSignupEmail">
            {{ sendingEmail ? 'Sending...' : 'Send verification code' }}
          </button>
        </div>
        <label>
          Verification code
          <input v-model="emailCode" inputmode="numeric" autocomplete="one-time-code" required>
        </label>
        <div class="button-row">
          <button type="button" :disabled="!email || !emailCode || verifyingEmail" @click="verifySignupEmail">
            {{ verifyingEmail ? 'Verifying...' : 'Verify email' }}
          </button>
        </div>
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
        <button type="submit" :disabled="creatingAccount">
          {{ creatingAccount ? 'Creating...' : 'Create account' }}
        </button>
      </form>
      <div class="inline-links">
        <NuxtLink class="text-link" to="/login">Back to sign in</NuxtLink>
        <NuxtLink class="text-link" to="/">Portal home</NuxtLink>
      </div>
      <p v-if="error" class="error">{{ error }}</p>
      <p v-if="result" class="success">{{ result }}</p>
    </section>
  </main>
</template>
