# Merge cashier + palitada — breakdown

**Date:** 2026-07-20

## Summary

Resolved merge conflicts between the split entry-fee cashier branch and main's matching/palitada flow. Entry fees collect in one action with separate registration/rooster receipts; palitada uses BET barcode scan with a single receipt. Match auto-queue runs after entry payments and palitada payments.

## Changelog

- Cashier auto-collects registration + rooster entry fees in one payment; partial pay applies to registration first
- Entry fee success shows multiple print links; palitada success shows one print link
- Entry payments trigger promoteMatchesForEntry so matches auto-queue when both sides are paid up
- New entry_fees category collects are rejected (legacy rows still read for dues allocation)
- Admin and user cashier docs updated for split entry fees and BET palitada flow

## Files touched

### Conflict resolution
- features/payments/service.ts
- features/payments/components/cashier-client.tsx

### Docs (nested repos — stage separately)
- docs/users/docs/cashier-terminal.md
- docs/admins/docs/phase-04-registration-payments/cashier.md

### Merge payload (already staged from main + HEAD)
- app/dashboard/events/[id]/matching/ pages
- features/matches/*
- features/payments/* (except resolved files above)
- features/printing/components/match-bet-barcode-slip.tsx
- lib/supabase/database.types.ts
- supabase/migrations/202607201530_match_bet_payments.sql
- e2e/matching-palitada.spec.ts

## Stage files

git add \
  .cursor/breakdowns/20260720-0408-merge-cashier-palitada-breakdown.md \
  app/dashboard/events/[id]/matching/[matchId]/print/page.tsx \
  app/dashboard/events/[id]/matching/page.tsx \
  e2e/matching-palitada.spec.ts \
  features/matches/actions.ts \
  features/matches/components/matching-board-client.tsx \
  features/matches/components/matching-rooster-scan-row.tsx \
  features/matches/promotion.ts \
  features/matches/queries.ts \
  features/matches/schema.test.ts \
  features/matches/schema.ts \
  features/matches/service.ts \
  features/matches/types.ts \
  features/matches/utils.test.ts \
  features/matches/utils.ts \
  features/payments/actions.ts \
  features/payments/components/cashier-client.tsx \
  features/payments/dues.test.ts \
  features/payments/dues.ts \
  features/payments/fee-calc.ts \
  features/payments/schema.ts \
  features/payments/service.ts \
  features/payments/types.ts \
  features/printing/components/match-bet-barcode-slip.tsx \
  features/printing/components/payment-receipt-slip.tsx \
  features/public/queries.ts \
  lib/supabase/database.types.ts \
  supabase/migrations/202607201530_match_bet_payments.sql

Docs repo (stage separately):

git -C docs/users add docs/cashier-terminal.md
git -C docs/admins add docs/phase-04-registration-payments/cashier.md

## Deploy steps

1. Apply migration 202607201530_match_bet_payments.sql (supabase db push or dashboard)
2. Deploy app to Vercel after migration is applied
3. No new env vars

## Manual test steps

1. Entry fees: Open Cashier, scan entry with registration + rooster fees, one collect, two print links; partial pay covers registration first
2. Palitada: Scan BET barcode, Collect palitada, one print link
3. Auto-queue: After both sides pay palitada + entry dues, match moves from unpaid panel to fight queue on Matching board

## E2E

- Updated: e2e/cashier.spec.ts (split entry fees — from HEAD branch)
- Added: e2e/matching-palitada.spec.ts (skipped until seeded auth/data)

npx playwright test e2e/cashier.spec.ts
npx playwright test e2e/matching-palitada.spec.ts

## Suggested ClashPoint commit

Merge palitada flow with split entry-fee cashier

Combines matching BET payments and auto-queue promotion with split
registration/rooster entry collection. Entry fees print multiple receipts;
palitada prints one. Legacy entry_fees rows remain read-only in dues.

## Commit commands

git commit -m "Merge palitada flow with split entry-fee cashier" -m "Combines matching BET payments and auto-queue promotion with split registration/rooster entry collection. Entry fees print multiple receipts; palitada prints one. Legacy entry_fees rows remain read-only in dues."

User docs:

git -C docs/users commit -m "Document split entry-fee collect at cashier" -m "Cashiers collect registration and rooster fees in one payment with separate receipts; BET palitada scan unchanged."

Admin docs:

git -C docs/admins commit -m "Update cashier guide for split entry fees and palitada" -m "Operators see split entry-fee collection, BET palitada flow, and auto-queue when both sides are paid up."

## Linear paste block

Title: Merge palitada flow with split entry-fee cashier

Description:
Resolved merge conflicts between split entry-fee cashier and matching/palitada flow. Entry fees collect in one action with separate receipts; palitada uses BET scan with one receipt. promoteMatchesForEntry runs on all entry payment paths so matches auto-queue when both sides are paid.

Comment / instructions:
Apply migration 202607201530_match_bet_payments.sql before deploy. Test: cashier entry split collect, BET palitada collect, matching board auto-queue.

Documentation:
Admin: {ADMIN_DOCS_URL}/phase-04-registration-payments/cashier
User: {USER_DOCS_URL}/cashier-terminal
