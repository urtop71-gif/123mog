# Architecture Overview

## App Structure

123MOG uses the **Next.js 16 App Router** with a mix of server and client components. The dashboard is a **server component** that fetches data directly via Prisma; the meals page is a **client component** that calls REST APIs.

### Page Routes

| Route | Component Type | Purpose |
|-------|---------------|---------|
| `/` | Client | Landing page (login/register CTA) |
| `/login` | Client | Email/password login form |
| `/register` | Client | Registration form |
| `/dashboard` | Server | Daily meal summary, charts, water/weight |
| `/meals` | Client | Search foods, log meals, edit/delete items |
| `/profile` | Client | Edit profile, targets, health conditions |
| `/onboarding` | Client | First-login profile setup |

### API Routes

All routes are under `src/app/api/`. See [API Reference](api/reference.md) for full details.

- `/api/auth/register` — User registration
- `/api/auth/[...nextauth]` — NextAuth handler
- `/api/foods` — Search foods, create custom foods
- `/api/favorites` — Toggle and list favorites
- `/api/meals` — CRUD for meals + items
- `/api/meals/[id]` — Update/delete a meal
- `/api/meals/[id]/items/[itemId]` — Delete single item
- `/api/meals/export` — CSV export
- `/api/meals/stats` — Streak + weekly progress
- `/api/meals/trend` — 7 or 30-day nutrient series
- `/api/user/profile` — Get/update profile + auto-calc macros
- `/api/water` — Water log (get/put)
- `/api/weight` — Weight log (get/put)

## Authentication

- **NextAuth 4** with credentials provider, JWT sessions
- Password hashing via **bcryptjs**
- In-memory rate limiting on login attempts (10 per 10 min per email)
- All API routes verify session via `auth()` helper
- Data isolation: every DB query filters by `userId`
- `src/middleware.ts` (formerly `src/proxy.ts`) — protects routes at edge

Key file: `src/lib/auth.ts` — single `authOptions` export

## Data Layer

- **Prisma 7** + SQLite via `@libsql/client` and `@prisma/adapter-libsql`
- Prisma client singleton at `src/lib/prisma.ts` with resolved DB URL
- Migrations in `prisma/migrations/`
- Seed data: ~317,000+ foods (MFDS + curated menus) in `prisma/seed.ts`

## Component Architecture

### Dashboard (`src/app/dashboard/page.tsx`)
Server component that:
1. Verifies auth and redirects unauthenticated users
2. Redirects to onboarding if profile incomplete
3. Fetches user targets + meals for the selected date
4. Computes **adaptive TDEE** via `computeAdaptiveTdee()` from `src/lib/adaptiveTdee.ts` (requires 7+ days of weight logs + meal data; null otherwise)
5. Renders sub-components via props (no client-side data fetching for the day view)

Sub-components (all in `src/components/dashboard/`):

| Component | Responsibility |
|-----------|---------------|
| `DateNav` | Date picker, copy yesterday, prev/next day |
| `SummaryCards` | Daily totals: calories, protein, fat, carbs, sodium; adaptive TDEE display |
| `MealList` | Meal-type sections with items and health-tag badges |
| `MacroChart` | Donut chart of macro distribution |
| `DayExtras` | Water + weight quick-log widgets |
| `TrendChart` | 7 or 30-day nutrient trend chart |
| `ChartsToggle` | Switch between macro chart and trend chart |

### Meals Page (`src/app/meals/page.tsx`)
Client component with full CRUD:
- Food search with debounce (shared + private custom foods)
- Favorites and recent foods tabs
- Serving unit selection from food's `FoodServing` records
- Health tag badge display per item
- Edit/delete individual items or entire meals
- Copy yesterday's meal

### Shared Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `LangToggle` | `src/components/LangToggle.tsx` | Nav + bottom tab bar + FAB |
| `HealthTagBadges` | `src/components/HealthTagBadges.tsx` | Renders health condition tags |
| `Toast` | `src/components/Toast.tsx` | Toast notification system |
| `RegisterSW` | `src/components/RegisterSW.tsx` | PWA service worker registration |

### Context Providers

