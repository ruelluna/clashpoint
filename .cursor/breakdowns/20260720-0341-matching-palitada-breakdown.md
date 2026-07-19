# Matching Desk + Palitada Payment Flow — Breakdown

**Date:** 2026-07-20

## Summary

Extended matching with COCK barcode scan at the desk, per-side palitada (BET-) barcodes at pairing, cashier collection with receipts and revolving fund posting, and automatic fight-queue promotion when both sides pay palitada plus any enabled entry fees.

## Changelog

- Matching desk scans COCK barcodes (with search fallback) and requires positive Meron/Wala palitada
- BET- barcodes generated at pairing; print route for both palitada slips
- Cashier accepts BET- scans; shows palitada due plus outstanding entry fees on one screen
- Matches auto-promote to fight queue when both sides fully paid (no manual lock required)
- Unpaid matches can be cancelled; bet amounts lock after first palitada payment
- Roosters marked `matched` on pairing

## Files touched

### supabase/
- `supabase/migrations/202607201530_match_bet_payments.sql`

### lib/
- `lib/supabase/database.types.ts`

### features/matches/
- `schema.ts`, `schema.test.ts`, `types.ts`, `utils.ts`, `utils.test.ts`
- `service.ts`, `queries.ts`, `actions.ts`, `promotion.ts`
- `components/matching-board-client.tsx`, `components/matching-rooster-scan-row.tsx`

### features/payments/
- `schema.ts`, `dues.ts`, `dues.test.ts`, `fee-calc.ts`, `types.ts`
- `service.ts`, `actions.ts`, `components/cashier-client.tsx`

### features/printing/
- `components/match-bet-barcode-slip.tsx`, `components/payment-receipt-slip.tsx`

### features/public/
- `queries.ts`

### app/
- `app/dashboard/events/[id]/matching/page.tsx`
- `app/dashboard/events/[id]/matching/[matchId]/print/page.tsx`

### e2e/
- `e2e/matching-palitada.spec.ts` (skipped until auth seed exists)

## Stage files

```bash
git add \
  supabase/migrations/202607201530_match_bet_payments.sql \
  lib/supabase/database.types.ts \
  features/matches/schema.ts \
  features/matches/schema.test.ts \
  features/matches/types.ts \
  features/matches/utils.ts \
  features/matches/utils.test.ts \
  features/matches/service.ts \
  features/matches/queries.ts \
  features/matches/actions.ts \
  features/matches/promotion.ts \
  features/matches/components/matching-board-client.tsx \
  features/matches/components/matching-rooster-scan-row.tsx \
  features/payments/schema.ts \
  features/payments/dues.ts \
  features/payments/dues.test.ts \
  features/payments/fee-calc.ts \
  features/payments/types.ts \
  features/payments/service.ts \
  features/payments/actions.ts \
  features/payments/components/cashier-client.tsx \
  features/printing/components/match-bet-barcode-slip.tsx \
  features/printing/components/payment-receipt-slip.tsx \
  features/public/queries.ts \
  app/dashboard/events/[id]/matching/page.tsx \
  app/dashboard/events/[id]/matching/[matchId]/print/page.tsx \
  e2e/matching-palitada.spec.ts \
  .cursor/breakdowns/20260720-0341-matching-palitada-breakdown.md
```

**Docs repo (stage separately in nested repos):**

```bash
git -C docs/admins add \
  docs/phase-06-matching-fight-queue/index.md \
  docs/phase-06-matching-fight-queue/match-pairing.md \
  docs/phase-06-matching-fight-queue/fight-queue.md \
  docs/phase-04-registration-payments/cashier.md

git -C docs/users add \
  docs/matching-and-bets.md \
  docs/cashier-terminal.md \
  sidebars.ts
```

## Deploy steps

1. Apply migration: `supabase db push` or run `202607201530_match_bet_payments.sql` in Supabase dashboard
2. Deploy app (Vercel or your host)
3. No new env vars required

## Manual test steps

1. Event **In progress** with two verified roosters (optional unpaid entry fees)
2. **Event → Matching** — scan both COCK codes, enter palitada > 0, create match
3. **Print slips** — verify BET-M and BET-W barcodes
4. **Event → Cashier** — scan BET-M, pay palitada (+ entry fees if shown)
5. Scan BET-W and pay
6. Confirm match appears under **Fight queue** / **Scheduled**
7. Cancel an unpaid match and confirm roosters return to eligible pool

## Tests

- Vitest: `npm run test:run -- features/matches/schema.test.ts features/matches/utils.test.ts features/payments/dues.test.ts` (37 passed)
- Build: `npm run build` (passes)
- E2E: `e2e/matching-palitada.spec.ts` — **skipped** until Playwright auth + seeded event fixtures exist

## Suggested ClashPoint commit

**Summary:** Add matching desk palitada flow with BET barcodes and auto queue

**Body:** Matchmakers scan cock entries and set per-side palitada; BET- slips print at pairing. Cashier collects palitada and posts revolving fund; matches promote to the fight queue when both sides pay palitada and entry fees. Includes migration, Vitest coverage, and skipped E2E scaffold.

## Suggested doc commits

**docs/admins:**

```
Document palitada matching and BET cashier collection

Operators get phase-6 pairing/queue guides and updated Cashier steps for BET- barcodes.
```

**docs/users:**

```
Add matching and palitada guide for handlers

Owners learn cock slip → matching → BET slip → cashier flow.
```

## Commit commands

```bash
git commit -m "$(cat <<'EOF'
Add matching desk palitada flow with BET barcodes and auto queue

Matchmakers scan cock entries and set per-side palitada; BET- slips print at pairing.
Cashier collects palitada and posts revolving fund; matches promote to the fight queue
when both sides pay palitada and entry fees.
EOF
)"
```

```bash
git -C docs/admins commit -m "$(cat <<'EOF'
Document palitada matching and BET cashier collection

Operators get phase-6 pairing/queue guides and updated Cashier steps for BET- barcodes.
EOF
)"
```

```bash
git -C docs/users commit -m "$(cat <<'EOF'
Add matching and palitada guide for handlers

Owners learn cock slip → matching → BET slip → cashier flow.
EOF
)"
```

## Linear paste block

```
Title: Matching desk + palitada payment flow

Description:
Matching staff scan COCK barcodes, set palitada, and print BET- slips. Cashier collects palitada (+ entry fees) and posts revolving fund. Matches auto-enter fight queue when both sides are fully paid. Unpaid matches can be cancelled; bet edits lock after first payment.

Comment / instructions:
Apply Supabase migration 202607201530_match_bet_payments.sql. Test: pair → print BET slips → cashier pay both → verify fight queue. Vitest: features/matches + features/payments/dues. E2E scaffold skipped pending seed.

Documentation:
Admin: {ADMIN_DOCS_URL}/phase-06-matching-fight-queue/match-pairing
User: {USER_DOCS_URL}/matching-and-bets
```
