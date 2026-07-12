# Chakra UI Standards Audit — Breakdown

**Date:** 2026-07-12

## Summary

Implemented the four-phase Chakra UI standards audit: global provider at root, public/portal layout migration from Tailwind space-y-* to Chakra Stack, shared FormField wrapper for dashboard forms, and removal of orphaned shadcn scaffold.

## Changelog

- Chakra provider now wraps the entire app from app/layout.tsx via ChakraAppRoot
- Removed per-route ChakraClientRoot wrappers
- Public events layout and home page migrated to Chakra
- Replaced className space-y-* with Stack gap across public and portal clients
- Weighing station uses NativeSelect instead of native select with Tailwind
- Added FormField in components/dashboard/; refactored dashboard form clients
- Deleted unused shadcn components and SSR fallback files
- Updated architecture.mdc for Chakra-first structure

## Manual test

npm run dev — verify /, /events, /login, /dashboard, /portal, weighing form

## E2E

N/A — standards refactor, no new flows

## Suggested commit

Summary: Align app UI with Chakra v3 standards

Body: Mount Chakra globally, migrate public/portal layouts, introduce FormField, remove unused shadcn scaffold.
