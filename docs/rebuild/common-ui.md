# 共通UI/API基盤 移植設計

## 目的

AuthPortal の各画面を機能ごとに移植できるように、先に Nuxt の最小構成と共通UI方針を用意する。

この段階では login / signup / terms の具体画面は実装しない。アプリ起動、共通レイアウト、API base URL の扱いだけを対象にする。

## 対象

- Nuxt 3 skeleton
- 共通 app shell
- runtime config
- basic CSS
- typecheck / build script

## 非対象

- OIDC flow
- login form
- signup form
- terms consent
- MFA / password screens

## 完了条件

- `npm run typecheck` が通る構成になっている。
- 後続PRで画面を1機能ずつ追加できる。
