<template>
  <AuthShell
    title="OIDC Portal"
    description="AuthFoundation の Authorization Code + PKCE フローを開始し、認可コードをトークンへ交換します。"
  >
    <template #context>
      <div class="portal-metrics">
        <span>client_id</span>
        <code>{{ clientId }}</code>
        <span>scope</span>
        <strong>{{ scope }}</strong>
        <span>redirect_uri</span>
        <code>{{ redirectUri }}</code>
      </div>
    </template>

    <div class="stack">
      <p v-if="authStatus === 'processing'" class="message message-info">
        認可レスポンスを処理しています。
      </p>

      <p v-if="authStatus === 'success'" class="message message-info">
        ログインが完了しました。アクセストークンで UserInfo を取得済みです。
      </p>

      <p v-if="notice" class="message message-info">
        {{ notice }}
      </p>

      <p v-if="authError" class="message message-error">
        {{ authError }}
      </p>

      <div class="button-row">
        <button class="button" type="button" :disabled="pending" @click="startLogin">
          {{ pending ? "処理中..." : "OIDCログインを開始" }}
        </button>

        <button
          v-if="storedTokens"
          class="button button-secondary"
          type="button"
          :disabled="pending"
          @click="signOut"
        >
          ログアウト
        </button>
      </div>

      <section v-if="storedTokens" class="token-summary">
        <h2>Session</h2>
        <dl>
          <div>
            <dt>token_type</dt>
            <dd>{{ storedTokens.token_type || "Bearer" }}</dd>
          </div>
          <div>
            <dt>scope</dt>
            <dd>{{ storedTokens.scope || "unknown" }}</dd>
          </div>
          <div>
            <dt>issued_at</dt>
            <dd>{{ storedTokens.issued_at }}</dd>
          </div>
        </dl>
      </section>

      <section v-if="storedUserInfo" class="flow-box">
        <h2>UserInfo</h2>
        <dl>
          <div v-for="([key, value]) in userInfoEntries" :key="key">
            <dt>{{ key }}</dt>
            <dd><code>{{ String(value) }}</code></dd>
          </div>
        </dl>
      </section>

      <section class="flow-box flow-box-muted">
        <h2>Flow</h2>
        <ol>
          <li>Portal が PKCE、state、nonce を生成して /authorize を呼び出します。</li>
          <li>Auth API は認可セッションを HttpOnly Cookie として保持し、次の画面 URL を返します。</li>
          <li>ログインと規約同意が完了すると、Auth API はこのページへ code と state を返します。</li>
          <li>Portal は state を検証し、/token と /userinfo を呼び出します。</li>
        </ol>
      </section>
    </div>
  </AuthShell>
</template>

<script setup lang="ts">
import type { StoredTokens, StoredUserInfo } from "~/composables/usePortalAuthFlow";

useHead({ title: "Portal" });

const flow = usePortalAuthFlow();
const route = useRoute();
const { clientId, scope } = flow;

const pending = ref(false);
const storedTokens = ref<StoredTokens | null>(null);
const storedUserInfo = ref<StoredUserInfo | null>(null);
const authStatus = ref<"idle" | "processing" | "success" | "error">("idle");
const authError = ref("");
const notice = ref("");
const redirectUri = ref("/");

const userInfoEntries = computed(() => Object.entries(storedUserInfo.value || {})
  .filter(([key]) => key !== "saved_at"));

function firstQueryValue(value: unknown) {
  if (Array.isArray(value)) {
    return String(value[0] ?? "");
  }

  return String(value ?? "");
}

onMounted(() => {
  redirectUri.value = `${window.location.origin}/`;
  storedTokens.value = flow.readTokens();
  storedUserInfo.value = flow.readUserInfo();

  const authorizationError = firstQueryValue(route.query.error);
  if (authorizationError) {
    authStatus.value = "error";
    authError.value = firstQueryValue(route.query.error_description) || authorizationError;
    return;
  }

  const code = firstQueryValue(route.query.code);
  const state = firstQueryValue(route.query.state);
  if (code && state) {
    completeAuthorization(code, state);
  }
});

async function completeAuthorization(code: string, state: string) {
  pending.value = true;
  authStatus.value = "processing";
  authError.value = "";
  notice.value = "";

  try {
    const result = await flow.completeAuthorization({ code, state });
    storedTokens.value = result.tokens;
    storedUserInfo.value = result.userInfo;
    authStatus.value = "success";
    window.history.replaceState({}, document.title, window.location.pathname);
  } catch (error) {
    authStatus.value = "error";
    authError.value = error instanceof Error ? error.message : "認可レスポンスの処理に失敗しました。";
  } finally {
    pending.value = false;
  }
}

async function startLogin() {
  pending.value = true;
  authError.value = "";
  notice.value = "";

  try {
    await flow.startAuthorization();
  } catch (error) {
    authStatus.value = "error";
    authError.value = error instanceof Error ? error.message : "認可リクエストの開始に失敗しました。";
  } finally {
    pending.value = false;
  }
}

async function signOut() {
  pending.value = true;
  authError.value = "";
  notice.value = "";

  try {
    await flow.signOut(false);
    authStatus.value = "idle";
    notice.value = "ログアウトしました。";
  } catch (error) {
    authStatus.value = "error";
    authError.value = error instanceof Error ? error.message : "ログアウトAPIの呼び出しに失敗しました。ローカルのトークンは削除しました。";
  } finally {
    storedTokens.value = null;
    storedUserInfo.value = null;
    pending.value = false;
  }
}
</script>
