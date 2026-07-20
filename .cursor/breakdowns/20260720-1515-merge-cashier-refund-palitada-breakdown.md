# Merge iron-branch + palitada refund side effects

**Date:** 2026-07-20

## Summary

Resolved merge conflicts between `develop` (refund tender constraint fix) and `iron-branch` (split entry-fee slips, merged cashier/palitada). Kept both tender helpers. Added palitada refund side effects: revert `match_bets` to unpaid and demote auto-queued matches when palitada is refunded before the fight is called.

## Changelog

- Cashier split entry-fee collect retained: one action, separate registration/rooster payment rows and receipts
- Refund still clears `amount_tendered` / `change_given` to satisfy `payments_tender_change_check`
- Refunding a **match_bet** (palitada) payment reverts that bet slip to **unpaid** so Cashier can collect again
- If the match was auto-queued (`locked` + `scheduled`) and is no longer queue-ready, it is demoted to **draft** with queue cleared
- Refunds blocked once the fight queue has advanced to **called**, **ready**, or **ongoing**

## Files touched

### features/

- `features/payments/service.ts` — combined imports; palitada side effects in `refundPayment`
- `features/payments/tender.test.ts` — both test suites
- `features/payments/service.test.ts` — mock palitada revert; match_bet linkage
- `features/matches/promotion.ts` — `revertPalitadaPaymentSideEffects`
- `features/matches/promotion.test.ts` — demote + blocked-when-called cases

## Deploy steps

No migration. Deploy app after merge commit.

## Manual test steps

1. Complete merge commit if not done: `git add features/payments/service.ts features/payments/tender.test.ts` then `git commit`
2. **Split entry fees:** Cashier → collect partial/full reg + rooster fees → confirm two slips when both portions paid
3. **Refund entry fee row:** Refund one split row → entry status recalculates; other row unchanged
4. **Palitada refund (scheduled):** Create match, pay both palitada, confirm fight in queue → refund one side → bet unpaid, match demoted to Matching board
5. **Palitada refund (called):** Advance fight to Called → attempt palitada refund → error message

## Tests

```bash
npm run test:run -- features/payments/tender.test.ts features/payments/service.test.ts features/matches/promotion.test.ts features/payments/dues.test.ts
npx playwright test e2e/cashier.spec.ts
```

E2E: existing `e2e/cashier.spec.ts` covers split entry fees; palitada refund not in E2E (service + promotion Vitest cover it).

## Suggested ClashPoint commit

```
Summary: Merge iron-branch cashier split fees and palitada refund side effects

Combine split entry-fee tender allocation with refund tender clearing.
Palitada refunds revert match_bets to unpaid and demote scheduled matches
when the fight is not yet called.
```

## Linear paste block

```
Title: Merge cashier split fees + palitada refund side effects

Description:
Resolved iron-branch merge conflicts. Split entry-fee slips and refund tender
fix both retained. Palitada refunds now revert bet slips and demote matches
from the queue when appropriate; blocked after fight is called.

Comment / instructions:
No migration. Run Vitest payment/promotion tests. Manual: refund palitada on
scheduled fight → match returns to Matching; refund after Called → blocked.

Documentation: N/A (no doc changes this pass)
```
