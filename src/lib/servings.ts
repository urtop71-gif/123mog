const RAW_UNIT_NAMES = new Set(["g", "ml", "gram", "grams", "그램", "㎖", "㎖"]);

export interface ServingLike {
  unitName: string;
  gramsPerUnit: number;
}

/**
 * The food's standard one-serving unit. Seed data puts a named serving
 * first and a 1 g / 1 ml fallback later; picking index 1 logs ~0 kcal
 * for any food whose second unit is that fallback.
 */
export function defaultServing<T extends ServingLike>(servings: T[]): T | undefined {
  if (servings.length === 0) return undefined;
  const standard = servings.find((s) => {
    const name = s.unitName.trim().toLowerCase();
    return !RAW_UNIT_NAMES.has(name) && s.gramsPerUnit > 1;
  });
  return standard ?? servings[0];
}

export function defaultUnitName(servings: ServingLike[]): string {
  return defaultServing(servings)?.unitName || "g";
}
