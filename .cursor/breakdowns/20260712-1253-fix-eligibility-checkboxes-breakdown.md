# Fix eligibility checkboxes and entry fee

**Date:** 2026-07-12

## Summary

Eligibility sub-checkboxes were not clickable because Chakra UI v3 requires `Checkbox.HiddenInput`. Added a `PolicyCheckbox` helper with correct structure. Registration entry fee is now on the derby event form and wired through create/update.

## Changelog

- All eligibility policy checkboxes toggle correctly (weight, banding, origin, association, inspection, documents, payment).
- Derby create/edit forms include **Registration entry fee** field.
- Payment eligibility rule shows help text linking to the entry fee on the form.

## Files touched

- `features/eligibility/components/derby-eligibility-config-panel.tsx`
- `features/events/components/event-form-client.tsx`
- `features/events/schema.ts`
- `features/events/actions.ts`
- `features/events/service.ts`
- `features/events/schema.test.ts`

## Manual test steps

1. New event → Derby → enable Weight/Banding/Origin sections → click each sub-checkbox; confirm they toggle.
2. Set Registration entry fee (e.g. 500) → enable Payment rule → Create event.
3. Edit event → verify entry fee persists; payment help shows current fee amount.

## Vitest

npm run test:run -- features/events/schema.test.ts

## E2E

N/A — manual UI verification.

## Suggested commit

Fix eligibility checkboxes and add event entry fee field

Add Checkbox.HiddenInput via PolicyCheckbox so Chakra v3 eligibility toggles respond to clicks. Expose registration entry fee on the derby event form for the payment eligibility rule.
