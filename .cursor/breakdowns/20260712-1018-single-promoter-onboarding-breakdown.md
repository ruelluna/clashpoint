# Single promoter onboarding path

**Date:** 2026-07-12

## Summary

External promoters are now created only from **Promoters** (business profile + optional portal login). **Users** no longer offers Promoter on invite or role assignment, preventing orphan logins without a `promoters` row. Existing promoter-role users can still be demoted to staff/organizer/owner from Users.

## Changelog

- Users invite role dropdown: System Owner, Event Organizer, Staff only — Promoter removed.
- Users role update dropdown: same manageable roles; cannot assign Promoter from Users.
- Invite form helper: external promoters are created under Promoters.
- Promoter-role users in the list show a link to manage their profile in Promoters; demote to another role remains available.
- Promoters list/form copy clarifies portal login is granted from Promoters.
- Zod + service guards reject `promoter` role on Users invite/update.

## Files touched

- `features/users/schema.ts` — `usersManageableRoleSchema`, shared error message
- `features/users/service.ts` — defense-in-depth rejection
- `features/users/components/users-page-client.tsx` — UI and copy
- `features/users/schema.test.ts`, `features/users/service.test.ts`
- `features/promoters/components/promoters-list-client.tsx`
- `features/promoters/components/promoter-form-client.tsx`
- `e2e/users-management.spec.ts`

## Deploy steps

None. App-only change; no migration or env vars.

## Manual test steps

1. Open **Users** as system owner — confirm invite roles exclude Promoter and helper text mentions Promoters.
2. Open **Promoters → Add promoter** without login — confirm list shows profile with "No login".
3. Add promoter with **Give this promoter portal login access** — confirm "Has login" and portal works.
4. On **Users**, find a promoter-role user — confirm Promoters link and demote to Staff succeeds.
5. Attempt API bypass (optional): POST invite with `role=promoter` should fail validation.

## Vitest

```bash
npm run test:run -- features/users/schema.test.ts features/users/service.test.ts
```

## E2E

```bash
npx playwright test e2e/users-management.spec.ts
```

Updated spec asserts Promoter absent from invite role select and new helper copy visible.

## Admin docs

N/A this pass — nested `docs/admins/` not cloned. When available, add a short note under promoter management: create profiles in **Promoters**; optional portal login there; do not use **Users** for promoter onboarding.

## Suggested ClashPoint commit

Summary: Route promoter onboarding through Promoters module only

Body: Remove Promoter from Users invite and role assignment so external partners are created with a business profile first. Optional portal login stays on Promoters create/link. Server-side Zod and service guards prevent bypass; existing promoter logins can still be demoted from Users.

## Linear paste block

```
Title: Route promoter onboarding through Promoters module only

Description:
Users no longer offers Promoter on invite or role update. External promoters are created in Promoters (profile + optional portal login). Existing promoter-role accounts can be demoted from Users. Prevents orphan logins without a promoters row.

Comment / instructions:
No migration. Test: Users invite has no Promoter option → Promoters add with/without login → demote promoter user to staff from Users.

Documentation:
N/A this pass (nested admin doc repo not present).
```
