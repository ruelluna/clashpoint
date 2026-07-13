# Fix dual match status (Completed + Ongoing)

**Date:** 2026-07-13

## Summary

Matching board fights showed two status badges (**Completed** + **Ongoing**) because `matches.status` and `matches.queue_status` were both rendered, and recording a result set `status = completed` without clearing stale `queue_status = ongoing`.

## Changelog

- **Organizers:** Match list on the matching board shows **one** status badge per fight.
- **Organizers:** After recording a fight result, completed fights no longer retain a stale **Ongoing** queue badge.
- **Data:** `recordResult` clears `queue_status` when marking a match completed.

## Files touched

- `features/results/service.ts` — clear `queue_status` on complete
- `features/matches/utils.ts` — `getDisplayMatchStatus` helper
- `features/matches/utils.test.ts` — display priority tests
- `features/matches/components/matching-board-client.tsx` — single badge

## Deploy steps

None. App-only change.

## Manual test steps

1. Open an event in **ready_for_matching** or **ongoing** with at least one locked match.
2. Advance a fight through the queue to **Ongoing**.
3. Record a fight result for that match.
4. On the **Matching** board match list, confirm **one** badge: **Completed** (not Completed + Ongoing).
5. Optional DB check: `matches.status = completed` and `queue_status IS NULL` for that row.

## E2E

N/A — display + small service sync; manual steps above.

## Vitest

```bash
npm run test:run -- features/matches/utils.test.ts
```

## Suggested commit

**Summary:** Fix dual Completed/Ongoing badges on matching board

**Body:**

Clear queue_status when a fight result completes the match, and show one status badge on the matching list (lifecycle wins over stale queue state).
