# Palitada remove, sync, and toast fixes

**Date:** 2026-07-21

## Summary

Fixed three regressions on Bet Balancing pit to Matching board sync: per-row Remove button loading, reliable remove broadcasts with contributionId, and centralized toast/banner notifications on the same realtime hook path that refreshes match data. Remove refreshes are deferred 300ms to avoid stale re-inserts.

## Changelog

- Only the clicked Remove button shows loading (per-form useFormStatus).
- Remove cross-tab broadcasts always include contributionId (captured on submit).
- Matching board toasts and green banner fire from useEventMatchingRealtime (cross-tab + Realtime), not a duplicate subscription in sub-tabs.
- Active Match optimistically removes palitada rows on remove sync; server refresh deferred for removes.

## Files touched

### features/matches/components/
- match-palitada-record-form.tsx
- matching-live-sync-provider.tsx
- matching-board-client.tsx
- matching-sub-tabs.tsx

### features/matches/hooks/
- use-event-matching-realtime.ts

### features/matches/
- matching-cross-tab-sync.test.ts

## Stage files

git add features/matches/components/match-palitada-record-form.tsx features/matches/components/matching-live-sync-provider.tsx features/matches/components/matching-board-client.tsx features/matches/components/matching-sub-tabs.tsx features/matches/hooks/use-event-matching-realtime.ts features/matches/matching-cross-tab-sync.test.ts .cursor/breakdowns/20260721-0608-palitada-remove-toast-fix-breakdown.md

## Deploy steps

No migration or env changes. Deploy app only.

## Manual test steps

1. Two windows, same origin.
2. Window A: Matching Active Match.
3. Window B: Bet Balancing pit.
4. Add Palitada on B - A updates totals, toast, banner.
5. Remove one row on B - only that Remove spins; A syncs with toast and banner.

## Tests

npm run test:run -- features/matches/matching-cross-tab-sync.test.ts
npm run build

E2E: N/A

## Suggested ClashPoint commit

Fix Palitada remove sync and matching board toasts

Per-row Remove loading, reliable remove broadcasts with contributionId, and centralized notifications on the realtime hook path. Defers remove refresh to prevent stale rows reappearing on Active Match.
