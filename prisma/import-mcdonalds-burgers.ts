// Additive import: McDonald's burger menu items with approximate per-100g
// nutrition (derived from typical published per-burger figures). Never
// deletes existing data — safe to run on a live database.
import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const adapter = new PrismaLibSql({ url: 'file:./dev.db' })
const prisma = new PrismaClient({ adapter })

const foods = [
  { name: "빅맥", nameEn: "Big Mac", category: "western", subcategory: "burger", caloriesPer100g: 251, proteinPer100g: 12.0, fatPer100g: 14.0, carbsPer100g: 19.0, sodiumPer100g: 460, servings: [{ unitName: "개", gramsPerUnit: 219 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "그랜드빅맥", nameEn: "Grand Big Mac", category: "western", subcategory: "burger", caloriesPer100g: 266, proteinPer100g: 15.0, fatPer100g: 16.0, carbsPer100g: 18.0, sodiumPer100g: 470, servings: [{ unitName: "개", gramsPerUnit: 282 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "맥스파이시 상하이버거", nameEn: "McSpicy", category: "western", subcategory: "burger", caloriesPer100g: 225, proteinPer100g: 12.0, fatPer100g: 13.0, carbsPer100g: 18.0, sodiumPer100g: 480, servings: [{ unitName: "개", gramsPerUnit: 236 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "상하이버거", nameEn: "Shanghai Burger", category: "western", subcategory: "burger", caloriesPer100g: 219, proteinPer100g: 11.0, fatPer100g: 11.0, carbsPer100g: 20.0, sodiumPer100g: 450, servings: [{ unitName: "개", gramsPerUnit: 215 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "불고기버거", nameEn: "Bulgogi Burger", category: "korean", subcategory: "burger", caloriesPer100g: 291, proteinPer100g: 10.0, fatPer100g: 11.0, carbsPer100g: 40.0, sodiumPer100g: 480, servings: [{ unitName: "개", gramsPerUnit: 141 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "쿼터파운더치즈", nameEn: "Quarter Pounder with Cheese", category: "western", subcategory: "burger", caloriesPer100g: 261, proteinPer100g: 15.0, fatPer100g: 15.0, carbsPer100g: 18.0, sodiumPer100g: 480, servings: [{ unitName: "개", gramsPerUnit: 199 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "더블쿼터파운더치즈", nameEn: "Double Quarter Pounder with Cheese", category: "western", subcategory: "burger", caloriesPer100g: 265, proteinPer100g: 20.0, fatPer100g: 17.0, carbsPer100g: 15.0, sodiumPer100g: 480, servings: [{ unitName: "개", gramsPerUnit: 283 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "치즈버거", nameEn: "Cheeseburger", category: "western", subcategory: "burger", caloriesPer100g: 252, proteinPer100g: 12.0, fatPer100g: 12.0, carbsPer100g: 25.0, sodiumPer100g: 500, servings: [{ unitName: "개", gramsPerUnit: 119 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "더블치즈버거", nameEn: "Double Cheeseburger", category: "western", subcategory: "burger", caloriesPer100g: 265, proteinPer100g: 18.0, fatPer100g: 15.0, carbsPer100g: 22.0, sodiumPer100g: 550, servings: [{ unitName: "개", gramsPerUnit: 166 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "햄버거", nameEn: "Hamburger", category: "western", subcategory: "burger", caloriesPer100g: 250, proteinPer100g: 11.0, fatPer100g: 8.0, carbsPer100g: 31.0, sodiumPer100g: 430, servings: [{ unitName: "개", gramsPerUnit: 100 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "1955버거", nameEn: "1955 Burger", category: "korean", subcategory: "burger", caloriesPer100g: 223, proteinPer100g: 12.0, fatPer100g: 12.0, carbsPer100g: 18.0, sodiumPer100g: 470, servings: [{ unitName: "개", gramsPerUnit: 238 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "베이컨토마토디럭스", nameEn: "Bacon Tomato Deluxe", category: "western", subcategory: "burger", caloriesPer100g: 239, proteinPer100g: 13.0, fatPer100g: 13.0, carbsPer100g: 19.0, sodiumPer100g: 460, servings: [{ unitName: "개", gramsPerUnit: 180 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "필레오피쉬", nameEn: "Filet-O-Fish", category: "western", subcategory: "burger", caloriesPer100g: 250, proteinPer100g: 12.0, fatPer100g: 12.0, carbsPer100g: 24.0, sodiumPer100g: 430, servings: [{ unitName: "개", gramsPerUnit: 136 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "맥치킨", nameEn: "McChicken", category: "western", subcategory: "burger", caloriesPer100g: 252, proteinPer100g: 11.0, fatPer100g: 12.0, carbsPer100g: 25.0, sodiumPer100g: 400, servings: [{ unitName: "개", gramsPerUnit: 143 }, { unitName: "g", gramsPerUnit: 1 }] },
]

async function main() {
  const existing = await prisma.food.findMany({ select: { name: true } })
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

  console.log(`Added ${added} new McDonald's burgers, skipped ${skipped} already present.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
