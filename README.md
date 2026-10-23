# AutoTrack CRM — Next.js + Prisma + PostgreSQL

## Architecture
- Next.js App Router UI and API routes.
- `src/context/AppContext.tsx` is the client-side API gateway for authentication, registration, records, users, job cards, permissions and audit history. UI components call context methods instead of calling API endpoints directly.
- API route handlers authenticate the signed HTTP-only `token` cookie and enforce role/record permissions on the server.
- `src/proxy.ts` uses the Next.js 16 Proxy convention to redirect unauthenticated dashboard requests and signed-in users away from login/register pages. Proxy is a navigation guard only; route handlers still verify authorization themselves.
- PostgreSQL is the source of truth. Local storage is a display cache only and is never used to authenticate a session.

## Setup
1. Install Node.js 22 or newer.
2. Copy `.env.example` to `.env`.
3. Configure `DATABASE_URL`, `JWT_SECRET` (32+ characters, random) and a different `BOOTSTRAP_SECRET`.
4. Install dependencies: `npm install`
5. Generate Prisma Client: `npm run db:generate`
6. On a **development database**, create/review the first migration: `npx prisma migrate dev --name init`
7. Start locally: `npm run dev`

For production, commit and review migration files first, then deploy with `npm run db:deploy`. Do not use `migrate dev` against a production database.

## Relevant API routes
- `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`, `POST /api/auth/register`
- `GET/POST/PATCH/DELETE /api/users`
- `GET/POST /api/records` and `GET/PUT/DELETE /api/records/[id]`
- `/api/permissions`, `/api/audit-logs`, `/api/status-logs`
- `/api/job-cards` and `/api/job-cards/[id]`

## Responsive behavior
- The profile dropdown is centered and constrained to the viewport on narrow devices.
- Full-screen modals are centered and limited to the usable viewport with internal scrolling; the layout supports screens down to 320px.
- City filtering is a highlighted free-text field and matches partial city names.
- Vehicle `Make` is a plain free-text field, without a fixed datalist.

## Security
- `.env` and `.env.local` must never be committed or shared. The supplied clean ZIP excludes `.env` and `.git`.
- Rotate any database password and JWT/bootstrap secrets that were present in an earlier uploaded archive.
- Existing password hashes cannot be reversed to recover a current password. Use the admin password reset endpoint.
- Perform an end-to-end build and test against a development PostgreSQL database before deploying.
