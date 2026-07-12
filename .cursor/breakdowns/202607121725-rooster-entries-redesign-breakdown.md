# Rooster Entries Classic vs Derby Redesign

**Date:** 2026-07-12

## Summary

Restructured rooster entry create/edit flows for Classic (1 cock) vs Derby (N-cock format).

## Changelog

- Classic: one required rooster on create
- Derby: N slots; min 1 on save; complete on edit
- Entry name per rooster; Owner Name/Game Farm with Add new dialog
- Contact: 69 + 8 digits; address removed from forms
- List: entry #, game farm, X/Y cocks

## Deploy

No migration. Deploy app only.

## Tests

npm run test:run -- features/entries/schema.test.ts
npx playwright test e2e/rooster-entries-weighing-matching.spec.ts
npx playwright test e2e/rooster-entry-eligibility.spec.ts

## Changelog (2026-07-12 follow-up)

- Entry rooster weight entered and validated in **grams** (Weight (g))
- Contact numbers use **+63** prefix; stored as +63 + 10 digits (e.g. +639171234567)
- Removed **Save owner for future entries** checkbox; owners saved via **Add new** dialog only
- User doc updated for grams, +63, and owner workflow

## Verification

- npm run test:run -- features/entries/schema.test.ts features/entries/policy-validation.test.ts features/entries/service.test.ts
- npm run build
