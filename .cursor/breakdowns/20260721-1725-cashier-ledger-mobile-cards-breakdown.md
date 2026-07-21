# Cashier ledger mobile receipt cards

**Date:** 2026-07-21

## Summary

Cashier Terminal payment history now uses **receipt summary cards** on phones/tablets while keeping the existing multi-column table on `lg+`. Each mobile card highlights amount, entry, items, and a full-width Print action.

## Changelog

- Payment history section titled **Payment history** on all breakpoints.
- Mobile (`base`–`md`): bordered receipt cards with reference + status header, hero paid/refund amount, entry/owner, items line, timestamp, optional balance, and full-width **Print receipt** button.
- Desktop (`lg+`): unchanged table row layout (Reference, Items, Entry, Paid, Balance, Status, Paid at).
- Ledger print links use `data-testid="cashier-ledger-print-link"` for stable E2E targeting with `:visible` filter (dual DOM for responsive layouts).

## Files touched

### features/

- `features/payments/components/cashier-ledger-row.tsx` (new)
- `features/payments/components/cashier-client.tsx`

### e2e/

- `e2e/cashier.spec.ts`

## Stage files

```bash
git add \
  features/payments/components/cashier-ledger-row.tsx \
  features/payments/components/cashier-client.tsx \
  e2e/cashier.spec.ts \
  .cursor/breakdowns/20260721-1725-cashier-ledger-mobile-cards-breakdown.md
```

## Commit commands

```bash
git commit -m "$(cat <<'EOF'
Add mobile receipt cards to Cashier payment history

Phone and tablet layouts show scannable receipt cards with
hero amounts and full-width print actions. Desktop table unchanged.
EOF
)"
```

## Deploy steps

No migration. Deploy app only.

## Manual test steps

1. Open **Cashier Terminal** on a phone or narrow browser window (< 992px).
2. Confirm **Payment history** shows bordered cards (not unlabeled stacked columns).
3. Verify each card: reference, status badge, large amount, entry/owner, items, time, **Print receipt**.
4. Widen to desktop — table headers and row columns should appear as before.
5. Collect a payment — ledger card/row updates; print link works.

## E2E

- Updated: `e2e/cashier.spec.ts` (visible ledger print link selector)
- Run: `npx playwright test e2e/cashier.spec.ts`

## Vitest

N/A — UI-only responsive layout; no schema/service changes.

## Documentation

**Admin docs N/A** — mobile layout refinement only; no workflow change.

**User docs N/A** — same.

## Suggested ClashPoint commit

```
Add mobile receipt cards to Cashier payment history

Phone and tablet layouts show scannable receipt cards with
hero amounts and full-width print actions. Desktop table unchanged.
```

## Linear paste block

```
Title: Add mobile receipt cards to Cashier payment history

Description:
Cashier Terminal payment history uses receipt summary cards on phones and tablets (amount, entry, items, print). Desktop table layout is unchanged.

Comment / instructions:
Deploy app only. Test on narrow viewport: Payment history cards with Print receipt button. Desktop: table columns unchanged.

Documentation:
N/A
```
