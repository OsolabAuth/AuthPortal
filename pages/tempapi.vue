<script setup lang="ts">
const method = ref('GET')
const url = ref('')

const queryParams = ref([
  { key: '', value: '' }
])

const headers = ref([
  { key: '', value: '' }
])

const body = ref('')

const loading = ref(false)
const response = ref<any>(null)
const error = ref('')

const addRow = (target: typeof queryParams.value) => {
  target.push({ key: '', value: '' })
}

const toObject = (list: { key: string; value: string }[]) => {
  return Object.fromEntries(
    list.filter(v => v.key).map(v => [v.key, v.value])
  )
}

const sendRequest = async () => {
  loading.value = true
  error.value = ''
  response.value = null

  try {
    const res = await $fetch(url.value, {
      method: method.value as any,
      query: toObject(queryParams.value),
      headers: toObject(headers.value),
      body:
        method.value === 'GET'
          ? undefined
          : body.value
            ? JSON.parse(body.value)
            : undefined
    })

    response.value = res
  } catch (e: any) {
    error.value = e?.data || e.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="api-client">
    <div class="row">
      <select v-model="method">
        <option>GET</option>
        <option>POST</option>
        <option>PUT</option>
        <option>PATCH</option>
        <option>DELETE</option>
      </select>

      <input
        v-model="url"
        type="text"
        placeholder="https://example.com/api"
        class="url-input"
      />

      <button @click="sendRequest" :disabled="loading">
        {{ loading ? 'Sending...' : 'Send' }}
      </button>
    </div>

    <section>
      <h3>Query Params</h3>

      <div
        v-for="(param, index) in queryParams"
        :key="index"
        class="param-row"
      >
        <input v-model="param.key" placeholder="key" />
        <input v-model="param.value" placeholder="value" />
      </div>

      <button @click="addRow(queryParams)">
        + Add Query Param
      </button>
    </section>

    <section>
      <h3>Headers</h3>

      <div
        v-for="(header, index) in headers"
        :key="index"
        class="param-row"
      >
        <input v-model="header.key" placeholder="key" />
        <input v-model="header.value" placeholder="value" />
      </div>

      <button @click="addRow(headers)">
        + Add Header
      </button>
    </section>

    <section v-if="method !== 'GET'">
      <h3>Body (JSON)</h3>

      <textarea
        v-model="body"
        rows="10"
        placeholder='{"name":"test"}'
      />
    </section>

    <section>
      <h3>Response</h3>

      <pre v-if="response">
{{ JSON.stringify(response, null, 2) }}
      </pre>

      <pre v-else-if="error">
{{ JSON.stringify(error, null, 2) }}
      </pre>
    </section>
  </div>
</template>

<style scoped>
.api-client {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.row {
  display: flex;
  gap: 12px;
}

.url-input {
  flex: 1;
}

.param-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

input,
select,
textarea,
button {
  padding: 8px;
}

pre {
  background: #111;
  color: #0f0;
  padding: 16px;
  overflow: auto;
}
</style>