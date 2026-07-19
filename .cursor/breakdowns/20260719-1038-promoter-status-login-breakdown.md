# Promoter status login gate

**Date:** 2026-07-19

## Summary

Inactive and suspended promoters with portal login can no longer sign in or use `/portal` / `/dashboard`. Login shows status-specific error messages. Changing promoter status syncs the linked user's `profiles.is_active` flag.

## Changelog

- Promoters with status **Inactive** or **Suspended** are blocked at sign-in with a clear message on `/login`.
- Already-logged-in promoters lose access on the next request (redirect to `/access-denied` with the same status-specific copy).
- Setting status back to **Active** reactivates the linked login profile.
- Users list **Active/Inactive** badge stays aligned when promoter status changes.

## Files touched

### lib/

- `lib/auth/promoter-access.ts` (new) — shared promoter access checks and login messages
- `lib/auth/promoter-access.test.ts` (new)
- `lib/auth/permissions.ts` — `canAccessDashboardForProfile`, `requirePortalAccess`
- `lib/auth/permissions.test.ts`
- `lib/auth/index.ts` — re-exports

### features/

- `features/auth/actions.ts` — `signInAction` promoter gate
- `features/promoters/service.ts` — sync `profiles.is_active` on status change
- `features/promoters/service.test.ts`

### app/

- `app/access-denied/page.tsx` — promoter-specific denial copy

## Deploy steps

No migration or env vars. Deploy app code only.

## Manual test steps

1. **Dashboard → Promoters → Add promoter** with login access (status Active).
2. Sign in as that promoter → `/portal` or `/dashboard` loads.
3. As staff, edit promoter → set status **Suspended** (with reason) → save.
4. Sign out as promoter → sign in again → see: *"Your promoter account has been suspended…"* — remain on `/login`.
5. Set status **Active** → sign in succeeds.
6. Repeat step 3–4 with **Inactive** → see inactive message.
7. While promoter is signed in, staff suspends them → promoter navigates → `/access-denied` shows suspended message.

## E2E

N/A — would require seeded promoter auth user via service role; manual steps above cover the flow.

## Tests

```bash
npm run test:run -- lib/auth/promoter-access.test.ts lib/auth/permissions.test.ts features/promoters/service.test.ts
npm run build
```

## Suggested commit

**Summary:** Block inactive/suspended promoter login

**Body:** Enforce promoter status at sign-in and route guards with status-specific messages. Sync profiles.is_active when organizer changes promoter status so Users list and auth stay consistent.

## Documentation

- Admin doc: **N/A** — `docs/admins/` not present in this workspace. When available, add a note under promoter management that Inactive/Suspended block portal login immediately and Active restores it.

## Linear paste block

```
Title: Block inactive/suspended promoter login

Description:
Promoters with Inactive or Suspended status can no longer sign in or use the portal/dashboard. Login and access-denied pages show status-specific messages. Active restores access; linked profiles.is_active syncs on status change.

Comment / instructions:
Deploy app only — no migration. Manual test: create promoter with login → suspend → sign-in blocked with message → set Active → sign-in works.

Documentation:
N/A (admin doc note pending docs/admins clone)
```
