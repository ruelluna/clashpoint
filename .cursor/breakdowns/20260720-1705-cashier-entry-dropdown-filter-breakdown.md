# Cashier entry dropdown — unpaid only

**Date:** 2026-07-20

## Summary

The Cashier Terminal **Or select entry** dropdown now lists only entries with **Cashier outstanding balance greater than zero** (registration, rooster entry, cash bond, adjustments). Fully paid entries are omitted. Scan/search and BET- palitada flows are unchanged.

## Changelog

- Dropdown options show `#entry · owner · amount due`
- When every entry is paid, dropdown is disabled with helper text pointing staff to scan/search or BET- barcode
- Batch-loaded dues use the same `computeOutstandingDues` math as collect flow (includes cash bond when entry fees are already paid)

## Files touched

### app/

- `app/dashboard/events/[id]/payments/page.tsx`

### features/

- `features/payments/cashier-selectable.ts` (new)
- `features/payments/cashier-selectable.tesnpm run t.ts` (new)
- `features/payments/service.ts` — `listCashierSelectableEntries`
- `features/payments/types.ts` — `CashierSelectableEntry`
- `features/payments/components/cashier-client.tsx`

### e2e/

- `e2e/cashier.spec.ts`

## Deploy steps

None. App-only change.

## Manual test steps

1. Run `npm run seed:classic-demo` (or use an event with mixed unpaid/partial entries)
2. Open **Events → {event} → Cashier** → open session
3. Confirm dropdown lists only entries with dues; labels include amount due
4. Pay one entry fully → reload Cashier → entry gone from dropdown
5. Scan/search same owner → still resolves with **fully paid** message

## Tests

```bash
npm run test:run -- features/payments/cashier-selectable.test.ts
npx playwright test e2e/cashier.spec.ts
```

## Documentation

- User doc: N/A — `docs/users/docs/cashier-terminal.md` not present in workspace clone

## Suggested ClashPoint commit

```
Summary: Filter Cashier entry dropdown to unpaid dues only

Dropdown uses batch-loaded outstanding balances so staff cannot select
fully paid entries. Scan/search still resolves paid owners for lookup.
```

## Linear paste block

```
Title: Filter Cashier entry dropdown to unpaid dues only

Description:
Cashier Or select entry lists only entries with outstanding Cashier
dues (fees, cash bond, adjustments). Paid entries drop from the list
after collection; scan/search unchanged.

Comment / instructions:
No migration. Run Vitest cashier-selectable tests. Manual: pay entry,
reload Cashier, confirm dropdown excludes it; scan still finds owner.

Documentation: N/A
```
