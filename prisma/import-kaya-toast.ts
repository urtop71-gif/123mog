// Additive import: Kaya toast variants (only generic "카야토스트" and the
// "Kaya" jam itself existed before). Never deletes existing data.
import { importFoods, runImport } from './importUtils'

const foods = [
  { name: "카야토스트_탄토스트", nameEn: "Charcoal Kaya Toast", category: "singapore", subcategory: "bread", caloriesPer100g: 260, proteinPer100g: 6.0, fatPer100g: 12.0, carbsPer100g: 32.0, sodiumPer100g: 380, servings: [{ unitName: "세트", gramsPerUnit: 70 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "카야버터토스트", nameEn: "Kaya Butter Toast (Thick)", category: "singapore", subcategory: "bread", caloriesPer100g: 310, proteinPer100g: 6.5, fatPer100g: 14.0, carbsPer100g: 38.0, sodiumPer100g: 350, servings: [{ unitName: "세트", gramsPerUnit: 90 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "카야토스트세트", nameEn: "Kaya Toast Set (w/ Soft-boiled Eggs)", category: "singapore", subcategory: "bread", caloriesPer100g: 230, proteinPer100g: 9.0, fatPer100g: 11.0, carbsPer100g: 26.0, sodiumPer100g: 320, servings: [{ unitName: "세트", gramsPerUnit: 180 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "카야번", nameEn: "Kaya Bun", category: "singapore", subcategory: "bread", caloriesPer100g: 300, proteinPer100g: 6.0, fatPer100g: 9.0, carbsPer100g: 48.0, sodiumPer100g: 280, servings: [{ unitName: "개", gramsPerUnit: 80 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "카야크루아상", nameEn: "Kaya Croissant", category: "singapore", subcategory: "bread", caloriesPer100g: 380, proteinPer100g: 6.0, fatPer100g: 20.0, carbsPer100g: 42.0, sodiumPer100g: 320, servings: [{ unitName: "개", gramsPerUnit: 90 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "스리카야토스트", nameEn: "Sri Kaya (Pandan) Toast", category: "singapore", subcategory: "bread", caloriesPer100g: 285, proteinPer100g: 6.0, fatPer100g: 10.5, carbsPer100g: 41.0, sodiumPer100g: 380, servings: [{ unitName: "세트", gramsPerUnit: 80 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "카야프렌치토스트", nameEn: "Kaya French Toast", category: "singapore", subcategory: "bread", caloriesPer100g: 320, proteinPer100g: 7.0, fatPer100g: 15.0, carbsPer100g: 38.0, sodiumPer100g: 300, servings: [{ unitName: "개", gramsPerUnit: 120 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "반숙계란_카야세트용", nameEn: "Soft-boiled Eggs (Kaya Set Style)", category: "singapore", subcategory: "side", caloriesPer100g: 145, proteinPer100g: 12.0, fatPer100g: 10.0, carbsPer100g: 1.0, sodiumPer100g: 350, servings: [{ unitName: "개", gramsPerUnit: 55 }, { unitName: "g", gramsPerUnit: 1 }] },
]

runImport(() => importFoods(foods, "kaya toast items"))
