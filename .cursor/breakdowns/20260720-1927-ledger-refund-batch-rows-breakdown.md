# Cashier ledger refund batch rows

**Date:** 2026-07-20

## Summary

Payment history now shows **append-only** rows: collection batches stay as historical collect receipts; each refund action adds a separate ledger row with **Print refund receipt**.

## Changelog

- Collection rows preserve original items and collected amounts (using `refunded_amount + amount_paid` snapshot)
- New **refund** row per `refund_batch_id` with refunded items, −refunded amount, Refunded status, and refund timestamp
- Collection rows no longer show `(refunded)` labels or refund print links
- Refund rows show **Print refund receipt** only; collection rows show **Print receipt** only

## Files touched

- `features/payments/ledger-grouping.ts`, `ledger-grouping.test.ts`
- `features/payments/types.ts`
- `features/payments/service.ts` (`updated_at` on ledger query)
- `features/payments/components/cashier-client.tsx`

## Stage files

```bash
git add \
  features/payments/ledger-grouping.ts \
  features/payments/ledger-grouping.test.ts \
  features/payments/types.ts \
  features/payments/service.ts \
  features/payments/components/cashier-client.tsx \
  .cursor/breakdowns/20260720-1927-ledger-refund-batch-rows-breakdown.md
```

## Manual test

1. Collect registration dues → one collection row with Print receipt
2. Refund cash bond → **second row** appears (newer, Refunded status, −bond amount, Print refund receipt)
3. Original collection row unchanged (still shows all three items and full collected total)

## Tests

```bash
npm run test:run -- features/payments/ledger-grouping.test.ts
npm run build
```

**E2E:** N/A — ledger grouping covered by Vitest; existing cashier E2E still expects one Print receipt link after collect only.

## Suggested commit

```
Add append-only refund rows to cashier payment ledger

Collection rows stay historical; each refund_batch_id gets its own
ledger row with Print refund receipt.
```

## Commit commands

```bash
git commit -m "$(cat <<'EOF'
Add append-only refund rows to cashier payment ledger

Collection rows stay historical; each refund_batch_id gets its own
ledger row with Print refund receipt.
EOF
)"
```
