# Owner picker show-all breakdown

**Date:** 2026-07-18

## Summary

The Register owner combobox now loads saved owners on mount and shows the full list when clicked. Typing filters the list client-side on each keypress instead of requiring typed input before any results appear.

## Changelog

- Clicking **Owner Name/Game Farm** on Register owner / game farm shows saved owners immediately (up to 100).
- Each keypress filters the dropdown by display name without waiting for a debounced server search.
- Empty catalog vs no filter matches show distinct helper text in the dropdown.
- Edit entry and legacy entry forms using the same picker get the same behavior.

## Files touched

### features/

- `features/competitors/schema.ts` — raised `searchCompetitorsSchema` limit max to 100
- `features/competitors/actions.ts` — optional `limit` on `searchCompetitorsAction`
- `features/entries/components/owner-picker-field.tsx` — preload + client-side filter

### e2e/

- `e2e/event-owners.spec.ts` — picker show-all and filter spec

## Deploy steps

No migration or env changes. Deploy app only.

## Manual test steps

1. Sign in as organizer with **entries.manage**.
2. Ensure at least one saved owner exists (**Dashboard → Owners**).
3. Open **Events → {event} → Owners → Register owner**.
4. Click **Owner Name/Game Farm** without typing — all saved owners (≤100) should appear.
5. Type letters — list narrows immediately.
6. Clear input — full list returns.
7. Select an owner — contact fields populate.
8. **Add new** still creates and selects a new owner.

## E2E

Added: `e2e/event-owners.spec.ts` — `owner picker shows saved owners on click and filters while typing`

```bash
npx playwright test e2e/event-owners.spec.ts
```

Vitest: N/A — UI-only change.

## Suggested ClashPoint commit

**Summary:** Show all owners on owner picker click and filter on type

**Body:** Preload up to 100 saved owners when the Register owner combobox mounts and filter client-side on each keypress. Removes the empty-input guard that blocked the dropdown until the user typed. Extends searchCompetitorsAction with an optional limit for the initial load.

## Suggested doc commits

N/A — no admin/user doc changes.

## Linear paste block

```
Title: Show all owners on owner picker click and filter on type

Description:
Register owner / game farm combobox now shows saved owners when clicked and filters on each keypress. Initial catalog loads up to 100 owners on mount; no typing required to browse the list.

Comment / instructions:
No migration or env vars. Deploy app. Test: Events → Owners → Register owner → click Owner Name/Game Farm → verify list appears; type to filter.

Documentation:
N/A
```
