<script setup lang="ts">
const config = useRuntimeConfig()
const loading = ref(false)
const profile = ref<Record<string, unknown> | null>(null)
const error = ref('')

const hasAccessToken = computed(() => import.meta.client && Boolean(sessionStorage.getItem('auth_access_token')))

async function loadProfile() {
  error.value = ''
  profile.value = null

  const accessToken = sessionStorage.getItem('auth_access_token') || ''
  if (!accessToken) {
    error.value = 'login is required'
    return
  }

  loading.value = true
  try {
    const response = await fetch(`${config.public.authApiBase}/userinfo`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })
    const body = await response.json() as Record<string, unknown>
    if (!response.ok) {
      sessionStorage.removeItem('auth_access_token')
      sessionStorage.removeItem('auth_id_token')
      error.value = String(body.error_description || 'profile fetch failed')
      return
    }

    profile.value = body
  }
  catch {
    error.value = 'profile fetch failed'
  }
  finally {
    loading.value = false
  }
}

onMounted(() => {
  void loadProfile()
})
</script>

<template>
  <main class="app-shell">
    <section class="panel">
      <p class="eyebrow">OsolabAuth</p>
      <h1>My page</h1>

      <p v-if="loading">Loading profile...</p>
      <p v-if="error" class="error">{{ error }}</p>

      <dl v-if="profile" class="profile-list">
        <dt>Subject</dt>
        <dd>{{ profile.sub }}</dd>
        <dt>Email</dt>
        <dd>{{ profile.email || '-' }}</dd>
        <dt>Name</dt>
        <dd>{{ profile.name || '-' }}</dd>
      </dl>

      <div class="button-row">
        <NuxtLink v-if="!hasAccessToken" class="text-link" to="/">Login</NuxtLink>
        <NuxtLink class="text-link" to="/mfa">MFA</NuxtLink>
        <NuxtLink class="text-link" to="/password/change">Change password</NuxtLink>
        <NuxtLink class="text-link" to="/account/withdrawal">Delete account</NuxtLink>
        <NuxtLink class="text-link" to="/logout">Logout</NuxtLink>
      </div>
    </section>
  </main>
</template>
