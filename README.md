# AutoTrack EMI Management (Next.js)

Next.js 16 (App Router) version of the original Vite + React app.

## Run

```bash
npm install
cp .env.example .env.local   # then set JWT_SECRET
npm run dev                  # http://localhost:3000
npm run build && npm start   # production
```

## Routes

| Route        | What                                                          |
| ------------ | ------------------------------------------------------------- |
| `/`          | redirects to `/dashboard`                                     |
| `/login`     | login screen (redirects to `/dashboard` if already signed in) |
| `/dashboard` | spreadsheet, team and audit-log tabs (redirects to `/login` if signed out) |

API (`src/app/api/*`): `auth/login`, `auth/me`, `auth/logout`, `users`, `records`, `records/[id]` (PUT/DELETE), `audit-logs`, `admin/create`.
They store data in `database.json` in the project root (created and seeded on first request).

## Note

The UI still keeps its data in browser localStorage (as in the original app); it does not call the API routes yet.
