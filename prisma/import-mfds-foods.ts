// Additive import: adds foods from the MFDS (식품의약품안전처) nutrition DB export
// that aren't already in the Food table. Unlike seed.ts, this never deletes
// existing data (meals, meal items, or foods) — safe to run on a live database.
import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import fs from 'fs'
import path from 'path'

const adapter = new PrismaLibSql({ url: 'file:./dev.db' })
const prisma = new PrismaClient({ adapter })

interface MfdsFood {
  name: string
  category: string
  subcategory: string | null
  caloriesPer100g: number
  proteinPer100g: number
  fatPer100g: number
  carbsPer100g: number
  sodiumPer100g: number | null
}

async function main() {
  const dataPath = path.join(__dirname, 'data', 'mfds-import.json')
  const foods: MfdsFood[] = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))

  const existing = await prisma.food.findMany({ select: { name: true } })
  const existingNames = new Set(existing.map((f) => f.name))

  let added = 0
  let skipped = 0
  for (const food of foods) {
    if (existingNames.has(food.name)) {
      skipped++
      continue
    }
    await prisma.food.create({
      data: {
        name: food.name,
        category: food.category,
        subcategory: food.subcategory,
        caloriesPer100g: food.caloriesPer100g,
        proteinPer100g: food.proteinPer100g,
        fatPer100g: food.fatPer100g,
        carbsPer100g: food.carbsPer100g,
        sodiumPer100g: food.sodiumPer100g,
        servings: { create: [{ unitName: 'g', gramsPerUnit: 1 }] },
      },
    })
    existingNames.add(food.name)
    added++
  }

  console.log(`Added ${added} new foods, skipped ${skipped} already present.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
