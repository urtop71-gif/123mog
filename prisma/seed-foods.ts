/**
 * Additive food seeder — USDA / Subway / Starbucks / GYG from local JSON.
 *
 * Run: npx tsx prisma/seed-foods.ts
 *
 * Uses DATABASE_URL from .env (SQLite or Turso/libsql).
 * Skips foods already present (by name). Does not touch user/meal data.
 */

import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import "dotenv/config";
import fs from "fs";
import path from "path";

const dbUrl = process.env.DATABASE_URL || "file:./dev.db";
const adapter = new PrismaLibSql({ url: dbUrl });
const prisma = new PrismaClient({ adapter });

function dataPath(file: string) {
  return path.join(process.cwd(), "prisma", "data", file);
}

function readJson<T>(file: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(dataPath(file), "utf-8")) as T;
  } catch {
    console.log(`  skip: ${file} not found`);
    return null;
  }
}

async function existingNames(prefix?: string): Promise<Set<string>> {
  const rows = await prisma.food.findMany({
    where: prefix ? { name: { startsWith: prefix } } : undefined,
    select: { name: true },
  });
  return new Set(rows.map((r) => r.name.toLowerCase()));
}

// ─── USDA (already per-100g) ─────────────────────────────────────────────────
async function importUsda() {
  type Item = {
    name: string;
    nameEn: string;
    caloriesPer100g: number;
    proteinPer100g: number;
    fatPer100g: number;
    carbsPer100g: number;
    sodiumPer100g: number | null;
  };
  const items = readJson<Item[]>("usda-nutrition.json");
  if (!items) return;

  const seen = await existingNames("[USDA]");
  let imported = 0;
  let skipped = 0;

  for (const item of items) {
    if (seen.has(item.name.toLowerCase())) {
      skipped++;
      continue;
    }
    const lc = (item.nameEn || item.name).toLowerCase();
    let sub = "other";
    if (/lettuce|spinach|kale|cabbage|carrot|onion|garlic|tomato|cucumber|pepper|mushroom|broccoli|zucchini|celery|potato|sweet potato/.test(lc))
      sub = "vegetable";
    else if (/apple|banana|orange|grape|strawberry|blueberry|watermelon|avocado/.test(lc)) sub = "fruit";
    else if (/chicken|beef|pork|turkey|lamb/.test(lc)) sub = "meat";
    else if (/salmon|tuna|shrimp|cod|fish|seafood/.test(lc)) sub = "seafood";
    else if (/rice|pasta|bread|oat|quinoa|grain|cereal/.test(lc)) sub = "grain";
    else if (/milk|yogurt|cheese|butter|cream|egg/.test(lc)) sub = "dairy";
    else if (/almond|walnut|peanut|seed|nut/.test(lc)) sub = "nut";
    else if (/oil|fat/.test(lc)) sub = "oil";
    else if (/soy sauce|salt|sugar|honey|vinegar|spice/.test(lc)) sub = "seasoning";
    else if (/tofu|bean|lentil|legume/.test(lc)) sub = "legume";

    await prisma.food.create({
      data: {
        name: item.name,
        nameEn: item.nameEn,
        category: "general",
        subcategory: sub,
        caloriesPer100g: item.caloriesPer100g,
        proteinPer100g: item.proteinPer100g,
        fatPer100g: item.fatPer100g,
        carbsPer100g: item.carbsPer100g,
        sodiumPer100g: item.sodiumPer100g,
        servings: {
          create: [
            { unitName: "100g", gramsPerUnit: 100 },
            { unitName: "g", gramsPerUnit: 1 },
          ],
        },
      },
    });
    imported++;
    seen.add(item.name.toLowerCase());
  }
  console.log(`  USDA: ${imported} imported, ${skipped} skipped`);
}

// ─── Subway SG / TW ([name, {size,cal,pro,fat,car,na}]) ──────────────────────
async function importSubway(
  file: string,
  namePrefix: string,
  nameEnSuffix: string,
) {
  type Row = [string, { size?: string; cal: string; pro: string; fat: string; car: string; na?: string; na_est?: string }];
  const data = readJson<Row[]>(file);
  if (!data) return;

  const seen = await existingNames(namePrefix);
  let imported = 0;
  let skipped = 0;

  for (const [menuName, item] of data) {
    const foodName = `${namePrefix} ${menuName}`;
    if (seen.has(foodName.toLowerCase())) {
      skipped++;
      continue;
    }
    const servingG = parseFloat(item.size || "230") || 230;
    const factor = 100 / servingG;
    const naRaw = item.na ?? item.na_est;
    const na = naRaw != null && naRaw !== "" ? parseFloat(naRaw) : null;
    const lower = menuName.toLowerCase();
    const sub = lower.includes("soup")
      ? "soup"
      : lower.includes("cookie")
        ? "snack"
        : "sandwich";

    await prisma.food.create({
      data: {
        name: foodName,
        nameEn: `Subway ${menuName}${nameEnSuffix}`,
        category: "western",
        subcategory: sub,
        caloriesPer100g: Math.round(parseFloat(item.cal) * factor * 10) / 10,
        proteinPer100g: Math.round(parseFloat(item.pro) * factor * 10) / 10,
        fatPer100g: Math.round(parseFloat(item.fat) * factor * 10) / 10,
        carbsPer100g: Math.round(parseFloat(item.car) * factor * 10) / 10,
        sodiumPer100g: na != null && !Number.isNaN(na) ? Math.round(na * factor * 10) / 10 : null,
        servings: {
          create: [
            { unitName: lower.includes("soup") ? "컵" : "개", gramsPerUnit: servingG },
            { unitName: "g", gramsPerUnit: 1 },
          ],
        },
      },
    });
    imported++;
    seen.add(foodName.toLowerCase());
  }
  console.log(`  ${namePrefix.trim()}: ${imported} imported, ${skipped} skipped`);
}

