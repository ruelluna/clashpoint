# Matching payment separation — breakdown

**Date:** 2026-07-20

## Summary

Matching staff no longer edit palitada amounts after pairing. Handlers pay at Cashier Terminal via COCK- or BET- scan. Cock barcode scan now resolves unpaid palitada for matched roosters. Auto-queue on full payment is unchanged.

## Changelog

- Removed per-side bet Save forms from the Matching board **Awaiting cashier payment** panel.
- Matching panel directs handlers to Cashier Terminal (COCK- or BET- slip); added **Open Cashier Terminal** link.
- Cashier Terminal: scanning a matched rooster **COCK-** barcode loads palitada due (same as BET- slip).
- Palitada amounts are set only when creating a match at the desk.
- User and admin docs updated for the separated payment workflow.

## Files touched

### features/

- `features/matches/components/matching-board-client.tsx`
- `features/matches/actions.ts`
- `features/matches/service.ts`
- `features/matches/schema.ts`
- `features/matches/schema.test.ts`
- `features/payments/service.ts`
- `features/payments/cashier-resolve.test.ts` (new)

### e2e/

- `e2e/matching-palitada.spec.ts`

### docs (nested repos — stage separately)

- `docs/users/docs/cashier-terminal.md`
- `docs/users/docs/matching-and-bets.md`
- `docs/admins/docs/phase-06-matching-fight-queue/match-pairing.md`
- `docs/admins/docs/cashier-terminal-admin.md`

## Stage files

```bash
git add \
  features/matches/components/matching-board-client.tsx \
  features/matches/actions.ts \
  features/matches/service.ts \
  features/matches/schema.ts \
  features/matches/schema.test.ts \
  features/payments/service.ts \
  features/payments/cashier-resolve.test.ts \
  e2e/matching-palitada.spec.ts \
  .cursor/breakdowns/20260720-2316-matching-payment-separation-breakdown.md
```

**Docs repo (stage separately):**

```bash
git -C docs/users add docs/cashier-terminal.md docs/matching-and-bets.md
git -C docs/admins add docs/phase-06-matching-fight-queue/match-pairing.md docs/cashier-terminal-admin.md
```

## Deploy steps

No migration or env vars. Deploy app as usual.

## Manual test steps

1. **Matching** → create a match → **Awaiting cashier payment** shows amounts and Palitada Unpaid badges, no Save inputs.
2. **Matching** → **Print slips** and **Open Cashier Terminal** link work.
3. **Cashier Terminal** → scan **COCK-** for a rooster in an unpaid match → palitada panel with correct amount.
4. **Cashier Terminal** → **Collect palitada** → Matching board shows Palitada Paid for that side.
5. Pay both sides (+ clear entry fees if enabled) → match appears in **Fight queue** automatically.
6. **Cashier Terminal** → scan **BET-** slip still loads palitada.

## Tests

- Vitest: `npm run test:run -- features/payments/cashier-resolve.test.ts`
- E2E (seed required): `npx playwright test e2e/matching-palitada.spec.ts`
- Build: `npm run build` (passed)

## Suggested ClashPoint commit

```
Separate palitada payments from matching desk

Matching staff no longer edit bet amounts after pairing; handlers pay
at Cashier Terminal via COCK or BET scan. Cock scan now resolves unpaid
palitada for matched roosters; auto-queue on full payment unchanged.
```

## Commit commands

```bash
git commit -m "$(cat <<'EOF'
Separate palitada payments from matching desk

Matching staff no longer edit bet amounts after pairing; handlers pay
at Cashier Terminal via COCK or BET scan. Cock scan now resolves unpaid
palitada for matched roosters; auto-queue on full payment unchanged.
EOF
)"
```
