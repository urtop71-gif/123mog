# 123MOG agent notes

## Conventions

- Prefer local date keys via `src/lib/dates.ts` (`toLocalDateKey`, `localDayRange`, `parseLocalDateKey`). Never use `toISOString().split('T')[0]` for "today".
- Auth: single `authOptions` in `src/lib/auth.ts`. NextAuth route re-exports only. Use `auth()` for API/session checks.
- Custom foods must set `userId` + `isCustom: true`. Shared foods keep `userId: null`.
- Custom food ids are intentionally shareable: list/search only shows own customs + global foods, but any valid food id (including another user's custom) may be used when logging a meal via `computeMealItems` — do not add ownership checks that block that.
- Meal mutations that replace items use Prisma `$transaction`.
- i18n: all user-visible strings go through `src/lib/i18n.ts` + `useT()`.
- Health tags: use `HealthTagBadges` component; `augmentHealthTags` must not duplicate sodium_/sugar_/ldl_ prefixes. Never surface `*_neutral` tags (good/bad only).
- Forms: use shared CSS classes `.input-field`, `.btn-primary`, `.card` from `globals.css`.
- Password policy: min 8, letter + number (Zod in `validation.ts`).

## Food data (read this before adding foods)

- Shared catalog foods are **not** applied by Vercel deploy. Code merge only ships scripts/JSON; rows must be inserted into Turso via a local script with prod `DATABASE_URL`.
- Prefer additive scripts (`importUtils.importFoods` or skip-if-exists). Never use `prisma/seed.ts` on production casually — it wipes meals/foods.
- After adding or changing an import script / `prisma/data/*`:
  1. Commit the script/data.
  2. Run the import against **prod** Turso (`.env` `DATABASE_URL=libsql://…`).
  3. Verify: `npm run db:verify:basic` and/or search the new names on https://123mog.vercel.app
  4. PR description must say: **Requires post-merge import: `npm run db:import:…`**
- Common commands: `npm run db:import:basic`, `npm run db:import:branded`. Full checklist: `docs/FOOD_DATA.md`.

## Do not

- Duplicate NextAuth config in the route handler.
- Store custom foods as global without `userId`.
- Commit `.env` or `*.db`.
- Assume production food DB updates when only the import script is merged (deploy ≠ seed).

## Tests

```bash
npm test
```

Unit coverage: validation, healthTags, mealItems, rateLimit, dates, foodLabel.
