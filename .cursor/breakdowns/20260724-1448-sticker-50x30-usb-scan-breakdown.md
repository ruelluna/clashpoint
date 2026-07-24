# 50×30 mm sticker labels + USB scanner auto-search

**Date:** 2026-07-24

## Summary

Print **sticker** now uses a compact **50×30 mm** landscape layout with micro barcode and iframe print (avoids localhost URL in footer). **Print slip** stays on **100×150 mm** full layout. USB/handheld wedge scanners auto-fill and auto-search via shared `useBarcodeScanInput` on Cashier, Matching, Inspection, and Owners/Roosters.

## Changelog

- **Print sticker:** 50×30 mm `@page sticker`, compact headline + micro CODE128 + code caption
- **Print slip:** unchanged full OWNER/COCK/PLEDGE layout on 100×150 mm `@page label`
- **Sticker print:** iframe print suppresses dashboard URL in browser footer
- **Screen preview:** sticker mode shows 50×30 mm dashed box before printing
- **USB scanner:** scan fields auto-focus; Enter reads live input value; idle auto-submit for `OWN-`/`COCK-`/`BET-` barcodes

## Files touched

### features/printing/

- `label-sizes.ts` — slip + sticker dimension constants
- `format-compact-label-line.ts` + test
- `print-compact-label.ts` — iframe sticker print
- `components/compact-barcode-label-body.tsx`
- `components/barcode-label.tsx` — `micro` size
- `components/owner-barcode-slip.tsx`, `cock-entry-barcode-slip.tsx`, `match-bet-barcode-slip.tsx`
- `components/print-slip-layout.tsx`

### hooks/

- `use-barcode-scan-input.ts` + test

### features/entries/

- `barcode-scan-utils.ts` + test
- `components/owner-barcode-scan-row.tsx`

### features/matches/, inspection/, payments/

- `matching-rooster-scan-row.tsx`
- `rooster-barcode-scan-row.tsx`
- `cashier-client.tsx`

### app/

- `globals.css` — `@page sticker`, split slip/sticker print rules, sticker screen preview

## Stage files

```bash
git add \
  app/globals.css \
  features/printing/label-sizes.ts \
  features/printing/format-compact-label-line.ts \
  features/printing/format-compact-label-line.test.ts \
  features/printing/print-compact-label.ts \
  features/printing/components/compact-barcode-label-body.tsx \
  features/printing/components/barcode-label.tsx \
  features/printing/components/owner-barcode-slip.tsx \
  features/printing/components/cock-entry-barcode-slip.tsx \
  features/printing/components/match-bet-barcode-slip.tsx \
  features/printing/components/print-slip-layout.tsx \
  hooks/use-barcode-scan-input.ts \
  hooks/use-barcode-scan-input.test.ts \
  features/entries/barcode-scan-utils.ts \
  features/entries/barcode-scan-utils.test.ts \
  features/entries/components/owner-barcode-scan-row.tsx \
  features/matches/components/matching-rooster-scan-row.tsx \
  features/inspection/components/rooster-barcode-scan-row.tsx \
  features/payments/components/cashier-client.tsx \
  .cursor/breakdowns/20260724-1448-sticker-50x30-usb-scan-breakdown.md
```

## Deploy steps

- App deploy only (Vercel). No migration or env vars.

## Manual test steps

1. **Owner print:** `/dashboard/events/{id}/owners/{entryId}/print` → Print slip (full 100×150) → Print sticker (50×30 preview, no URL footer)
2. **Pledge print:** matching print route → same slip/sticker behavior
3. **USB scan:** Cashier → scan field focused → wedge-scan `BET-…` or `OWN-…` → lookup runs without clicking Look up
4. **Matching:** scan COCK barcode on Meron/Wala row → rooster resolves automatically

## E2E

N/A — existing `e2e/matching-pledges.spec.ts` remains skipped (seed dependency). Vitest covers scan utils and sticker headline helpers.

```bash
npm run test:run
npx vitest run features/printing/format-compact-label-line.test.ts features/entries/barcode-scan-utils.test.ts hooks/use-barcode-scan-input.test.ts
npm run build
```

## Suggested ClashPoint commit

```
Add 50×30 sticker labels and USB scan auto-search

Print sticker uses compact 50×30 mm layout with iframe print to avoid
browser URL footers; slip stays on 100×150 mm. Wedge scanners auto-submit
barcode lookups across cashier, matching, and inspection scan fields.
```

## Commit commands

```bash
git commit -m "$(cat <<'EOF'
Add 50×30 sticker labels and USB scan auto-search

Print sticker uses compact 50×30 mm layout with iframe print to avoid
browser URL footers; slip stays on 100×150 mm. Wedge scanners auto-submit
barcode lookups across cashier, matching, and inspection scan fields.
EOF
)"
```

## Linear paste block

```
Title: Add 50×30 sticker labels and USB scan auto-search

Description:
Print sticker is now a compact 50×30 mm landscape label with micro barcode.
Print slip unchanged on 100×150 mm. Iframe sticker print removes localhost
URL from print footer. USB wedge scanners auto-fill and auto-search on all
scan inputs.

Comment / instructions:
Deploy app only. Test: owner print slip vs sticker; cashier USB scan BET-
barcode; matching COCK scan without clicking Look up.

Documentation:
N/A
```
