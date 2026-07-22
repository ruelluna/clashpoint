# Cashier payment side-effects RLS fix — breakdown

**Date:** 2026-07-21

## Summary

Staff Cashier (`payments.manage` only) could insert payment rows but RLS blocked updates to `match_bets`, `entries`, `rooster_event_registrations`, and match queue promotion. Matching stayed unpaid while the terminal showed success. Extended RLS for payment settlement side-effects and hardened the payment service to fail when updates affect zero rows.

## Changelog

- Cashier staff with **Cashier Terminal** module only can settle pledges and entry fees; matching board and entry dues update after collection
- No need to grant Rooster Entries, Bet Balancing, or Matching modules to cashiers for payment side-effects
- Payment service returns a clear error if pledge or entry payment status fails to persist (instead of silent success)
- Apply Supabase migration `202607211700_cashier_payment_settlement_rls.sql` after deploy

## Files touched

### supabase/

- `supabase/migrations/202607211700_cashier_payment_settlement_rls.sql` (new)

### features/

- `features/payments/service.ts`
- `features/payments/payment-settlement.test.ts` (new)

### e2e/

- `e2e/matching-pledges.spec.ts` (skip reason updated)

## Stage files

```bash
git add \
  supabase/migrations/202607211700_cashier_payment_settlement_rls.sql \
  features/payments/service.ts \
  features/payments/payment-settlement.test.ts \
  e2e/matching-pledges.spec.ts \
  .cursor/breakdowns/20260721-1705-cashier-payment-rls-breakdown.md
```

## Deploy steps

1. Deploy app
2. Apply migration: `supabase db push` or run `202607211700_cashier_payment_settlement_rls.sql` in Supabase dashboard
3. No new env vars

## Manual test steps

1. Assign a staff user **only** the Cashier Terminal access module (`payments.manage`, `payments.print`, `events.view`)
2. Open an in-progress event with a draft match, unpaid pledges, and rooster entry fees due
3. Cashier Terminal → open session → scan **BET-** slip → **Collect pledge**
4. **Matching** → **Pending Payments** → side shows **Palitada Paid** (not stuck on Unpaid)
5. Collect rooster entry fee via entry or **COCK-** scan → entry dues clear on matching board
6. When both sides paid and entry fees clear → match auto-queues to **Fight queue**
7. Confirm cashier still **cannot** open Bet Balancing pit or Rooster Entries tabs

## Tests

```bash
npm run test:run -- features/payments/payment-settlement.test.ts
npm run build
```

E2E: `e2e/matching-pledges.spec.ts` remains skipped — requires seeded matchmaker + cashier-only staff fixture. Manual steps above cover the regression.

## Documentation

Nested doc repos not cloned in workspace. When syncing `docs/admins` / `docs/users`, add:

**Admin** (`docs/admins/docs/cashier-terminal-admin.md` or phase-06 match-pairing sibling):

> Cashier Terminal staff need only the **Cashier Terminal** module. Collecting pledges and entry fees updates matching payment status automatically; they do not need Bet Balancing or Rooster Entries access.

**User** (`docs/users/docs/cashier-terminal.md`):

> After you collect a pledge or entry fee, the matching board reflects the payment without matching staff re-entering amounts.

## Suggested ClashPoint commit

```
Fix cashier payment RLS for matching and entry fees

Cashiers with payments.manage only could record payments but RLS blocked
match_bets, entries, and registration status updates. Extend settlement
policies and fail loudly when post-payment updates affect zero rows.
```

## Commit commands

```bash
git commit -m "$(cat <<'EOF'
Fix cashier payment RLS for matching and entry fees

Cashiers with payments.manage only could record payments but RLS blocked
match_bets, entries, and registration status updates. Extend settlement
policies and fail loudly when post-payment updates affect zero rows.
EOF
)"
```

## Linear paste block

```
Title: Fix cashier payment RLS for matching and entry fees

Description:
Staff Cashier could record payments but matching stayed unpaid because RLS required matches.manage / entries.manage for downstream updates. Cashiers keep Cashier Terminal module only; pledge and entry fee collection now updates match_bets, entries, and queue promotion.

Comment / instructions:
Apply migration 202607211700_cashier_payment_settlement_rls.sql after deploy. Test: cashier-only staff collects BET- pledge → Matching Pending Payments shows Palitada Paid.

Documentation:
Admin: add note to cashier-terminal-admin — Cashier Terminal module only
User: add note to cashier-terminal — payments reflect on matching board
```
