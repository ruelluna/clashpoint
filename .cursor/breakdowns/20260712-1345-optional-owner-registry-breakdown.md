# Optional owner registry on rooster entry

**Date:** 2026-07-12

## Summary

Staff can search previously saved owners when encoding rooster entries. Saving a new owner is optional (checkbox unchecked by default). Handler remains free-text per entry and is never stored on the owner profile. Uses the existing `competitors` table and `entries.competitor_id` FK.

## Changelog

- New rooster entry form includes owner search (typeahead) against saved owners
- Optional **Save owner for future entries** checkbox when registering a new owner name
- Selecting a saved owner pre-fills contact number, email, and address
- Handler name stays independent on each entry
- Edit entry form supports the same owner search and optional save behavior

## Files touched

### features/competitors/

- types.ts, schema.ts, queries.ts, service.ts, actions.ts, service.test.ts

### features/entries/

- schema.ts, schema.test.ts, service.ts, actions.ts, types.ts
- components/owner-picker-field.tsx, entry-form-client.tsx, entry-edit-client.tsx

### app/

- dashboard/events/[id]/rooster-entries/[entryId]/edit/page.tsx

### e2e/

- rooster-entries-weighing-matching.spec.ts

### docs/users/

- docs/phase-04-registration/registering-rooster-entries.md
- sidebars.ts

## Deploy steps

- No new migration - requires 202607121701_derby_reference_entities.sql already applied
- Deploy app to Vercel as usual; no new env vars

## Manual test steps

1. Sign in as staff with Entries permission.
2. Open an open event -> Rooster entries -> New entry.
3. Enter a new owner name, contact details, check Save owner for future entries, save entry.
4. Start another entry -> type the same owner name -> select from search results -> confirm contact fields prefill.
5. Enter a different handler on the second entry -> save -> confirm both entries show the same owner and different handlers on the list.

## E2E

- Updated: e2e/rooster-entries-weighing-matching.spec.ts
- Run: npx playwright test e2e/rooster-entries-weighing-matching.spec.ts

## Vitest

- features/competitors/service.test.ts
- features/entries/schema.test.ts
- Run: npm run test:run

## Suggested ClashPoint commit

Summary: Add optional owner search and save on rooster entry

Body: Wire competitors registry into entry create/edit so staff can search saved owners or opt in to saving new ones. Handler stays per-entry text only.

## Suggested doc commit (docs/users)

Summary: Document owner search and optional save on rooster entry

Body: Add staff guide for searching saved owners, optional save checkbox, and per-entry handler behavior.

## Linear paste block

Title: Optional owner save and search on rooster entry

Description:
Staff can search saved owners when encoding rooster entries. New owners can optionally be saved for reuse via a checkbox (unchecked by default). Handler remains free-text per entry.

Comment / instructions:
Ensure derby reference entities migration is applied. E2E: npx playwright test e2e/rooster-entries-weighing-matching.spec.ts

Documentation:
User: {USER_DOCS_URL}/phase-04-registration/registering-rooster-entries
