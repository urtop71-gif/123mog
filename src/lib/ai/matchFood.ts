import { defaultUnitName, type ServingLike } from "@/lib/servings";

export interface MatchableFood {
  id: string;
  name: string;
  nameEn: string | null;
  servings: ServingLike[];
}

/** Higher is better. 0 means no match. */
export function scoreFoodName(query: string, food: { name: string; nameEn?: string | null }): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  const name = food.name.trim().toLowerCase();
  const en = (food.nameEn ?? "").trim().toLowerCase();
  const scoreOne = (candidate: string): number => {
    if (!candidate) return 0;
    if (candidate === q) return 100;
    if (candidate.startsWith(q) || q.startsWith(candidate)) return candidate.length >= 2 ? 80 : 0;
    if (candidate.includes(q) || q.includes(candidate)) return candidate.length >= 2 ? 60 : 0;
    return 0;
  };
  return Math.max(scoreOne(name), scoreOne(en));
}

export function pickBestFood<T extends { name: string; nameEn?: string | null }>(
  query: string,
  foods: T[],
): T | null {
  let best: T | null = null;
  let bestScore = 0;
  for (const food of foods) {
    const score = scoreFoodName(query, food);
    if (score > bestScore) {
      best = food;
      bestScore = score;
    } else if (score === bestScore && score > 0 && best && food.name.length < best.name.length) {
      best = food;
    }
  }
  return bestScore >= 60 ? best : null;
}

const UNIT_ALIASES: Record<string, string[]> = {
  공기: ["공기", "bowl of rice", "rice"],
  그릇: ["그릇", "bowl"],
  인분: ["인분", "serving", "portion", "serving(s)"],
  개: ["개", "piece", "ea"],
  조각: ["조각", "slice"],
  컵: ["컵", "cup"],
  잔: ["잔", "glass"],
  g: ["g", "gram", "grams", "그램"],
  ml: ["ml", "milliliter", "milliliters"],
};

const GENERIC_UNITS = new Set(["인분", "serving", "portion", "serving(s)", "servings"]);

export function resolveUnit(unit: string | null | undefined, servings: ServingLike[]): string {
  const wanted = (unit ?? "").trim().toLowerCase();
  if (GENERIC_UNITS.has(wanted)) return defaultUnitName(servings);
  if (wanted) {
    const exact = servings.find((s) => s.unitName.trim().toLowerCase() === wanted);
    if (exact) return exact.unitName;
    for (const serving of servings) {
      const aliases = UNIT_ALIASES[serving.unitName] ?? UNIT_ALIASES[serving.unitName.toLowerCase()] ?? [];
      if (aliases.some((alias) => alias.toLowerCase() === wanted)) return serving.unitName;
    }
  }
  return defaultUnitName(servings);
}
