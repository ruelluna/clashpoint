# Demo seeder fixes (cashier + matching)

**Date:** 2026-07-20

## Summary

Aligned classic and derby demo seed scripts with Cashier Terminal and matching/palitada flows. Events now seed the correct opening float default, rooster reg_payment_status matches payment tiers, and both demos insert two sample matches (Fight #1 draft awaiting palitada, Fight #2 on the scheduled fight queue with palitada already collected).

## Changelog

- Cashier Terminal opening float defaults to revolving fund amount (PHP 50,000 classic / PHP 200,000 derby) instead of PHP 0
- Partial-payment owners get reg_payment_status: partial on roosters (was incorrectly unpaid)
- Classic demo stores fee snapshots on entries (same as derby)
- Both demos seed Fight #1 (draft, unpaid BET slips) and Fight #2 (scheduled queue, palitada paid)
- Seed console output lists BET barcodes for palitada cashier practice

## Files touched

### scripts/

- scripts/lib/seed-demo-shared.mjs — opening float, reg payment status, match seeding helpers, summary output
- scripts/seed-classic-demo.mjs — wire match seed, fee snapshot
- scripts/seed-derby-demo.mjs — wire match seed

## Stage files

git add \
  scripts/lib/seed-demo-shared.mjs \
  scripts/seed-classic-demo.mjs \
  scripts/seed-derby-demo.mjs \
  .cursor/breakdowns/20260720-2246-demo-seeder-fixes-breakdown.md

## Deploy steps

None. Run locally after supabase db reset:

npm run seed:first-admin
npm run seed:classic-demo
# or
npm run seed:derby-demo

## Manual test steps

1. Run npm run seed:classic-demo (or derby).
2. Sign in as admin, open Events, seed event, Cashier Terminal.
3. Confirm Opening float shows PHP 50,000 (classic) or PHP 200,000 (derby), not PHP 0.
4. Start session, scan Fight #1 BET barcodes from seed output, collect palitada.
5. Open Matching — Fight #1 under awaiting payment; Fight #2 under fight queue.
6. Revolving fund balance includes Fight #2 palitada collections (+PHP 1,250 for default PHP 500/750 bets).

## E2E

N/A — internal npm seed scripts only; no UI or Server Action changes.

## Suggested ClashPoint commit

Align demo seeders with cashier terminal and matching

Set cashier_opening_float_default from revolving fund, fix reg_payment_status
for partial tiers, and seed draft + scheduled sample matches with BET barcodes.

## Commit commands

git commit -m "Align demo seeders with cashier terminal and matching" -m "Set cashier_opening_float_default from revolving fund, fix reg_payment_status for partial tiers, and seed draft + scheduled sample matches with BET barcodes."

## Linear paste block

Title: Align demo seeders with cashier terminal and matching

Description:
Classic and derby demo seeds now set cashier_opening_float_default, correct
reg_payment_status for partial owners, and insert two sample matches (draft
awaiting palitada + scheduled fight queue with palitada collected).

Comment / instructions:
No migration or deploy. After db reset: npm run seed:first-admin then
seed:classic-demo or seed:derby-demo. Verify opening float and BET barcodes
on Cashier Terminal and Matching board.

Documentation:
N/A — internal seed scripts only
