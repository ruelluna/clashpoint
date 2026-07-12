# Dashboard spacing standard

**Date:** 2026-07-12

## Summary

Introduced shared Chakra layout primitives (PageStack, PageHeader, PanelCard, ButtonGroup, EventPageLayout) with a documented spacing scale (LAYOUT_GAP). Migrated all dashboard pages and feature clients so cards, sections, and buttons get consistent 24px gaps by default. Fixes the Matching page where tabs and content were flush together.

## Changelog (organizer-visible)

- Event tab pages now have consistent spacing between the tab bar and page content
- Matching board sections (create match, matches table, fight queue) are visually separated with uniform card padding
- Dashboard home, audit, events list, and other admin pages use the same header/card/button spacing rhythm
- New pages should import layout primitives from @/components/dashboard per .cursor/rules/layout-spacing.mdc

## Files touched

### components/dashboard/
- spacing.ts, page-stack.tsx, page-header.tsx, panel-card.tsx, button-group.tsx, event-page-layout.tsx, index.ts

### .cursor/rules/
- layout-spacing.mdc

### app/dashboard/
- All event tab pages use EventPageLayout; page.tsx and audit/page.tsx use PageStack

### features/ (dashboard clients)
- matching-board-client.tsx and 19+ other feature clients migrated

## Deploy steps

None. UI-only change.

## Manual test steps

1. Dashboard -> Events -> [event] -> Matching: gap between tabs and content; gaps between cards; button spacing in create form
2. Rooster Entries: header and table card spacing
3. Dashboard home: stat cards and Recent activity spacing
4. Events list and Users pages

## E2E

N/A - visual spacing refactor with no behavior change.

## Suggested commit

Add dashboard layout spacing primitives

Introduce PageStack, PageHeader, PanelCard, ButtonGroup, and EventPageLayout with a shared LAYOUT_GAP scale. Migrate dashboard pages and feature clients so new routes get consistent section and card spacing by default.
