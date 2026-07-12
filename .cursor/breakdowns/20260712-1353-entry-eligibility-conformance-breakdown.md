# Entry eligibility conformance

**Date:** 2026-07-12

## Summary

Rooster entry create/edit now evaluates and enforces derby eligibility policy. Derby events show policy-driven fields; saves are blocked when enforcement is on and rules fail.

## Changelog

- Entry forms adapt to enabled eligibility rules (age class, weight policy range, band, origin, experience)
- `applyRegistrationEligibility` persists snapshots and sets registration workflow status
- Create/update rooster blocks ineligible entries when enforcement is enabled
- Edit screen shows eligibility status and failed checks per rooster

## Files touched

- `features/eligibility/registration-bridge.ts`, `format-errors.ts`, `entry-form-context.ts`
- `features/entries/policy-validation.ts`, `actions.ts`, `service.ts`, `queries.ts`
- `features/entries/components/entry-form-client.tsx`, `entry-edit-client.tsx`, `rooster-policy-fields.tsx`
- `features/weighing/service.ts`, `schema.ts`
- `features/registrations/service.ts`
- `app/dashboard/events/[id]/rooster-entries/new/page.tsx`, `[entryId]/edit/page.tsx`
- `e2e/rooster-entry-eligibility.spec.ts`
- `docs/users/docs/phase-04-registration/registering-rooster-entries.md`
- `docs/admins/docs/phase-04-registration-payments/rooster-registry-and-approval.md`

## Deploy steps

Apply derby migrations if not already applied (`202607121702`–`202607121703`).

## Manual test

1. Create derby event with age + weight rules and enforcement ON
2. **Events → Rooster Entries → New entry** — confirm age class select and weight policy hint
3. Save with out-of-range weight — blocked with error
4. Save with valid age/weight — entry appears in list
5. Edit entry — eligibility status visible

## E2E

`npx playwright test e2e/rooster-entry-eligibility.spec.ts --workers=1`

## Suggested commit

**Summary:** Enforce derby eligibility on rooster entry save

**Body:** Wire rooster entry create/edit to eligibility evaluation with policy-driven form fields, snapshot persistence, and hard-block when enforcement is on and rules fail.

## Doc commits

User + admin phase-04 docs updated for eligibility at registration time.
