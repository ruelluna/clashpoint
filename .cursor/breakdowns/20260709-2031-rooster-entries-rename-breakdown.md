# Rooster Entries (Rename of Lineups tab)

**Date:** 2026-07-09

## Summary

The existing per-event Lineups tab already captures individual roosters (birds) in `rooster_records`, so it now serves as the "Rooster Entries" feature. This change is user-facing only: the per-event tab label and its route were renamed from "Lineups" / `/lineups` to "Rooster Entries" / `/rooster-entries`. No logic, schema, permission, or RLS changes were made.

## Changelog

- The event sub-navigation tab formerly labeled **Lineups** now reads **Rooster Entries**.
- The page URL moved from `/dashboard/events/{id}/lineups` to `/dashboard/events/{id}/rooster-entries`.
- The in-page heading and helper text updated to "Rooster Entries".
- Submitting a rooster entry now revalidates the new route so the list refreshes after save.

## Files touched

- `app/`
  - Moved `app/dashboard/events/[id]/lineups/page.tsx` -> `app/dashboard/events/[id]/rooster-entries/page.tsx` (content unchanged)
- `features/`
  - `features/events/components/event-detail-tabs.tsx` — tab slug `lineups` -> `rooster-entries`, label `Lineups` -> `Rooster Entries`
  - `features/lineups/actions.ts` — `revalidatePath` updated to `/rooster-entries`
  - `features/lineups/components/lineups-client.tsx` — visible heading/description updated to "Rooster Entries"

## Explicitly unchanged

- `features/lineups/` module internals (`queries.ts`, `service.ts`, `schema.ts`, `types.ts`) keep their "lineup" names.
- Permission key `lineups.manage` and RLS policies (no migration).
- `canSubmitLineup` eligibility and the Registrations / Weighing / Matching flows.
- The old `/lineups` URL is retired; no external links point to it (admin-internal), so no redirect was added.

## Deploy steps

None. No migration, no env vars.

## Manual test

1. Open an event at `/dashboard/events/{id}`.
2. Confirm the sub-nav tab now reads **Rooster Entries** and navigates to `/dashboard/events/{id}/rooster-entries`.
3. Select a confirmed, fully paid entry and submit a rooster entry — confirm it saves and the list refreshes.
4. Confirm the old `/dashboard/events/{id}/lineups` URL no longer resolves (404), which is expected.

## Vitest

N/A — copy/route rename with no new business logic. Existing `features/lineups/schema.test.ts` remains valid (imports unchanged).

## E2E

N/A behavior-wise. No existing spec navigates to `/lineups`, so no Playwright update was required.

## Docs

Admin/User docs: N/A this pass — the nested `docs/admins/` and `docs/users/` repos are not cloned in this workspace, and no published doc references "Lineups". When those repos are available, update the admin event guide to use the term "Rooster Entries" for the former Lineups step (in-app wording only, no CLI).

## Suggested ClashPoint commit

Summary: Rename Lineups tab to Rooster Entries

Body: The per-event Lineups tab already manages individual roosters, so it is now surfaced as "Rooster Entries". Renames the tab label and route (`/lineups` -> `/rooster-entries`), updates the submit revalidation path and in-page heading. No logic, schema, or permission changes.

## Linear paste block

```
Title: Rename Lineups tab to Rooster Entries

Description:
The per-event Lineups tab already captures individual roosters, so it is now labeled "Rooster Entries" and lives at /dashboard/events/{id}/rooster-entries. User-facing rename only; no logic, schema, permission, or RLS changes.

Comment / instructions:
No migration and no env vars. Test: open an event -> confirm the tab reads "Rooster Entries" at /rooster-entries -> submit a rooster entry -> confirm it saves and the list refreshes. Old /lineups URL now 404s (expected).

Documentation:
N/A this pass (nested doc repos not present).
```
