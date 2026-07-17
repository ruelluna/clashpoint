# Inspection tab fight-day station — breakdown

**Date:** 2026-07-17

## Summary

Hardened the Inspection tab into a fight-day operator station: find roosters by COCK barcode scan or entry/handler search, record and verify official weight, complete physical inspection with notes, route cleared cocks through Payments before Matching, and align matching eligibility with inspection and payment gates.

## Changelog

- Inspection pass requires verified weight with passed status before promotion
- Passed inspection sets conditionally_approved when rooster fees are unpaid; full approved after payment sync
- Find rooster panel: COCK barcode scan (derby) + entry name / handler search with multi-match picker
- Queue split into Pending, Cleared, and Failed / for review sections
- Organizer summary when queue complete with Open Payments and Mark event Ready for Matching actions
- Matching board eligible rooster query honors inspection, payment, registration, and lineup gates
- Rooster create respects physical_inspection_required and workflow routing flags

## Deploy steps

No new migrations. Deploy app only. No new env vars.

## Manual test steps

1. Edit event → enable Physical inspection required.
2. Inspection tab → Find rooster by entry name or COCK barcode.
3. Record official weight → Verify → Save inspection Passed.
4. Pay rooster fees on Payments if enabled → confirm matchable on Matching.

## Tests

npm run test:run
npm run build
npx playwright test e2e/rooster-entries-weighing-matching.spec.ts

## Suggested ClashPoint commit

Summary: Harden Inspection tab fight-day workflow and matching gates

Body: Inspection pass requires verified weight, payment-aware approval, find-rooster UX, and matching gate alignment.

## Documentation

Admin: phase-05-lineup-weighing/physical-inspection-station
User: phase-04-registration/physical-inspection-and-payments
