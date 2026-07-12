# Event Workflow Refactor — Breakdown

**Date:** 2026-07-12

## Summary

Restructured event operations into **Rooster Entries → Weighing → Matching** (with merged fight queue and side bets). Removed Payments tab, entry-fee UI, lineup submit flow, and legacy route surfaces while keeping payments / entry_fee columns in the database for audit history.

## Changelog (organizer-visible)

- **Rooster Entries** tab replaces Registrations (owner roster only; no Payment/Lineup columns).
- **Weighing** creates roosters with official weight in one step (no separate lineup submit).
- **Matching** records Meron/Wala side bets (editable until lock) and includes the **Fight queue** section.
- **Payments** tab and entry-fee field removed from event create/edit and overview.
- Legacy routes redirect: /registrations → /rooster-entries, /fight-queue → /matching, /payments → /rooster-entries.
- Staff modules: rooster-entries, weighing, matching; payments and lineups modules removed.

## Deploy steps

1. Supabase: Apply migration 202607121400_match_bets.sql.
2. Vercel: Deploy as usual; no new env vars.

## Manual test steps

1. Open an event - confirm tabs: Rooster Entries, Weighing, Matching.
2. Rooster Entries - New entry - save.
3. Weighing - add band + weight for two entries.
4. Matching - pair roosters, set bets, lock list, Mark called.
5. /registrations redirects to /rooster-entries.

## E2E

npx playwright test e2e/rooster-entries-weighing-matching.spec.ts

## Vitest

npm run test:run (135 tests passing)

## Admin / user docs

N/A - investment docs updated instead.

## Suggested ClashPoint commit

Summary: Refactor event workflow to rooster entries → weighing → matching

Removes entry-fee and payments UI, merges fight queue into matching, and adds match side bets.

## Changelog update (2026-07-12) — Remove Weighing tab

- Weighing tab removed from event navigation.
- Rooster + weight UI merged into Rooster Entries page (Roosters & weights section).
- /weighing redirects to /rooster-entries.
- rooster-entries staff module now includes weighing.manage permission.
- E2E and investment docs updated.

## Changelog update — Combined entry + rooster create

- New rooster entry form includes band, weight, category, and markings.
- createEntryWithRooster service creates entry then rooster (rolls back entry on rooster failure).
- List page no longer shows primary add-rooster form; only Add another cock for multi-cock entries.
