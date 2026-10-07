# Inventory SaaS — Frontend

Next.js **16.3.6** (App Router, Turbopack) + React 19, TypeScript 5 (`strict`),
Tailwind CSS v4. It is the user-facing half of the multi-tenant inventory and
sales SaaS, and it is a **BFF** in front of the Laravel API in `../backend`.

## Architecture

The browser only ever talks to Next.js; the session token never leaves the
server:

```
browser ──httpOnly cookies──> Next.js (server) ──Bearer + X-Tenant-Slug──> Laravel API
```

- Session cookies: `erp_token`, `erp_tenant` (httpOnly, so no client-side
  token handling and no CORS configuration anywhere).
- `proxy.ts` only checks that a session cookie exists and that the URL tenant
  matches it; real validation (401/403) happens server-side per request.
- The private area is `/app/[tenant]/...` with English route segments.

## Requirements

- Node `24` / npm `11`

## Getting started

Start the API first (see `../backend/README.md`), then:

```bash
npm install
cp .env.example .env                # set LARAVEL_API_URL
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server (Turbopack) |
| `npm run build` | Production build — also the typecheck |
| `npm run lint` | ESLint (flat config) |

There is no separate `typecheck` script and no test runner configured.

## Routes

Public paths and the private tenant area (English segments by design):

| Path | Purpose |
| --- | --- |
| `/login`, `/register` | Authentication (login has an organization picker for multi-account users) |
| `/invitations/accept?token=...` | Anonymous invitation preview/acceptance |
| `/app/[tenant]/dashboard` | Today's summary |
| `/app/[tenant]/products` | Product catalog (search, filters, CRUD) |
| `/app/[tenant]/sales` | Sales list, filters and the sale form |
| `/app/[tenant]/sales/[saleId]` | Sale detail |
| `/app/[tenant]/team` | Members and invitation management (copy-link on success) |
| `/app/[tenant]/settings` | Organization settings (ADMIN only): rename, logo, delete |

The bare `/app/[tenant]` is not a page; it redirects to the dashboard so stale
hand-written links degrade instead of 404ing.

## Language

`es` and `en`. The locale lives in the `erp_locale` cookie — **not** in the
URL — so emailed invitation links never go stale when someone switches
language. Resolution order: `erp_locale` cookie → `Accept-Language` →
`es`. The dictionary is typed (`Dictionary = typeof en`), so a missing or
mistyped translation is a compile error, not a runtime gap. The language picker
is in the app header; the browser's first visit is detected from
`Accept-Language`.

Routes are the same in both languages: only labels are translated. Money is
always `USD`; switching language changes separators and date format, never the
currency meaning.

## Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `LARAVEL_API_URL` | — | Base URL of the backend API (`http://127.0.0.1:8000`) |

## Notes

- The logo upload is a Route Handler (`app/api/organizations/logo`) rather than
  a Server Action, because actions cap their body at 1 MB and a big multipart
  upload would dead-end on the framework before reaching the API.
- `node_modules/next/dist/docs/` ships the Next.js 16 guides — read them before
  writing code; several APIs differ from older Next.js versions.
- `AGENTS.md` documents the full conventions and security decisions.