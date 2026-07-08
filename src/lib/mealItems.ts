import { prisma } from "@/lib/prisma";

export interface MealItemInput {
  foodId: string;
  quantity: number;
  unitName: string;
}

export interface ComputedMealItem {
  foodId: string;
  quantity: number;
  unitName: string;
  gramsPerUnit: number;
  totalGrams: number;
  totalCalories: number;
  totalProtein: number;
  totalFat: number;
  totalCarbs: number;
}

// Looks up each food/serving and computes the nutrition snapshot stored on MealItem.
export async function computeMealItems(items: MealItemInput[]): Promise<ComputedMealItem[]> {
  return Promise.all(
    items.map(async (item) => {
      if (!item.quantity || item.quantity <= 0) {
        throw new Error(`Quantity must be a positive number for food: ${item.foodId}`);
      }

      const food = await prisma.food.findUnique({
        where: { id: item.foodId },
        include: { servings: true },
      });
      if (!food) {
        throw new Error(`Food not found: ${item.foodId}`);
      }

      const serving = food.servings.find((s) => s.unitName === item.unitName);
      if (!serving) {
        throw new Error(`Unit "${item.unitName}" not found for food "${food.name}"`);
      }

      const gramsPerUnit = serving.gramsPerUnit;
      const totalGrams = item.quantity * gramsPerUnit;
      const factor = totalGrams / 100;

      return {
        foodId: food.id,
        quantity: item.quantity,
        unitName: item.unitName,
        gramsPerUnit,
        totalGrams,
        totalCalories: Math.round(food.caloriesPer100g * factor * 10) / 10,
        totalProtein: Math.round(food.proteinPer100g * factor * 10) / 10,
        totalFat: Math.round(food.fatPer100g * factor * 10) / 10,
        totalCarbs: Math.round(food.carbsPer100g * factor * 10) / 10,
      };
    })
  );
}
