import type { MealParseInput, MealParser, ParsedPortion } from "@/lib/ai/types";
import { parseParserResponse } from "@/lib/ai/parseResponse";

const DEFAULT_MODEL = "gemini-3.5-flash-lite";

const PROMPT = `Extract each food in this meal. The note may be Korean and may include a photo.
Return JSON {"items":[{"name":"","quantity":1,"unit":"","calories":0,"protein":0,"fat":0,"carbs":0,"sodium":0}]}.
name: short food name in the user's language. quantity: number ("반" = 0.5), default 1.
unit: 공기, 그릇, 인분, 개, 조각, 컵, g, ml, or "".
calories/protein/fat/carbs/sodium: rough totals for THAT portion, or null if unsure. Do not list foods that are not in the text or photo.`;

export class GeminiMealParser implements MealParser {
  readonly id = "gemini";

  constructor(
    private readonly apiKey: string,
    private readonly model: string = process.env.GEMINI_MODEL || DEFAULT_MODEL,
  ) {}

  async parse(input: MealParseInput): Promise<ParsedPortion[]> {
    const parts: Record<string, unknown>[] = [{ text: PROMPT }];
    if (input.text?.trim()) parts.push({ text: input.text.trim().slice(0, 500) });
    if (input.image) {
      parts.push({
        inlineData: { mimeType: input.image.mimeType, data: input.image.base64 },
      });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.model)}:generateContent`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": this.apiKey,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 800,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`Gemini request failed (${response.status}): ${detail.slice(0, 200)}`);
    }

    const payload = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
    return parseParserResponse(text);
  }
}

export function getMealParser(): MealParser | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GeminiMealParser(apiKey, process.env.GEMINI_MODEL || DEFAULT_MODEL);
}

export const DEFAULT_GEMINI_MODEL = DEFAULT_MODEL;
