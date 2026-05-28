# Audit Log UI Design

## Goal

Add a simple development page to inspect AuthFoundation audit logs.

## Scope

- `/audit` page.
- Fetch `GET /audit/logs?limit=100`.
- Display event time, type, result, subject, actor, and client.

## Out of Scope

- Production access control.
- Filtering/search.
- Export.

## Validation

- `npm run typecheck`
