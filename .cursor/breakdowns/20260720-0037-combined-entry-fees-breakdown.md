# Combined entry fees payment

**Date:** 2026-07-20

## Summary

Cashiers can collect registration and rooster entry fees in one payment after scanning an owner or cock barcode. The payment category **Registration & entry fees** replaces separate Registration fee / Rooster entry fee options. Cash bond and fee adjustments remain separate categories.

## Changelog

- Cashier payment category dropdown shows **Registration & entry fees** when registration and/or rooster entry amounts are outstanding (not separate reg/rooster picks).
- Default amount after scan equals combined registration + rooster entry outstanding.
- One `entry_fees` payment row is recorded; FIFO allocation clears registration first, then rooster entry on partial payments.
- Prize pool totals include `entry_fees` collections.
- New DB enum value `entry_fees` on `payment_category`.

## Files touched

### supabase/

- `supabase/migrations/202607201235_payment_category_entry_fees.sql`

### features/

- `features/payments/dues.ts`
- `features/payments/dues.test.ts`
- `features/payments/fee-calc.ts`
- `features/payments/schema.ts`
- `features/payments/service.ts`
- `features/payments/components/cashier-client.tsx`
- `features/events/prize-pool-utils.ts`
- `features/events/prize-pool.ts`
- `features/events/prize-pool.test.ts`

### lib/

- `lib/supabase/database.types.ts`

### e2e/

- `e2e/cashier.spec.ts`

## Stage files

```bash
git add \
  supabase/migrations/202607201235_payment_category_entry_fees.sql \
  lib/supabase/database.types.ts \
  features/payments/dues.ts \
  features/payments/dues.test.ts \
  features/payments/fee-calc.ts \
  features/payments/schema.ts \
  features/payments/service.ts \
  features/payments/components/cashier-client.tsx \
  features/events/prize-pool-utils.ts \
  features/events/prize-pool.ts \
  features/events/prize-pool.test.ts \
  e2e/cashier.spec.ts \
  .cursor/breakdowns/20260720-0037-combined-entry-fees-breakdown.md
```

## Deploy steps

1. Apply migration: `supabase db push` or run `202607201235_payment_category_entry_fees.sql` in the Supabase dashboard.
2. Deploy app (Vercel or your usual pipeline).
3. No new env vars.

## Manual test steps

1. Event with registration fee (500) and entry fee per rooster (200) enabled; register an owner with at least one rooster.
2. **Events → Cashier** → scan `OWN-…` or search owner.
3. Confirm breakdown shows Registration fee and Rooster entry fee lines; category defaults to **Registration & entry fees**; amount = sum of both outstanding.
4. **Collect payment** once → receipt shows combined category; both entry-fee lines clear.
5. If cash bond enabled, confirm bond appears as a separate category for a follow-up collection.

## E2E

- Updated: `e2e/cashier.spec.ts` (combined category default + receipt label)
- Run: `npx playwright test e2e/cashier.spec.ts`

## Documentation

**Admin docs N/A** — `docs/admins/` is not present in this workspace. When publishing admin docs, update `docs/admins/docs/phase-04-registration-payments/cashier.md` to describe the combined **Registration & entry fees** collection step.

## Suggested ClashPoint commit

```
Combine registration and rooster entry fees in Cashier

Cashiers collect registration and per-rooster entry fees in one payment
after scanning. Cash bond and adjustments stay separate categories.
Adds entry_fees payment_category with FIFO allocation in dues math.
```

## Commit commands

```bash
git commit -m "$(cat <<'EOF'
Combine registration and rooster entry fees in Cashier

Cashiers collect registration and per-rooster entry fees in one payment
after scanning. Cash bond and adjustments stay separate categories.
Adds entry_fees payment_category with FIFO allocation in dues math.
EOF
)"
```

## Linear paste block

```
Title: Combine registration and rooster entry fees in Cashier

Description:
Cashiers no longer choose between Registration fee and Rooster entry fee.
After scanning, the default category is Registration & entry fees with the
combined outstanding amount. One collection clears both fee lines. Cash bond
and fee adjustments remain separate.

Comment / instructions:
Apply migration 202607201235_payment_category_entry_fees.sql before deploy.
Test: Events → Cashier → scan owner → Collect payment → verify receipt
category and both fee lines paid. Run: npx playwright test e2e/cashier.spec.ts

Documentation:
Admin: update cashier.md when docs/admins repo is available (combined entry fees step)
```
