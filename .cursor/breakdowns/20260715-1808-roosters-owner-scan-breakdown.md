# Roosters owner barcode scan — breakdown

**Date:** 2026-07-15

## Summary

Staff on **Events → Roosters** can scan derby OWNER barcodes or search registered owners in a combobox before adding a cock. The old **Entry** dropdown is replaced with **Owner**, and a check panel shows existing cocks for the selected owner.

## Changelog

- **Roosters tab:** Add rooster form uses searchable **Owner** field (all event owners) instead of Entry select
- **Derby events:** OWNER barcode wedge + camera scan pre-selects owner on Roosters (stays on page)
- **Owner check panel:** Shows slot usage and registered cocks for selected owner before submit
- **Full owners:** Visible in search with full suffix; Add rooster disabled when at cock limit
- **Deep links:** entryId and barcode searchParams on Roosters page pre-select owner
- **Owners list:** Scan UI refactored to shared OwnerBarcodeScanRow
- **Permissions:** lookupOwnerEntryByBarcodeAction allows cock_entry.manage

## Manual test

1. Open a derby event → Roosters
2. Confirm Owner combobox filters by name / entry #
3. Scan or type OWNER barcode → owner selected; check panel lists existing cocks
4. Add rooster with band number → appears in list

## E2E

npx playwright test e2e/event-roosters-owner-scan.spec.ts

## Admin docs

N/A — docs/admins nested repo not populated locally.
