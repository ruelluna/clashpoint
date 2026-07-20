# Cash bond refund in Outstanding dues

**Date:** 2026-07-20

## Summary

Moved cash bond refund from the payment ledger into the **Outstanding dues** panel when an owner is re-scanned. Refund is gated by rooster/match completion rules: all roosters on the entry must be done, and any withdrawal forfeits the bond.

## Changelog

- **Refund cash bond** button appears in Outstanding dues (not on ledger rows) after bond is collected
- Dues lines use `displayLabel`; paid bond shows **Cash bond (Can be refunded after match)**
- Refund enabled only when every rooster is terminal (fought in completed match, disqualified, or withdrawn) and **no** rooster withdrew
- Disabled button shows reason: “Match not completed yet”, “Owner withdrew — bond forfeited”, etc.
- Server enforces the same rules in `refundSelectedPayments`
- Ledger keeps **Print receipt** / **Print refund receipt** only (no Refund button)

## Files touched

### features/payments/
- `cash-bond-refund.ts`, `cash-bond-refund.test.ts` (new)
- `dues.ts`, `types.ts`, `service.ts`, `refund-eligibility.ts`, `refund-eligibility.test.ts`
- `components/cash-bond-refund-dialog.tsx` (new)
- `components/cashier-client.tsx`
- Removed `components/batch-refund-dialog.tsx` (unused)

## Stage files

```bash
git add \
  features/payments/cash-bond-refund.ts \
  features/payments/cash-bond-refund.test.ts \
  features/payments/dues.ts \
  features/payments/types.ts \
  features/payments/service.ts \
  features/payments/refund-eligibility.ts \
  features/payments/refund-eligibility.test.ts \
  features/payments/components/cash-bond-refund-dialog.tsx \
  features/payments/components/cashier-client.tsx \
  .cursor/breakdowns/20260720-1830-cash-bond-refund-dues-breakdown.md
```

Note: stage deletion separately if tracking removed file:

```bash
git add features/payments/components/batch-refund-dialog.tsx
```

## Deploy steps

No new migration. Deploy app only.

## Manual test steps

1. Open Cashier Terminal with open session; collect full registration dues including cash bond
2. Re-scan owner → Outstanding dues shows bond line with **(Can be refunded after match)**; **Refund cash bond** disabled with “Match not completed yet”
3. Complete all entry roosters’ fights (or disqualify non-matched roosters per ops flow)
4. Re-scan → **Refund cash bond** enabled → confirm with reason → **Print refund receipt** on ledger row
5. Withdraw a rooster on another test entry after paying bond → re-scan → button disabled with “Owner withdrew — bond forfeited”

## Tests

```bash
npm run test:run -- features/payments/cash-bond-refund.test.ts features/payments/refund-eligibility.test.ts features/payments/ledger-grouping.test.ts
npm run build
```

**E2E:** N/A — requires completed matches and rooster status seeding; manual steps above.

## Suggested ClashPoint commit

```
Move cash bond refund to Outstanding dues with match gating

Refund cash bond from the dues panel after re-scan when all roosters
are done and none withdrew. Server enforces the same eligibility rules.
```

## Commit commands

```bash
git commit -m "$(cat <<'EOF'
Move cash bond refund to Outstanding dues with match gating

Refund cash bond from the dues panel after re-scan when all roosters
are done and none withdrew. Server enforces the same eligibility rules.
EOF
)"
```

## Linear paste block

```
Title: Move cash bond refund to Outstanding dues with match gating

Description:
Cashiers refund cash bond from Outstanding dues when the owner re-scans.
Refund unlocks only after all entry roosters are done; any withdrawal
forfeits the bond. Ledger refund buttons removed; print links remain.

Comment / instructions:
No migration. Test: collect bond → re-scan (disabled) → complete fights →
re-scan → refund → print refund receipt.

Documentation:
N/A
```
