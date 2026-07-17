# Event settings refactor

**Date:** 2026-07-17

## Summary

Refactored event creation and settings: physical inspection is now a global event toggle (classic and derby), derby eligibility rules were simplified, tax commission and revolving fund were added with a basic ledger, defaults were updated (2-cock derby, tax 50/100), inline promoter creation was enabled, and obsolete form checkboxes were removed with legal authorization auto-set on save.

## Changelog

- Physical inspection is configured on the main event form for classic and derby events; the Inspection tab appears only when enabled.
- Derby eligibility panel keeps age class, weight, banding, and documents only.
- Tax per fight (defaults: 50 classic / 100 derby) and Tax commission (management per fight) are separate fields.
- Revolving fund initial amount on create; opening ledger row plus manual adjustments on the Revolving fund tab.
- Derby defaults: 2-Cock format; prize pool collected shown read-only on derby edit form.
- Promoters can be quick-added (name + phone) during derby event setup.
- Removed form checkboxes: legal authorization, public listing, publish matches/standings/winners/prize amounts.
- Opening registration (draft to open) sets is_public automatically; legal authorization is always true on save.

## Deploy steps

1. Apply Supabase migration 202607171640_event_settings_refactor.sql
2. Deploy app to Vercel (no new env vars)

## Manual test steps

1. Create derby event at /dashboard/events/new — 2-Cock default, tax 100, inspection toggle, revolving fund, prize pool 0, Add promoter.
2. Create classic event — tax defaults to 50; inspection toggle visible.
3. Edit derby — prize pool updates after registration/rooster entry payments.
4. Revolving fund tab — opening balance and manual adjustments.
5. Inspection tab hidden when disabled.

## E2E

npx playwright test e2e/event-owners.spec.ts
npx playwright test e2e/public-registration.spec.ts

## Vitest

npm run test:run

## Suggested commit

Summary: Refactor event settings form and add revolving fund ledger

Body: Moves physical inspection to a global event flag, simplifies derby eligibility UI, adds tax commission and revolving fund with a basic ledger, updates defaults, and enables inline promoter creation.
