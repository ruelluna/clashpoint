# Winners, Prizes, Payouts & Promoter Settlements

**Date:** 2026-07-04

## Summary

Shipped end-to-end winner finalization, prize pool math, prize payout release, promoter settlement, and winner announcement flows for event dashboard.

## Changelog

- Finalize winners from standings with event tie-breaker; lock results and generate pending prize payouts
- Prize pool: entries x fee minus deductions and promoter commission, with guaranteed prize floor
- Release prize payouts with payment method and audit trail
- Promoter settlement computes payable/receivable; message when no promoter assigned
- Announcement page generates copy-ready winner text

## Deploy steps

Apply migration `202607041700_winners_payouts.sql` via `supabase db push`.

## Manual test

Standings -> Winners -> Payouts -> Promoter Settlement -> Announcement -> Audit log

## Vitest

npm run test:run -- features/prizes/utils.test.ts

## Suggested commit

Summary: Add winners, payouts, and promoter settlement modules

Body: Finalize winners, auto-generate prize payouts, release payouts with audit logging, compute promoter settlements.
