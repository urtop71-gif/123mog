// Additive fix-up: the MFDS bulk import (import-mfds-foods.ts) only had a
// generic "g" unit for each food since the source spreadsheet's per-serving
// reference amount column was empty. It does have a "식품중량" (product/
// analysis weight) column though, so add that as a "인분" (portion) serving
// on top of the existing "g" one. Never deletes or modifies existing data.
//
// Food.name has no unique constraint (users can have private custom foods
// that share a name with a shared food), so the lookup below is scoped to
// userId: null to avoid ever matching/modifying a private custom food.
import fs from 'fs'
import path from 'path'
import { prisma } from './importUtils'

async function main() {
  const dataPath = path.join(__dirname, 'data', 'mfds-servings.json')
  const servingsByName: Record<string, number> = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))

  let added = 0
  let skippedNotFound = 0
  let skippedAlreadyHasServing = 0

  for (const [name, grams] of Object.entries(servingsByName)) {
    const food = await prisma.food.findFirst({
      where: { name, userId: null },
      include: { servings: true },
    })
    if (!food) {
      skippedNotFound++
      continue
    }
    const hasNonGramServing = food.servings.some((s) => s.unitName !== 'g')
    if (hasNonGramServing) {
      skippedAlreadyHasServing++
      continue
    }
    await prisma.foodServing.create({
      data: { foodId: food.id, unitName: '인분', gramsPerUnit: grams },
    })
    added++
  }

  console.log(`Added ${added} servings, skipped ${skippedNotFound} (not found), ${skippedAlreadyHasServing} (already had a serving).`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
