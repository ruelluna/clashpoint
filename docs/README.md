# ClashPoint documentation sites

Admin and user guides live in **separate git repositories** nested under this folder. They are gitignored in the main ClashPoint repo.

## Documentation structure (phases)

Guides are organized by **MVP phase** with section files and Mermaid flowcharts.

### Admin site (`docs/admins/docs/`)

| Phase | Folder | Sections |
|-------|--------|----------|
| 1 | `phase-01-foundation/` | user-management, roles-and-permissions, system-settings, audit-trail |
| 2 | `phase-02-promoters/` | creating-promoters, promoter-login-access, status-and-commissions |
| 3 | `phase-03-events/` | creating-events, event-status-workflow, derby-rules-and-prizes |
| 4 | `phase-04-registration-payments/` | participant-registration, payment-tracking |
| 5 | `phase-05-lineup-weighing/` | lineup-submission, official-weighing |
| 6 | `phase-06-matching-fight-queue/` | match-pairing, fight-queue |
| 7 | `phase-07-results-scoring/` | recording-results, standings-and-scoring |
| 8 | `phase-08-winners-payouts/` | winner-finalization, prize-payouts, promoter-settlement, winner-announcement |
| 9 | `phase-09-reports/` | event-reports, financial-reports, audit-reports |
| 10 | `phase-10-public-display/` | publishing-public-results, promoter-portal-admin |

Each phase has an `index.md` overview with a phase-level Mermaid diagram.

### User site (`docs/users/docs/`)

| Phase | Folder | Sections |
|-------|--------|----------|
| 4 | `phase-04-registration/` | registration-at-event |
| 10 | `phase-10-public/` | viewing-public-events, standings-and-winners, promoter-portal |

Phases 1–3 and 5–9 are operator-only; user guides exist only where participants or the public interact.

## Setup

If the Docusaurus site is not cloned yet, markdown is still available under `docs/admins/docs/` and `docs/users/docs/`. To run the doc site:

```bash
# From ClashPoint repo root — clone if needed
git clone <admin-docs-repo-url> docs/admins
git clone <user-docs-repo-url> docs/users

cd docs/admins   # or docs/users
npm install
npm run start
```

Copy or sync the phase markdown and `sidebars.ts` from this repo into your cloned doc repos before publishing.

Build before publishing:

```bash
npm run build
```

## Where to write guides

| Audience | Path |
|----------|------|
| Admin (ops, scoring, internal) | `docs/admins/docs/<phase-folder>/<section>.md` |
| User (players, spectators) | `docs/users/docs/<phase-folder>/<section>.md` |

See `.cursor/rules/documentation.mdc` for full conventions (no CLI in published admin guides, no `.cursor/` links).

## Environment

In the main app `.env`:

```
ADMIN_DOCS_URL=https://<org>.github.io/clashpoint-admin-docs
USER_DOCS_URL=https://<org>.github.io/clashpoint-user-docs
```

Wire these in `lib/docs.ts` when in-app help links are added.