| Provider | Location | Purpose |
|----------|----------|---------|
| `ThemeProvider` | `src/lib/ThemeContext.tsx` | Dark mode toggle, persisted to localStorage |
| `LangProvider` | `src/lib/LangContext.tsx` | ko/en i18n, persisted to localStorage |
| `ToastProvider` | `src/components/Toast.tsx` | Toast notification state |

## Key Libraries

### `src/lib/healthTags.ts`
Computes sodium/LDL/sugar estimates from macro values when manual curation is absent. Thresholds:
- **Sodium**: low ≤120 mg, high ≥600 mg per 100g
- **Carbs**: low ≤10 g, high ≥40 g per 100g
- **Fat**: low ≤3 g, high ≥20 g per 100g
- `augmentHealthTags()` fills in missing tags without overwriting curated values

### `src/lib/mealItems.ts`
Looks up each food + serving unit, calculates total nutrition:
```
totalGrams = quantity × gramsPerUnit
totalNutrient = (foodNutrientPer100g / 100) × totalGrams
```
Stores a snapshot on each `MealItem` (denormalized for data stability).

### `src/lib/dates.ts`
Local date helpers to avoid UTC day-shift bugs:
- `toLocalDateKey()` — `yyyy-MM-dd` from local clock
- `parseLocalDateKey()` — parse as local noon
- `localDayRange()` — `{start, end}` for Prisma date queries
- `addDaysToKey()` — arithmetic on local date keys

### `src/lib/validation.ts`
Zod schemas for all API inputs: register, meal CRUD, food create, profile update, water/weight logs, password change.

### `src/lib/rateLimit.ts`
In-memory sliding-window rate limiter. Single-instance only; swap for Redis in multi-instance deployment.

### `src/lib/adaptiveTdee.ts`
Replaces static BMR×activity-multiplier TDEE with a feedback-loop estimate from real weight and calorie data. Algorithm:
- Fetches last 30 days of weight logs + daily calorie intake from meals
- Aligns dates where both weight and intake exist (requires ≥7 overlapping days)
- Computes EMA weight trend (14-day span)
- Back-solves actual TDEE: `avgIntake - (Δweight × 7700 kcal/kg / Δdays)`
- Clamps to [1200, 5000] kcal; confidence: low (<14d), medium (14-20d), high (≥21d)
- `adjustTargets()` recomputes macro targets from adaptive TDEE + goal deficit + macro split
- Returns `null` (falls back to static TDEE) when insufficient data

### `src/lib/foodRanking.ts`
Content-based search result ranking for `/api/foods?q=`. Scores foods on three dimensions:
1. **Macro gap fill** (45%): how well a 150g serving fits remaining daily macro targets
2. **Personal affinity** (35%): frequency × recency (14-day half-life) from meal history + 0.2 boost for favorites
3. **Health compatibility** (20%): penalizes high sodium (hypertension), high carbs (diabetes), high fat (high_cholesterol)

Only applied for logged-in users with a `dailyTarget` set. Results are sorted by score and limited to top 20.

## Git History Summary

Key development phases (from `git log`):
1. **v1** (commit `9f6f87e`): Initial 123MOG diet tracker with MFDS food DB, health tags, i18n
2. **Auth hardening** (commit `f6174cd`): Real middleware, per-user data isolation
3. **Validation + tests** (commit `211eb1f`): Zod schemas, rate limiting, Vitest setup
4. **Meal editing + extras** (commit `1df2187`): Item editing, custom foods, sodium tracking, trends, CSV, dark mode, PWA
5. **Expanded food DB** (commits `b3c39db`-`cb4c2a8`): Fruits, SE Asian, Kaya toast, McDonald's
6. **Health tag expansion** (commits `3199c0a`, `8da71d9`): Sugar/LDL + sodium tags
7. **Final polish** (commit `2cc545b`): Codebase review fixes, water/weight routes, onboarding, favorites API
8. **USDA importer** (commit `559bfea`): USDA FoodData Central importer for basic ingredients
9. **Adaptive TDEE** (commits `f692c31`-`98a5ae5`): Feedback-loop TDEE module + dashboard integration
10. **Smart food ranking** (commit `e434461`): Content-based search ranking (Phase 3)
11. **Subway Singapore** (commits `19aa091`-`a7055f1`): 31-item Subway Singapore nutrition data + import script
