# AutoTrack CRM

Next.js App Router application with Prisma and PostgreSQL. The server database is the source of truth; browser `localStorage` is only a local UI cache.

## Requirements
- Node.js 22 or newer
- A PostgreSQL database (Supabase PostgreSQL is supported)
- A unique `JWT_SECRET` of at least 32 characters
- A separate `BOOTSTRAP_SECRET` for the initial admin bootstrap endpoint

## Setup
1. Create an empty PostgreSQL database or choose the existing AutoTrack database.
2. Copy `.env.example` to `.env` and fill in the real `DATABASE_URL`, `JWT_SECRET`, and `BOOTSTRAP_SECRET`.
3. Install packages: `npm install` (or `yarn install`).
4. Generate Prisma Client: `npm run db:generate`.
5. Apply the tracked schema migration: `npm run db:deploy`.
6. Start locally: `npm run dev`; open `http://localhost:3000`.

`prisma/migrations/20261023000000_initial_schema/migration.sql` creates the current schema for a fresh database and safely adds the new permission-policy fields/table when the prior AutoTrack schema already exists. Before production use, take a database backup and inspect the migration against a staging database. Existing duplicate registration numbers must be cleaned before a unique registration-number constraint can be established.

## Useful scripts
- `npm run dev` — local development
- `npm run build` — production compilation
- `npm run start` — serve a production build
- `npm run db:generate` — regenerate Prisma Client
- `npm run db:migrate` — create/apply a development migration
- `npm run db:deploy` — apply reviewed migrations in deployment
- `npm run db:studio` — open Prisma Studio

Do not run `db:migrate` against production. Use `db:deploy` after reviewing and testing migration files.

## Main routes
- `/login`, `/register`, `/dashboard`
- `/api/auth/login`, `/api/auth/me`, `/api/auth/logout`, `/api/auth/register`
- `/api/users`, `/api/permissions`
- `/api/records`, `/api/records/[id]`
- `/api/audit-logs`, `/api/status-logs`
- `/api/job-cards`, `/api/job-cards/[id]`

## Security notes
- Passwords are bcrypt-hashed; the previous password cannot be displayed or recovered. Admins can reset a user's password.
- Agent field-level permissions are enforced in both the UI and record mutation API.
- Never commit `.env`, real database credentials, JWT secrets, or bootstrap secrets. Rotate any credentials that were included in previously shared archives.
- Before production, verify login rate limiting, backups/restore, user role review, and authorization behavior against a real database.
