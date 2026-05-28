# Logout / Revoke UI Design

## Goal

Add a minimal logout screen for the rebuild portal.

## Scope

- `/logout` page
- Button calls `POST /logout`
- Token revocation remains API-only until a persisted browser session exists.

## Validation

- `npm run typecheck`
