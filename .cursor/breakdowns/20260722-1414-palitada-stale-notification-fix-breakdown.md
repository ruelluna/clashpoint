# Fix stale Palitada notifications on Matching refresh

**Date:** 2026-07-22

## Summary

Stopped Fight #N Palitada toast/banner from replaying on every Matching page refresh. Cross-tab sync now persists handled message timestamps in `sessionStorage`, and poll/mount replays only refresh match data — they no longer trigger notifications. Green feedback banner auto-dismisses after 8s and has a close button.

## Changelog

- Palitada toast and green banner only fire on **live** cross-tab events (`broadcast` / `storage`), not on `poll` replays from `localStorage` on mount.
- Handled sync `sentAt` per event persisted in `sessionStorage` so remount/refresh in the same browser session does not re-deliver stale messages.
- Matching feedback banner: dismiss (×) button and 8-second auto-dismiss for success messages.

## Files touched

### features/matches/

- `matching-cross-tab-sync.ts`
- `matching-cross-tab-sync.test.ts`
- `hooks/use-event-matching-realtime.ts`
- `components/matching-board-client.tsx`

## Stage files

```bash
git add \
  features/matches/matching-cross-tab-sync.ts \
  features/matches/matching-cross-tab-sync.test.ts \
  features/matches/hooks/use-event-matching-realtime.ts \
  features/matches/components/matching-board-client.tsx \
  .cursor/breakdowns/20260722-1414-palitada-stale-notification-fix-breakdown.md
```

## Commit commands

```bash
git commit -m "$(cat <<'EOF'
Fix stale Palitada notifications on Matching refresh

Persist handled sync timestamps in sessionStorage and skip
toast/banner on poll replays. Add dismiss and auto-hide on banner.
EOF
)"
```

## Deploy steps

No migration. Deploy app only.

## Manual test steps

1. Record Palitada on Bet Balancing pit for a fight while Matching board is open in another tab — toast + banner should appear once.
2. Refresh Matching board — Fight #N notification should **not** reappear.
3. If banner appears from a live event, confirm × dismisses it and it auto-hides after ~8s.
4. Optional: clear `pitclash-matching-sync` in localStorage if testing from a dirty prior state.

## Tests

- Vitest: `npm run test:run -- features/matches/matching-cross-tab-sync.test.ts` — 8 passed
- Build: `npm run build`
- E2E: N/A — sync/session behavior; existing matching specs unchanged

## Documentation

N/A — bug fix, no workflow change.

## Suggested ClashPoint commit

```
Fix stale Palitada notifications on Matching refresh

Persist handled sync timestamps in sessionStorage and skip
toast/banner on poll replays. Add dismiss and auto-hide on banner.
```
