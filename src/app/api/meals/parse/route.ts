import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { aiParseSchema } from "@/lib/validation";
import { getMealParser } from "@/lib/ai/gemini";
import { pickBestFood, resolveUnit } from "@/lib/ai/matchFood";
import { compressMealPhoto } from "@/lib/imageCompress";
import { toPublicFood } from "@/lib/foodPublic";
import { augmentHealthTags } from "@/lib/healthTags";
import { rateLimit, clientIp } from "@/lib/rateLimit";
import { jsonError, tooMany, unauthorized } from "@/lib/apiErrors";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();
  return NextResponse.json({ enabled: !!process.env.GEMINI_API_KEY });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const parser = getMealParser();
  if (!parser) return jsonError("ai_unavailable", 503);

  if (!rateLimit(`ai-parse:${session.user.id}`, 12, 10 * 60 * 1000)) return tooMany();
  if (!rateLimit(`ai-parse-ip:${clientIp(request)}`, 30, 10 * 60 * 1000)) return tooMany();

  const body = await request.json().catch(() => null);
  const parsed = aiParseSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message || "Invalid input", 400);
  }

  let image: { mimeType: string; base64: string } | undefined;
  if (parsed.data.imageBase64) {
    const raw = parsed.data.imageBase64.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "");
    let compressed: Buffer;
    try {
      compressed = await compressMealPhoto(Buffer.from(raw, "base64"));
    } catch {
      return jsonError("image_invalid", 400);
    }
    image = { mimeType: "image/jpeg", base64: compressed.toString("base64") };
  }

  let portions;
  try {
    portions = await parser.parse({ text: parsed.data.text, image });
  } catch (error) {
    console.error("Meal parse failed:", error instanceof Error ? error.message : "error");
    return jsonError("ai_failed", 502);
  }

  const items = await Promise.all(
    portions.map(async (portion) => {
      const query = portion.name.replace(/\s+/g, "");
      const foods = await prisma.food.findMany({
        where: {
          OR: [
            { name: portion.name },
            { name: { contains: portion.name } },
            { name: { contains: query } },
            { nameEn: { contains: portion.name } },
          ],
        },
        include: { servings: true },
        take: 40,
      });
      const match = pickBestFood(portion.name, foods);
      const food = match
        ? {
            ...toPublicFood(match, session.user.id),
            healthTags: augmentHealthTags(match.healthTags, match),
          }
        : null;
      return {
        name: portion.name,
        quantity: portion.quantity,
        unit: food ? resolveUnit(portion.unit, food.servings) : portion.unit,
        matched: !!food,
        food,
        estimate: {
          calories: portion.calories,
          protein: portion.protein,
          fat: portion.fat,
          carbs: portion.carbs,
          sodium: portion.sodium,
        },
      };
    }),
  );

  return NextResponse.json({ items });
}
