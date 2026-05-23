<template>
  <AuthShell
    title="OIDCログイン"
    description="ログインを開始します。"
  >
    <div class="stack">
      <p v-if="authStatus === 'processing'" class="message message-info">
        認証処理中です...
      </p>

      <p v-if="authStatus === 'success'" class="message message-info">
        ログインしました。
      </p>

      <p v-if="notice" class="message message-info">
        {{ notice }}
      </p>

      <p v-if="authError" class="message message-error">
        {{ authError }}
      </p>

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
  </AuthShell>
</template>

<script setup lang="ts">
import type { StoredTokens } from "~/composables/usePortalAuthFlow";

useHead({ title: "Portal" });

const flow = usePortalAuthFlow();
const route = useRoute();

const pending = ref(false);
const storedTokens = ref<StoredTokens | null>(null);
const authStatus = ref<"idle" | "processing" | "success" | "error">("idle");
const authError = ref("");
const notice = ref("");

function firstQueryValue(value: unknown) {
  if (Array.isArray(value)) {
    return String(value[0] ?? "");
  }

  return String(value ?? "");
}

onMounted(() => {
  storedTokens.value = flow.readTokens();

  const authorizationError = firstQueryValue(route.query.error);
  if (authorizationError) {
    authStatus.value = "error";
    authError.value = firstQueryValue(route.query.error_description) || authorizationError;
    return;
  }

  const code = firstQueryValue(route.query.code);
  const state = firstQueryValue(route.query.state);
  if (code && state) {
    void completeAuthorization(code, state);
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
    authStatus.value = "success";
    window.history.replaceState({}, document.title, window.location.pathname);
  } catch (error) {
    authStatus.value = "error";
    authError.value = error instanceof Error ? error.message : "認証処理に失敗しました。";
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
    authError.value = error instanceof Error ? error.message : "ログイン開始に失敗しました。";
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
    authError.value = error instanceof Error ? error.message : "ログアウトに失敗しました。";
  } finally {
    storedTokens.value = null;
    pending.value = false;
  }
}
</script>
