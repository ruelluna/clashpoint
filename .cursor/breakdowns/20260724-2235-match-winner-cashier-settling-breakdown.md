# Match Winners + Matching Code Settling

**Date:** 2026-07-24

## Summary

Settling is organized by Active Matching Code. A **Match Winners** section shows handler bet + winnings payouts (paid at Cashier). Cashier scans BET-/COCK- stickers post-fight, shows win/lose/draw refund, pays from revolving fund, and blocks settle until handler obligations are paid.

## Changelog

- Settling cards titled `{matching_number} · Settling` (Fight # badge secondary), sorted by matching code
- **Match Winners** section above VIP: handler payout breakdown, progress badge, link to Cashier (read-only in Settling)
- New obligation types `handler_win_payout` / `handler_draw_refund`; settle gate requires Cashier payout
- Cashier: win/lose/draw refund UI on paid pledge slips when match is `settling`; `recordMatchBetWinPayout` posts RF refund + marks obligation paid
- COCK- scan resolves paid bets on `settling` matches for winner payout
- Results expandable details include Match Winners lines (bet + won, paid timestamp)
- Migration adds `match_bet_payout` payment category and `match_bets.payout_status` / `payout_payment_id`

## Files touched

### supabase/

- `supabase/migrations/202607242200_handler_winner_cashier_payout.sql`

### lib/

- `lib/supabase/database.types.ts`

### features/matches/

- `features/matches/match-settlement-obligations.ts`
- `features/matches/match-settlement-obligations.test.ts`
- `features/matches/match-settling-service.ts`
- `features/matches/pledge-settlement.ts`
- `features/matches/types.ts`
- `features/matches/components/matching-handler-settlement-list.tsx`
- `features/matches/components/matching-settling-panel.tsx`

### features/payments/

- `features/payments/service.ts`
- `features/payments/actions.ts`
- `features/payments/schema.ts`
- `features/payments/types.ts`
- `features/payments/fee-calc.ts`
- `features/payments/components/cashier-client.tsx`

### features/results/

- `features/results/queries.ts`
- `features/results/types.ts`
- `features/results/components/results-entry-client.tsx`

### e2e/

- `e2e/match-winner-cashier-payout.spec.ts` (skipped until seed)

## Stage files

```bash
git add \
  supabase/migrations/202607242200_handler_winner_cashier_payout.sql \
  lib/supabase/database.types.ts \
  features/matches/match-settlement-obligations.ts \
  features/matches/match-settlement-obligations.test.ts \
  features/matches/match-settling-service.ts \
  features/matches/pledge-settlement.ts \
  features/matches/types.ts \
  features/matches/components/matching-handler-settlement-list.tsx \
  features/matches/components/matching-settling-panel.tsx \
  features/payments/service.ts \
  features/payments/actions.ts \
  features/payments/schema.ts \
  features/payments/types.ts \
  features/payments/fee-calc.ts \
  features/payments/components/cashier-client.tsx \
  features/results/queries.ts \
  features/results/types.ts \
  features/results/components/results-entry-client.tsx \
  e2e/match-winner-cashier-payout.spec.ts \
  .cursor/breakdowns/20260724-2235-match-winner-cashier-settling-breakdown.md
```

## Deploy steps

```bash
supabase db push
```

Fights already in `settling` before this migration may need result re-record to regenerate handler obligations.

## Manual test steps

1. Run migration; open event with paid pledges + VIP Palitada; record **Wala win**.
2. **Matching → Settling:** card shows `ABCD-0014 · Settling`, Match Winners row (bet + won = total), VIP, Monton RF.
3. **Cashier:** scan losing Meron BET- → **Lost — no payout**.
4. Scan winning Wala BET- → Pay winner → obligation **Paid at Cashier**, RF balance drops.
5. Complete VIP + Monton posts → **Mark match settled**.
6. **Draw:** both handlers scan and receive draw refunds before settle.
7. **Results:** expand row → Match Winners lines with paid timestamps.

## E2E

- Added `e2e/match-winner-cashier-payout.spec.ts` (skipped until seed)
- Run when seeded: `npx playwright test e2e/match-winner-cashier-payout.spec.ts`

## Vitest

```bash
npm run test:run -- features/matches/match-settlement-obligations.test.ts
```

## Admin / user docs

N/A — nested doc repos not updated in this pass. When publishing, add Cashier winner scan + Settling section order to admin guides.

## Suggested ClashPoint commit

```
Add match winner Cashier payout and matching-code Settling

Handlers are paid at Cashier after results; Settling shows Match Winners
by matching code and blocks mark settled until handler, VIP, and RF rows
are complete.
```

## Commit commands

```bash
git commit -m "$(cat <<'EOF'
Add match winner Cashier payout and matching-code Settling

Handlers are paid at Cashier after results; Settling shows Match Winners
by matching code and blocks mark settled until handler, VIP, and RF rows
are complete.
EOF
)"
```

## Linear paste block

```
Title: Match Winners Cashier payout + matching-code Settling

Description:
Settling cards use Active Matching Code titles and sort order. Match Winners
section shows handler bet + winnings; payout is Cashier-only via BET-/COCK-
scan with win/lose/draw validation. Revolving fund debits on payout; mark
settled blocked until handler obligations are paid.

Comment / instructions:
Apply supabase db push (202607242200_handler_winner_cashier_payout.sql).
Re-record results on fights already in settling if handler rows missing.
Test: result → Settling Match Winners → Cashier pay winner → VIP/RF → settle.

Documentation:
N/A this pass (admin Cashier winner scan guide when docs repo updated)
```
