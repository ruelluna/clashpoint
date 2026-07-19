# Event and Owners Summary Card Layout

**Date:** 2026-07-17

## Summary

Aligned the Event overview page and Event → Owners tab with the Roosters/Inspection summary-card layout: bordered cards, left summary + badges, right outline action. Layout and styling only — no data, queries, or workflow changes.

## Changelog

- Event overview shows a summary card (name, venue · date · type, status/Public badges) with **Edit event** on the right when permitted.
- Event details fields moved into a bordered card with an inline **Event details** heading (no `PanelCard` wrapper).
- Owners tab drops the outer **Registered owners** panel; list rows match Rooster list cards (`p={4}`, no hover).
- Owner list action is a single **View owner details** button; **Print OWNER slip** removed from list (still on owner detail header).

## Files touched

- `app/dashboard/events/[id]/page.tsx`
- `app/dashboard/events/[id]/owners/page.tsx`
- `features/entries/components/owners-list-client.tsx`

## Deploy steps

None — frontend layout only.

## Manual test steps

1. **Events → [event]** — summary card shows name, meta line, badges; **Edit event** on the right (desktop) or stacked full-width (mobile). Details fields unchanged below.
2. **Events → Owners** — no wrapping panel; each owner is a bordered card with **View owner details** on the right.
3. Derby owner detail still has **Print OWNER slip** in the page header.
4. Mobile: cards stack column-first; action buttons full-width on `base`.

## Tests

| Layer | Status |
|-------|--------|
| Vitest | N/A — layout only |
| E2E | N/A — no existing specs assert owners list **View** label |
| Build | `npm run build` — passed |

## Suggested commit

```
Summary: Align Event and Owners tabs to summary card layout

Apply Roosters/Inspection bordered summary-card pattern to the event
overview and owners list for consistent operator UX. Layout only.
```

## Linear paste block

```
Title: Align Event and Owners tabs to summary card layout

Description:
- Event overview: summary card (name, meta, badges) + bordered details card
- Owners tab: Rooster-style list cards with View owner details action
- Print OWNER slip removed from owners list (remains on detail page)

Comment / instructions:
No migration or env changes. Run npm run build locally if verifying.

Documentation:
N/A — visual alignment only
```
