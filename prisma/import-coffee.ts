// Additive import: common cafe coffee drinks. Never deletes existing data.
import { importFoods, runImport } from './importUtils'

const foods = [
  { name: "아메리카노", nameEn: "Americano", category: "general", subcategory: "coffee", caloriesPer100g: 2, proteinPer100g: 0.1, fatPer100g: 0.0, carbsPer100g: 0.3, sodiumPer100g: 2, servings: [{ unitName: "톨", gramsPerUnit: 355 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "에스프레소", nameEn: "Espresso", category: "general", subcategory: "coffee", caloriesPer100g: 9, proteinPer100g: 0.5, fatPer100g: 0.2, carbsPer100g: 1.7, sodiumPer100g: 4, servings: [{ unitName: "샷", gramsPerUnit: 30 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "카페라떼", nameEn: "Caffe Latte", category: "general", subcategory: "coffee", caloriesPer100g: 42, proteinPer100g: 2.2, fatPer100g: 1.5, carbsPer100g: 4.5, sodiumPer100g: 40, servings: [{ unitName: "톨", gramsPerUnit: 355 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "카푸치노", nameEn: "Cappuccino", category: "general", subcategory: "coffee", caloriesPer100g: 35, proteinPer100g: 1.8, fatPer100g: 1.3, carbsPer100g: 3.8, sodiumPer100g: 35, servings: [{ unitName: "톨", gramsPerUnit: 355 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "플랫화이트", nameEn: "Flat White", category: "general", subcategory: "coffee", caloriesPer100g: 48, proteinPer100g: 2.5, fatPer100g: 1.8, carbsPer100g: 4.2, sodiumPer100g: 45, servings: [{ unitName: "톨", gramsPerUnit: 240 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "바닐라라떼", nameEn: "Vanilla Latte", category: "general", subcategory: "coffee", caloriesPer100g: 65, proteinPer100g: 1.8, fatPer100g: 1.3, carbsPer100g: 11.0, sodiumPer100g: 40, servings: [{ unitName: "톨", gramsPerUnit: 355 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "카라멜마키아토", nameEn: "Caramel Macchiato", category: "general", subcategory: "coffee", caloriesPer100g: 70, proteinPer100g: 1.7, fatPer100g: 1.5, carbsPer100g: 12.5, sodiumPer100g: 45, servings: [{ unitName: "톨", gramsPerUnit: 355 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "카페모카", nameEn: "Caffe Mocha", category: "general", subcategory: "coffee", caloriesPer100g: 90, proteinPer100g: 2.0, fatPer100g: 3.5, carbsPer100g: 13.0, sodiumPer100g: 40, servings: [{ unitName: "톨", gramsPerUnit: 355 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "콜드브루", nameEn: "Cold Brew", category: "general", subcategory: "coffee", caloriesPer100g: 3, proteinPer100g: 0.2, fatPer100g: 0.0, carbsPer100g: 0.5, sodiumPer100g: 3, servings: [{ unitName: "톨", gramsPerUnit: 355 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "드립커피", nameEn: "Drip Coffee", category: "general", subcategory: "coffee", caloriesPer100g: 2, proteinPer100g: 0.1, fatPer100g: 0.0, carbsPer100g: 0.3, sodiumPer100g: 2, servings: [{ unitName: "잔", gramsPerUnit: 240 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "아인슈페너", nameEn: "Vienna Coffee (Einspänner)", category: "general", subcategory: "coffee", caloriesPer100g: 110, proteinPer100g: 1.2, fatPer100g: 9.0, carbsPer100g: 6.0, sodiumPer100g: 15, servings: [{ unitName: "잔", gramsPerUnit: 300 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "두유라떼", nameEn: "Soy Latte", category: "general", subcategory: "coffee", caloriesPer100g: 38, proteinPer100g: 2.8, fatPer100g: 1.5, carbsPer100g: 3.2, sodiumPer100g: 35, servings: [{ unitName: "톨", gramsPerUnit: 355 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "헤이즐넛라떼", nameEn: "Hazelnut Latte", category: "general", subcategory: "coffee", caloriesPer100g: 62, proteinPer100g: 1.8, fatPer100g: 1.5, carbsPer100g: 10.0, sodiumPer100g: 40, servings: [{ unitName: "톨", gramsPerUnit: 355 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "콘파냐", nameEn: "Espresso Con Panna", category: "general", subcategory: "coffee", caloriesPer100g: 35, proteinPer100g: 0.8, fatPer100g: 2.5, carbsPer100g: 2.5, sodiumPer100g: 10, servings: [{ unitName: "샷", gramsPerUnit: 60 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "아포가토", nameEn: "Affogato", category: "general", subcategory: "coffee", caloriesPer100g: 140, proteinPer100g: 2.5, fatPer100g: 6.0, carbsPer100g: 18.0, sodiumPer100g: 40, servings: [{ unitName: "잔", gramsPerUnit: 120 }, { unitName: "g", gramsPerUnit: 1 }] },
]

runImport(() => importFoods(foods, "coffee drinks"))
