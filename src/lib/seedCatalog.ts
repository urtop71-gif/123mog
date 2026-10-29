export interface CatalogFoodInput {
  name: string;
  nameEn?: string | null;
  category: string;
  subcategory?: string | null;
  caloriesPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbsPer100g: number;
  sodiumPer100g?: number | null;
  healthTags?: string | null;
  servings: { unitName: string; gramsPerUnit: number }[];
}

interface SeedFoodDelegate {
  findFirst(args: {
    where: { name: string; userId: null; isCustom: false };
    select: { id: true };
  }): Promise<{ id: string } | null>;
  create(args: { data: Record<string, unknown> }): Promise<unknown>;
}

/**
 * Insert a global food only when that name is not already in the catalog.
 * Existing rows (and every meal, custom food, and import) are left alone.
 */
export async function insertGlobalFoodIfMissing(
  foodDelegate: SeedFoodDelegate,
  food: CatalogFoodInput,
): Promise<"created" | "skipped"> {
  const existing = await foodDelegate.findFirst({
    where: { name: food.name, userId: null, isCustom: false },
    select: { id: true },
  });
  if (existing) return "skipped";

  const { servings, nameEn, subcategory, sodiumPer100g, healthTags, ...rest } = food;
  await foodDelegate.create({
    data: {
      ...rest,
      nameEn: nameEn ?? null,
      subcategory: subcategory ?? null,
      sodiumPer100g: sodiumPer100g ?? null,
      healthTags: healthTags ?? null,
      userId: null,
      isCustom: false,
      servings: { create: servings },
    },
  });
  return "created";
}
