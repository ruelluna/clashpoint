# VIP Mark paid posts to revolving fund — breakdown

**Date:** 2026-07-24

## Summary

VIP Palitada **Mark paid** now posts to the event revolving fund ledger, matching handler winner payouts at Cashier. Pay/refund obligations debit RF; collect obligations credit RF.

## Changelog

- **Mark paid** on VIP payout or draw refund → revolving fund **refund** entry (negative amount)
- **Mark paid** on VIP collect → revolving fund **collection** entry (positive amount)
- Obligation stores `ledger_entry_id`; deduped by match + obligation key
- Revolving fund page revalidates after VIP Mark paid

## Files touched

- `features/matches/match-settlement-obligations.ts` — VIP ledger amount/type helpers
- `features/matches/match-settlement-obligations.test.ts`
- `features/matches/match-settling-service.ts` — `markVipSettlementObligationPaid`
- `features/matches/actions.ts` — revalidate revolving-fund path

## Stage files

```bash
git add \
  features/matches/match-settlement-obligations.ts \
  features/matches/match-settlement-obligations.test.ts \
  features/matches/match-settling-service.ts \
  features/matches/actions.ts \
  .cursor/breakdowns/20260724-2348-vip-revolving-fund-ledger-breakdown.md
```

## Deploy steps

App deploy only — no migration.

## Manual test steps

1. Open a fight in **Settling** with VIP pay obligations (winning side).
2. Note revolving fund balance on **Revolving fund**.
3. **Mark paid** on a VIP row — balance should decrease by that amount; ledger shows Refund with obligation description.
4. For a losing-side VIP **Collect**, Mark paid — balance should increase (Collection entry).

## E2E

N/A — extends existing VIP settling flow; Vitest covers ledger sign/type mapping.

```bash
npm run test:run -- features/matches/match-settlement-obligations.test.ts
```

## Suggested commit

```
Post VIP settlement Mark paid to revolving fund ledger

VIP payout and draw refund debit RF; VIP collect credits RF. Aligns
Palitada settlement with handler Cashier payouts and pledge collections.
```

## Commit commands

```bash
git commit -m "$(cat <<'EOF'
Post VIP settlement Mark paid to revolving fund ledger

VIP payout and draw refund debit RF; VIP collect credits RF. Aligns
Palitada settlement with handler Cashier payouts and pledge collections.
EOF
)"
```
