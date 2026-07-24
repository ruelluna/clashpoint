# Fix 2nd sticker print + minimal cock sticker

**Date:** 2026-07-24

## Summary

Pledge print pages with Meron + Wala now print the correct sticker when **Print sticker** is clicked on either card. Cock entry stickers use a minimal layout: band number, compact barcode, scan code only.

## Changelog

- **Print sticker / Print slip** on the 2nd (or any) slip on a page targets that slip’s panel, not the first `.print-slip-root` on the page
- **Cock sticker** headline is band number only (e.g. `SEED-001-1`), not `COCK · Band … · owner name`
- Sticker barcode height reduced (46→28 px) and width cap 75% so content fits 50×30 mm without clipping

## Files touched

- `features/printing/components/print-slip-layout.tsx`
- `features/printing/format-compact-label-line.ts`
- `features/printing/format-compact-label-line.test.ts`
- `features/printing/components/cock-entry-barcode-slip.tsx`
- `features/printing/components/compact-barcode-label-body.tsx`
- `features/printing/label-sizes.ts`
- `features/printing/print-compact-label.ts`
- `app/globals.css`

## Stage files

```bash
git add \
  features/printing/components/print-slip-layout.tsx \
  features/printing/format-compact-label-line.ts \
  features/printing/format-compact-label-line.test.ts \
  features/printing/components/cock-entry-barcode-slip.tsx \
  features/printing/components/compact-barcode-label-body.tsx \
  features/printing/label-sizes.ts \
  features/printing/print-compact-label.ts \
  app/globals.css \
  .cursor/breakdowns/20260724-2032-multi-sticker-print-cock-minimal-breakdown.md
```

## Manual test

1. Matching → **Print slips** (Meron + Wala) → **Print sticker** on **Wala** → preview shows Wala sticker (not blank)
2. **Print sticker** on Meron → still works
3. Cock rooster print → **Print sticker** → band + barcode + `C####` only; no long owner line

## E2E

N/A — print targeting and sticker layout only.

## Suggested commit

```
Fix multi-slip sticker print and minimal cock stickers

Use per-layout ref for print so the second pledge sticker is not blank.
Cock stickers show band + scan code only with smaller barcode on 50×30 mm.
```

## Commit commands

```bash
git commit -m "$(cat <<'EOF'
Fix multi-slip sticker print and minimal cock stickers

Use per-layout ref for print so the second pledge sticker is not blank.
Cock stickers show band + scan code only with smaller barcode on 50×30 mm.
EOF
)"
```
