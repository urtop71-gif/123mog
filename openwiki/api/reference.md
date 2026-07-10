# API Reference

All API routes are under `src/app/api/`. Uses Next.js Route Handlers.

## Authentication & Authorization

- All routes (except register/login) call `auth()` from `src/lib/auth.ts`
- Returns `401` if no valid session
- Data is isolated by `userId` — every query filters by the session user
- Custom food access: user can see their own custom foods + shared (`userId: null`) foods
- Meal ownership verified before mutations

## Common Patterns

- **Input validation**: Zod schemas from `src/lib/validation.ts` via `safeParse()`
- **Error responses**: `{ error: string }` with appropriate HTTP status
- **Helper functions**: `unauthorized()`, `forbidden()`, `tooMany()`, `jsonError()` from `src/lib/apiErrors.ts`

---

## Auth

### `POST /api/auth/register`

Register a new user.

**Body**:
```json
{
  "email": "user@example.com",
  "password": "mypassword1",
  "name": "User Name"
}
```

**Validated by**: `registerSchema` — email format, password min 8 chars + letter + number

**Response**: `201` on success, `400` on validation error, `409` if email exists

### `POST /api/auth/[...nextauth]`

NextAuth credentials login handler. Uses `authOptions` from `src/lib/auth.ts`.

---

## Foods

### `GET /api/foods?q=<search>&recent=1&favorites=1`

Search foods or list recent/favorites.

| Param | Type | Description |
|-------|------|-------------|
| `q` | string | Search query (name or nameEn contains) |
| `recent` | `1` | Returns last 12 distinct foods used by the user |
| `favorites` | `1` | Returns last 30 favorited foods |
| (none) | | Returns up to 20 matching foods |

**Response**: Array of `Food` objects with `servings[]` and augmented `healthTags`

### `POST /api/foods`

Create a custom food.

**Body**:
```json
{
  "name": "My Custom Food",
  "category": "general",
  "caloriesPer100g": 150,
  "proteinPer100g": 10,
  "fatPer100g": 5,
  "carbsPer100g": 20,
  "servings": [{ "unitName": "g", "gramsPerUnit": 1 }]
}
```

**Validated by**: `foodCreateSchema`

---

## Meals

### `GET /api/meals?date=<yyyy-MM-dd>`

Get all meals for a specific date.

**Response**: Array of meal objects with items, each item includes computed `healthTags`

### `POST /api/meals`

Create a meal with items.

**Body**:
```json
{
  "mealType": "lunch",
  "date": "2026-07-08",
  "items": [
    { "foodId": "abc123", "quantity": 1, "unitName": "공기" }
  ]
}
```

**Validated by**: `mealCreateSchema` — min 1 item, valid meal type, positive quantity

**Response**: Created meal with items (201)

### `PUT /api/meals/[id]`

Update meal type, date, and/or replace all items.

**Body** (all fields optional):
```json
{
  "mealType": "dinner",
  "date": "2026-07-09",
  "items": [{ "foodId": "def456", "quantity": 2, "unitName": "g" }]
}
```

**Notes**:
- If `items` is provided, **all existing items are deleted** and replaced (inside `$transaction`)
- Meal ownership verified: returns 403 if another user's meal

### `DELETE /api/meals/[id]`

Delete an entire meal and all its items (cascade).

### `DELETE /api/meals/[id]/items/[itemId]`

Delete a single meal item. Verifies both meal ownership and item-belonging-to-meal.

---

## Meal Aggregations

### `GET /api/meals/stats`

Compute streak and weekly progress.

**Response**:
```json
{
  "streak": 5,
  "weekDaysLogged": 5,
  "weekDaysOnTarget": 3,
  "dailyTarget": 2000,
  "healthConditions": "diabetes,hypertension"
}
```

- **streak**: Consecutive days (up to 60) with at least one meal logged
- **weekDaysOnTarget**: Days in last 7 where total calories ≤ target × 1.05

### `GET /api/meals/trend?range=week|month`

7-day or 30-day daily nutrient series.

**Response**:
```json
[
  { "date": "2026-07-01", "calories": 1800, "protein": 80, "fat": 50, "carbs": 200 },
  ...
]
```

### `GET /api/meals/export`

CSV export of all user's meals. Includes BOM (`\uFEFF`) for Korean Excel compatibility.

**Headers**: `Content-Type: text/csv; charset=utf-8`, `Content-Disposition: attachment; filename="123mog-meals.csv"`

**Columns**: date, mealType, food, quantity, unit, calories, protein_g, fat_g, carbs_g, sodium_mg

---

## Favorites

### `GET /api/favorites`

List all user's favorite foods (with servings).

### `POST /api/favorites`

Add a food to favorites. Idempotent (upserts).

**Body**: `{ "foodId": "abc123" }`

**Access control**: Can only favorite shared foods or own custom foods.

### `DELETE /api/favorites?foodId=abc123`

Remove a food from favorites.

---

## User Profile

### `GET /api/user/profile`

Get current user's full profile.

**Response**: All profile fields including BMR, TDEE, targets, health conditions

### `PUT /api/user/profile`

Update profile fields. Auto-recalculates BMR/TDEE/macros when body metrics change (unless `targetsManual` is true).

**Sodium target logic**:
- Hypertension condition → 2000 mg target
- Otherwise → 2300 mg target

**Validated by**: `profileUpdateSchema`

---

## Water

### `GET /api/water?date=<yyyy-MM-dd>`

Get water log for a date.

**Response**: `{ date, ml, targetMl }`

### `PUT /api/water`

Upsert water log.

**Body**:
```json
{
  "date": "2026-07-08",
  "ml": 1500,
  "deltaMl": 250
}
```

Either `ml` (absolute) or `deltaMl` (increment) is used. `deltaMl` is clamped to prevent negative totals.

---

## Weight

### `GET /api/weight?limit=30`

Get weight logs (up to 90, default 30), newest first.

### `PUT /api/weight`

Upsert weight log.

**Body**:
```json
{
  "date": "2026-07-08",
  "weight": 72.5
}
```

If date is today, syncs `weight` on the User profile.

---

## Route File Map

| Route File | Path |
|------------|------|
| Auth register | `src/app/api/auth/register/route.ts` |
| NextAuth handler | `src/app/api/auth/[...nextauth]/route.ts` |
| Foods | `src/app/api/foods/route.ts` |
| Favorites | `src/app/api/favorites/route.ts` |
| Meals CRUD | `src/app/api/meals/route.ts` |
| Meal by ID | `src/app/api/meals/[id]/route.ts` |
| Meal item delete | `src/app/api/meals/[id]/items/[itemId]/route.ts` |
| CSV export | `src/app/api/meals/export/route.ts` |
| Meal stats | `src/app/api/meals/stats/route.ts` |
| Meal trend | `src/app/api/meals/trend/route.ts` |
| User profile | `src/app/api/user/profile/route.ts` |
| Water | `src/app/api/water/route.ts` |
| Weight | `src/app/api/weight/route.ts` |
