// Computed fallback health tags for foods without manual curation. These are
// rule-of-thumb estimates from macro/sodium content, not medical advice —
// used only to fill the gap for foods that lack a hand-curated tag (the
// original ~1,390 curated foods keep their more nuanced manual ldl_/sugar_
// tags untouched).
const SODIUM_LOW_MG_PER_100G = 120; // "low sodium" - good for hypertension
const SODIUM_HIGH_MG_PER_100G = 600; // "high sodium" - bad for hypertension

const CARBS_LOW_G_PER_100G = 10; // low-carb - good for blood sugar
const CARBS_HIGH_G_PER_100G = 40; // high-carb - bad for blood sugar

const FAT_LOW_G_PER_100G = 3; // low-fat - good for LDL/cholesterol
const FAT_HIGH_G_PER_100G = 20; // high-fat - bad for LDL/cholesterol

export function sodiumTagFor(
  sodiumPer100g: number | null | undefined,
): "sodium_good" | "sodium_bad" | "sodium_neutral" | null {
  if (sodiumPer100g == null) return null;
  if (sodiumPer100g <= SODIUM_LOW_MG_PER_100G) return "sodium_good";
  if (sodiumPer100g >= SODIUM_HIGH_MG_PER_100G) return "sodium_bad";
  return "sodium_neutral";
}

export function carbsTagFor(
  carbsPer100g: number | null | undefined,
): "sugar_good" | "sugar_bad" | "sugar_neutral" | null {
  if (carbsPer100g == null) return null;
  if (carbsPer100g <= CARBS_LOW_G_PER_100G) return "sugar_good";
  if (carbsPer100g >= CARBS_HIGH_G_PER_100G) return "sugar_bad";
  return "sugar_neutral";
}

export function fatTagFor(
  fatPer100g: number | null | undefined,
): "ldl_good" | "ldl_bad" | "ldl_neutral" | null {
  if (fatPer100g == null) return null;
  if (fatPer100g <= FAT_LOW_G_PER_100G) return "ldl_good";
  if (fatPer100g >= FAT_HIGH_G_PER_100G) return "ldl_bad";
  return "ldl_neutral";
}

interface Macros {
  carbsPer100g?: number | null;
  fatPer100g?: number | null;
  sodiumPer100g?: number | null;
}

// Fills in sugar/LDL/sodium tags for whichever of the three the stored
// healthTags string doesn't already cover.
// Neutral tags (*_neutral) are never shown — only good/bad (and curated non-neutral).
export function augmentHealthTags(
  healthTags: string | null | undefined,
  macros: Macros,
): string | null {
  const existing = healthTags
    ? healthTags.split(",").filter((t) => t && !t.endsWith("_neutral"))
    : [];
  const hasSugarTag = existing.some((t) => t.startsWith("sugar_"));
  const hasLdlTag = existing.some((t) => t.startsWith("ldl_"));
  const hasSodiumTag = existing.some((t) => t.startsWith("sodium_"));

  const result = [...existing];
  if (!hasSugarTag) {
    const tag = carbsTagFor(macros.carbsPer100g);
    if (tag && !tag.endsWith("_neutral")) result.push(tag);
  }
  if (!hasLdlTag) {
    const tag = fatTagFor(macros.fatPer100g);
    if (tag && !tag.endsWith("_neutral")) result.push(tag);
  }
  if (!hasSodiumTag) {
    const sodiumTag = sodiumTagFor(macros.sodiumPer100g);
    if (sodiumTag && !sodiumTag.endsWith("_neutral")) result.push(sodiumTag);
  }

  // de-dupe while preserving order
  const seen = new Set<string>();
  const deduped = result.filter((t) => {
    if (seen.has(t)) return false;
    seen.add(t);
    return true;
  });

  return deduped.length > 0 ? deduped.join(",") : null;
}
