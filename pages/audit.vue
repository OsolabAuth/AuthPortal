<script setup lang="ts">
const config = useRuntimeConfig()
const logs = ref<Array<Record<string, unknown>>>([])
const error = ref('')

async function loadLogs() {
  error.value = ''
  const response = await fetch(`${config.public.authApiBase}/audit/logs?limit=100`)
  const body = await response.json()
  if (!response.ok) {
    error.value = body.error_description || 'audit log fetch failed'
    return
  }
  logs.value = body.logs || []
}

onMounted(loadLogs)
</script>

<template>
  <main class="app-shell">
    <section class="panel">
      <p class="eyebrow">OsolabAuth</p>
      <h1>Audit logs</h1>
      <button type="button" @click="loadLogs">Refresh</button>
      <p v-if="error" class="error">{{ error }}</p>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Event</th>
              <th>Result</th>
              <th>Subject</th>
              <th>Actor</th>
              <th>Client</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in logs" :key="String(log.audit_log_id)">
              <td>{{ log.occurred_at }}</td>
              <td>{{ log.event_type }}</td>
              <td>{{ log.result }}</td>
              <td>{{ log.subject }}</td>
              <td>{{ log.actor_type }}</td>
              <td>{{ log.client_id }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </main>
</template>
