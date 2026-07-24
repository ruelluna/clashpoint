# Settling live updates — breakdown

**Date:** 2026-07-24

## Summary

Matching **Settling** now refreshes without a full page reload when staff Mark paid VIP obligations, Post ledger lines, complete settlement, or pay Match Winners at Cashier (including from another browser tab).

## Changelog

- Settling panel re-fetches the full match settlement snapshot after Mark paid, Post, and Mark match settled succeed.
- Supabase Realtime on `match_settlement_obligations` and `match_bets` triggers a debounced settling refresh (covers Cashier win payout and obligation DB updates).
- Cross-tab `settlement_updated` broadcast notifies the Matching board when Cashier records a handler win payout in another tab.
- `refreshSettlingMatch` exposed on `MatchingLiveSyncProvider` for action hooks and realtime.

## Files touched

**features/matches/**

- `matching-cross-tab-sync.ts` — `settlement_updated` action, `broadcastSettlementUpdated()`
- `matching-realtime-patches.ts` — `upsertSettlingMatch`, `sortSettlingMatches` (already present)
- `client-queries.ts` — `fetchSettlingMatchClient()` (already present)
- `hooks/use-settlement-action-refresh.ts` — new hook
- `hooks/use-event-matching-realtime.ts` — settling refresh + realtime/cross-tab wiring
- `components/matching-live-sync-provider.tsx` — expose `refreshSettlingMatch`
- `components/matching-vip-settlement-list.tsx` — hook on Mark paid
- `components/matching-settling-panel.tsx` — hook on Post + Mark match settled
- `matching-realtime-patches.test.ts`, `matching-cross-tab-sync.test.ts`

**features/payments/**

- `components/cashier-client.tsx` — broadcast on win payout success

## Stage files

```bash
git add \
  features/matches/matching-cross-tab-sync.ts \
  features/matches/matching-cross-tab-sync.test.ts \
  features/matches/matching-realtime-patches.test.ts \
  features/matches/hooks/use-settlement-action-refresh.ts \
  features/matches/hooks/use-event-matching-realtime.ts \
  features/matches/components/matching-live-sync-provider.tsx \
  features/matches/components/matching-vip-settlement-list.tsx \
  features/matches/components/matching-settling-panel.tsx \
  features/payments/components/cashier-client.tsx \
  .cursor/breakdowns/20260724-2255-settling-live-updates-breakdown.md
```

## Deploy steps

No migration. Deploy app only.

## Manual test steps

1. Open **Matching → Settling** for an event with a fight in settling.
2. **Mark paid** on a VIP row — status and progress update without refresh.
3. **Post** a revolving-fund obligation — posted badge appears live.
4. Open **Cashier** in a second tab; scan/pay a Match Winner COCK bet — return to Matching tab; Match Winners row shows **Paid at Cashier** without refresh.
5. **Mark match settled** when all obligations complete — card state updates live.

## E2E

N/A — cross-tab sync and Supabase Realtime; covered by Vitest unit tests.

```bash
npm run test:run -- features/matches/matching-realtime-patches.test.ts features/matches/matching-cross-tab-sync.test.ts
```

## Suggested ClashPoint commit

```
Wire Settling live updates for Mark paid, Post, and Cashier payout

Settling re-fetches on server action success, obligation/bet realtime,
and cross-tab settlement_updated from Cashier so staff no longer need
a full page refresh on the Matching board.
```

## Commit commands

```bash
git commit -m "$(cat <<'EOF'
Wire Settling live updates for Mark paid, Post, and Cashier payout

Settling re-fetches on server action success, obligation/bet realtime,
and cross-tab settlement_updated from Cashier so staff no longer need
a full page refresh on the Matching board.
EOF
)"
```

## Documentation

N/A — no organizer workflow change; same actions, live UI only.

## Linear paste block

```
Title: Wire Settling live updates (Mark paid, Post, Cashier payout)

Description:
Matching Settling panel now updates without a full page reload when VIP Mark paid, ledger Post, match settled, or Cashier handler win payout occur. Uses debounced fetchSettlingMatchClient, Supabase Realtime on obligations/bets, and cross-tab settlement_updated from Cashier.

Comment / instructions:
Deploy app only (no migration). Test: Matching Settling tab + Cashier in second tab; pay Match Winner and confirm Match Winners row updates live.

Documentation:
N/A
```
