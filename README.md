# 123MOG — Diet Tracker

Next.js 16 diet & nutrition tracker with Korean / English UI, food DB (MFDS + common menus), macros, health-condition tags, water/weight logs, and PWA shell.

## Stack

- **Next.js 16** (App Router) + React 19 + TypeScript
- **Prisma 7** + SQLite (`@libsql` adapter)
- **NextAuth** credentials (JWT)
- **Tailwind CSS 4** + Chart.js
- **Vitest** unit tests

## Setup

```bash
npm install
cp .env.example .env   # or create .env manually
# .env needs at least:
#   DATABASE_URL="file:./dev.db"
#   NEXTAUTH_SECRET="generate-a-long-random-string"
#   NEXTAUTH_URL="http://localhost:3000"

npx prisma db push
npx prisma db seed    # optional: load food catalog (see package.json prisma.seed)
npm run dev
```

Open http://localhost:3000

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server |
| `npm run build` / `start` | Production |
| `npm test` | Vitest |
| `npm run lint` | ESLint |
| `npx prisma db push` | Sync schema to SQLite |
| `npx prisma studio` | Browse DB |

## Features

- Meal logging (breakfast / lunch / dinner / snack) with serving units
- Shared food DB + custom foods (visible to every signed-in user; only the owner can edit or delete them)
- Favorites, recent foods, copy yesterday’s meal
- BMR/TDEE targets, manual target override, health conditions
- Sodium / LDL / blood-sugar **estimate tags** (not medical advice)
- Water + weight logs, streak & weekly progress
- CSV export, dark mode, ko/en i18n, mobile bottom tabs + FAB
- Onboarding after first login when profile incomplete

## Project layout

```
src/app/           # pages + API routes
src/components/    # UI
src/lib/           # auth, prisma, validation, i18n, dates, healthTags
prisma/            # schema, seed, imports
```

## Notes

- Dates are **yyyy-MM-dd keys in the user's timezone** (`User.timezone`, default `Asia/Singapore`). Server code must pass that zone into `src/lib/dates.ts`. The runtime zone on Vercel is UTC, so "today" is never taken from the server clock alone.
- `npm run db:seed` only inserts missing global foods. It does not delete meals or custom foods. A remote `DATABASE_URL` (Turso / `libsql://`) is refused unless `SEED_ALLOW_REMOTE=1`.
- In-memory rate limiting is for single-instance deploys only.
- SQLite is fine for personal/local use; swap `DATABASE_URL` / adapter for production multi-user.
- Health tags for fat/carbs/sodium are heuristics — UI shows a disclaimer.

## License

Private / personal project.
