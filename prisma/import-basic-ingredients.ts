// Additive import: common raw vegetables and raw meat/protein ingredients
// (barely represented in the MFDS "prepared dish" export — e.g. no plain
// "토마토" or "닭가슴살" existed, only composite dishes containing them).
// Never deletes existing data — safe to run on a live database. Values are
// standard per-100g nutrition figures for the raw/uncooked ingredient.
import { importFoods, runImport } from './importUtils'

const vegetables = [
  { name: "토마토", nameEn: "Tomato", caloriesPer100g: 18, proteinPer100g: 0.9, fatPer100g: 0.2, carbsPer100g: 3.9, sodiumPer100g: 5, servings: [{ unitName: "개", gramsPerUnit: 150 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "방울토마토", nameEn: "Cherry Tomato", caloriesPer100g: 18, proteinPer100g: 0.9, fatPer100g: 0.2, carbsPer100g: 3.9, sodiumPer100g: 5, servings: [{ unitName: "10알", gramsPerUnit: 150 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "오이", nameEn: "Cucumber", caloriesPer100g: 15, proteinPer100g: 0.7, fatPer100g: 0.1, carbsPer100g: 3.6, sodiumPer100g: 2, servings: [{ unitName: "개", gramsPerUnit: 200 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "당근", nameEn: "Carrot", caloriesPer100g: 41, proteinPer100g: 0.9, fatPer100g: 0.2, carbsPer100g: 9.6, sodiumPer100g: 69, servings: [{ unitName: "개", gramsPerUnit: 100 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "양파", nameEn: "Onion", caloriesPer100g: 40, proteinPer100g: 1.1, fatPer100g: 0.1, carbsPer100g: 9.3, sodiumPer100g: 4, servings: [{ unitName: "개", gramsPerUnit: 150 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "양배추", nameEn: "Cabbage", caloriesPer100g: 25, proteinPer100g: 1.3, fatPer100g: 0.1, carbsPer100g: 5.8, sodiumPer100g: 18, servings: [{ unitName: "잎", gramsPerUnit: 50 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "브로콜리", nameEn: "Broccoli", caloriesPer100g: 34, proteinPer100g: 2.8, fatPer100g: 0.4, carbsPer100g: 6.6, sodiumPer100g: 33, servings: [{ unitName: "송이", gramsPerUnit: 300 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "시금치", nameEn: "Spinach", caloriesPer100g: 23, proteinPer100g: 2.9, fatPer100g: 0.4, carbsPer100g: 3.6, sodiumPer100g: 79, servings: [{ unitName: "단", gramsPerUnit: 70 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "상추", nameEn: "Lettuce", caloriesPer100g: 15, proteinPer100g: 1.4, fatPer100g: 0.2, carbsPer100g: 2.9, sodiumPer100g: 28, servings: [{ unitName: "장", gramsPerUnit: 10 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "깻잎", nameEn: "Perilla Leaf", caloriesPer100g: 47, proteinPer100g: 3.9, fatPer100g: 0.9, carbsPer100g: 6.4, sodiumPer100g: 6, servings: [{ unitName: "장", gramsPerUnit: 3 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "파프리카", nameEn: "Bell Pepper", caloriesPer100g: 31, proteinPer100g: 1.0, fatPer100g: 0.3, carbsPer100g: 6.0, sodiumPer100g: 4, servings: [{ unitName: "개", gramsPerUnit: 170 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "피망", nameEn: "Green Pepper", caloriesPer100g: 20, proteinPer100g: 0.9, fatPer100g: 0.2, carbsPer100g: 4.6, sodiumPer100g: 3, servings: [{ unitName: "개", gramsPerUnit: 120 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "청양고추", nameEn: "Green Chili Pepper", caloriesPer100g: 40, proteinPer100g: 2.0, fatPer100g: 0.4, carbsPer100g: 8.8, sodiumPer100g: 7, servings: [{ unitName: "개", gramsPerUnit: 10 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "마늘", nameEn: "Garlic", caloriesPer100g: 149, proteinPer100g: 6.4, fatPer100g: 0.5, carbsPer100g: 33.1, sodiumPer100g: 17, servings: [{ unitName: "쪽", gramsPerUnit: 3 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "대파", nameEn: "Green Onion", caloriesPer100g: 32, proteinPer100g: 1.8, fatPer100g: 0.2, carbsPer100g: 7.3, sodiumPer100g: 17, servings: [{ unitName: "대", gramsPerUnit: 60 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "애호박", nameEn: "Zucchini", caloriesPer100g: 17, proteinPer100g: 1.2, fatPer100g: 0.2, carbsPer100g: 3.6, sodiumPer100g: 2, servings: [{ unitName: "개", gramsPerUnit: 250 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "가지", nameEn: "Eggplant", caloriesPer100g: 25, proteinPer100g: 1.0, fatPer100g: 0.2, carbsPer100g: 5.9, sodiumPer100g: 2, servings: [{ unitName: "개", gramsPerUnit: 150 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "양송이버섯", nameEn: "Button Mushroom", caloriesPer100g: 22, proteinPer100g: 3.1, fatPer100g: 0.3, carbsPer100g: 3.3, sodiumPer100g: 5, servings: [{ unitName: "개", gramsPerUnit: 15 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "감자", nameEn: "Potato", caloriesPer100g: 77, proteinPer100g: 2.0, fatPer100g: 0.1, carbsPer100g: 17.5, sodiumPer100g: 6, servings: [{ unitName: "개", gramsPerUnit: 150 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "고구마", nameEn: "Sweet Potato", caloriesPer100g: 86, proteinPer100g: 1.6, fatPer100g: 0.1, carbsPer100g: 20.1, sodiumPer100g: 55, servings: [{ unitName: "개", gramsPerUnit: 150 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "무", nameEn: "Korean Radish", caloriesPer100g: 18, proteinPer100g: 0.6, fatPer100g: 0.1, carbsPer100g: 4.1, sodiumPer100g: 21, servings: [{ unitName: "토막", gramsPerUnit: 100 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "콩나물", nameEn: "Soybean Sprouts", caloriesPer100g: 30, proteinPer100g: 3.0, fatPer100g: 0.3, carbsPer100g: 5.0, sodiumPer100g: 5, servings: [{ unitName: "줌", gramsPerUnit: 50 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "옥수수", nameEn: "Corn", caloriesPer100g: 86, proteinPer100g: 3.3, fatPer100g: 1.4, carbsPer100g: 19.0, sodiumPer100g: 15, servings: [{ unitName: "개", gramsPerUnit: 200 }, { unitName: "g", gramsPerUnit: 1 }] },
].map((v) => ({ ...v, category: "general", subcategory: "채소류" }))

const protein = [
  { name: "닭가슴살", nameEn: "Chicken Breast", caloriesPer100g: 120, proteinPer100g: 22.5, fatPer100g: 2.6, carbsPer100g: 0, sodiumPer100g: 45, servings: [{ unitName: "조각", gramsPerUnit: 100 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "닭다리살", nameEn: "Chicken Thigh", caloriesPer100g: 119, proteinPer100g: 18.0, fatPer100g: 4.7, carbsPer100g: 0, sodiumPer100g: 77, servings: [{ unitName: "조각", gramsPerUnit: 100 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "소고기(등심)", nameEn: "Beef Sirloin", caloriesPer100g: 183, proteinPer100g: 19.0, fatPer100g: 12.0, carbsPer100g: 0, sodiumPer100g: 55, servings: [{ unitName: "인분", gramsPerUnit: 100 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "소고기(안심)", nameEn: "Beef Tenderloin", caloriesPer100g: 165, proteinPer100g: 20.6, fatPer100g: 8.6, carbsPer100g: 0, sodiumPer100g: 54, servings: [{ unitName: "인분", gramsPerUnit: 100 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "돼지고기(삼겹살)", nameEn: "Pork Belly", caloriesPer100g: 331, proteinPer100g: 14.6, fatPer100g: 29.5, carbsPer100g: 0, sodiumPer100g: 55, servings: [{ unitName: "인분", gramsPerUnit: 100 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "돼지고기(안심)", nameEn: "Pork Tenderloin", caloriesPer100g: 143, proteinPer100g: 20.9, fatPer100g: 5.8, carbsPer100g: 0, sodiumPer100g: 50, servings: [{ unitName: "인분", gramsPerUnit: 100 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "계란", nameEn: "Egg", caloriesPer100g: 155, proteinPer100g: 13.0, fatPer100g: 11.0, carbsPer100g: 1.1, sodiumPer100g: 124, servings: [{ unitName: "개", gramsPerUnit: 50 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "두부", nameEn: "Tofu", caloriesPer100g: 76, proteinPer100g: 8.1, fatPer100g: 4.2, carbsPer100g: 1.9, sodiumPer100g: 7, servings: [{ unitName: "모", gramsPerUnit: 300 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "새우", nameEn: "Shrimp", caloriesPer100g: 99, proteinPer100g: 24.0, fatPer100g: 0.3, carbsPer100g: 0.2, sodiumPer100g: 111, servings: [{ unitName: "마리", gramsPerUnit: 15 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "연어", nameEn: "Salmon", caloriesPer100g: 208, proteinPer100g: 20.4, fatPer100g: 13.4, carbsPer100g: 0, sodiumPer100g: 59, servings: [{ unitName: "조각", gramsPerUnit: 100 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "참치(생)", nameEn: "Tuna", caloriesPer100g: 144, proteinPer100g: 23.3, fatPer100g: 4.9, carbsPer100g: 0, sodiumPer100g: 39, servings: [{ unitName: "조각", gramsPerUnit: 100 }, { unitName: "g", gramsPerUnit: 1 }] },
].map((p) => ({ ...p, category: "general", subcategory: "육류 및 알류" }))

const foods = [...vegetables, ...protein]

runImport(() => importFoods(foods, "basic ingredients (vegetables & protein)"))
