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

Copy `.env.example` to `.env.local` and fill in the values.

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
npm run dev
```

### Scripts

| Script            | Description                              |
|-------------------|------------------------------------------|
| `npm run dev`     | Start the Vite dev server (`--host`)     |
| `npm run build`   | Type-check (`tsc -b`) and build for production |
| `npm run test`    | Run the test suite with Vitest           |
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

`todo add tests`

---

## Deployment

Deploys to Cloudflare Workers via Wrangler. The built frontend (`./dist`) is served as static assets with
`/api/*` handled by the worker first; production config lives under `env.production` in `wrangler.jsonc`.

```bash
npm run build

npx wrangler deploy --env production
```

---

## Project structure

```
src/          React frontend
worker/       Cloudflare Worker & Hono API
shared/       Shared constants & Zod schemas used by both client and worker
drizzle/      D1 database migrations
```
