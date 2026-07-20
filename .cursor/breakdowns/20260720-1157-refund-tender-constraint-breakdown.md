# Refund tender constraint fix — breakdown

**Date:** 2026-07-20

## Summary

Fixed Cashier refunds failing with `payments_tender_change_check` when the original payment had cash tendered and change recorded. Refunds now clear `amount_tendered` and `change_given` while preserving those values in the audit log.

## Changelog

- Refunding a payment no longer violates the DB check that requires `change_given = amount_tendered - amount_paid`.
- Original tender and change amounts are stored in audit `oldValues` before the row is cleared.

## Files touched

- `features/payments/tender.ts` — `clearedTenderFieldsForRefund()`
- `features/payments/service.ts` — `refundPayment` update payload + fetch/audit fields
- `features/payments/tender.test.ts` — helper unit test
- `features/payments/service.test.ts` — refund with/without tender fields

## Deploy steps

No migration. Deploy app only.

## Manual test steps

1. Log in as **staff/organizer** (not admin read-only).
2. Open event → **Cashier Terminal** → open session.
3. Collect palitada (or any payment) with **cash tendered greater than due** (e.g. due ₱10,000, tender ₱15,000).
4. In the payment list, click **Refund**, enter a reason, confirm.
5. Expect success (no constraint error).
6. Row shows **Refunded**, amount paid **₱0**, no tender/change line.

## Tests

```bash
npm run test:run -- features/payments/service.test.ts features/payments/tender.test.ts
```

**E2E:** N/A — bug fix, UI unchanged.

## Suggested commit

```
Fix refund violating payments_tender_change_check

Clear amount_tendered and change_given when refunding so the tender
check passes after amount_paid is zeroed. Preserve original tender
values in audit oldValues.
```

## Linear paste block

```
Title: Fix refund violating payments_tender_change_check

Description:
Cashier refunds failed when payments had cash tender/change from the
POS flow. Refund now nulls tender fields to satisfy the DB constraint.

Comment / instructions:
Deploy app only — no migration. Test: collect with change, refund from
Cashier Terminal payment list.

Documentation:
N/A
```
