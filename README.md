# Finishing Touch
Supabase-first, Vercel-friendly monorepo for a turnover painting business.

## Current Runtime Mode
The web app now runs in **Supabase-only mode** (no Docker required):
- Auth: Supabase Auth (email/password)
- Data: Supabase Postgres via `@supabase/supabase-js`
- Frontend: Next.js on Vercel (`apps/web`)

A legacy Nest API still exists in `apps/api`, but it is not required for day-to-day web usage.

## Monorepo
- `apps/web` Next.js App Router + TypeScript + Tailwind + admin UI
- `apps/api` legacy NestJS backend (optional)
- `packages/shared` shared Zod schemas + pricing logic

## Logo
Replace:
- `apps/web/public/logo-placeholder.png`

## Quick Start (Supabase + Web)
1. Install:
```bash
pnpm install
```
2. Create web env:
```bash
cp apps/web/.env.example apps/web/.env
```
3. Fill `apps/web/.env`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=replace-with-strong-secret
NEXT_PUBLIC_CURRENCY_SYMBOL=₪
```
4. Start web:
```bash
pnpm dev
```

## Supabase Setup
### 1. Create schema tables
Run SQL from:
- `apps/api/prisma/migrations/20260220150000_init/migration.sql`
in Supabase SQL Editor.

### 2. Create admin user in Supabase Auth
In Supabase Dashboard:
- Authentication → Users → Add user
- Email: `admin@finishingtouch.test`
- Password: `Password123!`

Optional role metadata:
```json
{ "role": "ADMIN" }
```
(If omitted, app defaults to `ADMIN` role for authenticated users.)

## Local URLs
- Web: `http://localhost:3000`
- Admin login: `http://localhost:3000/admin/login`
- Web health: `http://localhost:3000/api/health`

## Vercel Env Vars (`apps/web`)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `NEXT_PUBLIC_CURRENCY_SYMBOL`

## Deploy
1. Import repo in Vercel
2. Set Root Directory to `apps/web`
3. Add env vars above
4. Deploy

## Scripts
- `pnpm dev` → shared build + web dev (Supabase-first)
- `pnpm dev:full` → legacy full stack (docker + api + web)
- `pnpm build`
- `pnpm lint`

## Notes
- “Generate PDF” currently opens a print-ready document in a new tab for browser Save as PDF.
- If you want server-side binary PDF generation again, use legacy API mode or add a serverless PDF route.
