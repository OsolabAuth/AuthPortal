<script setup lang="ts">
const config = useRuntimeConfig()
const loading = ref(false)
const profile = ref<Record<string, unknown> | null>(null)
const error = ref('')

const hasAccessToken = computed(() => import.meta.client && Boolean(sessionStorage.getItem('auth_access_token')))
const profileDisplayName = computed(() => String(profile.value?.name || 'OsolabAuth account'))
const extraProfileFields = computed(() => {
  if (!profile.value) {
    return []
  }

  const primaryKeys = new Set(['sub', 'email', 'name'])
  return Object.entries(profile.value)
    .filter(([key]) => !primaryKeys.has(key))
    .map(([key, value]) => ({
      key,
      label: key.replaceAll('_', ' '),
      value: formatProfileValue(value)
    }))
})

function formatProfileValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '-'
  }
  if (Array.isArray(value)) {
    return value.map(formatProfileValue).join(', ')
  }
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  return String(value)
}

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
    <section class="panel panel-wide auth-panel">
      <header class="page-header">
        <span class="brand-mark">OsolabAuth</span>
        <h1>My page</h1>
        <p class="page-copy">Review your profile and manage account security from this dashboard.</p>
      </header>

      <p v-if="loading" class="notice">Loading profile...</p>
      <p v-if="error" class="error">{{ error }}</p>

      <template v-if="profile">
        <section class="profile-hero">
          <div>
            <p class="profile-name">{{ profileDisplayName }}</p>
            <p class="profile-email">{{ profile.email || 'No email claim' }}</p>
          </div>
          <span class="profile-status">Signed in</span>
        </section>

        <section class="section-block">
          <h2 class="section-title">Profile</h2>
          <div class="profile-grid">
            <div class="field-card">
              <span>Subject</span>
              <strong>{{ profile.sub }}</strong>
            </div>
            <div class="field-card">
              <span>Email</span>
              <strong>{{ profile.email || '-' }}</strong>
            </div>
            <div class="field-card">
              <span>Name</span>
              <strong>{{ profile.name || '-' }}</strong>
            </div>
            <div v-for="field in extraProfileFields" :key="field.key" class="field-card">
              <span>{{ field.label }}</span>
              <strong>{{ field.value }}</strong>
            </div>
          </div>
        </section>
      </template>

      <section class="section-block">
        <h2 class="section-title">Account actions</h2>
        <div class="action-grid">
          <NuxtLink v-if="!hasAccessToken" class="action-card" to="/">
            <strong>Sign in</strong>
            <span>Start a new authentication session.</span>
          </NuxtLink>
          <NuxtLink class="action-card" to="/mfa">
            <strong>MFA</strong>
            <span>Issue a step-up token or set up authenticator MFA.</span>
          </NuxtLink>
          <NuxtLink class="action-card" to="/password/change">
            <strong>Change password</strong>
            <span>Update your password after step-up verification.</span>
          </NuxtLink>
          <NuxtLink class="action-card" to="/agent">
            <strong>AI agents</strong>
            <span>Manage delegated AI agent access.</span>
          </NuxtLink>
          <NuxtLink class="action-card" to="/logout">
            <strong>Logout</strong>
            <span>End this browser session.</span>
          </NuxtLink>
          <NuxtLink class="action-card" to="/account/withdrawal">
            <strong>Delete account</strong>
            <span>Withdraw your account after step-up verification.</span>
          </NuxtLink>
        </div>
      </section>
    </section>
  </main>
</template>
