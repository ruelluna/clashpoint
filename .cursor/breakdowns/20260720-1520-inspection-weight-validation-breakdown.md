# Inspection weight validation fix

**Date:** 2026-07-20

## Summary

Inspection and weighing now resolve weight limits from Derby Eligibility policy (when weight field is enabled), not only from `events.min_weight_grams` / `max_weight_grams`. The inspection UI shows configured limits, disables **Record weight** for out-of-range input, and exposes **Reject** when preview fails.

## Changelog

- Inspection uses effective weight limits from Derby Eligibility (e.g. 1000–1500 g) even when event columns are null
- Weight input shows live **Within range** / **Out of range** preview against correct limits
- **Record weight** is enabled only when entered grams are valid and within limits
- **Reject** appears when weight preview is out of range so staff can fail the rooster without recording a pass
- Verified weight badges show **Passed** / **Failed** with correct colors instead of generic green “Weight verified”
- Weighing record/verify server paths use the same effective limits (defense in depth)

## Files touched

### features/
- `features/entries/weight-utils.ts` — `resolveEffectiveWeightLimitsGrams`, `formatWeightLimitsLabel`
- `features/entries/weight-utils.test.ts` — new unit tests
- `features/entries/weight-limits.ts` — server helpers for effective limits
- `features/eligibility/registration-bridge.ts` — DRY via shared resolver
- `features/weighing/service.ts` — effective limits on record/verify
- `features/weighing/service.test.ts` — policy-aware test case
- `features/inspection/components/inspection-station-client.tsx` — UI gating, limits label, badge fix

### app/
- `app/dashboard/events/[id]/inspection/page.tsx` — pass effective limits to client

## Stage files

```bash
git add \
  features/entries/weight-utils.ts \
  features/entries/weight-utils.test.ts \
  features/entries/weight-limits.ts \
  features/eligibility/registration-bridge.ts \
  features/weighing/service.ts \
  features/weighing/service.test.ts \
  features/inspection/components/inspection-station-client.tsx \
  app/dashboard/events/[id]/inspection/page.tsx \
  .cursor/breakdowns/20260720-1520-inspection-weight-validation-breakdown.md
```

## Deploy steps

No migration. Deploy app only.

## Manual test steps

1. Event → **Derby Eligibility** → enable Weight limits → set 1000–1500 g → save.
2. **Inspection** → **Inspect** a rooster.
3. Confirm `Limits: 1000–1500 g` under the weight field.
4. Enter `2000` → red **Out of range**, **Record weight** disabled, **Reject** visible.
5. Enter `1200` → green **Within range**, **Record weight** enabled → submit → **Weight passed**.
6. Enter `900` → out of range; use **Reject** to fail the rooster.

## Tests

```bash
npm run test:run -- features/entries/weight-utils.test.ts features/weighing/service.test.ts
npm run build
```

**E2E:** N/A — unit tests + manual inspection flow; no new routes.

## Suggested ClashPoint commit

**Summary:** Fix inspection weight validation against Derby Eligibility limits

**Body:** Inspection and weighing now merge derby eligibility policy weight limits with event columns. Out-of-range weights show failed preview, Record weight is gated, and Reject is available before recording.

## Commit commands

```bash
git commit -m "$(cat <<'EOF'
Fix inspection weight validation against Derby Eligibility limits

Inspection and weighing now merge derby eligibility policy weight limits
with event columns. Out-of-range weights show failed preview, Record weight
is gated, and Reject is available before recording.
EOF
)"
```

## Linear paste block

```
Title: Fix inspection weight validation against Derby Eligibility limits

Description:
Inspection and weighing now resolve min/max grams from Derby Eligibility policy when weight limits are enabled, matching what organizers configure in event setup. The inspection UI shows limits, disables Record weight for out-of-range input, and exposes Reject for failed preview.

Comment / instructions:
Deploy app only — no migration. Test: Derby Eligibility 1000–1500 g → Inspection → 2000 g shows Out of range and disabled submit; 1200 g records as passed.

Documentation:
N/A — fixes existing behavior to match configured eligibility limits.
```
