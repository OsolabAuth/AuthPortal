<script setup lang="ts">
const config = useRuntimeConfig()

const allowedScopes = [
  { value: 'task_read', label: 'タスクを読む' },
  { value: 'task_create', label: 'タスクを作成する' },
  { value: 'task_comment', label: 'タスクにコメントする' }
]
const permissionProfiles = [
  {
    value: 'observe',
    title: '閲覧のみ',
    description: 'プロジェクトの内容確認だけを許可します。',
    scopes: ['task_read']
  },
  {
    value: 'collaborate',
    title: '共同作業',
    description: '閲覧、作成、コメントを許可します。',
    scopes: ['task_read', 'task_create', 'task_comment']
  }
]
const expiresOptions = [7, 30, 90]

const currentProfile = ref<Record<string, unknown> | null>(null)
const profileLoading = ref(false)
const profileError = ref('')
const stepUpToken = ref('')
const clientId = ref(config.public.authClientId)
const agentName = ref('Issue Triage Agent')
const expiresDays = ref(30)
const permissionProfile = ref('collaborate')
const createMessage = ref('')
const createError = ref('')
const creatingAgent = ref(false)

const agentId = ref('')
const agentSecret = ref('')
const rotateMessage = ref('')
const rotateError = ref('')
const rotatingSecret = ref(false)
const revokeMessage = ref('')
const revokeError = ref('')
const revokingAgent = ref(false)

const tokenScopes = ref(['task_read'])
const tokenMessage = ref('')
const tokenError = ref('')
const tokenResponse = ref<Record<string, unknown> | null>(null)
const requestingToken = ref(false)

const selectedProfile = computed(() => (
  permissionProfiles.find((profile) => profile.value === permissionProfile.value) || permissionProfiles[1]
))
const createScopes = computed(() => selectedProfile.value.scopes)
const selectedCreateScope = computed(() => createScopes.value.join(' '))
const selectedTokenScope = computed(() => tokenScopes.value.join(' '))
const scopeLabels = computed(() => createScopes.value
  .map((value) => allowedScopes.find((scope) => scope.value === value)?.label || value)
  .join(', '))
const hasAccessToken = computed(() => Boolean(readAccessToken()))
const ownerDisplayName = computed(() => String(currentProfile.value?.name || 'ログイン中のユーザー'))
const ownerSubject = computed(() => String(currentProfile.value?.sub || '-'))
const tokenInspections = computed(() => [
  inspectJwt('ID Token', tokenResponse.value?.id_token),
  inspectOpaqueToken('Access Token', tokenResponse.value?.access_token)
])

function readAccessToken(): string {
  if (!import.meta.client) {
    return ''
  }

  return sessionStorage.getItem('auth_access_token') || ''
}

function authHeaders(): Record<string, string> {
  const accessToken = readAccessToken()
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
}

async function loadCurrentProfile() {
  profileError.value = ''
  currentProfile.value = null

  const accessToken = readAccessToken()
  if (!accessToken) {
    profileError.value = 'Osolabログインが必要です。'
    return
  }

  profileLoading.value = true
  try {
    const response = await fetch(`${config.public.authApiBase}/account/profile`, {
      headers: authHeaders(),
      credentials: 'include'
    })
    const body = await readJsonBody(response)
    if (!response.ok) {
      profileError.value = readError(body, 'ユーザー情報を取得できませんでした。')
      return
    }

    currentProfile.value = body
  }
  catch {
    profileError.value = 'ユーザー情報を取得できませんでした。'
  }
  finally {
    profileLoading.value = false
  }
}

async function createAgent() {
  createError.value = ''
  createMessage.value = ''

  if (!readAccessToken()) {
    createError.value = 'Osolabログインが必要です。'
    return
  }

  if (!stepUpToken.value) {
    createError.value = 'MFA承認コードを入力してください。'
    return
  }

  creatingAgent.value = true
  try {
    const response = await fetch(`${config.public.authApiBase}/agent`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({
        owner_email: '',
        agent_name: agentName.value,
        client_id: clientId.value,
        scope: selectedCreateScope.value,
        expires_days: Number(expiresDays.value),
        step_up_token: stepUpToken.value
      })
    })
    const body = await readJsonBody(response)
    if (!response.ok) {
      createError.value = readError(body, 'agent creation failed')
      return
    }

    agentId.value = String(body.agent_id || agentId.value)
    agentSecret.value = String(body.agent_secret || agentSecret.value)
    createMessage.value = 'AIエージェントを登録しました。シークレットはこの画面で一度だけ確認できます。'
  }
  catch {
    createError.value = 'AIエージェントの登録に失敗しました。'
  }
  finally {
    creatingAgent.value = false
  }
}

