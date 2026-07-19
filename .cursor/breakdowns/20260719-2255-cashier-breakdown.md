# Cashier: scan-to-dues + revolving fund posts

**Date:** 2026-07-19 22:55  
**Updated:** 2026-07-19 23:12

## Summary

Renamed the Payments tab to **Cashier**. Staff can scan OWN/COCK barcodes or search owners/entries; the station computes outstanding dues and collects cash. Each collection and refund posts to the event revolving fund ledger (`collection` / `refund` entry types). Match barcodes and winner cash-out remain deferred.

## Changelog

- Event tab label is now **Cashier** (route remains `/dashboard/events/[id]/payments`; permission `payments.manage`)
- Scan OWN-/COCK- barcodes (camera or keyboard wedge) or search by owner name / entry number; wrong-event barcodes are rejected
- Outstanding dues panel shows registration / rooster entry / cash bond / fee-adjustment balances with suggested next amount
- Collect payment pre-fills the next open category; redirects to receipt print
- Cashier header shows live revolving fund balance
- Collections post `+amount` (`collection`); refunds post `-amount` (`refund`) with `source_payment_id` for idempotency
- Revolving fund tab labels Collection / Refund lines (opening + manual adjustment unchanged)
- Deep-link: `/dashboard/events/[id]/payments?barcode=…`
- Admin guide added under Phase 4 registration & payments

### 2026-07-19 23:10 — completion pass

- Implementation verified present: dues helpers + Vitest, cashier client, fund posts from `recordPayment` / `refundPayment`, migration, E2E, admin docs
- Unique ledger index is `(source_payment_id, entry_type)` so one collection and one refund row can exist per payment
- `npm run build` and `npm run test:run -- features/payments/dues.test.ts` passed during implementation
- Explicitly out of scope: match barcodes, winner cash-out from Cashier, non-cash methods, removing Revolving fund tab

## Files touched

### `app/`

- `app/dashboard/events/[id]/payments/page.tsx` — Cashier page; loads entries, payments, revolving fund balance; `?barcode=` support

### `features/`

- `features/payments/dues.ts` / `dues.test.ts` — outstanding dues math + query classification
- `features/payments/components/cashier-client.tsx` — scan/search, dues panel, collect, ledger, refund
- `features/payments/service.ts` — `resolveCashierTarget`, `getEntryOutstandingDues`, fund posts after record/refund
- `features/payments/actions.ts` — `lookupCashierTargetAction`, `getCashierDuesAction`; revalidates revolving-fund path
- `features/payments/types.ts` — `CashierTargetMatch` / lookup result types
- `features/revolving-fund/service.ts` — `postRevolvingFundLedgerEntry`
- `features/revolving-fund/types.ts` — `collection` / `refund` entry types + `sourcePaymentId`
- `features/revolving-fund/components/revolving-fund-client.tsx` — ledger type labels
- `features/events/components/event-detail-tabs.tsx` — Cashier label
- Copy updates: inspection / roosters / owner detail links to Cashier

### `lib/` / `supabase/`

- `lib/auth/event-tabs.ts` — Cashier label
- `lib/supabase/database.types.ts` — `source_payment_id`, enum values
- `supabase/migrations/20260719145244_revolving_fund_cashier_posts.sql`

### Docs / E2E / breakdown

- `docs/admins/docs/phase-04-registration-payments/cashier.md`
- `docs/admins/docs/phase-04-registration-payments/payment-tracking.md` (points to Cashier)
- `docs/admins/docs/phase-04-registration-payments/index.md`
- `docs/admins/sidebars.ts`
- `e2e/cashier.spec.ts`
- `.cursor/breakdowns/20260719-2255-cashier-breakdown.md` (this file)

Removed: `features/payments/components/payments-ledger-client.tsx` (replaced by cashier client)

## Files to stage (this conversation)

Stage **only** the Cashier work below. Leave public-registration, seeders, and other unrelated dirty files unstaged.

### ClashPoint monorepo (`git add`)

