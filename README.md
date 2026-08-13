# Delva

A private focus timer that learns how long things actually take you.

Live at [delva.app](https://delva.app). Product context, strategy and the build sequence live in
[`docs/`](docs/) — start with [`CLAUDE.md`](CLAUDE.md).

## Stack

Next.js (App Router) on Vercel, Supabase for auth / Postgres / cron, Tailwind v4.

## Local setup

```bash
npm install
cp .env.example .env.local   # fill in from Supabase → Project Settings → API
npm run dev
```

| Script            | What it does                        |
| ----------------- | ----------------------------------- |
| `npm run dev`     | Dev server on http://localhost:3000 |
| `npm run build`   | Production build                    |
| `npm run lint`    | ESLint                              |
| `npm run typecheck` | `tsc --noEmit`                    |

`GET /api/health` reports whether the app booted and the configured Supabase project is reachable.
It is a deployment check, not a user-facing page.

## Deploying

Vercel project → import this repo → set `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY` for Production, Preview and Development → point `delva.app` at it.

## Where things stand

Phase A of [`docs/BUILD-PLAN.md`](docs/BUILD-PLAN.md). The scaffold and a holding page exist; there
is no timer yet. Next up is **D-02 · Schema**, which is the consequential one — the data model is
the moat.
