# VIP Palitada Settlement in Matching Settling + Results

**Date:** 2026-07-24

## Summary

VIP Palitada contributors now have trackable pay/collect/refund obligations in Matching → Settling. Staff mark each VIP paid before the fight can be marked settled. Results shows settlement status and expandable details after settlement completes.

## Changelog

- Settling tab lists VIP Palitada payments (Pay / Collect / Refund) with per-person **Mark paid**
- **Mark match settled** blocked until all VIP payments and revolving fund posts are complete
- Results tab adds **Settlement** column plus expandable settlement details (VIP lines, revolving fund, settled timestamp)
- Migration adds VIP obligation types, `paid` status, and `paid_at` / `paid_by` tracking

## Files touched

### supabase/

- `supabase/migrations/202607241800_vip_settlement_payments.sql`

### lib/

- `lib/supabase/database.types.ts`

### features/matches/

- `features/matches/match-settlement-obligations.ts`
- `features/matches/match-settlement-obligations.test.ts`
- `features/matches/match-settling-service.ts`
- `features/matches/schema.ts`
- `features/matches/actions.ts`
- `features/matches/types.ts`
- `features/matches/components/matching-settling-panel.tsx`
- `features/matches/components/matching-vip-settlement-list.tsx`

### features/results/

- `features/results/queries.ts`
- `features/results/types.ts`
- `features/results/components/results-entry-client.tsx`

### e2e/

- `e2e/matching-vip-settling.spec.ts`

## Stage files

```bash
git add \
  supabase/migrations/202607241800_vip_settlement_payments.sql \
  lib/supabase/database.types.ts \
  features/matches/match-settlement-obligations.ts \
  features/matches/match-settlement-obligations.test.ts \
  features/matches/match-settling-service.ts \
  features/matches/schema.ts \
  features/matches/actions.ts \
  features/matches/types.ts \
  features/matches/components/matching-settling-panel.tsx \
  features/matches/components/matching-vip-settlement-list.tsx \
  features/results/queries.ts \
  features/results/types.ts \
  features/results/components/results-entry-client.tsx \
  e2e/matching-vip-settling.spec.ts \
  .cursor/breakdowns/20260724-2152-vip-settling-payments-breakdown.md
```

## Deploy steps

Apply migration after deploy:

```bash
supabase db push
```

Or run `supabase/migrations/202607241800_vip_settlement_payments.sql` in the Supabase dashboard.

No new env vars.

## Manual test steps

1. Create a match with VIP Palitada on at least one side (Bet Balancing pit).
2. Complete the fight and record a result (Results or Active Match).
3. Open **Matching → Settling** — confirm VIP list shows Pay/Collect/Refund amounts.
4. Click **Mark match settled** before marking VIP paid — expect blocked with unpaid VIP names.
5. Mark each VIP **Mark paid**, post Monton revolving fund rows, then **Mark match settled**.
6. Open **Results** — Settlement badge shows **Settled**; **View details** shows VIP lines and settled timestamp.

## E2E

- Added `e2e/matching-vip-settling.spec.ts` (skipped until seed fixture exists)

```bash
npx playwright test e2e/matching-vip-settling.spec.ts
```

## Vitest

```bash
npm run test:run -- features/matches/match-settlement-obligations.test.ts
```

## Documentation

- **Admin doc:** N/A — `docs/admins/` nested repo not cloned in this workspace. When available, add `docs/admins/docs/match-settling-admin.md` covering VIP pay/collect in Settling and Results settlement details.

## Suggested ClashPoint commit

```
Add VIP Palitada settlement tracking in Settling and Results

Staff mark VIP pay/collect/refund per person before completing match
settlement. Results shows settlement status and expandable details after
the fight is marked settled.
```

## Commit commands

```bash
git commit -m "$(cat <<'EOF'
Add VIP Palitada settlement tracking in Settling and Results

Staff mark VIP pay/collect/refund per person before completing match
settlement. Results shows settlement status and expandable details after
the fight is marked settled.
EOF
)"
```

## Linear paste block

```
Title: Add VIP Palitada settlement tracking in Settling and Results

Description:
Matching Settling now lists VIP Palitada pay/collect/refund obligations with Mark paid per person. Mark match settled is blocked until all VIP payments and revolving fund posts are complete. Results shows settlement status and expandable VIP/revolving-fund details after settlement.

Comment / instructions:
Apply migration 202607241800_vip_settlement_payments.sql (supabase db push). Test: record result → Matching Settling → mark VIP paid → post revolving fund → mark settled → Results View details.

Documentation:
Admin doc pending — add match-settling-admin.md when docs/admins repo is available.
```