```bash
# Git Bash / macOS / Linux (quote [id] paths)
git add \
  "app/dashboard/events/[id]/payments/page.tsx" \
  features/payments/actions.ts \
  features/payments/dues.ts \
  features/payments/dues.test.ts \
  features/payments/types.ts \
  features/payments/service.ts \
  features/payments/components/cashier-client.tsx \
  features/payments/components/payments-ledger-client.tsx \
  features/revolving-fund/service.ts \
  features/revolving-fund/types.ts \
  features/revolving-fund/components/revolving-fund-client.tsx \
  features/events/components/event-detail-tabs.tsx \
  features/entries/components/owner-detail-client.tsx \
  features/event-roosters/components/event-roosters-client.tsx \
  features/inspection/components/inspection-station-client.tsx \
  lib/auth/event-tabs.ts \
  supabase/migrations/20260719145244_revolving_fund_cashier_posts.sql \
  e2e/cashier.spec.ts

# PowerShell alternative (brackets are wildcards unless -LiteralPath / quoted):
# git add -- "app/dashboard/events/[id]/payments/page.tsx" features/payments/... e2e/cashier.spec.ts
```

Notes:

- `payments-ledger-client.tsx` is a **deletion** (replaced by `cashier-client.tsx`); include it so the delete is committed.
- `lib/supabase/database.types.ts` already matches HEAD for `collection` / `refund` / `source_payment_id` — no stage needed unless a local diff appears.
- Optional internal: `.cursor/breakdowns/20260719-2255-cashier-breakdown.md` (not required for app deploy).
- Do **not** stage `.cursor/plans/cashier_tab_dues_c387b222.plan.md` unless you intentionally track plans.

### Do not stage with this commit

Unrelated working-tree changes from other work:

- `app/events/[id]/register/**`, `features/public/**`, `e2e/public-registration.spec.ts`
- `scripts/seed-*.mjs`, `scripts/lib/**`, classic/derby seeder breakdowns/plans
- `package.json` (unless you confirmed it only contains Cashier-related changes)

### Admin docs (separate repo / gitignored under `docs/`)

Monorepo `.gitignore` ignores `docs/`. Commit these in the **admin docs** working tree if you publish docs separately:

```
docs/admins/docs/phase-04-registration-payments/cashier.md          (new)
docs/admins/docs/phase-04-registration-payments/payment-tracking.md (modified)
docs/admins/docs/phase-04-registration-payments/index.md            (modified)
docs/admins/sidebars.ts                                             (modified)
```


## Deploy steps

1. Apply migration `20260719145244_revolving_fund_cashier_posts.sql` (`supabase db push` or Supabase dashboard SQL).
2. Deploy Next.js app (Vercel).
3. No new env vars.

## Manual test steps

1. Open an event with fees enabled → **Cashier**.
2. Confirm revolving fund balance displays in the header.
3. Register an owner, scan or paste OWN barcode (or search owner name) → dues appear.
4. Collect payment → receipt print; return to Cashier and confirm fund balance increased; **Revolving fund** tab shows a Collection line.
5. Refund that payment → fund balance decreases; Refund line appears.
6. Enter `OWN-ABCDEF12-0001` → “This barcode does not belong to this event”.
7. Optional: scan a COCK barcode for a registered rooster → same owner/entry dues panel.

## E2E

- Spec: `e2e/cashier.spec.ts` (happy path search/collect + wrong-event barcode guard)
- Command: `npx playwright test e2e/cashier.spec.ts`
- Requires `PLAYWRIGHT_ADMIN_EMAIL` / `PLAYWRIGHT_ADMIN_PASSWORD`
- Not run automatically in this session (run locally when credentials are set)

## Vitest

```bash
npm run test:run -- features/payments/dues.test.ts
```

## Suggested ClashPoint commit

```
Summary: Add Cashier scan-to-dues and revolving fund posts

Rename Payments to Cashier, resolve OWN/COCK or search to outstanding entry dues,
and auto-post collections/refunds to the event revolving fund ledger.
```

## Suggested admin docs commit

```
Summary: Document Cashier fee collection workflow

Add Cashier guide for scan/search, dues, collect/refund, and revolving fund posts;
point payment-tracking at the new station.
```

Remind: nested `docs/admins` needs its own commit with maintainer git identity when you choose to commit.

## Linear paste block

```
Title: Add Cashier scan-to-dues and revolving fund posts

Description:
Payments tab is now Cashier. Staff scan OWN/COCK barcodes or search owners/entries to see outstanding dues, collect cash, and auto-update the revolving fund (collections in, refunds out). Match barcodes and winner cash-out remain deferred.

Comment / instructions:
Apply migration 20260719145244_revolving_fund_cashier_posts.sql after deploy. No new env vars. Test: Event → Cashier → scan/search owner → Collect payment → confirm fund balance and Revolving fund Collection line; refund and confirm deduction.

Documentation:
Admin: {ADMIN_DOCS_URL}/phase-04-registration-payments/cashier
```

## Docs

- Admin: Cashier guide added; payment-tracking + Phase 4 index updated
- User: N/A — staff/operator flow


