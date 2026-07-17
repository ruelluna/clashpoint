# Event form UI fixes

**Date:** 2026-07-17

## Summary

Fixed Physical inspection switch on create/edit (missing Switch.HiddenInput). Moved Prize pool collected from event form to event overview only.

## Changelog

- Physical inspection switch toggles on create and edit; saves correctly.
- Prize pool collected removed from Create/Edit event forms.
- Derby event overview shows Prize pool collected in Event details panel.

## Files touched

- features/events/components/event-form-client.tsx
- app/dashboard/events/[id]/page.tsx
- app/dashboard/events/[id]/edit/page.tsx
- e2e/events.spec.ts

## Deploy steps

None.

## Manual test

1. /dashboard/events/new — toggle Physical inspection; create classic event; Inspection tab appears.
2. Edit event — switch still checked; no Prize pool collected on form.
3. Derby event overview — Prize pool collected row visible.

## E2E

npx playwright test e2e/events.spec.ts

## Suggested commit

Fix event form inspection switch and move prize pool to overview

Physical inspection Switch now includes HiddenInput so it toggles on create/edit.
Prize pool collected displays on event overview only, not on the form.
