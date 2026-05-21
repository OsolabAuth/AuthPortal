<template>
  <AuthShell
    title="ログイン"
    description="AuthFoundation の認可セッション Cookie に紐づけて、ユーザーを認証します。"
  >
    <form class="stack" @submit.prevent="submit">
      <FormField
        id="email"
        v-model="email"
        label="メールアドレス"
        type="email"
        autocomplete="email"
        placeholder="you@example.com"
        required
      />

      <FormField
        id="password"
        v-model="password"
        label="パスワード"
        type="password"
        autocomplete="current-password"
        placeholder="Password123"
        required
      />

      <p class="message message-info">
        認可セッションは Auth API が発行した HttpOnly Cookie から読み取ります。
      </p>

      <p v-if="errorMessage" class="message message-error">{{ errorMessage }}</p>
      <p v-if="notice" class="message message-info">{{ notice }}</p>

      <button class="button" type="submit" :disabled="pending">
        {{ pending ? "ログイン中..." : "ログイン" }}
      </button>

      <NuxtLink class="text-link" to="/signup">
        アカウントを作成する
      </NuxtLink>
    </form>
  </AuthShell>
</template>

<script setup lang="ts">
useHead({ title: "Login" });

const api = useAuthApi();

const email = ref("");
const password = ref("");
const pending = ref(false);
const errorMessage = ref("");
const notice = ref("");

async function submit() {
  pending.value = true;
  errorMessage.value = "";
  notice.value = "";

  try {
    const result = await api.login({
      email: email.value.trim(),
      password: password.value
    });

    if (result.ok && result.data.result === "redirect" && result.location) {
      window.location.assign(result.location);
      return;
    }

    if (result.ok && result.data.result === "logged_in") {
      notice.value = result.data.message || "ログインしました。認可セッションがないため、この画面で完了しています。";
      return;
    }

    if (result.ok && result.data.result === "redirect") {
      errorMessage.value = "ログインは成功しましたが、リダイレクト先がレスポンスに含まれていません。";
      return;
    }

    errorMessage.value = result.data.message || `ログインに失敗しました。status=${result.status}`;
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "ログイン処理でエラーが発生しました。";
  } finally {
    pending.value = false;
  }
}
</script>