// ─── Starbucks (already per-100g + optional servings) ────────────────────────
async function importStarbucks() {
  type Item = {
    name: string;
    nameEn?: string;
    category?: string;
    subcategory?: string;
    caloriesPer100g: number;
    proteinPer100g: number;
    fatPer100g: number;
    carbsPer100g: number;
    sodiumPer100g?: number | null;
    servings?: { unitName: string; gramsPerUnit: number }[];
  };
  const items = readJson<Item[]>("starbucks-nutrition.json");
  if (!items) return;

  const seen = await existingNames("[Starbucks]");
  let imported = 0;
  let skipped = 0;

  for (const item of items) {
    const foodName = item.name.startsWith("[Starbucks]") ? item.name : `[Starbucks] ${item.name}`;
    if (seen.has(foodName.toLowerCase())) {
      skipped++;
      continue;
    }
    const servings =
      item.servings && item.servings.length > 0
        ? item.servings
        : [
            { unitName: "개", gramsPerUnit: 100 },
            { unitName: "g", gramsPerUnit: 1 },
          ];

    await prisma.food.create({
      data: {
        name: foodName,
        nameEn: item.nameEn ?? foodName.replace("[Starbucks] ", "Starbucks "),
        category: item.category || "western",
        subcategory: item.subcategory || "coffee",
        caloriesPer100g: item.caloriesPer100g,
        proteinPer100g: item.proteinPer100g,
        fatPer100g: item.fatPer100g,
        carbsPer100g: item.carbsPer100g,
        sodiumPer100g: item.sodiumPer100g ?? null,
        servings: { create: servings },
      },
    });
    imported++;
    seen.add(foodName.toLowerCase());
  }
  console.log(`  Starbucks: ${imported} imported, ${skipped} skipped`);
}

// ─── GYG (per-menu item; stored as one "serving" ≈ 100g reference) ───────────
async function importGyg() {
  type Item = {
    protein: string;
    category: string;
    calories: number;
    fat_g: number;
    carbs_g: number;
    protein_g: number;
    sodium_mg: number;
  };
  const items = readJson<Item[]>("gyg-nutrition.json");
  if (!items) return;

  const seen = await existingNames("[GYG]");
  let imported = 0;
  let skipped = 0;

  for (const item of items) {
    const foodName = `[GYG] ${item.category} - ${item.protein}`;
    if (seen.has(foodName.toLowerCase())) {
      skipped++;
      continue;
    }
    // Treat listed meal values as a single 100g-equivalent serving so UI math stays consistent.
    await prisma.food.create({
      data: {
        name: foodName,
        nameEn: `GYG ${item.category} ${item.protein}`,
        category: "western",
        subcategory: "mexican",
        caloriesPer100g: item.calories,
        proteinPer100g: item.protein_g,
        fatPer100g: item.fat_g,
        carbsPer100g: item.carbs_g,
        sodiumPer100g: item.sodium_mg,
        servings: {
          create: [
            { unitName: "1회", gramsPerUnit: 100 },
            { unitName: "g", gramsPerUnit: 1 },
          ],
        },
      },
    });
    imported++;
    seen.add(foodName.toLowerCase());
  }
  console.log(`  GYG: ${imported} imported, ${skipped} skipped`);
}

async function main() {
  const safeUrl = dbUrl
    .replace(/\/\/.*@/, "//***@")
    .replace(/authToken=[^&]+/i, "authToken=***");
  console.log(`Seeding foods into: ${safeUrl}\n`);
  const before = await prisma.food.count();
  console.log(`  Before: ${before} foods\n`);

  await importUsda();
  await importSubway("subway-nutrition.json", "[Subway]", "");
  await importSubway("subway-tw-nutrition.json", "[Subway TW]", " (Taiwan)");
  await importStarbucks();
  await importGyg();

  const after = await prisma.food.count();
  console.log(`\n  After: ${after} foods (+${after - before})`);
  console.log("Done.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
