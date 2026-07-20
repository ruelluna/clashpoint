# Dashboard sidebar scroll layout — 2026-07-20

## Summary

Locked the dashboard shell to viewport height (`100dvh`) so the left sidebar (including the profile footer) stays pinned while only the main content area scrolls. Previously `minH="100vh"` let the sidebar stretch with long page content, pushing the profile to the bottom of the page.

## Changelog

- Left sidebar profile/account menu stays at the bottom of the viewport on long pages.
- Main dashboard content scrolls independently; top header bar stays fixed.
- Sidebar nav links still scroll internally when the nav list exceeds viewport height.

## Files touched

- `components/dashboard/dashboard-shell.tsx`

## Stage files

```bash
git add \
  components/dashboard/dashboard-shell.tsx \
  .cursor/breakdowns/20260720-1440-dashboard-sidebar-scroll-breakdown.md
```

## Deploy steps

None — UI-only layout change. Deploy with normal Vercel push.

## Manual test steps

1. Open a long dashboard page (e.g. **Events → [event] → Revolving Fund** or **Matching**).
2. Scroll the main content — confirm the sidebar profile stays at the bottom of the screen.
3. Confirm the **Dashboard** header and color-mode button do not scroll away.
4. Toggle sidebar collapse — layout remains correct.
5. Below `992px` width — open mobile drawer, navigate, confirm drawer closes (existing `e2e/mobile-shell.spec.ts` flow).

## E2E

N/A — layout-only fix; no new user flows. Existing mobile drawer spec still applies.

## Vitest

N/A — no business logic changes.

## Docs

N/A — internal layout fix with no organizer workflow change.

## Suggested ClashPoint commit

```
Fix dashboard sidebar viewport height and main scroll

Lock the shell to 100dvh so the sidebar profile stays pinned while
only the main content area scrolls on long pages.
```

## Commit commands

```bash
git commit -m "$(cat <<'EOF'
Fix dashboard sidebar viewport height and main scroll

Lock the shell to 100dvh so the sidebar profile stays pinned while
only the main content area scrolls on long pages.
EOF
)"
```

## Linear paste block

```
Title: Fix dashboard sidebar viewport height and main scroll

Description:
The dashboard shell now uses 100dvh with overflow hidden on the shell
and sidebar. Main content scrolls independently; the sidebar profile
footer stays pinned to the viewport bottom on long pages.

Comment / instructions:
No migration or env changes. Deploy normally. Manual test on a long
event page (revolving fund or matching): scroll main content and confirm
profile stays visible at sidebar bottom.

Documentation:
N/A
```
