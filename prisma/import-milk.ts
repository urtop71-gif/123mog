// Additive import: milk types. 두유 (soy milk), 초코우유, 우유_딸기 already
// existed; this fills in the rest of the common lineup. Never deletes
// existing data.
import { importFoods, runImport } from './importUtils'

const foods = [
  { name: "우유", nameEn: "Whole Milk", category: "general", subcategory: "유제품류 및 빙과류", caloriesPer100g: 64, proteinPer100g: 3.4, fatPer100g: 3.6, carbsPer100g: 4.8, sodiumPer100g: 40, servings: [{ unitName: "컵", gramsPerUnit: 240 }, { unitName: "ml", gramsPerUnit: 1 }] },
  { name: "우유_저지방", nameEn: "Low-Fat Milk", category: "general", subcategory: "유제품류 및 빙과류", caloriesPer100g: 46, proteinPer100g: 3.4, fatPer100g: 1.0, carbsPer100g: 5.0, sodiumPer100g: 45, servings: [{ unitName: "컵", gramsPerUnit: 240 }, { unitName: "ml", gramsPerUnit: 1 }] },
  { name: "우유_무지방", nameEn: "Fat-Free (Skim) Milk", category: "general", subcategory: "유제품류 및 빙과류", caloriesPer100g: 35, proteinPer100g: 3.4, fatPer100g: 0.1, carbsPer100g: 5.0, sodiumPer100g: 45, servings: [{ unitName: "컵", gramsPerUnit: 240 }, { unitName: "ml", gramsPerUnit: 1 }] },
  { name: "우유_락토프리", nameEn: "Lactose-Free Milk", category: "general", subcategory: "유제품류 및 빙과류", caloriesPer100g: 64, proteinPer100g: 3.3, fatPer100g: 3.6, carbsPer100g: 4.8, sodiumPer100g: 40, servings: [{ unitName: "컵", gramsPerUnit: 240 }, { unitName: "ml", gramsPerUnit: 1 }] },
  { name: "우유_바나나맛", nameEn: "Banana Flavored Milk", category: "general", subcategory: "유제품류 및 빙과류", caloriesPer100g: 80, proteinPer100g: 2.5, fatPer100g: 2.7, carbsPer100g: 12.5, sodiumPer100g: 50, servings: [{ unitName: "병", gramsPerUnit: 240 }, { unitName: "ml", gramsPerUnit: 1 }] },
  { name: "우유_커피", nameEn: "Coffee Milk", category: "general", subcategory: "유제품류 및 빙과류", caloriesPer100g: 65, proteinPer100g: 2.8, fatPer100g: 2.0, carbsPer100g: 9.5, sodiumPer100g: 45, servings: [{ unitName: "병", gramsPerUnit: 240 }, { unitName: "ml", gramsPerUnit: 1 }] },
  { name: "아몬드우유", nameEn: "Almond Milk (Unsweetened)", category: "general", subcategory: "유제품류 및 빙과류", caloriesPer100g: 15, proteinPer100g: 0.6, fatPer100g: 1.2, carbsPer100g: 0.6, sodiumPer100g: 60, servings: [{ unitName: "컵", gramsPerUnit: 240 }, { unitName: "ml", gramsPerUnit: 1 }] },
  { name: "귀리우유", nameEn: "Oat Milk", category: "general", subcategory: "유제품류 및 빙과류", caloriesPer100g: 45, proteinPer100g: 1.0, fatPer100g: 1.5, carbsPer100g: 7.0, sodiumPer100g: 55, servings: [{ unitName: "컵", gramsPerUnit: 240 }, { unitName: "ml", gramsPerUnit: 1 }] },
  { name: "산양유", nameEn: "Goat Milk", category: "general", subcategory: "유제품류 및 빙과류", caloriesPer100g: 69, proteinPer100g: 3.6, fatPer100g: 4.1, carbsPer100g: 4.5, sodiumPer100g: 50, servings: [{ unitName: "컵", gramsPerUnit: 240 }, { unitName: "ml", gramsPerUnit: 1 }] },
]

runImport(() => importFoods(foods, "milk types"))
