# Unified registration dues collect + itemized receipt

**Date:** 2026-07-20

## Summary

Cashier Terminal now collects **registration fee, rooster entry fee, and cash bond** in one payment with FIFO allocation (registration → rooster entry → cash bond). Each collect produces a **single itemized receipt** via `collection_batch_id`. Follow-up partial payments issue **new receipts** (append-only); prior slips are not edited.

## Changelog

- One **Collect payment** covers all three registration dues when any are outstanding; category dropdown hidden until only fee adjustments remain.
- Partial payments apply FIFO across all three categories (e.g. ₱2,000 against ₱2,500 clears reg and rooster first, then partial cash bond).
- After success, one **Print receipt** link opens the batch itemized slip (line items + account balance summary).
- Adjustments and palitada flows unchanged (separate collects / single-category receipts).

## Files touched

### supabase/

- `supabase/migrations/202607201650_payment_collection_batch_id.sql`

### lib/

- `lib/supabase/database.types.ts`

### features/

- `features/payments/dues.ts`
- `features/payments/dues.test.ts`
- `features/payments/schema.ts`
- `features/payments/service.ts`
- `features/payments/actions.ts`
- `features/payments/types.ts`
- `features/payments/components/cashier-client.tsx`
- `features/printing/components/registration-dues-receipt-slip.tsx`

### app/

- `app/dashboard/events/[id]/payments/batch/[batchId]/print/page.tsx`

### e2e/

- `e2e/cashier.spec.ts`

## Stage files

```bash
git add \
  supabase/migrations/202607201650_payment_collection_batch_id.sql \
  lib/supabase/database.types.ts \
  features/payments/dues.ts \
  features/payments/dues.test.ts \
  features/payments/schema.ts \
  features/payments/service.ts \
  features/payments/actions.ts \
  features/payments/types.ts \
  features/payments/components/cashier-client.tsx \
  features/printing/components/registration-dues-receipt-slip.tsx \
  app/dashboard/events/[id]/payments/batch/[batchId]/print/page.tsx \
  e2e/cashier.spec.ts \
  .cursor/breakdowns/20260720-1657-unified-registration-dues-receipt-breakdown.md
```

## Commit commands

```bash
git commit -m "$(cat <<'EOF'
Unify registration dues collect with itemized receipt

Cashier collects registration, rooster entry, and cash bond in one
FIFO payment and prints a single itemized batch receipt. Partial
follow-up collects issue new slips without editing prior receipts.
EOF
)"
```

## Deploy steps

1. Apply Supabase migration: `supabase db push` or run `202607201650_payment_collection_batch_id.sql` in dashboard.
2. Deploy app (Vercel or usual pipeline).

## Manual test steps

1. Event with registration (500), entry fee per rooster (200), cash bond (1000); register owner with 2 roosters.
2. **Cashier Terminal** → open session → scan owner.
3. Confirm no category dropdown; total outstanding **1,900**; helper text mentions all three fees and one receipt.
4. **Collect payment** (exact tender) → one **Print receipt** link → slip shows three line items and **Paid** overall.
5. New entry, pay **2,000** against **2,500** (400 reg + 100 rooster + 2,000 bond): receipt shows reg/rooster paid, bond **500 remaining**, overall **Partial**.
6. Collect remaining 500 → new receipt; entry fully paid.

## E2E

- Updated: `e2e/cashier.spec.ts`
- Run: `npx playwright test e2e/cashier.spec.ts`

## Documentation

**Admin docs N/A** — `docs/admins/` not present in workspace. When available, update cashier guide: unified collect, FIFO order, itemized batch receipt, new slip per partial installment.

## Suggested ClashPoint commit

```
Unify registration dues collect with itemized receipt

Cashier collects registration, rooster entry, and cash bond in one
FIFO payment and prints a single itemized batch receipt. Partial
follow-up collects issue new slips without editing prior receipts.
```

## Linear paste block

```
Title: Unify registration dues collect with itemized receipt

Description:
Cashier Terminal collects registration, rooster entry, and cash bond in one payment (FIFO: registration first). Each collect prints one itemized receipt grouped by collection_batch_id. Partial follow-up payments create new receipts; prior slips stay unchanged.

Comment / instructions:
Apply migration 202607201650_payment_collection_batch_id.sql. Test: scan owner → collect → print batch receipt; partial pay → new receipt with remaining balance on slip.

Documentation:
Admin: N/A (docs/admins not in workspace)
```
