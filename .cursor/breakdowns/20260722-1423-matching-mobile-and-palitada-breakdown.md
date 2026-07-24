# Matching mobile cards + Palitada notification fix

**Date:** 2026-07-22

## Summary

Two related Matching improvements shipped in this pass:

1. **Mobile fight cards** — Fight Queue and Pending Payments tabs use bordered receipt-style cards on phones/tablets (below `lg`), matching the Cashier ledger pattern. Desktop row layouts at `lg+` unchanged.

2. **Stale Palitada notifications** — Fixed Fight #N toast/banner replaying on every Matching page refresh. Cross-tab sync persists handled timestamps in `sessionStorage`; poll/mount replays refresh data only (no toast/banner). Green banner has dismiss + 8s auto-hide.

## Changelog

### Mobile fight cards

- Fight Queue: mobile cards with fight # + queue status, Meron/Wala blocks, full-width queue advance buttons.
- Pending Payments: flush list, mobile cards with Print slips / Cancel match at full width; Open Cashier Terminal full-width on mobile.
- Shared `MatchingMatchSideBlock` for Meron/Wala display.

### Palitada notification fix

- Toast and banner only on live cross-tab events (`broadcast` / `storage`), not `poll` replays from `localStorage` on mount.
- `sessionStorage` dedupe per event so refresh in same session does not re-show old Fight #N messages.
- Feedback banner: × dismiss and 8-second auto-dismiss.

## Files touched

### features/matches/

- `components/matching-match-side-block.tsx` (new)
- `components/matching-fight-queue-row.tsx` (new)
- `components/matching-pending-payment-row.tsx` (new)
- `components/matching-shared.tsx`
- `components/matching-fight-queue-panel.tsx`
- `components/matching-pending-payments-panel.tsx`
- `components/matching-board-client.tsx`
- `hooks/use-event-matching-realtime.ts`
- `matching-cross-tab-sync.ts`
- `matching-cross-tab-sync.test.ts`

### e2e/

- `matching-pledges.spec.ts`

## Stage files

Two focused commits (recommended):

### Commit A — mobile fight cards

```bash
git add \
  features/matches/components/matching-match-side-block.tsx \
  features/matches/components/matching-fight-queue-row.tsx \
  features/matches/components/matching-pending-payment-row.tsx \
  features/matches/components/matching-shared.tsx \
  features/matches/components/matching-fight-queue-panel.tsx \
  features/matches/components/matching-pending-payments-panel.tsx \
  e2e/matching-pledges.spec.ts
```

### Commit B — Palitada notification fix

```bash
git add \
  features/matches/matching-cross-tab-sync.ts \
  features/matches/matching-cross-tab-sync.test.ts \
  features/matches/hooks/use-event-matching-realtime.ts \
  features/matches/components/matching-board-client.tsx
```

### Breakdown (this file)

```bash
git add .cursor/breakdowns/20260722-1423-matching-mobile-and-palitada-breakdown.md
```

Or stage everything in one commit:

```bash
git add \
  features/matches/components/matching-match-side-block.tsx \
  features/matches/components/matching-fight-queue-row.tsx \
  features/matches/components/matching-pending-payment-row.tsx \
  features/matches/components/matching-shared.tsx \
  features/matches/components/matching-fight-queue-panel.tsx \
  features/matches/components/matching-pending-payments-panel.tsx \
  features/matches/components/matching-board-client.tsx \
  features/matches/hooks/use-event-matching-realtime.ts \
  features/matches/matching-cross-tab-sync.ts \
  features/matches/matching-cross-tab-sync.test.ts \
  e2e/matching-pledges.spec.ts \
  .cursor/breakdowns/20260722-1423-matching-mobile-and-palitada-breakdown.md
```

## Commit commands

### Option A — two commits (recommended)

```bash
git commit -m "$(cat <<'EOF'
Add mobile fight cards to Matching queue and pending tabs

Phones and tablets show bordered fight cards with side blocks
and full-width actions. Desktop row layouts unchanged at lg+.
EOF
)"

git commit -m "$(cat <<'EOF'
Fix stale Palitada notifications on Matching refresh

Persist handled sync timestamps in sessionStorage and skip
toast/banner on poll replays. Add dismiss and auto-hide on banner.
EOF
)"
```

### Option B — single commit

```bash
git commit -m "$(cat <<'EOF'
Improve Matching mobile cards and fix stale Palitada notifications

Fight Queue and Pending Payments use mobile receipt cards below lg.
Palitada toast/banner no longer replay on refresh; banner dismisses.
EOF
)"
```

## Deploy steps

No migration. Deploy app only.

## Manual test steps

### Mobile cards

1. Open **Events → Matching** at width &lt; 992px.
2. **Fight Queue** — bordered cards, Meron/Wala, full-width advance button.
3. **Pending Payments** — bordered cards, Print/Cancel full width, Cashier link full width.
4. Desktop (`lg+`) — row layouts unchanged.

### Palitada notifications

1. With Matching open, record Palitada on Bet Balancing pit in another tab — one toast + banner.
2. Refresh Matching — Fight #N notification must **not** return.
3. Dismiss banner with × or wait ~8s for auto-hide.
4. If stuck from old state: DevTools → Local Storage → delete `pitclash-matching-sync`, refresh once.

## Tests

- Vitest: `npm run test:run -- features/matches/matching-cross-tab-sync.test.ts` — 8 passed
- Build: `npm run build` — passed
- E2E: `npx playwright test e2e/matching-pledges.spec.ts`

## Documentation

N/A — layout + bug fix only; no workflow change.

## Linear paste block

```
Title: Matching mobile cards + fix stale Palitada notifications

Description:
Fight Queue and Pending Payments use bordered mobile cards below lg (Meron/Wala blocks, full-width actions). Palitada toast/banner no longer replay on page refresh; sessionStorage dedupe and poll-only data refresh. Banner dismiss + auto-hide.

Comment / instructions:
Deploy app only. Test Matching on phone width and refresh after pit Palitada. Clear pitclash-matching-sync in localStorage if testing from dirty prior state.

Documentation:
N/A
```

## Related breakdowns

- `.cursor/breakdowns/20260722-1403-matching-mobile-fight-cards-breakdown.md` — mobile cards only
- `.cursor/breakdowns/20260722-1414-palitada-stale-notification-fix-breakdown.md` — Palitada fix only
- `.cursor/breakdowns/20260721-1725-cashier-ledger-mobile-cards-breakdown.md` — Cashier ledger cards (separate prior work)
