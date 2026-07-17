# Compact Users Page with Edit Mode

**Date:** 2026-07-17

## Summary

Refactored the Users dashboard page so staff module access is no longer always visible in the user list. Rows default to a read-only view with **Edit** and **Deactivate** actions; role and module forms appear in a compact inline panel only when editing. The module picker uses a responsive multi-column grid instead of a long vertical checkbox list.

## Changelog

- User list rows show name, email, role, and status only — no inline module badges or checkbox wall
- **Edit** opens a bordered panel with role select, compact module grid (1/2/3 columns), save actions, and **Cancel**
- Only one user editable at a time; edit panel closes after successful role/module update
- Invite form uses the same compact module grid; widens when Staff role is selected
- Mobile: Role/Status labeled via `DetailFieldRow`; action buttons stack full-width on small screens
- Fixed duplicate checkbox DOM ids across multiple staff rows

### Follow-up (same day)

- **Add user** opens a modal dialog (same pattern as Events → Roosters → Add rooster); form resets on close, dialog closes on successful invite
- Module access checkboxes fixed via `Fieldset` + `CheckboxGroup` (not `FormField`)
- Inactive users can be reactivated with **Activate**

## Files touched

### `features/`
- `features/users/components/users-page-client.tsx` — UI refactor (grid, edit mode, mobile layout)

### `e2e/`
- `e2e/users-management.spec.ts` — updated copy assertions; edit-mode module visibility test

## Deploy steps

None — UI-only change. Deploy with normal Vercel flow.

## Manual test steps

1. Open `/dashboard/users` at ~375px width.
2. Confirm active user rows show **Edit** and **Deactivate** only (no module checkboxes).
3. Tap **Edit** on a staff user → compact module grid and role select appear.
4. Tap **Cancel** → panel collapses.
5. Update role or modules → success message; panel auto-closes.
6. Invite form with Staff role → compact 2–3 column module grid.

## E2E

Updated: `e2e/users-management.spec.ts`

```bash
npx playwright test e2e/users-management.spec.ts
```

## Vitest

N/A — UI-only; no schema/service changes.

## Admin / user docs

N/A — same capabilities, cleaner layout.

## Suggested ClashPoint commit

**Summary:** Compact Users page with per-row edit mode

**Body:** Hide inline module checkboxes and role forms behind an Edit action so the user list stays scannable on mobile. Module picker uses a responsive grid; edit panel closes on successful save or Cancel.

## Linear paste block

```
Title: Compact Users page with per-row edit mode

Description:
Users list no longer renders 22 module checkboxes per staff row. Edit opens a compact inline panel for role and module access; view mode shows Edit/Deactivate only. Invite form uses the same multi-column module grid.

Comment / instructions:
No migration or env vars. Test: /dashboard/users on mobile width → Edit → update modules → Cancel/success collapses panel.

Documentation:
N/A
```

## Changelog (2026-07-17 follow-up)

- Inactive users show an **Activate** button that restores `is_active` and clears `deactivated_at`
- Added `reactivateUserAction`, `reactivateUser` service, and `reactivateUserSchema`
- Vitest coverage for reactivation schema and service
