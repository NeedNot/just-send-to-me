# JustSendToMe - Easily receive files from anyone

Getting files from other people is a hassle. You have to walk them through uploading to a cloud account they may not even have, or they resort to texting photos and videos. **JustSendToMe** removes that friction: you create a request folder, share a link, and people upload their files directly without signing up.

Live: [justsendto.me](https://justsendto.me)

---

## Features

- **No account needed for uploaders**
- **folders expire after a chosen duration**
- **Credit-based durations:** longer folder lifetimes cost more credits (e.g. 1 day = 1 credit, 1 week = 3 credits)
- **Subscription tiers**
- **Email or Google sign-in**
- **Easily share folders with QR code**

---

## How it works

1. You sign up.
2. You create a request folder that stays open for a set amount of time.
3. You share the link with anyone.
4. They upload files to the folder with no sign-in required.

---

## Tech stack

| Area              | Choice                                                                          |
|-------------------|---------------------------------------------------------------------------------|
| Frontend          | React, TanStack Router + Query, Tailwind CSS, ShadCN               |
| Backend / runtime | Hono on Cloudflare Workers (Durable Objects, Workflows, Cron triggers, Rate Limiting) |
| Database          | Cloudflare D1 (SQLite) via Drizzle ORM                                           |
| Auth              | better-auth (email + Google OAuth)                                              |
| Payments          | Stripe                                    |
| Storage           | Cloudflare R2 (S3-compatible, via `aws4fetch`)                                  |
| Email             | Nodemailer over SMTP                                               |
| Anti-abuse        | Cloudflare Turnstile                                                            |

---

## Getting started

### Prerequisites

- Node.js
- A Cloudflare account on the **Workers Paid plan ($5/mo)** (required for R2, etc.)
- Accounts / API keys for: Stripe, Google OAuth, an SMTP provider, and Cloudflare Turnstile

### Installation

```bash
npm install
```

### Environment variables

`.env.example` lists every variable, split into two groups:

- **Worker secrets** (`BETTER_AUTH_SECRET`, `STRIPE_SECRET_KEY`, ...): put them in `.dev.vars` for local dev.
  In Cloudflare they are Worker secrets (`npx wrangler secret put NAME --env production`).
- **Build-time client vars** (`VITE_*`): put them in `.env.local`. Vite inlines them into the browser bundle, so they are public.

Use Stripe **test** keys and Cloudflare's Turnstile test keys locally (see the comments in `.env.example`).

### Database setup

Drizzle generates the migration SQL into `./drizzle`; Wrangler applies it to D1 (each
`d1_databases` entry in `wrangler.jsonc` points its `migrations_dir` there). Don't use
`drizzle-kit migrate` or `drizzle-kit push` on this project.

```bash
# 1. edit worker/db/schema.ts (or auth-schema.ts), then generate SQL
npm run db:generate

# 2. see what's pending
npm run db:list:dev

# 3. apply to dev-db
npm run db:migrate:dev

# 4. when ready, repeat against prod-db
npm run db:list:prod
npm run db:migrate:prod
```

### Running locally

First configure the wrangler.jsonc file. The vars (including the env.vars) need to be changed as well as binding ids.

```bash
npm run dev        # D1/R2 bindings marked "remote" use the real dev-db / dev-files-bucket
npm run dev:local  # everything in local Miniflare storage (run `npm run db:migrate:local` first)
```

To test Stripe webhooks locally, forward test-mode events to the dev server and put the printed
`whsec_...` in `.dev.vars` as `STRIPE_WEBHOOK_SECRET`:

```bash
stripe listen --forward-to localhost:5173/api/billing/webhook
```

### Scripts

| Script            | Description                              |
|-------------------|------------------------------------------|
| `npm run dev`     | Start the Vite dev server (`--host`)     |
| `npm run dev:local` | Dev server with local-only bindings (no remote D1/R2) |
| `npm run build`   | Type-check (`tsc -b`) and build for production |
| `npm run test`    | Run the test suite with Vitest (Workers pool, local bindings) |
| `npm run test:types` | Type-check the tests                   |
| `npm run lint`    | Lint with ESLint                         |
| `npm run preview` | Preview the production build             |
| `npm run types`   | Generate Cloudflare Worker types         |
| `npm run db:generate`     | Generate D1 migration SQL from the Drizzle schema |
| `npm run db:list:dev`     | List pending migrations on `dev-db`      |
| `npm run db:list:prod`    | List pending migrations on `prod-db`     |
| `npm run db:migrate:local`| Apply migrations to the local Miniflare DB |
| `npm run db:migrate:dev`  | Apply migrations to `dev-db`             |
| `npm run db:migrate:prod` | Apply migrations to `prod-db`            |

### Testing

```bash
npm test
```

Tests live in `tests/` and run inside the Workers runtime via `@cloudflare/vitest-pool-workers` with
local D1/R2/Durable Objects (migrations are applied in `tests/apply-migrations.ts`).

---

## Deployment

> **Pushing to `main` deploys production.** Workers Builds is connected to this repo and deploys the
> `just-send-to-me` Worker (justsendto.me) on every push to `main`. You normally never deploy by hand.

How the environment is chosen: this project uses the Cloudflare Vite plugin, so the environment is
picked **at build time** with `CLOUDFLARE_ENV`, and `wrangler deploy` ships whatever the last
`vite build` produced. `wrangler deploy --env production` does **not** switch environments after a
build; the flag is ignored.

| Command | Builds | Deploys to |
| ------- | ------ | ---------- |
| `npm run build` then `npx wrangler deploy` | dev config (dev-db, `IS_DEV`) | `just-send-to-me-dev` (a separate Worker, never production) |
| `npm run deploy:production` | production config | `just-send-to-me` (production) |

The top-level `name` in `wrangler.jsonc` must stay `just-send-to-me` (Workers Builds checks that it
matches the connected Worker), so `vite.config.ts` renames builds made without `CLOUDFLARE_ENV` to
`just-send-to-me-dev`. That is what stops a dev build from replacing production.

Secrets and other Wrangler commands that take an environment work as usual:
`npx wrangler secret put NAME --env production` targets the production Worker.

---

## Project structure

```
src/          React frontend
worker/       Cloudflare Worker & Hono API
shared/       Shared constants & Zod schemas used by both client and worker
drizzle/      D1 database migrations
```
