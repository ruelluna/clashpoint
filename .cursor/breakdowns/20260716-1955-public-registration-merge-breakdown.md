# Public registration merge resolution

**Date:** 2026-07-16

## Summary

Resolved merge conflicts between `public-registration` and `main` using the hybrid approach: keep the staged public wizard (game farm -> roosters) with OTP for returning farms and session resume, while wiring in main breed/color catalog pickers, eligibility-driven banding, and Settings-controlled public reference-value creation.

Removed main single-page `public-entry-form-client` and `public/service.ts`.

## Changelog

- Public registration stays a two-step wizard; single-form flow removed
- Returning game farms still verify by email OTP; session cookie resumes at Step 2
- Step 2 shows catalog breed/color pickers and optional notes; handler name required per rooster
- Derby public submit requires all cock slots in one submission
- Band number required only when event eligibility policy requires banding
- Public breed/color values respect Settings toggles

## Deploy steps

1. Apply migrations `202607151830_rooster_breed_presets.sql` and `202607151930_reference_value_settings.sql` if missing
2. Conclude merge commit on `public-registration` and deploy
3. No new env vars

## Manual test steps

1. `/events/{id}/register` — new farm through both steps
2. Returning farm — OTP then roosters
3. Refresh after Step 1 — lands on Step 2
4. Duplicate farm name on Step 1 — blocked
5. Settings public breed/color toggles — verify public form behavior

## E2E

- `npx playwright test e2e/public-registration.spec.ts`

## Suggested commit

Merge main into public-registration with hybrid staged wizard
