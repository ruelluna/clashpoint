# Mobile & tablet UX optimization

**Date:** 2026-07-16

## Summary

Optimized ClashPoint for phones and tablets: drawer navigation through 991px, responsive layout primitives, audited client UIs, Cursor rules for future UI, mobile E2E, and user guide.

## Changelog

- Dashboard drawer nav on phones and tablets (below 992px); persistent sidebar on large desktops only
- Drawer closes automatically after navigation
- Responsive padding on dashboard main, PanelCard, and public/portal shells
- New DetailFieldRow primitive for label/value detail rows
- Event-day screens use larger touch targets and stacked layouts on small screens
- Public site header uses hamburger menu on small screens
- Cursor rules: responsive-ui.mdc; updated layout-spacing, nextjs-components, stack
- User guide: using ClashPoint on mobile/tablet

## E2E

npx playwright test e2e/mobile-shell.spec.ts

## Suggested ClashPoint commit

Summary: Optimize ClashPoint UX for phones and tablets

Body: Drawer navigation now applies through 991px so ringside tablets match phone ergonomics. Adds responsive-ui Cursor rules, layout primitives, and audits major client pages.
