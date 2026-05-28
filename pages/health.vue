<script setup lang="ts">
const config = useRuntimeConfig()
const live = ref<Record<string, unknown> | null>(null)
const ready = ref<Record<string, unknown> | null>(null)
const error = ref('')

async function loadHealth() {
  error.value = ''
  const [liveResponse, readyResponse] = await Promise.all([
    fetch(`${config.public.authApiBase}/health/live`),
    fetch(`${config.public.authApiBase}/health/ready`)
  ])
  live.value = await liveResponse.json()
  ready.value = await readyResponse.json()
  if (!liveResponse.ok || !readyResponse.ok) {
    error.value = 'health check failed'
  }
}

onMounted(loadHealth)
</script>

<template>
  <main class="app-shell">
    <section class="panel">
      <p class="eyebrow">OsolabAuth</p>
      <h1>Health</h1>
      <button type="button" @click="loadHealth">Refresh</button>
      <p v-if="error" class="error">{{ error }}</p>
      <h2>Live</h2>
      <pre>{{ live }}</pre>
      <h2>Ready</h2>
      <pre>{{ ready }}</pre>
    </section>
  </main>
</template>
