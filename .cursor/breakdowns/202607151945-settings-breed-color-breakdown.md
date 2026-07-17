# Settings breed & color catalog

**Date:** 2026-07-15

## Summary

Admins manage canonical Breed and Color options on Settings. Staff rooster entry forms pick from the catalog only. Public registration can add new values by default; separate Settings toggles lock down public breed and/or color add when the catalog is mature.

## Changelog

- Settings Breed options / Color options — add and delete catalog values (delete blocked when in use)
- Settings toggles — allow public registrants to add new breeds/colors (default on)
- Rooster entry fields — breed and color use searchable catalog pickers
- Staff save — breed/color must exist in catalog
- Public save — respects toggles: find-or-create when allowed, strict catalog when disabled

## Deploy steps

1. Apply migration 202607151930_reference_value_settings.sql
2. Deploy app
3. No new env vars

## E2E

npx playwright test e2e/settings-reference-options.spec.ts
npx playwright test e2e/rooster-entry-eligibility.spec.ts

## Suggested commit

Add Settings breed/color catalog and wire rooster entry pickers
