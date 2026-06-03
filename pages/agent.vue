<script setup lang="ts">
import { inspectJwt } from '~/utils/jwt-inspector'

const config = useRuntimeConfig()

const allowedScopes = [
  { value: 'task_read', label: 'Read tasks' },
  { value: 'task_create', label: 'Create tasks' },
  { value: 'task_comment', label: 'Comment on tasks' }
]

const ownerEmail = ref('')
const stepUpToken = ref('')
const clientId = ref(config.public.authClientId)
const agentName = ref('Issue Triage Agent')
const expiresDays = ref(30)
const createScopes = ref(['task_read', 'task_create', 'task_comment'])
const createResult = ref('')
const createError = ref('')

const agentId = ref('')
const agentSecret = ref('')
const rotateResult = ref('')
const rotateError = ref('')
const revokeResult = ref('')
const revokeError = ref('')

const tokenScopes = ref(['task_read'])
const tokenResult = ref('')
const tokenError = ref('')
const tokenResponse = ref<Record<string, unknown> | null>(null)

const selectedCreateScope = computed(() => createScopes.value.join(' '))
const selectedTokenScope = computed(() => tokenScopes.value.join(' '))
const tokenInspections = computed(() => [
  inspectJwt('ID Token', tokenResponse.value?.id_token),
  inspectJwt('Access Token', tokenResponse.value?.access_token)
])

async function createAgent() {
  createError.value = ''
  createResult.value = ''
  const response = await fetch(`${config.public.authApiBase}/agent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      owner_email: ownerEmail.value,
      agent_name: agentName.value,
      client_id: clientId.value,
      scope: selectedCreateScope.value,
      expires_days: Number(expiresDays.value),
      step_up_token: stepUpToken.value
    })
  })
  const body = await response.json()
  if (!response.ok) {
    createError.value = readError(body, 'agent creation failed')
    return
  }

  agentId.value = body.agent_id || agentId.value
  agentSecret.value = body.agent_secret || agentSecret.value
  createResult.value = JSON.stringify(body, null, 2)
}

async function rotateSecret() {
  rotateError.value = ''
  rotateResult.value = ''
  const response = await fetch(`${config.public.authApiBase}/agent/${encodeURIComponent(agentId.value)}/secret`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      owner_email: ownerEmail.value,
      step_up_token: stepUpToken.value
    })
  })
  const body = await response.json()
  if (!response.ok) {
    rotateError.value = readError(body, 'secret rotation failed')
    return
  }

  agentSecret.value = body.agent_secret || agentSecret.value
  rotateResult.value = JSON.stringify(body, null, 2)
}

async function revokeAgent() {
  revokeError.value = ''
  revokeResult.value = ''
  const response = await fetch(`${config.public.authApiBase}/agent/${encodeURIComponent(agentId.value)}/revoke`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      owner_email: ownerEmail.value,
      step_up_token: stepUpToken.value
    })
  })
  const body = await response.json()
  if (!response.ok) {
    revokeError.value = readError(body, 'agent revoke failed')
    return
  }

  revokeResult.value = JSON.stringify(body, null, 2)
}

async function requestToken() {
  tokenError.value = ''
  tokenResult.value = ''
  tokenResponse.value = null
  const response = await fetch(`${config.public.authApiBase}/agent/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      agent_id: agentId.value,
      agent_secret: agentSecret.value,
      client_id: clientId.value,
      scope: selectedTokenScope.value
    })
  })
  const body = await response.json()
  if (!response.ok) {
    tokenError.value = readError(body, 'agent token request failed')
    return
  }

  tokenResponse.value = body
  tokenResult.value = JSON.stringify(body, null, 2)
}

function readError(body: Record<string, unknown>, fallback: string): string {
  return String(body.error_description || body.message || fallback)
}
</script>

<template>
  <main class="app-shell">
    <section class="panel panel-wide">
      <p class="eyebrow">OsolabAuth</p>
      <h1>AI Agent management</h1>

      <div class="grid-two">
        <section class="stack">
          <h2>Create agent</h2>
          <form class="form" @submit.prevent="createAgent">
            <label>
              Owner email
              <input v-model="ownerEmail" type="email" autocomplete="email" required>
            </label>
            <label>
              Step-up token
              <input v-model="stepUpToken" autocomplete="one-time-code" required>
            </label>
            <label>
              Agent name
              <input v-model="agentName" required>
            </label>
            <label>
              Client ID
              <input v-model="clientId" required>
            </label>
            <label>
              Expires days
              <input v-model="expiresDays" type="number" min="1" max="90" required>
            </label>
            <fieldset>
              <legend>Delegated scopes</legend>
              <label v-for="scope in allowedScopes" :key="scope.value" class="checkbox-row">
                <input v-model="createScopes" type="checkbox" :value="scope.value">
                {{ scope.label }}
              </label>
            </fieldset>
            <button type="submit" :disabled="createScopes.length === 0">Create agent</button>
          </form>
          <p class="notice">agent_secret is shown only once. Store it before leaving this page.</p>
          <p v-if="createError" class="error">{{ createError }}</p>
          <pre v-if="createResult">{{ createResult }}</pre>
        </section>

        <section class="stack">
          <h2>Manage agent</h2>
          <label>
            Agent ID
            <input v-model="agentId" required>
          </label>
          <label>
            Agent secret
            <input v-model="agentSecret" type="password" autocomplete="off">
          </label>

          <div class="button-row">
            <button type="button" :disabled="!agentId || !ownerEmail || !stepUpToken" @click="rotateSecret">
              Rotate secret
            </button>
            <button type="button" :disabled="!agentId || !ownerEmail || !stepUpToken" @click="revokeAgent">
              Revoke agent
            </button>
          </div>

          <p v-if="rotateError" class="error">{{ rotateError }}</p>
          <pre v-if="rotateResult">{{ rotateResult }}</pre>
          <p v-if="revokeError" class="error">{{ revokeError }}</p>
          <pre v-if="revokeResult">{{ revokeResult }}</pre>

          <form class="form" @submit.prevent="requestToken">
            <fieldset>
              <legend>Requested scopes</legend>
              <label v-for="scope in allowedScopes" :key="scope.value" class="checkbox-row">
                <input v-model="tokenScopes" type="checkbox" :value="scope.value">
                {{ scope.label }}
              </label>
            </fieldset>
            <button type="submit" :disabled="!agentId || !agentSecret || tokenScopes.length === 0">
              Request token
            </button>
          </form>

          <p v-if="tokenError" class="error">{{ tokenError }}</p>
          <pre v-if="tokenResult">{{ tokenResult }}</pre>

          <section v-if="tokenResponse" class="token-inspector">
            <h2>Token inspector</h2>
            <p class="notice">
              Payloads are decoded locally for inspection only. Signatures are not verified here.
            </p>
            <div v-for="inspection in tokenInspections" :key="inspection.label" class="stack">
              <h3>{{ inspection.label }}</h3>
              <p v-if="!inspection.available" class="notice">Token is not present in the response.</p>
              <p v-else-if="inspection.error" class="error">{{ inspection.error }}</p>
              <template v-else>
                <div class="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Claim</th>
                        <th>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="claim in inspection.importantClaims" :key="claim.name">
                        <td>{{ claim.name }}</td>
                        <td>{{ claim.value }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <pre>{{ inspection.rawPayload }}</pre>
              </template>
            </div>
          </section>
        </section>
      </div>

      <NuxtLink class="text-link" to="/mfa">Get step-up token</NuxtLink>
    </section>
  </main>
</template>
