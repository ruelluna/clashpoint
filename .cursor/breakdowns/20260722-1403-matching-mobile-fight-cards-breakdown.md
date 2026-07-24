# Matching tab mobile fight cards

**Date:** 2026-07-22

## Summary

Fight Queue and Pending Payments tabs in Matching now use bordered receipt-style cards on phones and tablets (below `lg`), matching the Cashier ledger pattern. Desktop row layouts at `lg+` are unchanged.

## Changelog

- **Fight Queue:** each match is a mobile card with fight # + queue status, Meron/Wala side blocks (entry, cock, band, bet, pledge badges), full-width queue advance buttons, and adjust-pledge form.
- **Pending Payments:** flush list with padded intro; each match is a mobile card with fight # + match status, side blocks, full-width Print slips and Cancel match buttons.
- Shared `MatchingMatchSideBlock` for Meron/Wala display across both tabs.
- `FightQueueAdvanceForm` supports `fullWidthButtons` with `size="md"` on mobile; `CancelMatchForm` supports `buttonSize` and `fullWidth`.
- **Open Cashier Terminal** is full-width on mobile in Pending Payments intro.

## Files touched

### features/matches/components/

- `matching-match-side-block.tsx` (new)
- `matching-fight-queue-row.tsx` (new)
- `matching-pending-payment-row.tsx` (new)
- `matching-shared.tsx`
- `matching-fight-queue-panel.tsx`
- `matching-pending-payments-panel.tsx`

### e2e/

- `matching-pledges.spec.ts`

## Stage files

```bash
git add \
  features/matches/components/matching-match-side-block.tsx \
  features/matches/components/matching-fight-queue-row.tsx \
  features/matches/components/matching-pending-payment-row.tsx \
  features/matches/components/matching-shared.tsx \
  features/matches/components/matching-fight-queue-panel.tsx \
  features/matches/components/matching-pending-payments-panel.tsx \
  e2e/matching-pledges.spec.ts \
  .cursor/breakdowns/20260722-1403-matching-mobile-fight-cards-breakdown.md
```

## Commit commands

```bash
git commit -m "$(cat <<'EOF'
Add mobile fight cards to Matching queue and pending tabs

Phones and tablets show bordered fight cards with side blocks
and full-width actions. Desktop row layouts unchanged at lg+.
EOF
)"
```

## Deploy steps

No migration. Deploy app only.

## Manual test steps

1. Open **Events → Matching** at viewport width &lt; 992px.
2. **Fight Queue** tab: confirm bordered cards with Meron/Wala, queue status badge, full-width advance button (when permitted).
3. **Pending Payments** tab: confirm bordered cards, full-width Print slips / Cancel match, full-width Open Cashier Terminal in intro.
4. Widen to desktop — row layouts should match pre-change behavior.

## E2E

- Updated: `e2e/matching-pledges.spec.ts` (mobile viewport smoke test)
- Run: `npx playwright test e2e/matching-pledges.spec.ts`

## Vitest

N/A — UI-only responsive layout.

## Documentation

**Admin docs N/A** — layout refinement only.

**User docs N/A** — same.

## Suggested ClashPoint commit

```
Add mobile fight cards to Matching queue and pending tabs

Phones and tablets show bordered fight cards with side blocks
and full-width actions. Desktop row layouts unchanged at lg+.
```

## Linear paste block

```
Title: Add mobile fight cards to Matching queue and pending tabs

Description:
Fight Queue and Pending Payments tabs use bordered mobile cards below lg with Meron/Wala side blocks and full-width actions. Desktop layouts unchanged.

Comment / instructions:
Deploy app only. Test Matching tabs on phone width (<992px) and desktop.

Documentation:
N/A
```
