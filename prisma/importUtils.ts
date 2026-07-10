// Shared setup + create-if-not-exists helper for the additive one-off data
// import scripts in this folder (import-*.ts, add-mfds-servings.ts). Never
// deletes or modifies existing data — safe to run against a live database.
//
// Food.name has no unique constraint: users can have private custom foods
// (Food.userId set) that legitimately share a name with a shared global food
// or with another user's custom food. These scripts only ever create/target
// shared global foods (Food.userId === null), so every existing-food lookup
// below is scoped to userId: null to avoid matching or colliding with a
// private custom food that happens to share the same name.
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

// Respects DATABASE_URL (e.g. a libsql://...?authToken=... Turso URL) so
// these scripts can target a remote database, falling back to the local
// dev.db file when unset.
const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL || 'file:./dev.db' })
export const prisma = new PrismaClient({ adapter })

export interface ServingInput {
  unitName: string
  gramsPerUnit: number
}

export interface FoodInput {
  name: string
  nameEn?: string | null
  category: string
  subcategory?: string | null
  caloriesPer100g: number
  proteinPer100g: number
  fatPer100g: number
  carbsPer100g: number
  sodiumPer100g?: number | null
  servings: ServingInput[]
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size))
  return chunks
}

const BATCH_SIZE = 200

// Batched (createMany) instead of one row at a time: each network round trip
// to a remote database (e.g. Turso) costs real latency, and importing
// thousands of MFDS rows one create() at a time can take many minutes.
// Batching cuts that down to a handful of round trips regardless of size.
export async function importFoods(foods: FoodInput[], label: string): Promise<void> {
  const existing = await prisma.food.findMany({ where: { userId: null }, select: { name: true } })
  const existingNames = new Set(existing.map((f) => f.name))

  const newFoods = foods.filter((f) => !existingNames.has(f.name))
  const skipped = foods.length - newFoods.length

  for (const [i, batch] of chunk(newFoods, BATCH_SIZE).entries()) {
    await prisma.food.createMany({
      data: batch.map(({ servings: _servings, ...data }) => data),
    })

    const created = await prisma.food.findMany({
      where: { userId: null, name: { in: batch.map((f) => f.name) } },
      select: { id: true, name: true },
    })
    const idByName = new Map(created.map((f) => [f.name, f.id]))

    const servingRows = batch.flatMap((food) => {
      const foodId = idByName.get(food.name)
      if (!foodId) return []
      return food.servings.map((s) => ({ foodId, unitName: s.unitName, gramsPerUnit: s.gramsPerUnit }))
    })
    if (servingRows.length > 0) {
      await prisma.foodServing.createMany({ data: servingRows })
    }

    console.log(`  ...batch ${i + 1}: ${batch.length} foods`)
  }

  console.log(`Added ${newFoods.length} new ${label}, skipped ${skipped} already present.`)
}

export function runImport(fn: () => Promise<void>): void {
  fn()
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
    .finally(() => prisma.$disconnect())
}
