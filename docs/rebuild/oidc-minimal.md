# 最低限OIDC UI 移植設計

## 目的

AuthFoundation の最小 Authorization Code + PKCE フローをブラウザから確認できる画面を追加する。

## 対象

- authorize 開始ボタン
- `state` / `nonce` / `code_verifier` / `code_challenge` 生成
- login form
- callback query の表示
- token exchange の簡易実行

## 非対象

- signup
- terms
- 本番向けtoken保管
- logout
- MFA

このPRのtoken表示は開発確認用に限定する。
