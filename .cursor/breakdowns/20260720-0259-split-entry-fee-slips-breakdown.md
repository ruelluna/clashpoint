# Split entry-fee payment slips

**Date:** 2026-07-20

## Summary

One **Collect payment** in Cashier still pays registration and rooster entry fees together (FIFO: registration first). The system now creates **separate payment rows and printable slips** per category (`registration`, `rooster_entry`) instead of a single combined `entry_fees` row. Cash bond and adjustments are collected separately afterward.

## Changelog

- When registration and/or rooster entry fees are outstanding, the category dropdown is hidden; one collect applies cash to both fee types.
- Partial payments (e.g. 600 when reg=500 + rooster=400) clear registration first; rooster entry gets the remainder with **partial** status on its payment row.
- After success, separate **Print registration fee receipt** / **Print rooster entry fee receipt** links appear when both rows were created.
- Legacy `entry_fees` payments in the database still allocate correctly in dues math.

## Files touched

### features/

- `features/payments/dues.ts`
- `features/payments/dues.test.ts`
- `features/payments/schema.ts`
- `features/payments/service.ts`
- `features/payments/actions.ts`
- `features/payments/components/cashier-client.tsx`

### e2e/

- `e2e/cashier.spec.ts`

## Stage files

```bash
git add \
  features/payments/dues.ts \
  features/payments/dues.test.ts \
  features/payments/schema.ts \
  features/payments/service.ts \
  features/payments/actions.ts \
  features/payments/components/cashier-client.tsx \
  e2e/cashier.spec.ts \
  .cursor/breakdowns/20260720-0259-split-entry-fee-slips-breakdown.md
```

## Deploy steps

No new migration. Deploy app only.

## Manual test steps

1. Event with registration (500) and entry fee per rooster (200); register owner with 2 roosters.
2. **Cashier Terminal** → open session → scan owner.
3. Confirm no payment category dropdown; amount defaults to 900; helper text about combined entry-fee collect.
4. **Collect payment** → two print links; ledger shows separate Registration fee and Rooster entry fee rows.
5. Repeat with 600 tendered → registration paid, rooster entry partial (100 paid, 300 balance).

## E2E

- Updated: `e2e/cashier.spec.ts`
- Run: `npx playwright test e2e/cashier.spec.ts`

## Documentation

**Admin docs N/A** — `docs/admins/` not present in workspace. When available, update cashier guide: one collect, separate slips, FIFO partials, bond collected separately.

## Suggested ClashPoint commit

```
Split entry-fee payment slips on single Cashier collect

One collect still pays registration and rooster entry fees together with
FIFO partial allocation, but records separate payment rows and print
links per category. Bond and adjustments stay separate follow-ups.
```

## Commit commands

```bash
git commit -m "$(cat <<'EOF'
Split entry-fee payment slips on single Cashier collect

One collect still pays registration and rooster entry fees together with
FIFO partial allocation, but records separate payment rows and print
links per category. Bond and adjustments stay separate follow-ups.
EOF
)"
```

## Linear paste block

```
Title: Split entry-fee payment slips on single Cashier collect

Description:
Cashiers collect registration and rooster entry fees in one action, but
the system records separate payment rows and printable slips per category.
Partial payments apply to registration first; rooster entry shows partial
when remainder is insufficient. Cash bond remains a separate collection.

Comment / instructions:
No migration. Test: Cashier → scan → Collect → verify two receipts when
both fees due. Run: npx playwright test e2e/cashier.spec.ts

Documentation:
Admin: update cashier.md when docs/admins repo is available
```
