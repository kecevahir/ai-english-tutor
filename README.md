# AI English Tutor

Adaptive, memory-backed AI English tutor — not a plain chatbot.

**Live target:** https://dmportal.com.tr/englishtutor  
**Base path:** `/englishtutor`  
**Auth:** none (password-free MVP demo learner)

## Stack

- Next.js (App Router) + React + TypeScript (strict)
- Tailwind CSS + light/dark theme
- PostgreSQL + Prisma
- Zod validation
- Provider-agnostic AI & speech interfaces

Architecture details: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)

## Phase status

| Phase | Status |
|-------|--------|
| 1 Foundation (layout, sidebar, dashboard, Prisma, adaptive stubs) | **In progress / this branch** |
| 2–10 | Not started |

## Setup

```bash
cp .env.example .env.local
# set DATABASE_URL to your Postgres instance

npm install
npm run db:migrate
npm run db:seed
npm run dev
```

App URL: http://localhost:3000/englishtutor/dashboard

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Apply Prisma migrations |
| `npm run db:seed` | Seed demo learner + dashboard data |
| `npm run db:studio` | Prisma Studio |

## Environment

See `.env.example`. Phase 1 requires `DATABASE_URL` only.

`AI_PROVIDER` defaults to `mock`. Real OpenAI/Anthropic providers are Phase 2 — missing keys must not be silently faked as success.

## Learning loop

```text
practice → AI analysis → mistakes/performance → database
→ learning profile → adaptive engine → next lesson → practice
```
