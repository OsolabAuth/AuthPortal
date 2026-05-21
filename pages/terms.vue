<template>
  <AuthShell
    title="同意確認"
    description="クライアントが要求した利用規約とスコープを確認します。"
  >
    <div class="stack">
      <p class="message message-info">
        認可セッションは Auth API の Cookie から読み取ります。Cookie が期限切れの場合は、トップからログインをやり直してください。
      </p>

      <p v-if="pending" class="message message-info">規約を読み込み中...</p>
      <p v-if="errorMessage" class="message message-error">{{ errorMessage }}</p>

      <section v-if="terms.length" class="terms-list">
        <label
          v-for="term in terms"
          :key="term.term_id"
          class="term-item"
        >
          <input
            v-model="acceptedTermIds"
            type="checkbox"
            :value="term.term_id"
            :disabled="term.required"
          >
          <span>
            <strong>{{ term.title }}</strong>
            <small>v{{ term.version }} / {{ term.required ? "必須" : "任意" }}</small>
            <a
              v-if="term.term_url"
              :href="term.term_url"
              class="text-link term-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              規約を開く
            </a>
            <small v-else class="term-url-note">規約URL未設定</small>
          </span>
        </label>
      </section>

      <section v-else-if="!pending && !errorMessage" class="flow-box flow-box-muted">
        <h2>Terms</h2>
        <p>このクライアントに表示対象の規約はありません。</p>
      </section>

      <section v-if="scopes.length" class="scope-box">
        <h2>要求スコープ</h2>
        <div class="scope-list">
          <span v-for="scopeItem in scopes" :key="scopeItem" class="scope-chip">{{ scopeItem }}</span>
        </div>
      </section>

      <div class="button-row">
        <button
          class="button"
          type="button"
          :disabled="pending || submitting || requiredMissing"
          @click="submit(true)"
        >
          {{ submitting ? "送信中..." : "同意して続ける" }}
        </button>
        <button class="button button-danger" type="button" :disabled="submitting" @click="submit(false)">
          拒否する
        </button>
      </div>
    </div>
  </AuthShell>
</template>

<script setup lang="ts">
import type { TermItem } from "~/types/auth";

useHead({ title: "Terms" });

const api = useAuthApi();

const pending = ref(false);
const submitting = ref(false);
const errorMessage = ref("");
const terms = ref<TermItem[]>([]);
const scopes = ref<string[]>([]);
const acceptedTermIds = ref<string[]>([]);

const requiredMissing = computed(() => terms.value
  .filter((term) => term.required)
  .some((term) => !acceptedTermIds.value.includes(term.term_id)));

function toSafeTermUrl(rawUrl: string | undefined) {
  if (!rawUrl) {
    return undefined;
  }

  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return undefined;
    }

    return parsed.toString();
  } catch {
    return undefined;
  }
}

async function loadTerms() {
  pending.value = true;
  errorMessage.value = "";

  try {
    const result = await api.fetchTerms();

    if (!result.ok) {
      errorMessage.value = result.data.message || `規約の取得に失敗しました。status=${result.status}`;
      return;
    }

    terms.value = (result.data.terms || []).map((term) => ({
      ...term,
      term_url: toSafeTermUrl(term.term_url)
    }));
    scopes.value = result.data.scopes || [];
    acceptedTermIds.value = terms.value
      .filter((term) => term.required)
      .map((term) => term.term_id);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "規約取得でエラーが発生しました。";
  } finally {
    pending.value = false;
  }
}

async function submit(accepted: boolean) {
  submitting.value = true;
  errorMessage.value = "";

  try {
    const result = await api.submitTerms({
      accepted,
      termIds: accepted ? acceptedTermIds.value : []
    });

    if (result.ok && result.data.result === "redirect" && result.location) {
      window.location.assign(result.location);
      return;
    }

    if (result.ok && result.data.result === "redirect") {
      errorMessage.value = "同意結果は送信されましたが、リダイレクト先がレスポンスに含まれていません。";
      return;
    }

    errorMessage.value = result.data.message || result.data.error || `同意結果の送信に失敗しました。status=${result.status}`;
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "同意結果の送信でエラーが発生しました。";
  } finally {
    submitting.value = false;
  }
}

onMounted(loadTerms);
</script>
