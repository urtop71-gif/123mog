# 123MOG agent notes

## Conventions

- Prefer local date keys via `src/lib/dates.ts` (`toLocalDateKey`, `localDayRange`, `parseLocalDateKey`). Never use `toISOString().split('T')[0]` for "today".
- Auth: single `authOptions` in `src/lib/auth.ts`. NextAuth route re-exports only. Use `auth()` for API/session checks.
- Custom foods must set `userId` + `isCustom: true`. Shared foods keep `userId: null`.
- Custom food ids are intentionally shareable: list/search only shows own customs + global foods, but any valid food id (including another user's custom) may be used when logging a meal via `computeMealItems` — do not add ownership checks that block that.
- Meal mutations that replace items use Prisma `$transaction`.
- i18n: all user-visible strings go through `src/lib/i18n.ts` + `useT()`.
- Health tags: use `HealthTagBadges` component; `augmentHealthTags` must not duplicate sodium_/sugar_/ldl_ prefixes.
- Forms: use shared CSS classes `.input-field`, `.btn-primary`, `.card` from `globals.css`.
- Password policy: min 8, letter + number (Zod in `validation.ts`).

## Do not

- Duplicate NextAuth config in the route handler.
- Store custom foods as global without `userId`.
- Commit `.env` or `*.db`.

## Tests

```bash
npm test
```

Unit coverage: validation, healthTags, mealItems, rateLimit, dates.
