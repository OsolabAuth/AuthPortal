# Terms / Consent UI Design

## Goal

Display the OsolabAuth terms during signup and prevent registration without explicit consent.

## Scope

- Fetch `GET /terms/current`.
- Render terms text on `/signup`.
- Add a required consent checkbox.
- Include `terms_accepted` in the signup API payload.

## Validation

- `npm run typecheck`
