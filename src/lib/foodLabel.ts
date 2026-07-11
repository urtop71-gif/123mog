import type { Lang } from "@/lib/i18n";

/** Pick a display label for a food based on UI language. */
export function foodDisplayName(
  food: { name: string; nameEn?: string | null },
  lang: Lang,
): string {
  const en = food.nameEn?.trim();
  if (lang === "en" && en) return en;
  return food.name;
}