async function rotateSecret() {
  rotateError.value = ''
  rotateMessage.value = ''
  rotatingSecret.value = true
  try {
    const response = await fetch(`${config.public.authApiBase}/agent/${encodeURIComponent(agentId.value)}/secret`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({
        owner_email: '',
        step_up_token: stepUpToken.value
      })
    })
    const body = await readJsonBody(response)
    if (!response.ok) {
      rotateError.value = readError(body, 'secret rotation failed')
      return
    }

    agentSecret.value = String(body.agent_secret || agentSecret.value)
    rotateMessage.value = 'シークレットを再発行しました。新しい値を保存してください。'
  }
  catch {
    rotateError.value = 'シークレットの再発行に失敗しました。'
  }
  finally {
    rotatingSecret.value = false
  }
}

async function revokeAgent() {
  revokeError.value = ''
  revokeMessage.value = ''
  revokingAgent.value = true
  try {
    const response = await fetch(`${config.public.authApiBase}/agent/${encodeURIComponent(agentId.value)}/revoke`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({
        owner_email: '',
        step_up_token: stepUpToken.value
      })
    })
    const body = await readJsonBody(response)
    if (!response.ok) {
      revokeError.value = readError(body, 'agent revoke failed')
      return
    }

    revokeMessage.value = 'AIエージェントを無効化しました。'
  }
  catch {
    revokeError.value = 'AIエージェントの無効化に失敗しました。'
  }
  finally {
    revokingAgent.value = false
  }
}

async function requestToken() {
  tokenError.value = ''
  tokenMessage.value = ''
  tokenResponse.value = null
  requestingToken.value = true
  try {
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
    const body = await readJsonBody(response)
    if (!response.ok) {
      tokenError.value = readError(body, 'agent token request failed')
      return
    }

    tokenResponse.value = body
    tokenMessage.value = 'Token issued.'
  }
  catch {
    tokenError.value = 'agent token request failed'
  }
  finally {
    requestingToken.value = false
  }
}

async function readJsonBody(response: Response): Promise<Record<string, unknown>> {
  try {
    return await response.json() as Record<string, unknown>
  }
  catch {
    return {}
  }
}

function readError(body: Record<string, unknown>, fallback: string): string {
  return String(body.error_description || body.message || fallback)
}

type TokenInspection = {
  label: string
  available: boolean
  tokenKind: 'jwt' | 'opaque' | 'missing'
  error: string
  claims: Record<string, unknown>
  importantClaims: Array<{ name: string, value: string }>
  rawPayload: string
  opaqueValue: string
}

function inspectJwt(label: string, token: unknown): TokenInspection {
  if (typeof token !== 'string' || token.length === 0) {
    return emptyInspection(label)
  }

  const parts = token.split('.')
  if (parts.length < 2) {
    return {
      ...emptyInspection(label),
      available: true,
      tokenKind: 'jwt',
      error: 'Token is not a JWT.'
    }
  }

  try {
    const payload = decodeBase64UrlJson(parts[1])
    const claims = JSON.parse(payload) as Record<string, unknown>
    return {
      label,
      available: true,
      tokenKind: 'jwt',
      error: '',
      claims,
      importantClaims: [
        'principal_type',
        'sub',
        'agent_id',
        'agent_name',
        'owner_sub',
        'delegation_id',
        'scope',
        'exp'
      ].map((name) => ({ name, value: formatClaim(claims[name]) })),
      rawPayload: JSON.stringify(claims, null, 2),
      opaqueValue: ''
    }
  } catch (error) {
    return {
      ...emptyInspection(label),
      available: true,
      tokenKind: 'jwt',
      error: error instanceof Error ? error.message : 'Token payload decode failed.'
    }
  }
}

