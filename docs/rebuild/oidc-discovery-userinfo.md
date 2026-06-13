# OIDC Discovery / JWKS / UserInfo UI Design

## Goal

Keep the portal compatible with AuthFoundation's OIDC metadata endpoints without adding new user-facing UI.

## Scope

- No new portal pages are required.
- The existing callback page continues to display token exchange output.
- Future portal work may add a session screen that calls `/userinfo`, but this branch only depends on the AuthFoundation endpoints.

## Validation

- `npm run typecheck`
