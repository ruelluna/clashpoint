# Print slips use short scan barcodes

**Date:** 2026-07-24

## Summary

Owner, cock entry, and pledge print slips now encode the short scan code (`O0001`, `C0001`, `B0042M`) in the large slip barcode. Canonical codes (`OWN-…`, `COCK-…`, `BET-…`) are no longer rendered on slips; stickers were already short.

## Changelog

- Owner registration slip barcode scans as `O####` instead of `OWN-{eventId}-####`
- Cock entry slip barcode scans as `C####` instead of `COCK-{eventId}-####`
- Pledge slip barcode scans as `B{fight}{M|W}` instead of full `BET-…` barcode
- Human-readable text under slip barcodes shows the short code (JsBarcode `displayValue`)
- **Print slip** no longer includes the sticker layout — only one barcode per slip (React `PrintFormatSection` gates slip vs sticker DOM)

## Files touched

- `features/printing/components/owner-barcode-slip.tsx`
- `features/printing/components/cock-entry-barcode-slip.tsx`
- `features/printing/components/match-bet-barcode-slip.tsx`
- `features/printing/components/print-format-section.tsx`

## Stage files

```bash
git add \
  features/printing/components/owner-barcode-slip.tsx \
  features/printing/components/cock-entry-barcode-slip.tsx \
  features/printing/components/match-bet-barcode-slip.tsx \
  features/printing/components/print-format-section.tsx \
  .cursor/breakdowns/20260724-1726-slip-short-barcode-breakdown.md
```

## Manual test

1. Open an owner print page → **Print slip** → barcode encodes `O####` (verify with USB scanner or on-screen text under bars)
2. Repeat for cock entry and matching pledge slips
3. Confirm sticker print unchanged

## E2E

N/A — same print flows; encoded value changed only.

## Suggested ClashPoint commit

```
Use short scan codes on print slip barcodes

Slip barcodes now match sticker/USB scan codes (O/C/B prefixes) instead of
canonical OWN/COCK/BET strings, so staff scan one format everywhere.
```

## Commit commands

```bash
git commit -m "$(cat <<'EOF'
Use short scan codes on print slip barcodes

Slip barcodes now match sticker/USB scan codes (O/C/B prefixes) instead of
canonical OWN/COCK/BET strings, so staff scan one format everywhere.
EOF
)"
```
