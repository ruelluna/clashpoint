# Cashier tender and change — breakdown

**Date:** 2026-07-20

## Summary

Added POS-style cash tendering to the Cashier Terminal: staff enter amount to collect (partial OK), cash tendered with Exact and denomination shortcuts, live change calculation, server validation, persisted tender/change on payments, receipt and ledger display.

## Changelog

- Cashier Terminal shows **Amount to collect**, **Cash tendered**, and live **Change due** before collecting payment.
- **Exact** and **₱100 / ₱500 / ₱1000** buttons speed tender entry; **Collect payment** disabled until tender covers collect amount.
- Payments store `amount_tendered` and `change_given`; receipts and payment list show tender/change when present.
- Success banner shows change after transaction when change > 0.

## Files touched

- `supabase/migrations/202607200300_payment_tender_change.sql`
- `lib/supabase/database.types.ts`
- `features/payments/tender.ts`, `tender.test.ts`, `schema.ts`, `schema.test.ts`, `actions.ts`, `service.ts`, `types.ts`
- `features/payments/components/cashier-client.tsx`, `cashier-tender-fields.tsx`
- `features/printing/components/payment-receipt-slip.tsx`
- `e2e/cashier.spec.ts`
- `docs/users/docs/cashier-terminal.md`, `docs/admins/docs/cashier-terminal-admin.md`

## Stage files

```bash
git add \
  supabase/migrations/202607200300_payment_tender_change.sql \
  lib/supabase/database.types.ts \
  features/payments/tender.ts \
  features/payments/tender.test.ts \
  features/payments/schema.ts \
  features/payments/schema.test.ts \
  features/payments/actions.ts \
  features/payments/service.ts \
  features/payments/types.ts \
  features/payments/components/cashier-client.tsx \
  features/payments/components/cashier-tender-fields.tsx \
  features/printing/components/payment-receipt-slip.tsx \
  e2e/cashier.spec.ts \
  .cursor/breakdowns/20260720-0130-cashier-tender-change-breakdown.md
```

Docs repo (stage separately):

```bash
git -C docs/users add docs/cashier-terminal.md
git -C docs/admins add docs/cashier-terminal-admin.md
```

## Deploy steps

1. Apply migration `202607200300_payment_tender_change.sql` (`supabase db push` or dashboard).
2. Deploy app.

## Manual test steps

1. Events → open event → Cashier Terminal → start session.
2. Lookup owner with dues; verify **Amount to collect** prefilled.
3. Click **Exact** → change ₱0.00 → collect.
4. New lookup: collect ₱700, tender ₱1000 via button → change ₱300 → collect → verify success + receipt.

## E2E

```bash
npx playwright test e2e/cashier.spec.ts
```

## Vitest

```bash
npm run test:run -- features/payments/tender.test.ts features/payments/schema.test.ts
```

## Suggested ClashPoint commit

Add cashier tender and change flow

Staff enter cash tendered at the terminal with live change calculation. Tender and change persist on payments and appear on receipts.

## Commit commands

```bash
git commit -m "$(cat <<''EOF''
Add cashier tender and change flow

Staff enter cash tendered at the terminal with live change calculation.
Tender and change persist on payments and appear on receipts.
EOF
)"
```