function inspectOpaqueToken(label: string, token: unknown): TokenInspection {
  if (typeof token !== 'string' || token.length === 0) {
    return emptyInspection(label)
  }

  return {
    label,
    available: true,
    tokenKind: 'opaque',
    error: '',
    claims: {},
    importantClaims: [
      { name: 'token_type', value: 'opaque' },
      { name: 'prefix', value: token.slice(0, 4) || '-' },
      { name: 'length', value: String(token.length) }
    ],
    rawPayload: '',
    opaqueValue: maskToken(token)
  }
}

function emptyInspection(label: string): TokenInspection {
  return {
    label,
    available: false,
    tokenKind: 'missing',
    error: '',
    claims: {},
    importantClaims: [],
    rawPayload: '',
    opaqueValue: ''
  }
}

function decodeBase64UrlJson(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

function formatClaim(value: unknown): string {
  if (value === undefined || value === null || value === '') {
    return '-'
  }

  if (Array.isArray(value)) {
    return value.join(' ')
  }

  return String(value)
}

function maskToken(token: string): string {
  if (token.length <= 12) {
    return token
  }

  return `${token.slice(0, 8)}...${token.slice(-4)}`
}

onMounted(() => {
  void loadCurrentProfile()
})
</script>

<template>
  <main class="app-shell">
    <section class="panel panel-wide auth-panel">
      <header class="page-header">
        <span class="brand-mark">OsolabAuth</span>
        <h1>AIエージェント管理</h1>
        <p class="page-copy">ログイン中のOsolabユーザーに紐づくAIエージェントを登録します。</p>
      </header>

      <div class="agent-layout">
        <aside class="agent-guide" aria-label="AI agent setup steps">
          <div class="guide-step">
            <span>1</span>
            <strong>本人確認</strong>
            <small>MFA承認コードを取得します。</small>
          </div>
          <div class="guide-step">
            <span>2</span>
            <strong>権限選択</strong>
            <small>必要最小限の操作だけ許可します。</small>
          </div>
          <div class="guide-step">
            <span>3</span>
            <strong>登録</strong>
            <small>一度だけ表示されるシークレットを保存します。</small>
          </div>
        </aside>

        <section class="agent-workspace">
          <section class="owner-card">
            <div>
              <span class="section-title">登録する所有者</span>
              <strong>{{ ownerDisplayName }}</strong>
              <small>Subject: {{ ownerSubject }}</small>
            </div>
            <div class="owner-card-actions">
              <span v-if="profileLoading" class="profile-status neutral">確認中</span>
              <span v-else-if="currentProfile" class="profile-status">ログイン済み</span>
              <span v-else class="profile-status warning">未ログイン</span>
              <button type="button" class="secondary-button" @click="loadCurrentProfile">再読み込み</button>
            </div>
          </section>

          <p v-if="profileError" class="error">{{ profileError }}</p>
          <p v-if="!hasAccessToken" class="notice">
            AIエージェントを登録するには、先にOsolabでログインしてください。
            <NuxtLink class="text-link inline-text-link" to="/">ログインへ進む</NuxtLink>
          </p>

          <form class="form agent-card" @submit.prevent="createAgent">
            <div class="section-block">
              <h2>AIエージェントを登録</h2>
              <p class="page-copy">タスク管理やコメント作成など、委譲した範囲だけをAIに許可します。</p>
            </div>

            <label>
              MFA承認コード
              <input v-model="stepUpToken" autocomplete="one-time-code" required>
              <small>パスワード共有を避けるため、登録時だけ追加確認します。</small>
            </label>

            <label>
              AIエージェント名
              <input v-model="agentName" required>
            </label>

            <fieldset>
              <legend>許可する操作</legend>
              <div class="choice-grid">
                <label
                  v-for="profile in permissionProfiles"
                  :key="profile.value"
                  class="choice-card"
                  :class="{ selected: permissionProfile === profile.value }"
                >
                  <input v-model="permissionProfile" type="radio" :value="profile.value">
                  <span>
                    <strong>{{ profile.title }}</strong>
                    <small>{{ profile.description }}</small>
                  </span>
                </label>
              </div>
            </fieldset>

            <fieldset>
              <legend>有効期限</legend>
              <div class="segmented-control">
                <label v-for="days in expiresOptions" :key="days" :class="{ selected: expiresDays === days }">
                  <input v-model="expiresDays" type="radio" :value="days">
                  {{ days }} days
                </label>
              </div>
            </fieldset>

            <details class="advanced-panel">
              <summary>詳細設定</summary>
              <label>
                Client ID
                <input v-model="clientId" required>
              </label>
              <p class="muted">Scopes: {{ scopeLabels }}</p>
            </details>

            <div class="form-actions">
              <button type="submit" :disabled="!hasAccessToken || !stepUpToken || creatingAgent">
                {{ creatingAgent ? '登録中...' : 'AIエージェントを登録' }}
              </button>
              <NuxtLink class="text-link" to="/mfa">MFA承認コードを取得</NuxtLink>
            </div>
          </form>

          <p v-if="createError" class="error">{{ createError }}</p>
          <p v-if="createMessage" class="success">{{ createMessage }}</p>

          <section v-if="agentId || agentSecret" class="credential-card">
            <div>
              <span>Agent ID</span>
              <code>{{ agentId || '-' }}</code>
            </div>
            <div>
              <span>Agent secret</span>
              <code>{{ agentSecret || '-' }}</code>
            </div>
          </section>

          <details class="advanced-panel">
            <summary>既存エージェントの管理</summary>
            <div class="form">
              <label>
                Agent ID
                <input v-model="agentId" required>
              </label>
              <label>
                Agent secret
                <input v-model="agentSecret" type="password" autocomplete="off">
              </label>
              <div class="button-row">
                <button type="button" :disabled="!agentId || !hasAccessToken || !stepUpToken || rotatingSecret" @click="rotateSecret">
                  {{ rotatingSecret ? '再発行中...' : 'シークレットを再発行' }}
                </button>
                <button type="button" :disabled="!agentId || !hasAccessToken || !stepUpToken || revokingAgent" @click="revokeAgent">
                  {{ revokingAgent ? '無効化中...' : 'エージェントを無効化' }}
                </button>
              </div>
              <p v-if="rotateError" class="error">{{ rotateError }}</p>
              <p v-if="rotateMessage" class="success">{{ rotateMessage }}</p>
              <p v-if="revokeError" class="error">{{ revokeError }}</p>
              <p v-if="revokeMessage" class="success">{{ revokeMessage }}</p>
            </div>
          </details>

          <details class="advanced-panel">
            <summary>発行トークンの確認</summary>
            <form class="form" @submit.prevent="requestToken">
              <fieldset>
                <legend>要求する権限</legend>
                <label v-for="scope in allowedScopes" :key="scope.value" class="checkbox-row">
                  <input v-model="tokenScopes" type="checkbox" :value="scope.value">
                  {{ scope.label }}
                </label>
              </fieldset>
              <button type="submit" :disabled="!agentId || !agentSecret || tokenScopes.length === 0 || requestingToken">
                {{ requestingToken ? '要求中...' : 'トークンを要求' }}
              </button>
            </form>

            <p v-if="tokenError" class="error">{{ tokenError }}</p>
            <p v-if="tokenMessage" class="success">{{ tokenMessage }}</p>

            <section v-if="tokenResponse" class="token-inspector">
              <h2>Token inspector</h2>
              <p class="notice">
                Payloads are decoded locally for inspection only. Signatures are not verified here.
              </p>
              <div v-for="inspection in tokenInspections" :key="inspection.label" class="stack">
                <h3>{{ inspection.label }}</h3>
                <p v-if="!inspection.available" class="notice">Token is not present in the response.</p>
                <p v-else-if="inspection.error" class="error">{{ inspection.error }}</p>
                <template v-else-if="inspection.tokenKind === 'opaque'">
                  <p class="notice">
                    This access token is opaque and is validated server-side. There is no JWT payload to decode.
                  </p>
                  <code class="token-value">{{ inspection.opaqueValue }}</code>
                  <div class="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Property</th>
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
                </template>
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
          </details>
        </section>
      </div>

      <div class="inline-links">
        <NuxtLink class="text-link" to="/me">マイページへ戻る</NuxtLink>
      </div>
    </section>
  </main>
</template>
