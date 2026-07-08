# Dashboard collapsible sidebar layout

**Date:** 2026-06-26

## Summary

Replaced the top-header-only dashboard shell with a shadcn collapsible left sidebar and right content area. Navigation includes Dashboard (active) plus Events, Fights, and Settings as disabled "Soon" placeholders. Profile avatar in the sidebar footer opens a dropdown with sign out.

## Changelog

- Admin dashboard uses a collapsible left sidebar (icon mode on desktop, sheet drawer on mobile)
- ClashPoint branding and navigation live in the sidebar
- Events, Fights, and Settings appear as disabled nav items labeled "Soon"
- Sign out moved from header button to profile avatar dropdown in sidebar footer
- Dashboard content fills the right pane (removed shell-level max-w-5xl constraint)

## Files touched

### app/

- app/dashboard/layout.tsx — server auth + DashboardShell
- app/dashboard/page.tsx — simplified content wrapper

### components/

- components/dashboard/app-sidebar.tsx — sidebar nav, branding, profile menu
- components/dashboard/dashboard-shell.tsx — SidebarProvider, inset, header trigger
- components/ui/sidebar.tsx, avatar.tsx, dropdown-menu.tsx, separator.tsx, tooltip.tsx, sheet.tsx, input.tsx, skeleton.tsx — shadcn primitives

### lib/

- lib/dashboard/nav.ts — nav item config

### hooks/

- hooks/use-mobile.ts — responsive sidebar behavior

## Deploy steps

None. No migrations or env vars.

## Manual test steps

1. Sign in as admin → /dashboard
2. Confirm left sidebar: ClashPoint header, Dashboard + 3 disabled items with "Soon" badges
3. Click sidebar collapse trigger → sidebar shrinks to icons; content expands
4. Click profile avatar → dropdown shows name and Sign out; sign out returns to /login
5. Resize to mobile → sidebar opens as drawer via trigger

## E2E

- Existing spec: e2e/auth-login.spec.ts — passed (3/3)
- Command: npx playwright test e2e/auth-login.spec.ts

## Vitest

N/A — layout/UI only, no new business logic.

## Docs

N/A — internal admin chrome only.

## Suggested commit

**Summary:** Add collapsible dashboard sidebar layout

**Body:** Replace the top-header dashboard shell with shadcn Sidebar (icon collapse on desktop, sheet on mobile). Nav includes Dashboard plus disabled Events/Fights/Settings placeholders. Profile avatar dropdown handles sign out.
