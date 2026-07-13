# Owner dropdown load saved owners on open

**Date:** 2026-07-13

## Summary

Fixed the Owner Name / Game Farm combobox on rooster entry forms so saved owners from `competitors` load when the field is empty (click to open or on first render), instead of showing “No saved owners found” until the user types.

## Changelog

- **Organizers:** On **New/Edit rooster entry**, clicking the owner dropdown with an empty field now lists up to 10 saved owners from the registry.
- **Organizers:** Typing still filters the list (300ms debounce); clearing the field reloads the default list.

## Files touched

- `features/entries/components/owner-picker-field.tsx`

## Deploy steps

None. Frontend-only.

## Manual test steps

1. Ensure at least one row exists in **competitors** (use **Add new** on the entry form if needed).
2. Open **Dashboard → Event → Rooster entries → New entry**.
3. Click **Owner Name / Game Farm** without typing — saved owners should appear.
4. Type part of a name — list should filter.
5. Clear the field — default saved list should return.

## E2E

N/A — no existing owner-picker E2E spec; manual test sufficient for one-line UX fix.

## Vitest

N/A — UI-only change; `searchCompetitors` already supports empty query server-side.

## Suggested commit

**Summary:** Load saved owners when owner picker opens empty

**Body:**

Empty owner combobox cleared search results instead of calling searchCompetitors with an empty query. Opening the dropdown now shows up to 10 saved competitors; typed search still debounces at 300ms.
