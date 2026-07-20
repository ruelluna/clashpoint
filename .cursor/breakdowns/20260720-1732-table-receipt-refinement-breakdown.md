# Table receipt refinement + Cashier Items column

**Date:** 2026-07-20

## Summary

Refined the unified registration-dues batch receipt with a print-friendly **item table** (Due / Prev. paid / Collected / Balance / Status), prior-receipt context on follow-up collects, and Cashier payment history grouped by batch with a new **Items** column (category removed from Reference).

## Changelog

- Batch print slip shows **all configured fee lines** in one HTML table, including zero-collected lines on follow-up receipts.
- Follow-up receipts show **Previous receipt {ref}** note and **Previously paid** column per line.
- Cashier payment ledger: **one row per collect** with **Items** listing Registration fee, Rooster entry fee, Cash bond (as applicable).
- Reference column shows payment code only — **no category subtitle**.
- Print link in ledger points to batch receipt when grouped.

## Files touched

### features/

- `features/payments/types.ts`
- `features/payments/batch-receipt.ts`
- `features/payments/batch-receipt.test.ts`
- `features/payments/ledger-grouping.ts`
- `features/payments/ledger-grouping.test.ts`
- `features/payments/service.ts`
- `features/payments/components/cashier-client.tsx`
- `features/printing/components/registration-dues-receipt-slip.tsx`

### e2e/

- `e2e/cashier.spec.ts`

## Stage files

```bash
git add \
  features/payments/types.ts \
  features/payments/batch-receipt.ts \
  features/payments/batch-receipt.test.ts \
  features/payments/ledger-grouping.ts \
  features/payments/ledger-grouping.test.ts \
  features/payments/service.ts \
  features/payments/components/cashier-client.tsx \
  features/printing/components/registration-dues-receipt-slip.tsx \
  e2e/cashier.spec.ts \
  .cursor/breakdowns/20260720-1732-table-receipt-refinement-breakdown.md
```

## Commit commands

```bash
git commit -m "$(cat <<'EOF'
Refine registration dues receipt table and Cashier Items column

Batch receipts use an itemized table with prior payment context.
Cashier ledger groups collects by batch and lists paid fee items
in a dedicated Items column without category under Reference.
EOF
)"
```

## Deploy steps

No new migration. Deploy app only.

## Manual test steps

1. Collect registration dues (full or partial) → **Print receipt** → verify table with all fee rows.
2. Partial collect → second collect → new receipt shows prior receipt note and Previously paid column.
3. Cashier ledger: one row per collect, **Items** column lists fee labels, Reference has no category line.

## E2E

- Updated: `e2e/cashier.spec.ts`
- Run: `npx playwright test e2e/cashier.spec.ts`

## Documentation

**Admin docs N/A** — `docs/admins/` not in workspace.

## Suggested ClashPoint commit

```
Refine registration dues receipt table and Cashier Items column

Batch receipts use an itemized table with prior payment context.
Cashier ledger groups collects by batch and lists paid fee items
in a dedicated Items column without category under Reference.
```
