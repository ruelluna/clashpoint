# Cash bond batch refund dialog + receipt

**Date:** 2026-07-20

## Summary

Cashier ledger rows now expose a single **Refund** dialog with per-line checkboxes. Cash bond is refundable; registration and rooster entry fees show as disabled with a non-refundable reason. Refunds from one action share a `refund_batch_id` and print a single itemized **Refund receipt** linked from the ledger.

## Changelog

- One **Refund** button per ledger row (batch or standalone) instead of three separate refund forms
- Refund dialog lists each fee line with collected amount; only **Cash bond** (and palitada/match bet on standalone rows) can be selected
- Refund action assigns shared `refund_batch_id` and stores `refunded_amount` on each refunded payment row
- **Print refund receipt** link on ledger rows after refund → `/payments/refund-batch/[id]/print`
- Refund slip shows original receipt reference, itemized table (Due / Collected / Refunded / Remaining / Balance / Status), total refunded, and reason
- Items column shows `Cash bond (refunded)` after bond refund

## Files touched

### supabase/
- `migrations/202607201750_payment_refund_batch.sql`

### lib/
- `supabase/database.types.ts`

### features/payments/
- `refund-eligibility.ts`, `refund-eligibility.test.ts`
- `batch-refund-receipt.ts`, `batch-refund-receipt.test.ts`
- `schema.ts`, `types.ts`, `actions.ts`, `service.ts`, `service.test.ts`
- `ledger-grouping.ts`, `ledger-grouping.test.ts`
- `components/batch-refund-dialog.tsx`, `components/cashier-client.tsx`

### features/printing/
- `components/registration-dues-refund-slip.tsx`

### app/
- `dashboard/events/[id]/payments/refund-batch/[refundBatchId]/print/page.tsx`

## Stage files

```bash
git add \
  supabase/migrations/202607201750_payment_refund_batch.sql \
  lib/supabase/database.types.ts \
  features/payments/refund-eligibility.ts \
  features/payments/refund-eligibility.test.ts \
  features/payments/batch-refund-receipt.ts \
  features/payments/batch-refund-receipt.test.ts \
  features/payments/schema.ts \
  features/payments/types.ts \
  features/payments/actions.ts \
  features/payments/service.ts \
  features/payments/service.test.ts \
  features/payments/ledger-grouping.ts \
  features/payments/ledger-grouping.test.ts \
  features/payments/components/batch-refund-dialog.tsx \
  features/payments/components/cashier-client.tsx \
  features/printing/components/registration-dues-refund-slip.tsx \
  app/dashboard/events/[id]/payments/refund-batch/[refundBatchId]/print/page.tsx \
  .cursor/breakdowns/20260720-1755-cash-bond-refund-batch-breakdown.md
```

## Deploy steps

1. Apply migration: `supabase db push` or run `202607201750_payment_refund_batch.sql` in Supabase dashboard
2. Deploy app (Vercel) — no new env vars

## Manual test steps

1. Open **Cashier Terminal** with an open session
2. Collect registration dues (reg + rooster + cash bond) for an entry
3. In payment history, confirm one ledger row with three **Items** and a single **Refund** button (not three)
4. Click **Refund** → dialog shows reg/rooster disabled, cash bond checked
5. Enter reason → **Confirm refund**
6. Row shows **Cash bond (refunded)** in Items; **Print refund receipt** link appears
7. Open refund print page — table shows bond refunded, reg/rooster unchanged with collected amounts
8. Confirm revolving fund ledger posts negative refund entry

## Tests

```bash
npm run test:run -- features/payments/refund-eligibility.test.ts features/payments/batch-refund-receipt.test.ts features/payments/ledger-grouping.test.ts features/payments/service.test.ts
npm run build
```

**E2E:** N/A — refund requires open cashier session and seeded payment rows; covered by Vitest eligibility/grouping/service tests and manual steps above.

## Suggested ClashPoint commit

```
Add batch refund dialog and cash bond refund receipt

One Refund dialog per ledger row with item selection; cash bond
refunds share refund_batch_id and print an itemized refund slip.
```

## Documentation

Admin doc N/A — extend existing cashier/payments admin guide when published; in-app flow is self-explanatory via dialog labels.

## Linear paste block

```
Title: Add batch refund dialog and cash bond refund receipt

Description:
Cashier rows use one Refund dialog with checkboxes. Cash bond is refundable;
registration/rooster fees are blocked. Refunds share refund_batch_id and
print a single itemized refund receipt linked from the ledger.

Comment / instructions:
Apply migration 202607201750_payment_refund_batch.sql. Test: collect dues →
Refund → select cash bond → Print refund receipt.

Documentation:
N/A (in-app labels)
```
