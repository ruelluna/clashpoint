# Remove Registration Approval Workflow

**Date:** 2026-07-12

## Summary

Registrations is now a roster list only. Staff record who registered; Approve/Reject actions and the Registration status column are removed. Payment unlocks lineup submission; matching in Classic/Derby remains downstream and optional per entry.

## Changelog

- Registrations list shows Entry, Owner, Payment, and Lineup only — no Approve/Reject buttons
- Filter by payment status replaces registration status filter
- Lineup eligibility requires full payment only (`payment_status === 'paid'`)
- Payments page no longer shows registration badge; all unpaid/partial entries can receive payment
- Prize pool and event summary reports count paid entries (`paid_entries` column)
- Lineups copy updated to “fully paid entries”

## Files touched

### `features/entries/`
- `components/entries-list-client.tsx` — simplified list UI
- `actions.ts` — removed approve/reject actions
- `service.ts` — removed approve/reject services
- `schema.ts` — removed approve/reject schemas; `canSubmitLineup` payment-only
- `schema.test.ts` — added `canSubmitLineup` tests

### `features/payments/`
- `service.ts` — removed rejected/cancelled payment block
- `components/payments-ledger-client.tsx` — payment-only summary and payable filter

### `features/lineups/`
- `components/lineups-client.tsx` — copy update
- `service.ts` — error message update

### `features/prizes/`
- `service.ts` — count paid entries for prize pool

### `features/reports/`
- `queries.ts` — `paid_entries` count
- `types.ts` — renamed `confirmed_entries` to `paid_entries`

### `docs/investment/`
- `MILESTONE_CHECKLIST.md` — aligned registration workflow wording

## Deploy steps

No Supabase migration or new env vars. Deploy app code only.

## Manual test steps

1. Registrations — `/dashboard/events/{id}/registrations` — no Approve/Reject; Payment + Lineup only
2. Payments — record full payment; summary shows Paid badge only
3. Registrations — Lineup shows Eligible after payment
4. Lineups — paid entry can submit
5. Reports — event summary CSV includes `paid_entries`

## E2E

N/A — UI removal and column drop.

## Vitest

npm run test:run -- features/entries/schema.test.ts

## Suggested ClashPoint commit

Summary: Remove registration approval workflow from entries list

Body: Registrations is a roster list only. Payment gates lineup eligibility; prize/report counts use paid entries.

## Linear paste block

Title: Remove registration approval workflow

Description:
Registrations is now a list-only roster. Approve/Reject removed. Payment unlocks lineup.

Comment / instructions:
No migration. Deploy app only.
