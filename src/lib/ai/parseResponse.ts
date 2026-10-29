import type { ParsedPortion } from "@/lib/ai/types";

function num(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return null;
  return value;
}

function oneItem(raw: unknown): ParsedPortion | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const name = typeof row.name === "string" ? row.name.trim() : "";
  if (!name || name.length > 100) return null;
  const quantity = num(row.quantity);
  const unit = typeof row.unit === "string" ? row.unit.trim().slice(0, 30) : "";
  return {
    name,
    quantity: quantity && quantity > 0 ? Math.min(quantity, 50) : 1,
    unit: unit || null,
    calories: num(row.calories),
    protein: num(row.protein),
    fat: num(row.fat),
    carbs: num(row.carbs),
    sodium: num(row.sodium),
  };
}

/** Turn the model's JSON text into portions. Ignores junk and caps the list. */
export function parseParserResponse(text: string): ParsedPortion[] {
  const trimmed = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start < 0 || end <= start) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed.slice(start, end + 1));
  } catch {
    return [];
  }
  const items = (parsed as { items?: unknown }).items;
  if (!Array.isArray(items)) return [];
  const portions: ParsedPortion[] = [];
  for (const item of items) {
    const portion = oneItem(item);
    if (portion) portions.push(portion);
    if (portions.length >= 12) break;
  }
  return portions;
}

/** Portion nutrition → per 100 g so `quantity` of a 100 g serving logs the portion. */
export function per100gFromPortion(portionAmount: number, quantity: number): number {
  if (!(quantity > 0) || !(portionAmount >= 0)) return 0;
  return Math.round((portionAmount / quantity) * 10) / 10;
}
