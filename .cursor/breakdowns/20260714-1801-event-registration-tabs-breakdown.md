# Event registration tab refactor — breakdown

**Date:** 2026-07-14

## Summary

Unified event registration into **Owners → Roosters → Inspection → Payments** for both derby and classic events.

## Changelog

- Event tabs: Owners, Roosters, Inspection, Payments (removed Weighing / Rooster Entries / Registrations)
- Classic events use owner-first registration on Owners tab
- Roosters tab: unified cock list + add form; entry fees stay pending until Payments
- Inspection: official weight + physical inspection; pass marks eligible
- Legacy routes redirect to new paths; global Roosters nav removed

## Deploy

No migration. Deploy app only.

## Manual test

Owners → Roosters → Inspection → Payments on classic and derby events; verify legacy URL redirects.

## E2E

npx playwright test e2e/rooster-entries-weighing-matching.spec.ts
npx playwright test e2e/rooster-entry-eligibility.spec.ts

## Vitest

npm run test:run

## Admin doc

N/A — docs/admins nested repo not in workspace.

## Suggested commit

Refactor event registration to Owners → Roosters → Inspection → Payments
