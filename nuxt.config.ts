export default defineNuxtConfig({
  compatibilityDate: '2026-05-28',
  devtools: { enabled: false },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      authApiBase: process.env.NUXT_PUBLIC_AUTH_API_BASE || '',
      authClientId: process.env.NUXT_PUBLIC_AUTH_CLIENT_ID || '00000000000000000000000000000000',
      authScope: process.env.NUXT_PUBLIC_AUTH_SCOPE || 'openid profile email'
    }
  }
})
