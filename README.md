# Finishing Touch Monorepo
Modern mobile-first marketing site + admin system for **Finishing Touch** (turnover painting for rental apartments).

## Stack
- `apps/web`: Next.js (App Router) + TypeScript + Tailwind + shadcn-style UI primitives
- `apps/api`: NestJS + TypeScript + Prisma + Swagger
- `packages/shared`: shared Zod schemas + pricing engine
- DB: PostgreSQL (Docker Compose for local dev)
- Auth: NextAuth credentials (web) + JWT + RBAC (API)
- PDF: Puppeteer HTML-to-PDF on API side
- Calendar: FullCalendar in admin schedule

## Monorepo Structure
- `apps/web`
- `apps/api`
- `packages/shared`
- `docker-compose.yml`

## Logo Replacement
Current logo file used by the site and PDF previews:
- `apps/web/public/logo-placeholder.png`

To replace branding, swap that file with your final logo (same filename), or update image references.

## Quick Start (Local)
1. Install dependencies:
```bash
pnpm install
```
2. Copy env files:
```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```
3. Start PostgreSQL:
```bash
pnpm db:up
```
4. Start full local stack:
```bash
pnpm dev
```
`pnpm dev` will:
- start Postgres (`docker compose`)
- build shared package
- run Prisma migration deploy
- run seed data
- start API + web apps

## URLs
- Web: `http://localhost:3000`
- API: `http://localhost:4000/api`
- Swagger: `http://localhost:4000/api/docs`
- API health: `http://localhost:4000/api/health`
- Web health: `http://localhost:3000/api/health`

## Puppeteer Note
If PDF generation fails because Chromium is missing, run:
```bash
pnpm --filter @finishing-touch/api exec puppeteer browsers install chrome
```
Or set `PUPPETEER_EXECUTABLE_PATH` in `apps/api/.env`.

## Default Login
- Email: `admin@finishingtouch.test`
- Password: `Password123!`

## Environment Variables
### `apps/api/.env`
- `NODE_ENV`
- `PORT`
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `CORS_ORIGIN`
- `APP_CURRENCY_SYMBOL` (default `₪`)
- `PUPPETEER_EXECUTABLE_PATH` (optional)

### `apps/web/.env`
- `NEXT_PUBLIC_API_URL` (example: `http://localhost:4000`)
- `NEXTAUTH_URL` (example: `http://localhost:3000`)
- `NEXTAUTH_SECRET`
- `NEXT_PUBLIC_CURRENCY_SYMBOL` (default `₪`)

## Key Features Delivered
- Public pages: `/`, `/services`, `/pricing`, `/about`, `/contact`
- Sticky mobile CTA + responsive header
- Contact/estimate public lead forms writing to API `/leads`
- Admin routes under `/admin` with credentials login
- Dashboard: today jobs, open estimates, clocked-in employees
- Estimates: list/filter, wizard creation, detail actions (PDF/send/convert)
- Invoices: list, detail, status update, PDF
- Employees: CRUD + timesheet range view
- Punch clock: clock in/out + duration handling
- Schedule: FullCalendar + job creation + assignment + create from accepted estimate
- Pricing logic implemented exactly in shared package + unit tests
- PDF generation via Puppeteer with required estimate table/format fields

## API Notes
- REST API with Swagger at `/api/docs`
- JWT bearer auth + RBAC (`ADMIN`, `MANAGER`, `EMPLOYEE`)
- Public lead endpoint: `POST /api/leads`
- Actions:
  - `POST /api/estimates/:id/convert-to-invoice`
  - `GET /api/estimates/:id/pdf`
  - `GET /api/invoices/:id/pdf`

## Tests
### Run unit tests (pricing)
```bash
pnpm --filter @finishing-touch/api test --runInBand
```

### Run e2e smoke test
Requires running Postgres and seeded data first.
```bash
pnpm db:up
pnpm prisma:deploy
pnpm prisma:seed
pnpm --filter @finishing-touch/api test:e2e --runInBand
```

## Deployment Plan (Later)
### Web (Vercel)
- Deploy `apps/web` to Vercel
- Set env vars in Vercel:
  - `NEXT_PUBLIC_API_URL` -> deployed API URL
  - `NEXTAUTH_URL` -> Vercel domain
  - `NEXTAUTH_SECRET`
  - `NEXT_PUBLIC_CURRENCY_SYMBOL`

### API (Railway / Fly / Render)
- Deploy `apps/api` as a Node service
- Set API env vars (`DATABASE_URL`, `JWT_SECRET`, etc.)
- Run Prisma migrations in deploy pipeline:
  - `pnpm --filter @finishing-touch/api prisma:migrate`
- Optionally set `PUPPETEER_EXECUTABLE_PATH` if host requires custom Chromium path

### Database (Managed PostgreSQL)
- Use managed Postgres (Neon, Supabase, Railway Postgres, Render Postgres, etc.)
- Point API `DATABASE_URL` to managed DB

## Final Verification Checklist
- [x] Monorepo with `apps/web`, `apps/api`, `packages/shared`
- [x] Docker Compose Postgres config
- [x] Prisma schema + seed + migration SQL
- [x] Auth (NextAuth credentials + API JWT/RBAC)
- [x] Shared pricing engine + backend unit tests
- [x] PDF generation via Puppeteer
- [x] Marketing site pages + lead forms
- [x] Admin pages and flows (estimates/invoices/employees/punch/schedule)
- [x] Swagger docs and health checks
- [x] Build passes for web/api/shared (`pnpm build`)

### Local execution caveat in this environment
`docker` is not installed in this execution environment, so DB-backed e2e could not be executed here. On a machine with Docker running, use the commands above and e2e will run against local Postgres.
