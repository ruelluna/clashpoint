# Event details eligibility options summary

**Date:** 2026-07-12

## Summary

Event details page now shows an Eligibility and registration options panel for derby events with enabled eligibility checks. Staff can see which options are on, configured values, and which fields to fill on rooster entry.

## Changelog

- Derby event details include Eligibility and registration options panel when eligibility fields are configured
- Each enabled check lists configured options and rooster entry fields to fill
- Badges show enforcement status, policy status, rooster entry approval, and classification matching

## Files touched

- app/dashboard/events/[id]/page.tsx
- features/eligibility/policy-summary.ts
- features/eligibility/policy-summary.test.ts
- features/eligibility/components/eligibility-policy-summary-panel.tsx
- docs/admins/docs/phase-03-events/derby-rules-and-prizes.md

## Deploy

No migration or env vars. Deploy app only.

## Manual test

1. Open a derby event with eligibility fields enabled (Edit event -> derby eligibility section).
2. Go to Events -> event name (details tab).
3. Confirm Eligibility and registration options panel lists each enabled check with configured options and entry fields.

## E2E

N/A — read-only summary on event details; covered by manual test and Vitest.

## Vitest

npm run test:run -- features/eligibility/policy-summary.test.ts

## Suggested commit

Summary: Show eligibility options on derby event details

Body: Add a summary panel on event details listing enabled eligibility checks, configured values, and rooster entry fields staff must fill.
