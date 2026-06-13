# Password Change UI Design

## Goal

Add a development password change page that consumes a step-up token.

## Scope

- `/password/change` page
- Fields: email, current password, new password, step-up token
- Submit to `POST /account/password`

## Validation

- `npm run typecheck`
