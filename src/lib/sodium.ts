export interface SodiumItem {
  totalSodium: number | null;
}

export interface SodiumSummary {
  /** Sum of items with a known value. Null when every item is unknown. */
  totalMg: number | null;
  knownCount: number;
  unknownCount: number;
  /** True when the total omits at least one item. */
  partial: boolean;
}

/**
 * Unknown sodium is not zero. A mixed day returns the known sum and
 * `partial: true` so the UI can say the total is incomplete.
 */
export function summarizeSodium(items: SodiumItem[]): SodiumSummary {
  let knownCount = 0;
  let unknownCount = 0;
  let total = 0;
  for (const item of items) {
    if (item.totalSodium == null || Number.isNaN(item.totalSodium)) {
      unknownCount += 1;
    } else {
      knownCount += 1;
      total += item.totalSodium;
    }
  }
  if (knownCount === 0) {
    return { totalMg: null, knownCount: 0, unknownCount, partial: false };
  }
  return {
    totalMg: Math.round(total * 10) / 10,
    knownCount,
    unknownCount,
    partial: unknownCount > 0,
  };
}
