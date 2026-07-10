# Data Models

All models are defined in `prisma/schema.prisma` with SQLite as the provider. The schema uses Prisma 7 syntax with `@prisma/adapter-libsql`.

## Entity Relationship Diagram (Text)

```
User ──1:N──> Meal ──1:N──> MealItem ──N:1──> Food
User ──1:N──> Food               (custom foods: userId set, isCustom: true)
User ──1:N──> FavoriteFood ──N:1──> Food
User ──1:N──> WeightLog
User ──1:N──> WaterLog
Food ──1:N──> FoodServing
```

## User

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (cuid) | Primary key |
| `email` | String @unique | Lowercase, trimmed on registration |
| `password` | String | bcrypt hashed |
| `name` | String? | Optional display name |
| `age` | Int? | For BMR calculation |
| `gender` | String? | `male` or `female` |
| `height` | Float? | cm |
| `weight` | Float? | kg |
| `goalWeight` | Float? | kg |
| `activityLevel` | String? | `sedentary`, `light`, `moderate`, `active`, `very_active` |
| `bmr` | Float? | Auto-calculated |
| `tdee` | Float? | Auto-calculated |
| `dailyTarget` | Float? | Target calories (auto or manual) |
| `proteinTarget` | Float? | g |
| `fatTarget` | Float? | g |
| `carbsTarget` | Float? | g |
| `sodiumTarget` | Float? | mg |
| `targetsManual` | Boolean | If true, skip auto macro recalculation |
| `waterTargetMl` | Int | Default 2000 |
| `healthConditions` | String? | Comma-separated: `diabetes`, `high_cholesterol`, `hypertension` |
| `onboardingDone` | Boolean | Default false |
| `createdAt` | DateTime | Auto |
| `updatedAt` | DateTime | Auto |

**Relations**: meals[], customFoods[], favorites[], weightLogs[], waterLogs[]

## Food

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (cuid) | Primary key |
| `name` | String | Korean name |
| `nameEn` | String? | English name |
| `category` | String | `korean`, `japanese`, `western`, `seasian`, `singapore`, `general` |
| `subcategory` | String? | `soup`, `rice`, `meat`, `side`, `noodle`, etc. |
| `caloriesPer100g` | Float | kcal |
| `proteinPer100g` | Float | g |
| `fatPer100g` | Float | g |
| `carbsPer100g` | Float | g |
| `sodiumPer100g` | Float? | mg; null if unknown |
| `healthTags` | String? | Comma-separated: `ldl_good`, `ldl_bad`, `sugar_good`, `sugar_bad`, `sodium_good`, `sodium_bad`, etc. Auto-computed neutral tags are suppressed (only good/bad shown). |
| `userId` | String? | Null = shared global food; set = private custom food |
| `isCustom` | Boolean | Default false |

**Indexes**: `name`, `nameEn`, `userId`

**Relations**: servings[], mealItems[], favorites[]

**Key rule**: Custom foods must set both `userId` and `isCustom: true`. Shared foods keep `userId: null`.

## FoodServing

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (cuid) | Primary key |
| `foodId` | String | FK -> Food |
| `unitName` | String | e.g., 공기, 그릇, 접시, 개, 조각, 인분, 소, 중, 대, g, ml |
| `gramsPerUnit` | Float | Conversion factor |

**Index**: `foodId`

## Meal

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (cuid) | Primary key |
| `userId` | String | FK -> User |
| `date` | DateTime | Stored as UTC; queried via local day range |
| `mealType` | String | `breakfast`, `lunch`, `dinner`, `snack` |
| `createdAt` | DateTime | Auto |

**Indexes**: `[userId, date]`, `[userId, mealType]`

**Relations**: items[]

## MealItem

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (cuid) | Primary key |
| `mealId` | String | FK -> Meal |
| `foodId` | String | FK -> Food |
| `quantity` | Float | e.g., 1.5 |
| `unitName` | String | Snapshot of chosen serving unit |
| `gramsPerUnit` | Float | Snapshot of serving conversion |
| `totalGrams` | Float | `quantity * gramsPerUnit` |
| `totalCalories` | Float | Computed snapshot |
| `totalProtein` | Float | Computed snapshot |
| `totalFat` | Float | Computed snapshot |
| `totalCarbs` | Float | Computed snapshot |
| `totalSodium` | Float? | mg; null if food's sodium is unknown |

**Indexes**: `mealId`, `foodId`

Nutrition is computed by `computeMealItems()` in `src/lib/mealItems.ts` and stored denormalized for data stability (the food's nutrition values or serving units may change later).

## FavoriteFood

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (cuid) | Primary key |
| `userId` | String | FK -> User |
| `foodId` | String | FK -> Food |
| `createdAt` | DateTime | Auto |

**Unique constraint**: `[userId, foodId]` — one favorite per food per user

## WeightLog

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (cuid) | Primary key |
| `userId` | String | FK -> User |
| `date` | String | `yyyy-MM-dd` local date key |
| `weight` | Float | kg |
| `createdAt` | DateTime | Auto |

**Unique constraint**: `[userId, date]` — one log per day

When logging today's weight, the profile `weight` field is synced automatically.

## WaterLog

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (cuid) | Primary key |
| `userId` | String | FK -> User |
| `date` | String | `yyyy-MM-dd` local date key |
| `ml` | Int | Total ml for the day |
| `updatedAt` | DateTime | Auto |

**Unique constraint**: `[userId, date]` — upserted daily

## Design Decisions

1. **Denormalized MealItem snapshots**: Nutrition values are computed at log time and stored on the item. This means editing a food's base data won't retroactively change past meal logs — data stays consistent with what the user actually logged.

2. **Local date keys**: `WaterLog.date` and `WeightLog.date` use `yyyy-MM-dd` strings (via `src/lib/dates.ts` helpers) rather than datetime columns, avoiding UTC timezone shift issues. Meal dates are stored as `DateTime` but always queried using `localDayRange()`.

3. **Comma-separated health tags**: Using a simple string instead of a join table for food health tags. Parsed/split at read time. Keeps the schema simple at the cost of some query flexibility.

4. **SQLite**: Chosen for zero-config local/personal use. The schema is simple enough that swapping to PostgreSQL/MySQL requires only changing the datasource provider and adapter.
