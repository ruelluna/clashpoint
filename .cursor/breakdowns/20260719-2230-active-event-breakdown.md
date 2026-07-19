# Single active event + sidebar pin

**Date:** 2026-07-19 22:30

## Summary

Added an orthogonal `is_active` flag on events so staff can designate exactly one event as the operational focus. Lifecycle statuses are unchanged (`open` still means registration). The active event is pinned as the first item in the dashboard sidebar for users with event view/manage access.

## Changelog

- Organizers with `events.manage` (including system owners) can **Set as active event** / **Clear active** on event overview and edit
- Only one non-deleted event may be active; a second activate is rejected with a clear error
- Completing or cancelling an event clears `is_active` automatically
- Event list and detail show an **Active** badge when the flag is set
- Sidebar shows the active event name first (with Active badge) when one exists
- Admin guide documents Open vs Active and the single-active rule
- Breakdown template now includes an explicit `git add` stage command (plan-implementation rule)
- Breakdown template now includes copy-paste `git commit` heredoc commands (plan-implementation rule)

## Files touched

- `supabase/migrations/202607192230_events_is_active.sql`
- `lib/supabase/database.types.ts`
- `features/events/` (types, schema, queries, utils, service, actions, components)
- `app/dashboard/layout.tsx`, `app/dashboard/events/[id]/page.tsx`, `edit/page.tsx`
- `components/dashboard/` (sidebar, shell, client layout)
- `lib/dashboard/nav.ts`, `nav.test.ts`
- `e2e/events.spec.ts`, `e2e/helpers/test-users.ts`
- `docs/admins/docs/phase-03-events/event-status-workflow.md`
- `.cursor/rules/plan-implementation.mdc` (stage + commit commands in breakdowns)

## Stage files

Copy-paste to stage only this breakdown's monorepo paths (skips other agent windows' dirty files):

```bash
git add \
  supabase/migrations/202607192230_events_is_active.sql \
  lib/supabase/database.types.ts \
  features/events/types.ts \
  features/events/schema.ts \
  features/events/schema.test.ts \
  features/events/queries.ts \
  features/events/utils.ts \
  features/events/utils.test.ts \
  features/events/service.ts \
  features/events/service.test.ts \
  features/events/actions.ts \
  features/events/components/event-active-controls.tsx \
  features/events/components/event-status-badges.tsx \
  features/events/components/events-list-client.tsx \
  features/events/components/event-form-client.tsx \
  app/dashboard/layout.tsx \
  app/dashboard/events/[id]/page.tsx \
  app/dashboard/events/[id]/edit/page.tsx \
  components/dashboard/app-sidebar.tsx \
  components/dashboard/dashboard-client-layout.tsx \
  components/dashboard/dashboard-shell.tsx \
  lib/dashboard/nav.ts \
  lib/dashboard/nav.test.ts \
  e2e/events.spec.ts \
  e2e/helpers/test-users.ts \
  .cursor/rules/plan-implementation.mdc \
  .cursor/breakdowns/20260719-2230-active-event-breakdown.md
```

### Docs repo (stage separately)

Nested admin docs are not in the ClashPoint monorepo index:

```bash
git -C docs/admins add docs/phase-03-events/event-status-workflow.md
```

## Deploy steps

1. Apply migration `202607192230_events_is_active.sql` (`supabase db push` or run in dashboard)
2. Deploy the Next.js app (no new env vars)

## Manual test steps

1. Sign in as system owner or staff with `events.manage`
2. Open an event → **Set as active event** → confirm Active badge
3. Confirm sidebar first nav item is that event name; click it to return to the event
4. Open a second event → **Set as active event** should be disabled/blocked until the first is cleared or finished
5. Clear active or mark the active event Completed/Cancelled → sidebar pin disappears

## Tests

### Vitest

```bash
npm run test:run -- features/events/service.test.ts features/events/utils.test.ts features/events/schema.test.ts lib/dashboard/nav.test.ts
```

### E2E

```bash
npx playwright test e2e/events.spec.ts -g "sets active event"
```

Requires seeded admin/organizer credentials and `SUPABASE_SERVICE_ROLE_KEY` (to clear any existing active event before the test).

## Suggested ClashPoint commit

```
Summary: Add single active event flag and sidebar pin

Staff can mark one event as the operational focus without changing lifecycle
statuses. Registration stays on open; the active event is pinned first in
the dashboard nav and enforced with a partial unique index.
```

## Suggested admin docs commit

```
Summary: Document active event vs open status for staff

Clarify that Open is registration and Active is the single staff focus flag,
including Set/Clear controls and sidebar pin behavior.
```

## Commit commands

After staging (see Stage files), copy-paste to commit. Do not run until you intend to commit.

### ClashPoint monorepo

```bash
git commit -m "$(cat <<'EOF'
Add single active event flag and sidebar pin

Staff can mark one event as the operational focus without changing lifecycle
statuses. Registration stays on open; the active event is pinned first in
the dashboard nav and enforced with a partial unique index.
EOF
)"
```

### Admin docs (nested repo)

```bash
git -C docs/admins commit -m "$(cat <<'EOF'
Document active event vs open status for staff

Clarify that Open is registration and Active is the single staff focus flag,
including Set/Clear controls and sidebar pin behavior.
EOF
)"
```

## Linear paste block

```
Title: Add single active event flag and sidebar pin

Description:
Staff can designate exactly one event as Active for ops focus. Open still means registration. Activating a second event is blocked until the current one is cleared, completed, or cancelled. The active event appears first in the dashboard sidebar.

Comment / instructions:
Apply migration 202607192230_events_is_active.sql after deploy. No new env vars. Manual test: set active on an event → confirm sidebar pin → try activating another → clear or complete and confirm pin clears.

Documentation:
Admin: {ADMIN_DOCS_URL}/phase-03-events/event-status-workflow
```
