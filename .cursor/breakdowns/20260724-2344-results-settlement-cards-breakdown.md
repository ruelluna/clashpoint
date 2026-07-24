# Results settlement cards — breakdown

**Date:** 2026-07-24

## Summary

Recorded results are phone/tablet card-friendly below `lg`, and expanded settlement details mirror Matching → Settling as a read-only summary. Manual Record result was removed (results are recorded from Matching).

## Changelog

- Removed the Results **Record result** form; recording stays on Matching outcome actions.
- Recorded results use stacked cards below `lg` and the existing table at `lg+`.
- **View details** shows Settling-style sections: Match Winners, VIP payments, Revolving fund (progress badges, status, paid-at timestamps; no pay/post/settle actions).
- Shared `SettlementSection` / `SettlementRow` live under `components/dashboard` for Matching Settling and Results.
- VIP summary includes Meron/Wala side; revolving-fund complete matches Settling’s ledger filter.
- Card actions: **View details** is an outline button; Verify / View details sit on the right beside Meron/Wala/result for balance.
- List shows **Active Matching** number (`matching_number`, fallback Fight #); winner entry highlighted with Meron blue / Wala red.

## Files touched

**app/**

- `dashboard/events/[id]/results/page.tsx` — drop `pendingMatches` load

**components/dashboard/**

- `settlement-rows.tsx` — moved chrome + `actionHeader` prop
- `index.ts` — export settlement rows

**features/matches/**

- `components/matching-handler-settlement-list.tsx` — import from dashboard
- `components/matching-vip-settlement-list.tsx` — import from dashboard
- `components/matching-settling-panel.tsx` — import from dashboard
- deleted `components/matching-settlement-rows.tsx`

**features/results/**

- `components/results-entry-client.tsx` — cards + summarized details; no record form
- `types.ts` — VIP `side`; `matching_number`
- `queries.ts` — VIP side mapping; ledger completeness filter; load `matching_number`

## Stage files

```bash
git add \
  app/dashboard/events/[id]/results/page.tsx \
  components/dashboard/settlement-rows.tsx \
  components/dashboard/index.ts \
  features/matches/components/matching-handler-settlement-list.tsx \
  features/matches/components/matching-vip-settlement-list.tsx \
  features/matches/components/matching-settling-panel.tsx \
  features/matches/components/matching-settlement-rows.tsx \
  features/results/components/results-entry-client.tsx \
  features/results/types.ts \
  features/results/queries.ts \
  .cursor/breakdowns/20260724-2344-results-settlement-cards-breakdown.md
```

## Deploy steps

None (no migrations or env vars).

## Manual test steps

1. Open **Events → Results** on a phone-width viewport: each result is a card (no horizontal swipe helper).
2. Confirm there is no **Record result** panel.
3. Expand a settled/settling fight: sections Match Winners, VIP payments, Revolving fund match Settling layout; no Mark paid / Post / Mark settled.
4. At desktop width: table columns remain; expand still shows the same summary.
5. Open Matching → Settling: interactive actions still work after chrome move.

## E2E

N/A — layout/summary UI only; no new multi-step flow. Record form removal does not need a new Playwright path (Matching still records results).

Suggest (optional smoke later): `npx playwright test e2e/matching-vip-settling.spec.ts`

## Suggested ClashPoint commit

```
Summary: Make Results a Settling-style card summary

Recorded results use responsive cards and a read-only Settling
mirror for settlement details. Drop the redundant Record result form.
```

## Commit commands

```bash
git commit -m "$(cat <<'EOF'
Make Results a Settling-style card summary

Recorded results use responsive cards and a read-only Settling
mirror for settlement details. Drop the redundant Record result form.
EOF
)"
```

## Documentation

- Admin docs: N/A — `docs/admins` not present in this workspace
- User docs: N/A — operator workflow

## Linear paste block

```
Title: Make Results a Settling-style card summary

Description:
Recorded results are card-friendly on phone/tablet. Expanded details reuse Settling section chrome as a read-only summary (Match Winners, VIP payments, Revolving fund). Manual Record result removed; Matching still records outcomes. Verify remains for standings.

Comment / instructions:
No migration. Test Results on narrow + wide viewports; confirm Matching Settling actions still work.

Documentation:
N/A (admin docs repo not checked out)
```
