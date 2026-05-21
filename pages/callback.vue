<template>
  <AuthShell
    title="Callback"
    description="認可コードを検証し、PKCE でトークンへ交換します。通常はトップページがこの処理を担当します。"
  >
    <div class="stack">
      <p v-if="status === 'processing'" class="message message-info">
        認可レスポンスを処理しています。
      </p>

      <p v-if="status === 'success'" class="message message-info">
        ログインが完了しました。UserInfo を取得済みです。
      </p>

      <p v-if="status === 'error'" class="message message-error">
        {{ errorMessage }}
      </p>

      <section v-if="tokenSummary" class="token-summary">
        <h2>Token</h2>
        <dl>
          <div>
            <dt>token_type</dt>
            <dd>{{ tokenSummary.tokenType }}</dd>
          </div>
          <div>
            <dt>expires_in</dt>
            <dd>{{ tokenSummary.expiresIn }}</dd>
          </div>
          <div>
            <dt>scope</dt>
            <dd>{{ tokenSummary.scope }}</dd>
          </div>
        </dl>
      </section>

      <div class="button-row">
        <NuxtLink class="button" to="/">ポータルトップへ戻る</NuxtLink>
        <button
          v-if="status === 'success'"
          class="button button-secondary"
          type="button"
          @click="signOut"
        >
          ログアウト
        </button>
      </div>
    </div>
  </AuthShell>
</template>

<script setup lang="ts">
import type { StoredTokens } from "~/composables/usePortalAuthFlow";

useHead({ title: "Auth Callback" });

const route = useRoute();
const flow = usePortalAuthFlow();

const status = ref<"processing" | "success" | "error">("processing");
const errorMessage = ref("");
const tokenResponse = ref<StoredTokens | null>(null);

const tokenSummary = computed(() => {
  const token = tokenResponse.value;
  if (!token?.access_token) {
    return null;
  }

  return {
    tokenType: token.token_type || "Bearer",
    expiresIn: token.expires_in ? `${token.expires_in} sec` : "unknown",
    scope: token.scope || "unknown"
  };
});

function firstQueryValue(value: unknown) {
  if (Array.isArray(value)) {
    return String(value[0] ?? "");
  }

  return String(value ?? "");
}

function fail(message: string) {
  status.value = "error";
  errorMessage.value = message;
}

async function signOut() {
  try {
    await flow.signOut(false);
  } finally {
    tokenResponse.value = null;
    status.value = "error";
    errorMessage.value = "ログアウトしました。";
  }
}

onMounted(async () => {
  const authorizationError = firstQueryValue(route.query.error);
  if (authorizationError) {
    fail(firstQueryValue(route.query.error_description) || authorizationError);
    return;
  }

  const code = firstQueryValue(route.query.code);
  const state = firstQueryValue(route.query.state);
  if (!code || !state) {
    fail("認可コードまたは state がありません。トップページからログインを開始してください。");
    return;
  }

  try {
    const result = await flow.completeAuthorization({ code, state });
    tokenResponse.value = result.tokens;
    status.value = "success";
    window.history.replaceState({}, document.title, window.location.pathname);
  } catch (error) {
    fail(error instanceof Error ? error.message : "トークン交換中にエラーが発生しました。");
  }
});
</script>
