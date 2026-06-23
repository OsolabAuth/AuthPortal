<script setup lang="ts">
const config = useRuntimeConfig()
const loading = ref(false)
const profile = ref<Record<string, unknown> | null>(null)
const error = ref('')

const hasAccessToken = computed(() => import.meta.client && Boolean(sessionStorage.getItem('auth_access_token')))
const profileDisplayName = computed(() => String(profile.value?.name || 'OsolabAuth account'))

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
    const response = await fetch(`${config.public.authApiBase}/account/profile`, {
      credentials: 'include',
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
  <main class="mypage-shell">
    <header class="mypage-header">
      <div>
        <span class="brand-mark">OsolabAuth</span>
        <h1>マイページ</h1>
        <p v-if="profile" class="page-copy">{{ profileDisplayName }} さんのアカウントメニュー</p>
        <p v-else class="page-copy">ログインすると会員情報とセキュリティ設定を管理できます。</p>
      </div>
      <NuxtLink v-if="hasAccessToken" class="mypage-logout" to="/logout">ログアウト</NuxtLink>
    </header>

    <section class="mypage-card">
      <p v-if="loading" class="notice">ユーザー情報を確認しています。</p>
      <p v-if="error" class="error">{{ error }}</p>

      <div v-if="!hasAccessToken" class="signin-panel">
        <h2>ログインが必要です</h2>
        <p class="page-copy">OsolabAuthにログインしてからマイページを利用してください。</p>
        <NuxtLink class="primary-action" to="/">ログインへ進む</NuxtLink>
      </div>

      <template v-else>
        <div class="menu-grid">
          <section class="menu-section">
            <h2 class="menu-heading">
              <span class="menu-heading-icon account-icon" aria-hidden="true" />
              会員メニュー
            </h2>
            <nav class="menu-list" aria-label="会員メニュー">
              <NuxtLink class="menu-link" to="/account/profile">
                <span>会員情報照会・変更</span>
                <span class="menu-arrow" aria-hidden="true">›</span>
              </NuxtLink>
              <NuxtLink class="menu-link" to="/agent">
                <span>AIエージェント管理</span>
                <span class="menu-arrow" aria-hidden="true">›</span>
              </NuxtLink>
            </nav>
          </section>

          <section class="menu-section">
            <h2 class="menu-heading">
              <span class="menu-heading-icon settings-icon" aria-hidden="true" />
              アカウント設定
            </h2>
            <nav class="menu-list" aria-label="アカウント設定">
              <NuxtLink class="menu-link" to="/mfa">
                <span>認証設定</span>
                <span class="menu-arrow" aria-hidden="true">›</span>
              </NuxtLink>
              <NuxtLink class="menu-link" to="/password/change">
                <span>パスワード変更</span>
                <span class="menu-arrow" aria-hidden="true">›</span>
              </NuxtLink>
              <NuxtLink class="menu-link" to="/password/reset">
                <span>パスワードリセット</span>
                <span class="menu-arrow" aria-hidden="true">›</span>
              </NuxtLink>
            </nav>
          </section>

          <section class="menu-section">
            <h2 class="menu-heading">
              <span class="menu-heading-icon other-icon" aria-hidden="true" />
              その他
            </h2>
            <nav class="menu-list" aria-label="その他">
              <NuxtLink class="menu-link" to="/logout">
                <span>ログアウト</span>
                <span class="menu-arrow" aria-hidden="true">›</span>
              </NuxtLink>
              <NuxtLink class="menu-link danger-link" to="/account/withdrawal">
                <span>退会</span>
                <span class="menu-arrow" aria-hidden="true">›</span>
              </NuxtLink>
            </nav>
          </section>
        </div>
      </template>
    </section>
  </main>
</template>
