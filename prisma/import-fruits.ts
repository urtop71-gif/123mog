// Additive import: adds common fresh fruits (barely represented in the MFDS
// "prepared dish" export). Never deletes existing data — safe to run on a
// live database. Values are standard per-100g nutrition figures.
import { importFoods, runImport } from './importUtils'

const fruits = [
  { name: "사과", nameEn: "Apple", caloriesPer100g: 52, proteinPer100g: 0.3, fatPer100g: 0.2, carbsPer100g: 14.0, sodiumPer100g: 1, servings: [{ unitName: "개", gramsPerUnit: 200 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "바나나", nameEn: "Banana", caloriesPer100g: 89, proteinPer100g: 1.1, fatPer100g: 0.3, carbsPer100g: 23.0, sodiumPer100g: 1, servings: [{ unitName: "개", gramsPerUnit: 120 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "오렌지", nameEn: "Orange", caloriesPer100g: 47, proteinPer100g: 0.9, fatPer100g: 0.1, carbsPer100g: 12.0, sodiumPer100g: 0, servings: [{ unitName: "개", gramsPerUnit: 200 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "귤", nameEn: "Mandarin", caloriesPer100g: 53, proteinPer100g: 0.8, fatPer100g: 0.3, carbsPer100g: 13.3, sodiumPer100g: 1, servings: [{ unitName: "개", gramsPerUnit: 80 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "포도", nameEn: "Grapes", caloriesPer100g: 69, proteinPer100g: 0.7, fatPer100g: 0.2, carbsPer100g: 18.0, sodiumPer100g: 2, servings: [{ unitName: "송이", gramsPerUnit: 150 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "청포도", nameEn: "Shine Muscat Grapes", caloriesPer100g: 71, proteinPer100g: 0.6, fatPer100g: 0.2, carbsPer100g: 18.0, sodiumPer100g: 2, servings: [{ unitName: "송이", gramsPerUnit: 150 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "수박", nameEn: "Watermelon", caloriesPer100g: 30, proteinPer100g: 0.6, fatPer100g: 0.2, carbsPer100g: 8.0, sodiumPer100g: 1, servings: [{ unitName: "조각", gramsPerUnit: 300 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "딸기", nameEn: "Strawberry", caloriesPer100g: 33, proteinPer100g: 0.7, fatPer100g: 0.3, carbsPer100g: 8.0, sodiumPer100g: 1, servings: [{ unitName: "컵", gramsPerUnit: 150 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "배", nameEn: "Korean Pear", caloriesPer100g: 57, proteinPer100g: 0.4, fatPer100g: 0.1, carbsPer100g: 15.0, sodiumPer100g: 1, servings: [{ unitName: "개", gramsPerUnit: 300 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "감", nameEn: "Persimmon", caloriesPer100g: 70, proteinPer100g: 0.6, fatPer100g: 0.2, carbsPer100g: 18.6, sodiumPer100g: 1, servings: [{ unitName: "개", gramsPerUnit: 180 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "참외", nameEn: "Korean Melon", caloriesPer100g: 34, proteinPer100g: 0.8, fatPer100g: 0.2, carbsPer100g: 8.0, sodiumPer100g: 17, servings: [{ unitName: "개", gramsPerUnit: 200 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "키위", nameEn: "Kiwi", caloriesPer100g: 61, proteinPer100g: 1.1, fatPer100g: 0.5, carbsPer100g: 15.0, sodiumPer100g: 3, servings: [{ unitName: "개", gramsPerUnit: 80 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "파인애플", nameEn: "Pineapple", caloriesPer100g: 50, proteinPer100g: 0.5, fatPer100g: 0.1, carbsPer100g: 13.0, sodiumPer100g: 1, servings: [{ unitName: "조각", gramsPerUnit: 100 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "망고", nameEn: "Mango", caloriesPer100g: 60, proteinPer100g: 0.8, fatPer100g: 0.4, carbsPer100g: 15.0, sodiumPer100g: 1, servings: [{ unitName: "개", gramsPerUnit: 200 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "블루베리", nameEn: "Blueberry", caloriesPer100g: 57, proteinPer100g: 0.7, fatPer100g: 0.3, carbsPer100g: 14.0, sodiumPer100g: 1, servings: [{ unitName: "컵", gramsPerUnit: 150 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "자두", nameEn: "Plum", caloriesPer100g: 46, proteinPer100g: 0.7, fatPer100g: 0.3, carbsPer100g: 11.0, sodiumPer100g: 0, servings: [{ unitName: "개", gramsPerUnit: 60 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "복숭아", nameEn: "Peach", caloriesPer100g: 39, proteinPer100g: 0.9, fatPer100g: 0.3, carbsPer100g: 10.0, sodiumPer100g: 0, servings: [{ unitName: "개", gramsPerUnit: 200 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "천도복숭아", nameEn: "Nectarine", caloriesPer100g: 44, proteinPer100g: 1.1, fatPer100g: 0.3, carbsPer100g: 10.6, sodiumPer100g: 0, servings: [{ unitName: "개", gramsPerUnit: 150 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "아보카도", nameEn: "Avocado", caloriesPer100g: 160, proteinPer100g: 2.0, fatPer100g: 15.0, carbsPer100g: 9.0, sodiumPer100g: 7, servings: [{ unitName: "개", gramsPerUnit: 200 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "체리", nameEn: "Cherry", caloriesPer100g: 63, proteinPer100g: 1.1, fatPer100g: 0.2, carbsPer100g: 16.0, sodiumPer100g: 0, servings: [{ unitName: "10알", gramsPerUnit: 70 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "레몬", nameEn: "Lemon", caloriesPer100g: 29, proteinPer100g: 1.1, fatPer100g: 0.3, carbsPer100g: 9.0, sodiumPer100g: 2, servings: [{ unitName: "개", gramsPerUnit: 100 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "라임", nameEn: "Lime", caloriesPer100g: 30, proteinPer100g: 0.7, fatPer100g: 0.2, carbsPer100g: 11.0, sodiumPer100g: 2, servings: [{ unitName: "개", gramsPerUnit: 70 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "자몽", nameEn: "Grapefruit", caloriesPer100g: 42, proteinPer100g: 0.8, fatPer100g: 0.1, carbsPer100g: 11.0, sodiumPer100g: 0, servings: [{ unitName: "개", gramsPerUnit: 250 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "멜론", nameEn: "Melon", caloriesPer100g: 34, proteinPer100g: 0.8, fatPer100g: 0.2, carbsPer100g: 8.0, sodiumPer100g: 16, servings: [{ unitName: "조각", gramsPerUnit: 150 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "무화과", nameEn: "Fig", caloriesPer100g: 74, proteinPer100g: 0.8, fatPer100g: 0.3, carbsPer100g: 19.0, sodiumPer100g: 1, servings: [{ unitName: "개", gramsPerUnit: 50 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "석류", nameEn: "Pomegranate", caloriesPer100g: 83, proteinPer100g: 1.7, fatPer100g: 1.2, carbsPer100g: 19.0, sodiumPer100g: 3, servings: [{ unitName: "개", gramsPerUnit: 200 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "용과", nameEn: "Dragon Fruit", caloriesPer100g: 60, proteinPer100g: 1.2, fatPer100g: 0.4, carbsPer100g: 13.0, sodiumPer100g: 1, servings: [{ unitName: "개", gramsPerUnit: 300 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "리치", nameEn: "Lychee", caloriesPer100g: 66, proteinPer100g: 0.8, fatPer100g: 0.4, carbsPer100g: 17.0, sodiumPer100g: 1, servings: [{ unitName: "10알", gramsPerUnit: 100 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "파파야", nameEn: "Papaya", caloriesPer100g: 43, proteinPer100g: 0.5, fatPer100g: 0.3, carbsPer100g: 11.0, sodiumPer100g: 8, servings: [{ unitName: "개", gramsPerUnit: 200 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "두리안", nameEn: "Durian", caloriesPer100g: 147, proteinPer100g: 1.5, fatPer100g: 5.3, carbsPer100g: 27.0, sodiumPer100g: 2, servings: [{ unitName: "조각", gramsPerUnit: 100 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "블랙베리", nameEn: "Blackberry", caloriesPer100g: 43, proteinPer100g: 1.4, fatPer100g: 0.5, carbsPer100g: 10.0, sodiumPer100g: 1, servings: [{ unitName: "컵", gramsPerUnit: 140 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "라즈베리", nameEn: "Raspberry", caloriesPer100g: 52, proteinPer100g: 1.2, fatPer100g: 0.7, carbsPer100g: 12.0, sodiumPer100g: 1, servings: [{ unitName: "컵", gramsPerUnit: 125 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "코코넛", nameEn: "Coconut Meat", caloriesPer100g: 354, proteinPer100g: 3.3, fatPer100g: 33.5, carbsPer100g: 15.2, sodiumPer100g: 20, servings: [{ unitName: "개", gramsPerUnit: 100 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "대추", nameEn: "Jujube", caloriesPer100g: 79, proteinPer100g: 1.2, fatPer100g: 0.2, carbsPer100g: 20.0, sodiumPer100g: 3, servings: [{ unitName: "개", gramsPerUnit: 10 }, { unitName: "g", gramsPerUnit: 1 }] },
  { name: "유자", nameEn: "Yuzu", caloriesPer100g: 32, proteinPer100g: 0.9, fatPer100g: 0.3, carbsPer100g: 10.0, sodiumPer100g: 2, servings: [{ unitName: "개", gramsPerUnit: 100 }, { unitName: "g", gramsPerUnit: 1 }] },
]

const foods = fruits.map((fruit) => ({ ...fruit, category: "general", subcategory: "과일류" }))

runImport(() => importFoods(foods, "fruits"))
