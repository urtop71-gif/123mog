# Development Setup

## Requirements

- **Node.js**: 18+ (tested with 22 in CI)
- **npm**: bundled with Node.js
- No external database server needed — app uses SQLite (zero config)

## First-Time Setup

```bash
# 1. Clone and install
git clone <repo>
cd 123mog
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env:
#   DATABASE_URL="file:./dev.db"
#   NEXTAUTH_SECRET="generate-a-long-random-string"
#   NEXTAUTH_URL="http://localhost:3000"

# 3. Push schema to SQLite
npx prisma db push

# 4. (Optional) Seed food database
npx prisma db seed

# 5. Start development
npm run dev
```

Open http://localhost:3000

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm test` | Run Vitest once |
| `npm run lint` | Run ESLint |
| `npx prisma db push` | Sync schema to SQLite (no migration files) |
| `npx prisma studio` | Open Prisma Studio GUI |
| `npx prisma db seed` | Run seed script |
| `npx tsx <script>` | Run any TypeScript file |

## Testing

Tests use **Vitest** configured in `vitest.config.ts` with the `@` import alias.

Test files are co-located with source:
- `src/lib/validation.test.ts` — Zod schema validation
- `src/lib/healthTags.test.ts` — Health tag computation
- `src/lib/mealItems.test.ts` — Meal item nutrition calculation
- `src/lib/rateLimit.test.ts` — Rate limiter behavior
- `src/lib/dates.test.ts` — Local date helpers

Run all tests:
```bash
npm test
```

Run in watch mode:
```bash
npx vitest
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | `file:./dev.db` | SQLite database path |
| `NEXTAUTH_SECRET` | Yes | — | JWT signing secret |
| `NEXTAUTH_URL` | Yes | — | App URL (e.g., http://localhost:3000) |

## Food Data Import Pipeline

The app has a multi-source food database pipeline:

### Pre-packaged Seed
`prisma/seed.ts` contains ~317,000+ foods bundled directly. Run:
```bash
npx prisma db seed
```

### Additive Import Scripts
These scripts add new foods without affecting existing data (meals, items, or foods). Safe to run on a live DB:

| Script | Source | Foods Added |
|--------|--------|-------------|
| `prisma/import-mfds-foods.ts` | MFDS Korean FDA export (`prisma/data/mfds-import.json`) | ~315k+ items |
| `prisma/import-fruits.ts` | Common fresh fruits | ~50+ items |
| `prisma/import-southeast-asian-foods.ts` | Singapore hawker + SE Asian | ~300+ items |
| `prisma/import-kaya-toast.ts` | Kaya toast variants | ~10+ items |
| `prisma/import-mcdonalds-burgers.ts` | McDonald's burger menu | ~20+ items |
| `prisma/add-mfds-servings.ts` | Adds serving units to MFDS-only foods | — |

Usage:
```bash
npx tsx prisma/import-fruits.ts
```

### Data Fetch Scripts
Raw food data tooling lives in `scripts/`:
- `fetch-foods.js` / `fetch-usda.js` / `fetch-sg-foods.js` — Node.js data collectors
- `fetch_usda.py` / `parse_mfds.py` — Python data processors
- `precise_tag.py` — Health tag curation assistant
- `generated-seed.ts` — Alternative seed generator

## Database Migrations

Because SQLite is used with `prisma db push`, there is no traditional migration workflow. Migration files exist in `prisma/migrations/` for schema history but the primary dev workflow is:
```bash
# After schema changes:
npx prisma db push   # syncs the database to the current schema
```

For schema changes that need to be applied to production, run `prisma migrate dev` (switch to PostgreSQL/MySQL first).

## CI / Automation

A scheduled GitHub Action (`.github/workflows/openwiki-update.yml`) runs daily to refresh OpenWiki documentation. It uses:
- `OPENROUTER_API_KEY` (from secrets) for LLM access
- `OPENWIKI_MODEL_ID`: `z-ai/glm-5.2`
- Creates a PR with wiki updates via `peter-evans/create-pull-request`

## Architecture Notes for Developers

See [Architecture Overview](architecture/overview.md) and [Data Models](data-models/schema.md) for detailed guidance.

### Key Constraints When Adding Features

1. **New API routes**: Add Zod schema in `src/lib/validation.ts`, route handler in `src/app/api/`, wire up `auth()` for session check
2. **New DB fields**: Update `prisma/schema.prisma`, run `prisma db push`, update seed import scripts if needed
3. **New i18n strings**: Add to both `ko` and `en` in `src/lib/i18n.ts`
4. **New health tags**: Add threshold constants and functions in `src/lib/healthTags.ts`, update `augmentHealthTags` logic
5. **New dashboard widgets**: Create component in `src/components/dashboard/`, import into `src/app/dashboard/page.tsx`
6. **New food imports**: Create an additive import script in `prisma/` following the existing pattern

### Common Pitfalls

- **Date handling**: Always use `src/lib/dates.ts` helpers. UTC-based date handling will cause off-by-one day bugs for users near midnight
- **Custom food access**: When querying foods visible to a user, use `{ OR: [{ userId: null }, { userId }] }`
- **Meal item mutation**: When replacing items, wrap delete+create in `$transaction` for atomicity
- **Rate limiting**: In-memory, single-instance only. In multi-instance deployment, swap for Redis
- **Prisma adapter**: Uses `@prisma/adapter-libsql` for SQLite. If switching DB providers, change the adapter and datasource
