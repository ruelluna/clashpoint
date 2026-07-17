# Registration, inspection, and payments minor fixes

**Date:** 2026-07-17

## Summary

Staff and public rooster weight inputs are capped at 9999 g (4 digits). Inspection and weighing station UIs now use grams end-to-end, matching registration. Recording official weight no longer overwrites declared weight. Payments ledger restricts recording to Cash only; non-cash methods remain visible but disabled; receipt number is hidden for Cash and enforced server-side.

## Changelog

- Rooster declared weight (public wizard, dashboard entries, event roosters add) rejects values above 9999 g; HTML `max={9999}` on inputs
- Inspection tab shows and accepts official weight in grams; queue displays declared/official weights in g
- Weighing station component labels, inputs, limits header, and table column use grams; query reads `*_weight_grams` with legacy fallback
- `recordWeight` persists `official_weight_grams`, syncs legacy kg column, leaves `declared_weight_grams` unchanged
- Payments: only Cash selectable; bank transfer, GCash, Other shown disabled; receipt field hidden for Cash; server rejects tampered non-cash posts
- Weight inputs use shared `GramWeightInput`: numeric text field with `maxLength={4}` so users cannot type more than four digits (paste also clamped)

## Changelog (2026-07-17 follow-up)

- Replaced `type="number"` weight fields with `GramWeightInput` — blocks a 5th digit at keystroke/paste instead of relying on submit validation only

## Files touched

### features/

- `entries/schema.ts` — `weightGramsSchema` max 9999
- `entries/schema.test.ts` — accept 9999, reject 10000
- `entries/weight-utils.ts` — `resolveStoredWeightGrams` helper
- `entries/components/rooster-entry-slots.tsx` — `GramWeightInput`
- `entries/components/gram-weight-input.tsx` — shared 4-digit weight input
- `entries/weight-input-utils.ts` — digit clamp helper
- `entries/weight-input-utils.test.ts` — clamp tests
- `event-roosters/components/event-roosters-client.tsx` — `GramWeightInput`
- `inspection/queries.ts` — gram fields + fallback mapping
- `inspection/components/inspection-station-client.tsx` — g labels/inputs/display
- `weighing/schema.ts` — `recordWeightSchema` uses `weightGramsSchema`
- `weighing/schema.test.ts` — gram fixtures, 10000 rejection
- `weighing/service.ts` — grams in `recordWeight` / `verifyWeight`; fix declared overwrite bug
- `weighing/queries.ts` — gram fields for station list
- `weighing/components/weighing-station-client.tsx` — grams UI; `minWeightGrams` / `maxWeightGrams` props
- `payments/schema.ts` — cash-only refine; clear receipt for cash
- `payments/schema.test.ts` — cash accept; gcash/bank_transfer reject
- `payments/components/payments-ledger-client.tsx` — disabled methods; conditional receipt

### e2e/

- `rooster-entries-weighing-matching.spec.ts` — inspection fill `2100` g

## Deploy steps

No migrations or env vars. Deploy app only (Vercel or usual pipeline).

## Manual test steps

1. **Weight cap** — Public register step 2 or dashboard rooster entry: enter `10000` → validation error; `9999` accepted
2. **Event roosters** — Add rooster with declared weight `9999` OK; `10000` blocked by input max / server
3. **Inspection** — Events → Inspection → search entry → record official weight `2100` g → verify → pass inspection; confirm declared weight unchanged on registration
4. **Payments** — Events → Payments → Record payment: only Cash enabled; no receipt field; submit succeeds
5. **Tamper guard** — (optional) POST non-cash `paymentMethod` via devtools → server rejects

## E2E

- Updated: `e2e/rooster-entries-weighing-matching.spec.ts` (`completeInspectionForEntry` uses `2100` g)
- Run: `npx playwright test e2e/rooster-entries-weighing-matching.spec.ts`

## Tests run

```bash
npm run test:run   # 310 passed
npm run build      # success
```

## Documentation

N/A — internal staff UX and validation only; no admin/user doc updates.

## Suggested ClashPoint commit

**Summary:** Cap rooster weight at 9999 g; inspection/weighing in grams; cash-only payments

**Body:**

Extend shared `weightGramsSchema` with a 9999 g ceiling for all registration and official weigh paths. Switch inspection and weighing station UI and queries to grams, fix `recordWeight` so declared weight is not overwritten, and restrict payment recording to Cash with server-side enforcement.

## Linear paste block

```
Title: Cap rooster weight at 9999 g; inspection/weighing in grams; cash-only payments

Description:
- Registration and staff rooster forms cap declared weight at 9999 g (4 digits)
- Inspection and weighing station use grams for display, input, and recordWeight/verifyWeight
- Official weight record no longer overwrites declared_weight_grams
- Payments ledger: Cash only (other methods visible but disabled); receipt hidden for Cash

Comment / instructions:
No migration. Deploy app. Manual: register/inspect with gram weights; record cash payment. E2E: npx playwright test e2e/rooster-entries-weighing-matching.spec.ts

Documentation:
N/A
```
