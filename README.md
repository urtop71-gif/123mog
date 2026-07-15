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
| `npm run db:import:basic` | Additive: raw veg + protein staples → current `DATABASE_URL` |
| `npm run db:import:branded` | Additive: USDA/Subway/Starbucks/GYG → current `DATABASE_URL` |
| `npm run db:verify:basic` | Assert staples exist in current DB |
| `npm run db:seed` | **Destructive** full reseed (`prisma/seed.ts`) — not for casual prod use |

## Food data & production

Production app: **https://123mog.vercel.app**  
Production DB: Turso (`DATABASE_URL=libsql://…` in Vercel + local `.env`).

**Deploy does not insert food rows.** After merging any food import/seed change, run the import against prod Turso, then verify:

```bash
# .env must point at Turso, not file:./dev.db
npm run db:import:basic    # or db:import:branded / npx tsx prisma/import-….ts
npm run db:verify:basic
```

Full checklist and script map: **[docs/FOOD_DATA.md](docs/FOOD_DATA.md)**.

## Features

- Meal logging (breakfast / lunch / dinner / snack) with serving units
- Shared food DB + **private custom foods** per user
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

- Dates are handled as **local yyyy-MM-dd** keys (see `src/lib/dates.ts`) to avoid UTC day shifts.
- In-memory rate limiting is for single-instance deploys only.
- SQLite is fine for personal/local use; swap `DATABASE_URL` / adapter for production multi-user.
- Health tags for fat/carbs/sodium are heuristics — UI shows a disclaimer.

## License

Private / personal project.
