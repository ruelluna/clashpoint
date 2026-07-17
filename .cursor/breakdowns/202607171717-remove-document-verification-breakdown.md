# Remove Document Verification from eligibility panel

**Date:** 2026-07-17

## Summary

Removed the Document verification field toggle from derby eligibility configuration. Saves now always persist document_verification_required: false.

## Changelog

- Organizers no longer see Document verification in Derby eligibility rules.
- Re-saving eligibility clears document verification on the policy row.

## Files touched

- lib/derby/eligibility-fields.ts
- features/eligibility/components/derby-eligibility-config-panel.tsx
- features/eligibility/policy-form.ts
- features/eligibility/policy-summary.ts
- features/eligibility/schema.ts
- features/eligibility/schema.test.ts
- e2e/events.spec.ts

## Deploy steps

None.

## Manual test

Edit derby event, confirm Document verification toggle is gone from eligibility panel.

## E2E

Updated e2e/events.spec.ts — run: npx playwright test e2e/events.spec.ts

## Suggested commit

Remove Document verification from derby eligibility panel
