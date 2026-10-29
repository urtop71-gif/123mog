/** A portion the model extracted. Nutrition is a fallback for unmatched names. */
export interface ParsedPortion {
  name: string;
  quantity: number;
  unit: string | null;
  /** Calories for this portion, not per 100 g. */
  calories: number | null;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
  sodium: number | null;
}

export interface MealParseInput {
  text?: string;
  image?: { mimeType: string; base64: string };
}

/** Swap Gemini for another provider by implementing this. */
export interface MealParser {
  readonly id: string;
  parse(input: MealParseInput): Promise<ParsedPortion[]>;
}
