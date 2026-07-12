# Derby setup on event create

**Date:** 2026-07-12

## Summary

Organizers can configure full derby setup on the **New event** form: derby format, derby age profile, and optional eligibility rules. A single **Create event** submit saves the event row and eligibility policy atomically when policy fields are present and the user has `derby_eligibility.manage`.

## Changelog

- **New event (Derby):** Derby type renamed to **Derby format**; new **Derby age profile** select.
- **New event (Derby):** Optional **Derby eligibility rules** panel embedded in the main form.
- **Create flow:** `createEventAction` upserts eligibility policy after event insert when fields are submitted.
- **Permission guard:** Clear error if eligibility fields submitted without `derby_eligibility.manage`.
- **Edit flow:** Standalone Save eligibility settings unchanged.

## Files touched

- `app/dashboard/events/new/page.tsx`
- `features/events/components/event-form-client.tsx`
- `features/events/actions.ts`
- `features/eligibility/policy-form.ts`
- `features/eligibility/policy-service.ts`
- `features/eligibility/actions.ts`
- `features/eligibility/components/derby-eligibility-config-panel.tsx`
- `features/eligibility/policy-form.test.ts`

## Deploy steps

Apply derby migrations (`202607121700`-`202607121707`) if `derby_format` column errors appear. No new env vars.

## Manual test steps

1. Dashboard -> Events -> New event
2. Event type = Derby; set format and age profile
3. With eligibility permission: enable banding, add options, Create event
4. Verify event detail and edit page reflect settings
5. Create with all eligibility toggles off -> no enforcement

## E2E

N/A - manual steps cover create + policy flow.

## Vitest

npm run test:run -- features/eligibility/policy-form.test.ts

## Suggested ClashPoint commit

Add derby age profile and eligibility rules to event create

Organizers can set derby format, age profile, and optional eligibility field options on the new-event form. Policy is saved when the event row is created so a second edit pass is not required.
