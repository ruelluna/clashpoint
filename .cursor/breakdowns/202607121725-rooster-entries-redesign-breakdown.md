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
