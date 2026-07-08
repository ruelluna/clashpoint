# Dashboard Chakra UI sidebar layout

**Date:** 2026-06-26

## Summary

Migrated the admin dashboard shell from shadcn Sidebar to Chakra UI v3 per the Next.js App guide. Dashboard routes are wrapped in ChakraProvider; login and public pages remain on Tailwind/shadcn.

## Changelog

- Installed @chakra-ui/react, @emotion/react, next-themes
- Dashboard uses Chakra collapsible left sidebar (localStorage persistence) and Drawer on mobile
- Nav, avatar menu, and layout rebuilt with Chakra Box, Flex, Button, Menu, Avatar, Drawer, Tooltip
- next.config.ts enables optimizePackageImports for @chakra-ui/react

## Files touched

### app/

- app/dashboard/layout.tsx — DashboardProvider + DashboardShell

### components/dashboard/

- dashboard-provider.tsx — ChakraProvider (defaultSystem)
- dashboard-shell.tsx — Chakra layout shell
- app-sidebar.tsx — Chakra nav + profile menu

### config

- next.config.ts — package import optimization
- package.json — Chakra dependencies

## Deploy steps

Run npm install after pull. No migrations or env vars.

## Manual test steps

1. npm run dev → sign in → /dashboard
2. Sidebar shows ClashPoint branding, nav items, profile avatar
3. Toggle sidebar collapse on desktop; state persists on refresh
4. Mobile width → sidebar opens as Drawer
5. Avatar menu → Sign out

## E2E

e2e/auth-login.spec.ts — passed (3/3)

## Vitest

N/A — UI/layout only

## Docs

N/A

## Note on Turbopack

Chakra docs recommend --webpack if Emotion hydration errors appear with Turbopack. Build passed with default scripts; switch dev/build to --webpack if hydration mismatches occur.

## Suggested commit

**Summary:** Migrate dashboard shell to Chakra UI

**Body:** Replace shadcn sidebar dashboard chrome with Chakra UI v3 (collapsible sidebar, mobile drawer, avatar menu). Scope ChakraProvider to dashboard layout only.
