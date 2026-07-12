# Add New dialog + per-cock notes breakdown

Date: 2026-07-12

## Summary

Reference value comboboxes (breed, bloodline, color/marking) no longer accept silent free text. When typed text has no exact catalog match, the dropdown shows only **Add New**, which opens a save dialog. Optional per-cock notes are stored on `rooster_event_registrations.notes` and appear on create and edit entry slots.

## Changelog

- Breed, bloodline, color/marking combobox: unknown text shows **Add New** only (no partial matches); dialog saves to catalog and selects the new value
- Removed free-text submit without catalog save (`allowCustomValue`)
- Optional **Notes** textarea on each cock slot at entry create and edit
- Per-cock notes persist on `rooster_event_registrations.notes` (separate from entry-level notes)

## Files touched

### supabase/
- `migrations/202607121710_rooster_registration_notes.sql`

### lib/
- `supabase/database.types.ts`

### features/reference-values/
- `schema.ts`, `schema.test.ts`
- `service.ts`, `actions.ts`
- `components/create-reference-value-dialog.tsx`
- `components/reference-value-combobox.tsx`

### features/entries/
- `schema.ts`, `schema.test.ts`
- `queries.ts`, `service.ts`
- `components/rooster-entry-slots.tsx`

### features/weighing/
- `schema.ts`, `service.ts`

### e2e/
- `rooster-entry-eligibility.spec.ts`

## Deploy steps

1. Apply migration `202607121710_rooster_registration_notes.sql` (`supabase db push` or dashboard)
2. Deploy app — no new env vars

## Manual test steps

1. **New rooster entry** → color combobox: type unknown value → only **Add New** appears → dialog → Save → value selected in combobox
2. Repeat on **Edit** for breed and bloodline profile fields
3. Fill **Notes** on a cock at create → save → **Edit** → notes textarea shows saved text
4. Confirm entry-level notes (owner/handler) unchanged and separate

## Tests

- Vitest: `npm run test:run` — 232 passed (exact-match helpers, notes parse)
- E2E: `npx playwright test e2e/rooster-entry-eligibility.spec.ts` (requires `PLAYWRIGHT_ADMIN_EMAIL` / `PLAYWRIGHT_ADMIN_PASSWORD`)

## E2E specs

- Extended `e2e/rooster-entry-eligibility.spec.ts`: cock notes persistence on edit; Add New color dialog flow

## Admin doc

N/A — `docs/admins/` not present in workspace

## Suggested ClashPoint commit

**Summary:** Add reference value Add New dialog and per-cock notes

**Body:** Comboboxes require catalog save via dialog when no exact match exists. Optional cock notes persist on rooster event registrations for create and edit flows.

## Linear paste block

```
Title: Add New dialog for reference values + per-cock notes

Description:
- Reference comboboxes show Add New only when typed text has no exact catalog match; dialog saves and selects the value
- Optional per-cock notes on entry create/edit stored on rooster_event_registrations.notes

Comment / instructions:
Apply migration 202607121710_rooster_registration_notes.sql. Test: unknown color → Add New → save; cock notes survive edit reload.

Documentation:
N/A
```
