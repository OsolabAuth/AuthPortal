<template>
  <AuthShell
    title="認証確認"
    description="認証結果を確認しています。"
  >
    <div class="stack">
      <p v-if="status === 'processing'" class="message message-info">
        認証処理中です...
      </p>

      <p v-if="status === 'success'" class="message message-info">
        ログインしました。
      </p>

      <p v-if="status === 'error'" class="message message-error">
        {{ errorMessage }}
      </p>

      <div class="button-row">
        <NuxtLink class="button" to="/">トップへ戻る</NuxtLink>
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
useHead({ title: "Auth Callback" });

const route = useRoute();
const flow = usePortalAuthFlow();

const status = ref<"processing" | "success" | "error">("processing");
const errorMessage = ref("");

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
    fail("認証コードまたは state がありません。");
    return;
  }

  try {
    await flow.completeAuthorization({ code, state });
    status.value = "success";
    window.history.replaceState({}, document.title, window.location.pathname);
  } catch (error) {
    fail(error instanceof Error ? error.message : "トークン処理中にエラーが発生しました。");
  }
});
</script>
