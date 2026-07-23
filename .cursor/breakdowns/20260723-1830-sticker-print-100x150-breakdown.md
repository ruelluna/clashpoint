# Sticker print fix for 100×150 mm labels

**Date:** 2026-07-23

## Summary

Owner/cock **Print sticker** was laid out for **50×25 mm** roller labels while organizers use **TP870 S / S3 100×150 mm** thermal labels. Preview and Save-as-PDF looked correct, but physical prints showed only browser headers/footers (localhost URL). Print CSS moved to `globals.css`, sticker `@page` set to **100mm × 150mm**, dashboard overflow reset for print, and print waits for barcode SVG before opening the dialog.

## Changelog (2026-07-23 follow-up 7)

- Fixed empty space on landscape labels: override Chakra `maxW="md"` (~118 mm) so slip/sticker fill full 150 mm `@page` width.

## Changelog (2026-07-23 follow-up 6)

- Label `@page` and layout updated to **landscape 150×100 mm** (matches print dialog Landscape on 100×150 stock).
- Kept **centered vertical stack** (no side-by-side columns); wider barcode area (142 mm max).

## Changelog (2026-07-23 follow-up 5)

- Reverted landscape horizontal layout; restored **portrait 100×150 mm** centered stack for Print slip and Print sticker.

## Changelog (2026-07-23 follow-up 4)

- **Print slip** on barcode pages (owner, cock entry, pledge) uses `labelSizedSlip`: 100×150 mm `@page`, centered vertically and horizontally in portrait on label paper.
- Payment/refund receipts unchanged (normal `@page auto` for full-length slips).

## Changelog (2026-07-23 follow-up 3)

- Removed in-page **ClashPoint** duplicate; browser print header title cannot be repositioned from app code.
- Sticker vertical centering retained.

## Changelog (2026-07-23 follow-up 2)

- **ClashPoint** brand added to top-right of every `PrintSlipLayout` printout (owner, cock, bet, payment/refund receipts).
- **Print sticker** content vertically centered on the label page; brand pinned to top-right corner of the label.

## Changelog (2026-07-23 follow-up)

- Sticker print root constrained to **100mm** and **horizontally centered** on the label page (fixes extra space on the right in portrait).
- Sticker body, text stack, and barcode block centered within the panel.

## Changelog (organizer-visible)

- **Print sticker** targets **100×150 mm** label paper (matches TP870 S / S3 preset).
- Sticker content uses full label width with larger text and barcode for 203 dpi thermal printers.
- **Print slip** keeps normal page size (`auto`) instead of forcing 50×25 mm.
- Print dialog opens after the barcode SVG is drawn; black ink forced for text and barcode on print.

## Files touched

### app/

- `globals.css` — `@media print` rules, `@page sticker`, dashboard overflow overrides

### features/

- `printing/label-sizes.ts` — `100×150` constants
- `printing/components/print-slip-layout.tsx` — remove styled-jsx; `flushSync` + barcode wait
- `printing/components/barcode-label.tsx` — larger sticker barcode, explicit black bars

### components/

- `dashboard/dashboard-shell.tsx` — `data-dashboard-shell` for print overflow CSS

## Stage files

```bash
git add \
  app/globals.css \
  components/dashboard/dashboard-shell.tsx \
  features/printing/label-sizes.ts \
  features/printing/components/barcode-label.tsx \
  features/printing/components/print-slip-layout.tsx \
  .cursor/breakdowns/20260723-1830-sticker-print-100x150-breakdown.md
```

## Deploy steps

- App deploy only (Vercel). No migration or env vars.

## Manual test steps

1. Open `/dashboard/events/{id}/owners/{entryId}/print`.
2. Click **Print sticker**.
3. In the print dialog:
   - Destination: **TP870 S** (or Save as PDF first, then print PDF).
   - Paper: **100×150 mm** (S3).
   - **Uncheck** Headers and footers.
   - **Check** Background graphics if barcode is missing on a given driver.
4. Confirm paper shows `#entry · owner`, contact line (if any), barcode, and `OWN-…` text.
5. Click **Print slip** — should print full slip on normal paper (not 100×150 crop).

## Tests

- **Vitest:** N/A — print CSS and timing only.
- **E2E:** N/A — hardware/driver print; manual verification above.
- **Build:** TypeScript passed; full `npm run build` failed on unrelated missing `matching/pit/page.tsx` in this workspace.

## Suggested ClashPoint commit

```
Fix sticker print for 100×150 mm thermal labels

Sticker @page and panel sizing matched TP870 S / S3 labels instead of
50×25 mm roller size. Print styles live in globals.css with dashboard
overflow overrides; print waits for barcode SVG before opening dialog.
```

## Commit commands

```bash
git commit -m "$(cat <<'EOF'
Fix sticker print for 100×150 mm thermal labels

Sticker @page and panel sizing matched TP870 S / S3 labels instead of
50×25 mm roller size. Print styles live in globals.css with dashboard
overflow overrides; print waits for barcode SVG before opening dialog.
EOF
)"
```

## Admin / user docs

- N/A — in-app print behavior only.

## Linear paste block

```
Title: Fix sticker print for 100×150 mm thermal labels

Description:
Print sticker now uses 100×150 mm @page and panel sizing for TP870 S /
S3 labels. Print CSS moved to globals.css; dashboard shell overflow
cleared on print; barcode renders before print dialog opens.

Comment / instructions:
Deploy app only. Test owner print → Print sticker on TP870 S with
100×150 paper, headers/footers off, background graphics on if needed.
```
