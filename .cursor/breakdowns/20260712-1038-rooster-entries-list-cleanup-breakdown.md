# Rooster Entries list cleanup + edit/delete

**Date:** 2026-07-12

## Summary

Removed the embedded **Roosters & weights** section from the Rooster Entries list page. Added **Edit** and **Delete** flows for staff with `entries.manage`. Rooster band/weight fields are editable only when the cock is not already assigned to a match; delete is blocked when the entry or any of its roosters is referenced by a match.

## Changelog

- Rooster Entries list shows the entry table only (no weighing station UI).
- Per-row **Edit** link opens `/rooster-entries/[entryId]/edit`.
- Per-row **Delete** button soft-deletes after browser confirm; server rejects when entry/roosters are in a match.
- Edit form: owner/handler/contact always editable; rooster fields disabled when paired with note in UI.
- Server skips paired roosters on roster update and blocks delete when matches exist.

## Files touched

### app/
- app/dashboard/events/[id]/rooster-entries/page.tsx
- app/dashboard/events/[id]/rooster-entries/[entryId]/edit/page.tsx

### features/entries/
- components/rooster-entries-client.tsx
- components/entry-edit-client.tsx
- schema.ts, schema.test.ts
- service.ts, service.test.ts
- actions.ts, queries.ts

### e2e/
- e2e/rooster-entries-weighing-matching.spec.ts

### docs/
- docs/investment/UI_CONCEPT.md

## Deploy steps

No migration or new env vars.

## Manual test steps

1. Event -> Rooster Entries: no Roosters & weights section.
2. New entry -> Edit owner -> Delete (before matching).

## E2E

npx playwright test e2e/rooster-entries-weighing-matching.spec.ts

## Vitest

npm run test:run (144 passed)

## Suggested ClashPoint commit

Summary: Simplify Rooster Entries list and add edit/delete flows

Body: Removes embedded roosters/weights from list. Adds edit and soft-delete for entries.manage with match pairing guards.

## Admin / user docs

N/A

## Linear paste block

Title: Simplify Rooster Entries list and add edit/delete flows

Description:
Rooster Entries list is entries-only. Staff with entries.manage can edit and soft-delete entries; rooster edits blocked when paired in a match.

Comment / instructions:
No migration. Run npm run test:run and Playwright spec above.

Documentation:
Investment UI concept: docs/investment/UI_CONCEPT.md
