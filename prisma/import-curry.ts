// Additive import: Chicken curry variants with approximate per-100g
// nutrition. Never deletes existing data — safe to run on a live database.
import { importFoods, runImport } from './importUtils'

const foods = [
  { name: "치킨커리", nameEn: "Chicken Curry", category: "seasian", subcategory: "curry", caloriesPer100g: 130, proteinPer100g: 10.0, fatPer100g: 7.0, carbsPer100g: 6.0, sodiumPer100g: 350, servings: [{ unitName: "인분", gramsPerUnit: 300 }, { unitName: "g", gramsPerUnit: 1 }] },
]

runImport(() => importFoods(foods, "치킨커리"))
