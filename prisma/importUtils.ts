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
import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const adapter = new PrismaLibSql({ url: 'file:./dev.db' })
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

export async function importFoods(foods: FoodInput[], label: string): Promise<void> {
  const existing = await prisma.food.findMany({ where: { userId: null }, select: { name: true } })
  const existingNames = new Set(existing.map((f) => f.name))

  let added = 0
  let skipped = 0
  for (const food of foods) {
    if (existingNames.has(food.name)) {
      skipped++
      continue
    }
    const { servings, ...data } = food
    await prisma.food.create({ data: { ...data, servings: { create: servings } } })
    existingNames.add(food.name)
    added++
  }

  console.log(`Added ${added} new ${label}, skipped ${skipped} already present.`)
}

export function runImport(fn: () => Promise<void>): void {
  fn()
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
    .finally(() => prisma.$disconnect())
}
