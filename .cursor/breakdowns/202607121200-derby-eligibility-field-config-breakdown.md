# Derby eligibility field configuration — breakdown

**Date:** 2026-07-12

## Summary

Derby events now support optional eligibility dimensions on the event edit screen. System users enable a field (banding, experience, weight, etc.), add accepted options for that field, and save a per-event policy. Disabled fields are skipped during eligibility evaluation.

## Changelog

- Derby event edit page shows **Derby eligibility rules** panel below the main event form
- Each eligibility dimension can be toggled on/off independently
- When enabled, organizers can add/remove options (band levels, organizations, years, seasons, age classes, experience statuses, origin types, breeding relationships)
- **Enforce eligibility** toggle saves to the event and gates registration review outcomes
- Saving clears stored values for disabled fields so old rules do not leak into workflow or evaluation

## Files touched

- `supabase/migrations/202607121707_eligibility_enabled_fields.sql`
- `lib/derby/eligibility-fields.ts`
- `features/eligibility/schema.ts`, `schema.test.ts`, `actions.ts`, `service.ts`, `types.ts`, `queries.ts`
- `features/eligibility/components/derby-eligibility-config-panel.tsx`
- `features/associations/queries.ts`
- `components/dashboard/option-list-field.tsx`, `index.ts`
- `features/events/components/event-form-client.tsx`
- `app/dashboard/events/[id]/edit/page.tsx`

## Deploy steps

1. Apply Supabase migration `202607121707_eligibility_enabled_fields.sql`
2. No new env vars

## Manual test steps

1. Open a derby event → Edit
2. Scroll to Derby eligibility rules
3. Enable Banding → add band levels and a custom organization → Save eligibility settings
4. Enable Experience → add Maiden and 1x Winner → save again
5. Toggle Enforce eligibility → save
6. Evaluate a registration and confirm only enabled checks appear

## Tests

- Vitest: `npm run test:run -- features/eligibility/schema.test.ts`
- E2E: N/A — configuration UI only

## Suggested ClashPoint commit

```
Add configurable derby eligibility fields on event edit

Derby organizers can enable optional eligibility dimensions and define
accepted options per field. Evaluation skips disabled fields so rules stay
scoped to what each event actually enforces.
```
