// Additive import: tomato soup was missing from the "스프_*" soup lineup
// (potato, beef, cream, corn, mushroom soups already existed). Never
// deletes existing data.
import { importFoods, runImport } from './importUtils'

const foods = [
  { name: "스프_토마토", nameEn: "Tomato Soup", category: "general", subcategory: "죽 및 스프류", caloriesPer100g: 45, proteinPer100g: 1.1, fatPer100g: 1.2, carbsPer100g: 7.5, sodiumPer100g: 260, servings: [{ unitName: "인분", gramsPerUnit: 200 }, { unitName: "g", gramsPerUnit: 1 }] },
]

runImport(() => importFoods(foods, "tomato soup"))
