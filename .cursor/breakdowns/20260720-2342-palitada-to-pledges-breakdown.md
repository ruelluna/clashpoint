# Palitada to Pledges rename — breakdown

**Date:** 2026-07-20

## Summary

Renamed all user-facing and code references from Palitada to Pledge/Pledges (owner pusta/bets per rooster side). DB payment category `match_bet` and BET- barcode prefix unchanged. New queue demotion audit reason is `pledge_refund` (historical `palitada_refund` rows unchanged).

## Changelog

- Matching, cashier, and print slips use **Pledge** / **Pledges** terminology.
- `data-testid`s: `cashier-pledge-due`, `cashier-record-pledge`, etc.
- `revertPalitadaPaymentSideEffects` → `revertPledgePaymentSideEffects`.
- E2E spec renamed to `e2e/matching-pledges.spec.ts`.
- User and admin docs updated.

## Files touched

### features/

- `features/matches/components/matching-board-client.tsx`
- `features/matches/actions.ts`
- `features/matches/service.ts`
- `features/matches/schema.ts`
- `features/matches/utils.ts`
- `features/matches/utils.test.ts`
- `features/matches/promotion.ts`
- `features/matches/promotion.test.ts`
- `features/matches/queries.ts` (SideBetDetails type fix for build)
- `features/payments/components/cashier-client.tsx`
- `features/payments/actions.ts`
- `features/payments/service.ts`
- `features/payments/service.test.ts`
- `features/payments/schema.ts`
- `features/payments/cashier-resolve.test.ts`
- `features/printing/components/match-bet-barcode-slip.tsx`

### e2e/

- `e2e/matching-pledges.spec.ts` (new)
- `e2e/matching-palitada.spec.ts` (deleted)

### scripts/

- `scripts/lib/seed-demo-shared.mjs`

### docs (nested repos — stage separately)

- `docs/users/docs/cashier-terminal.md`
- `docs/users/docs/matching-and-bets.md`
- `docs/admins/docs/phase-06-matching-fight-queue/match-pairing.md`
- `docs/admins/docs/cashier-terminal-admin.md`

## Stage files

```bash
git add \
  features/matches/components/matching-board-client.tsx \
  features/matches/actions.ts \
  features/matches/service.ts \
  features/matches/schema.ts \
  features/matches/utils.ts \
  features/matches/utils.test.ts \
  features/matches/promotion.ts \
  features/matches/promotion.test.ts \
  features/matches/queries.ts \
  features/payments/components/cashier-client.tsx \
  features/payments/actions.ts \
  features/payments/service.ts \
  features/payments/service.test.ts \
  features/payments/schema.ts \
  features/payments/cashier-resolve.test.ts \
  features/printing/components/match-bet-barcode-slip.tsx \
  e2e/matching-pledges.spec.ts \
  scripts/lib/seed-demo-shared.mjs \
  .cursor/breakdowns/20260720-2342-palitada-to-pledges-breakdown.md
git add -u e2e/matching-palitada.spec.ts
```

**Docs repo (stage separately):**

```bash
git -C docs/users add docs/cashier-terminal.md docs/matching-and-bets.md
git -C docs/admins add docs/phase-06-matching-fight-queue/match-pairing.md docs/cashier-terminal-admin.md
```

## Manual test steps

1. Matching board shows **Pledge Unpaid** badges and **Meron pledge (₱)** form labels.
2. Print slip header shows **PLEDGE**.
3. Cashier panel: **Pledge slip**, **Collect pledge**, test IDs `cashier-pledge-due`.
4. Receipt category label: **Pledge / match bet**.

## Tests

- `npm run test:run -- features/matches features/payments features/printing` (108 passed)
- `npm run build` (passed)
- E2E: `npx playwright test e2e/matching-pledges.spec.ts`

## Suggested ClashPoint commit

```
Rename Palitada to Pledges across app

User-facing copy, print slips, cashier test IDs, and code identifiers
now use pledge terminology. New demotion audit reason pledge_refund;
match_bet DB category unchanged.
```

## Commit commands

```bash
git commit -m "$(cat <<'EOF'
Rename Palitada to Pledges across app

User-facing copy, print slips, cashier test IDs, and code identifiers
now use pledge terminology. New demotion audit reason pledge_refund;
match_bet DB category unchanged.
EOF
)"
```
