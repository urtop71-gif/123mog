# Food data ops (123MOG)

## Critical rule

**Merging code ≠ production food DB update.**

Vercel deploys the Next.js app only. Food rows live in **Turso (libsql)** via `DATABASE_URL`.  
Any new `prisma/import-*.ts`, `prisma/seed-foods.ts`, or JSON under `prisma/data/` must be **run as a script** against that database after merge.

| Step | What happens |
|------|----------------|
| PR merge / `git push` master | Code on GitHub + Vercel redeploy |
| `npx tsx prisma/import-….ts` (with prod `DATABASE_URL`) | Rows appear in search / meals |
| Skip the script | UI “works” but food is missing (this bit us on PR #8) |

## Prerequisites

`.env` (local) or shell env:

```bash
DATABASE_URL="libsql://…turso.io?authToken=…"
```

Confirm target before running (scripts print a redacted URL when they start, or check `.env`):

```bash
# Windows Git Bash / macOS / Linux
grep '^DATABASE_URL=' .env | sed 's/authToken=[^&]*/authToken=***/'
```

- Local file DB: `file:./dev.db` — **not** production.
- Production: `libsql://123mog-….turso.io?authToken=…`

## npm scripts

```bash
npm run db:import:basic     # raw veg + protein staples (import-basic-ingredients.ts)
npm run db:import:branded   # USDA / Subway / Starbucks / GYG (seed-foods.ts)
npm run db:seed             # FULL wipe + reseed from prisma/seed.ts  ⚠️ DESTRUCTIVE
npm run db:verify:basic     # check that basic staples exist in current DATABASE_URL
```

Or call scripts directly:

```bash
npx tsx prisma/import-basic-ingredients.ts
npx tsx prisma/seed-foods.ts
npx tsx prisma/import-fruits.ts   # etc. — any additive import-*.ts
```

## Post-merge checklist (food data PR)

Use this every time a PR touches food catalogs or import scripts.

- [ ] PR only adds **additive** import (uses `importUtils.importFoods` or skip-if-exists logic)
- [ ] Does **not** call `deleteMany` on Food / Meal (unless intentional wipe)
- [ ] Merged to `master` (or target branch)
- [ ] Local `.env` `DATABASE_URL` points at **production Turso** (not `file:./dev.db`)
- [ ] Ran the matching import command(s) against that URL
- [ ] Ran `npm run db:verify:basic` (or spot-checked search: e.g. `토마토`, `닭가슴살`)
- [ ] Checked prod app: [https://123mog.vercel.app](https://123mog.vercel.app) meal search finds the new names
- [ ] PR description notes: **“Requires post-merge: `npm run db:import:…`”**

## Which script when?

| Data | Script | Notes |
|------|--------|--------|
| Raw staples (토마토, 닭가슴살, …) | `npm run db:import:basic` | Additive, safe re-run |
| USDA / Subway / Starbucks / GYG JSON | `npm run db:import:branded` | Skips existing names |
| One-off menus (coffee, milk, fruits, …) | `npx tsx prisma/import-<name>.ts` | All use `importUtils` |
| Schema change | `npx tsx prisma/deploy-migrations-remote.ts` | Separate from food rows |
| Nuclear reset of food catalog | `npm run db:seed` | **Deletes meals/foods** — never on prod casually |

## Safety

- Additive imports: skip by **global** `Food.name` where `userId` is null — safe to re-run.
- `prisma/seed.ts` (`db:seed`): deletes meals + foods then inserts seed catalog — **do not run on prod** unless you mean to wipe.
- Custom user foods (`isCustom: true`, `userId` set) are not created by these scripts.
- Do not commit `.env` or `*.db`.

## Agent / Claude Code note

If you add foods in code, your job is incomplete until:

1. Import script (or seed-foods JSON) is committed, **and**
2. You tell the human to run the import against prod, **or** run it yourself when `DATABASE_URL` is the prod Turso URL.

See also `AGENTS.md` → **Food data**.
