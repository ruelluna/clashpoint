# Owners management page

**Date:** 2026-07-12

## Summary

Added a dedicated **Owners** sidebar item and `/dashboard/owners` pages so staff can list, create, edit, and soft-delete saved owner names and game farms (`competitors` table). The rooster entry owner picker reuses the same registry; a **Manage owners** link was added on the entry form.

## Changelog

- Sidebar shows **Owners** (between Promoters and Roosters) for staff with `entries.manage` or `rooster.view`
- **Owners & game farms** list page with search and **Add owner**
- Create and edit pages for owner contact details, address, and notes
- Soft delete blocked when event entries are still linked to the owner
- Entry form owner picker links to **Manage owners** (`/dashboard/owners`)

## Files touched

### app/
- `app/dashboard/owners/page.tsx`
- `app/dashboard/owners/new/page.tsx`
- `app/dashboard/owners/[id]/page.tsx`

### features/
- `features/competitors/actions.ts`
- `features/competitors/queries.ts`
- `features/competitors/schema.ts`
- `features/competitors/service.ts`
- `features/competitors/types.ts`
- `features/competitors/components/owners-list-client.tsx`
- `features/competitors/components/owner-form-client.tsx`
- `features/competitors/components/owner-profile-fields.tsx`
- `features/competitors/schema.test.ts`
- `features/competitors/service.test.ts`
- `features/entries/components/create-owner-dialog.tsx`
- `features/entries/components/owner-picker-field.tsx`

### lib/
- `lib/dashboard/nav.ts`
- `lib/dashboard/nav-icons.tsx`
- `lib/dashboard/nav.test.ts`
- `lib/supabase/database.types.ts`

### e2e/
- `e2e/owners.spec.ts`

### Docs (nested repos)
- `docs/admins/docs/phase-04-registration-payments/rooster-registry-and-approval.md`
- `docs/admins/sidebars.ts`
- `docs/users/docs/phase-04-registration/registering-rooster-entries.md`

## Deploy steps

No migration required. Deploy app only (Vercel).

## Manual test steps

1. Sign in as staff with **Entries** access.
2. Confirm **Owners** appears in the left sidebar.
3. Open **Owners & game farms** -> **Add owner** -> save a test farm.
4. Go to **Events -> [event] -> Rooster Entries -> New entry** -> search for the saved owner.
5. Edit the owner from `/dashboard/owners/[id]` and confirm list updates.
6. Try deleting an owner linked to an entry -> expect error message.

## E2E

- Added: `e2e/owners.spec.ts`
- Run: `npx playwright test e2e/owners.spec.ts`

## Vitest

- `npx vitest run features/competitors lib/dashboard/nav.test.ts`

## Suggested ClashPoint commit

```
Add Owners management page for saved game farms

Staff can maintain the competitors registry from Dashboard -> Owners before encoding entries. Includes list, create, edit, and guarded soft delete; entry picker links to the directory.
```

## Out of scope (follow-up)

- `gamefarms` table CRUD (separate from competitors)
- Competitor level assignment UI
- Association membership management
