# ClashPoint documentation sites

Admin and user guides live in **separate git repositories** nested under this folder. They are gitignored in the main ClashPoint repo.

## Setup

Clone each site into its expected path:

```bash
# From ClashPoint repo root
git clone <admin-docs-repo-url> docs/admins
git clone <user-docs-repo-url> docs/users
```

## Local development

```bash
cd docs/admins   # or docs/users
npm install
npm run start
```

Build before publishing:

```bash
npm run build
```

## Where to write guides

| Audience | Path |
|----------|------|
| Admin (ops, scoring, internal) | `docs/admins/docs/<kebab-case>.md` |
| User (players, organizers) | `docs/users/docs/<kebab-case>.md` |

See `.cursor/rules/documentation.mdc` for full conventions.

## Environment

In the main app `.env`:

```
ADMIN_DOCS_URL=https://<org>.github.io/clashpoint-admin-docs
USER_DOCS_URL=https://<org>.github.io/clashpoint-user-docs
```

Wire these in `lib/docs.ts` when in-app help links are added.
