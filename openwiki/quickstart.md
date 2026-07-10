# 123MOG — Diet Tracker

## Overview

123MOG is a Next.js 16 nutrition and diet tracking app with Korean/English UI. It helps users log meals against a large shared food database (MFDS + common Korean, Japanese, Western, Southeast Asian, and Singapore menus), track macros/sodium, compute health-condition tags, and monitor water and weight.

**Key features:**
- Meal logging (breakfast / lunch / dinner / snack) with serving-unit selection
- Shared food DB (~317,000+ MFDS items from the Korean FDA + ~3,800 curated/branded items including Subway, Starbucks, Guzman Y Gomez) and private custom foods per user
- Favorites, recent foods, copy yesterday's meal
- BMR/TDEE auto-calculation with manual target override
- Health-condition tags (sodium, LDL, blood-sugar estimates) — not medical advice
- Water + weight tracking with streak and weekly goal progress
- CSV export, dark mode, PWA shell, mobile bottom tabs + FAB
- Onboarding flow after first login when profile is incomplete
- Rate-limited auth, Zod validation, Prisma $transaction for meal mutations

## Quick Links

| Page | Description |
|------|-------------|
| [Architecture Overview](architecture/overview.md) | App routing, auth, DB, pages, component tree |
| [Data Models](data-models/schema.md) | Prisma schema: User, Food, Meal, MealItem, WaterLog, WeightLog |
| [API Reference](api/reference.md) | All REST endpoints, request/response shapes, auth |
| [Development Setup](development/setup.md) | Local setup, scripts, tests, data import pipeline |

## Getting Started

```bash
npm install
cp .env.example .env   # configure DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL
npx prisma db push
npx prisma db seed     # optional: loads food catalog (~317k MFDS + ~3.8k curated/branded)
npm run dev
```

Open http://localhost:3000

## Quick Reference

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development server |
| `npm run build` / `start` | Production build |
| `npm test` | Vitest unit tests |
| `npm run lint` | ESLint |
| `npx prisma db push` | Sync schema to SQLite |
| `npx prisma studio` | Browse database |
| `npx tsx prisma/import-*.ts` | Additive food data imports |

## Tech Stack

- **Next.js 16** (App Router) + React 19 + TypeScript
- **Prisma 7** + SQLite (`@libsql`/`@prisma/adapter-libsql`)
- **NextAuth 4** credentials provider (JWT)
- **Tailwind CSS 4** + Chart.js / react-chartjs-2
- **Zod 4** for input validation
- **bcryptjs** + in-memory rate limiting for auth
- **Vitest** unit tests
- **date-fns** for date utilities

## Project Layout

```
src/
  app/           # Pages and API routes (App Router)
    api/         # Route handlers
    dashboard/   # Main dashboard (server component)
    meals/       # Meal logging page (client component)
    login/       # Login page
    register/    # Registration page
    profile/     # User profile settings
    onboarding/  # First-login onboarding
  components/    # UI components
    dashboard/   # Dashboard-specific components
  lib/           # Shared logic
    auth.ts      # NextAuth config
    prisma.ts    # Prisma client singleton
    i18n.ts      # ko/en translations
    validation.ts # Zod schemas
    healthTags.ts # Computed food tags
    mealItems.ts # Nutrition calculation engine
    adaptiveTdee.ts # Feedback-loop TDEE from weight + meal history
    foodRanking.ts # Content-based food search ranking
    dates.ts     # Local date key helpers
    rateLimit.ts # In-memory sliding-window limiter
prisma/
  schema.prisma  # Data model
  seed.ts        # Seed food data
  data/          # MFDS import JSON
  import-*.ts    # Additive food import scripts
scripts/         # Food DB fetch/parse tools (JS/Python)
```

## Key Conventions

Refer to `AGENTS.md` for full agent notes. Key rules:

- **Dates**: Use `src/lib/dates.ts` helpers (`toLocalDateKey`, `localDayRange`, `parseLocalDateKey`) — never `toISOString().split('T')[0]`
- **Auth**: Single `authOptions` in `src/lib/auth.ts`; use `auth()` for session checks in API/server components
- **Custom foods**: Must set `userId` + `isCustom: true`; shared foods keep `userId: null`
- **Meal mutations**: Use Prisma `$transaction` when replacing items
- **i18n**: All user-visible strings through `src/lib/i18n.ts` + `useT()` hook
- **Health tags**: Use `HealthTagBadges` component; `augmentHealthTags` never duplicates existing prefixes
- **Forms**: Shared CSS classes `.input-field`, `.btn-primary`, `.card` from `globals.css`
- **Password**: Min 8 chars, must include letter + number (Zod in `validation.ts`)

## Agent Maintenance Notes

- The scheduled GitHub Action (`.github/workflows/openwiki-update.yml`) refreshes this wiki daily via OpenWiki
- Do not hand-edit generated OpenWiki pages unless explicitly asked
- When adding new API routes, update both the route handler and this wiki
- Tests live alongside source: `src/lib/*.test.ts`, run via `npm test`
andler and this wiki
- Tests live alongside source: `src/lib/*.test.ts`, run via `npm test`
