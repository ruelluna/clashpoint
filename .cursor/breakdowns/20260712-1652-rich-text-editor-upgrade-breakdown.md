# Rich text editor toolbar upgrade

**Date:** 2026-07-12

## Summary

Upgraded the Chakra + Tiptap RichTextEditor used for derby Registration rules with a mui-tiptap-inspired toolbar. Did not install mui-tiptap or convert other plain Textarea fields.

## Changelog

- Registration rules editor now has an outlined field with a grouped icon toolbar and tooltips.
- Organizers can use headings (H2/H3), blockquote, strikethrough, undo/redo, and a link dialog instead of window.prompt.
- Public and dashboard event pages safely render the new HTML tags after sanitizer/CSS updates.

## Files touched

- components/ui/rich-text-editor.tsx
- components/ui/rich-text-editor-toolbar.tsx
- features/events/components/event-form-client.tsx
- lib/sanitize-html.ts
- lib/sanitize-html.test.ts
- app/globals.css

## Deploy steps

None.

## Manual test steps

Create/edit a derby event, format registration rules, verify dashboard and public event pages.

## E2E

npx playwright test e2e/events.spec.ts -g "registration rules"

## Vitest

npm run test:run -- lib/sanitize-html.test.ts

## Suggested commit

Summary: Upgrade registration rules rich text editor toolbar

Body: Replaces the minimal Chakra Tiptap toolbar with icon controls, undo/redo, headings, blockquote, strikethrough, and an in-app link dialog. Sanitizer and public CSS updated so new formatting renders safely on event pages.
