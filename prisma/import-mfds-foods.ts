// Additive import: adds foods from the MFDS (식품의약품안전처) nutrition DB export
// that aren't already in the Food table. Unlike seed.ts, this never deletes
// existing data (meals, meal items, or foods) — safe to run on a live database.
import fs from 'fs'
import path from 'path'
import { importFoods, runImport, FoodInput } from './importUtils'

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

const dataPath = path.join(__dirname, 'data', 'mfds-import.json')
const mfdsFoods: MfdsFood[] = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
const foods: FoodInput[] = mfdsFoods.map((food) => ({
  ...food,
  servings: [{ unitName: 'g', gramsPerUnit: 1 }],
}))

runImport(() => importFoods(foods, "foods"))
