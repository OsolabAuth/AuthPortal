# AuthPortal

OsolabAuth / AuthFoundation の認証画面です。

この `main` ブランチは、既存実装を機能単位で移植し直すための最小起点です。
現行実装は `legacy/current` ブランチに保持しています。

## Rebuild Policy

AuthFoundation の移植順に合わせて、必要な画面だけを小さく追加します。

1. 共通 UI / API 呼び出し基盤
2. OIDC login flow
3. signup
4. terms / consent
5. MFA / step-up authorization
6. password and account lifecycle screens

各機能は、設計書を先に追加し、その後で実装・テストを追加します。
