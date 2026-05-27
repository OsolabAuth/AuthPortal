<template>
  <main class="legal-page">
    <article class="legal-document">
      <header class="legal-header">
        <p class="eyebrow">Osolab Auth</p>
        <h1>Osolab Auth 利用規約</h1>
        <p class="lead">最終更新日: 2026年5月28日</p>
      </header>

      <section class="legal-section">
        <h2>1. 適用範囲</h2>
        <p>
          本規約は、Osolab Auth が提供するアカウント登録、ログイン、OpenID Connect / OAuth
          連携、プロフィール情報管理、および関連する認証認可機能の利用に適用されます。
        </p>
      </section>

      <section class="legal-section">
        <h2>2. アカウント情報</h2>
        <p>
          利用者は、登録時に正確なメールアドレス、氏名、生年月日その他必要な情報を登録するものとします。
          認証情報は本人の責任で管理し、第三者に共有しないでください。
        </p>
      </section>

      <section class="legal-section">
        <h2>3. 認証情報とトークン</h2>
        <p>
          Osolab Auth は、連携先アプリケーションへ必要な範囲で ID トークン、アクセストークン、
          およびユーザー情報を発行します。利用者は、連携先アプリケーションに表示される同意内容を確認した上で利用します。
        </p>
      </section>

      <section class="legal-section">
        <h2>4. 禁止事項</h2>
        <ul class="legal-list">
          <li>他人のアカウントまたは認証情報を利用する行為</li>
          <li>不正アクセス、脆弱性の悪用、過度なリクエスト送信</li>
          <li>法令または公序良俗に反する目的での利用</li>
          <li>サービスの運用、保守、セキュリティを妨げる行為</li>
        </ul>
      </section>

      <section class="legal-section">
        <h2>5. データの取り扱い</h2>
        <p>
          Osolab Auth は、認証、認可、監査、セキュリティ保護、サービス改善のために必要な範囲で
          アカウント情報、同意履歴、ログイン履歴、トークン発行履歴を取り扱います。
        </p>
      </section>

      <section class="legal-section">
        <h2>6. 規約の変更</h2>
        <p>
          本規約を変更する場合、重要な変更については再同意を求めることがあります。
          変更後の規約は、このページまたは同意画面に表示された時点から適用されます。
        </p>
      </section>
    </article>
  </main>
</template>

<script setup lang="ts">
useHead({ title: "Osolab Auth 利用規約" });
</script>
