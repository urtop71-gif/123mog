/**
 * Master food seeder — imports all new food data into any database.
 * 
 * Run: npx tsx prisma/seed-foods.ts
 * 
 * Works with BOTH local SQLite and Turso — just set DATABASE_URL in .env.
 * Skips foods already in the DB (by name), so it's safe to re-run.
 * Does NOT touch User, Meal, WeightLog, or any user data.
 * 
 * Sources:
 *   - USDA basic ingredients (prisma/import-usda.ts style)
 *   - Subway SG + Taiwan (prisma/data/subway-nutrition.json)
 *   - Subway TW (prisma/data/subway-tw-nutrition.json)  
 *   - Starbucks (prisma/data/starbucks-nutrition.json)
 *   - GYG (prisma/data/gyg-nutrition.json)
 */

import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import "dotenv/config";
import fs from "fs";

const dbUrl = process.env.DATABASE_URL || "file:./dev.db";
const adapter = new PrismaLibSql({ url: dbUrl });
const prisma = new PrismaClient({ adapter });

// ─── USDA items (simplified — key ingredients only) ──────────────────────────
const USDA_API_KEY = process.env.USDA_API_KEY;

const USDA_SEARCH_TERMS = [
  "chicken breast raw", "chicken thigh raw", "beef sirloin raw", "beef ground raw",
  "pork loin raw", "salmon raw", "tuna raw", "shrimp raw",
  "egg whole raw", "tofu firm",
  "white rice cooked", "brown rice cooked", "pasta cooked", "bread whole wheat",
  "oatmeal cooked", "quinoa cooked", "sweet potato raw", "potato raw",
  "broccoli raw", "spinach raw", "kale raw", "lettuce romaine", "cabbage raw",
  "carrot raw", "onion raw", "garlic raw", "tomato raw", "cucumber raw",
  "bell pepper raw", "mushroom raw", "zucchini raw",
  "apple raw", "banana raw", "orange raw", "grape raw", "strawberry raw",
  "blueberry raw", "avocado raw",
  "milk whole", "yogurt plain", "cheese cheddar", "butter salted",
  "olive oil", "vegetable oil", "sesame oil",
  "almond raw", "walnut raw", "peanut raw",
  "soy sauce", "salt table", "sugar white", "honey",
];

// ─── Branded food imports from JSON ──────────────────────────────────────────
interface BrandedItem {
  name: string;
  nameEn: string;
  category: string;
  subcategory: string;
  size: number;
  cal: number;
  pro: number;
  fat: number;
  car: number;
  na: number | null;
}

function loadBrandedFoods(): BrandedItem[] {
  const items: BrandedItem[] = [];

  // Subway SG
  try {
    const subway = JSON.parse(fs.readFileSync("prisma/data/subway-nutrition.json", "utf-8"));
    for (const [name, data] of subway) {
      items.push({
        name: `[Subway] ${name}`,
        nameEn: `Subway ${name}`,
        category: "western",
        subcategory: name.toLowerCase().includes("soup") ? "soup" : name.toLowerCase().includes("cookie") ? "snack" : "sandwich",
        size: parseFloat(data.size || "230"),
        cal: parseFloat(data.cal),
        pro: parseFloat(data.pro),
        fat: parseFloat(data.fat),
        car: parseFloat(data.car),
        na: data.na ? parseFloat(data.na) : null,
      });
    }
  } catch (e) { console.log("⚠️  Subway SG data not found, skipping"); }

  // Subway TW
  try {
    const subwayTW = JSON.parse(fs.readFileSync("prisma/data/subway-tw-nutrition.json", "utf-8"));
    for (const [name, data] of subwayTW) {
      items.push({
        name: `[Subway TW] ${name}`,
        nameEn: `Subway ${name} (Taiwan)`,
        category: "western",
        subcategory: name.toLowerCase().includes("soup") ? "soup" : name.toLowerCase().includes("cookie") ? "snack" : name.toLowerCase().includes("bacon") ? "meat" : "sandwich",
        size: parseFloat(data.size || "230"),
        cal: parseFloat(data.cal),
        pro: parseFloat(data.pro),
        fat: parseFloat(data.fat),
        car: parseFloat(data.car),
        na: data.na_est ? parseFloat(data.na_est) : null,
      });
    }
  } catch (e) { console.log("⚠️  Subway TW data not found, skipping"); }

  // Starbucks
  try {
    const starbucks = JSON.parse(fs.readFileSync("prisma/data/starbucks-nutrition.json", "utf-8"));
    for (const item of starbucks) {
      items.push({
        name: `[Starbucks] ${item.name}`,
        nameEn: `Starbucks ${item.name}`,
        category: "western",
        subcategory: item.subcategory || "coffee",
        size: item.serving_g || 350,
        cal: parseFloat(item.caloriesPer100g) / 100 * (item.serving_g || 350),
        pro: parseFloat(item.proteinPer100g) / 100 * (item.serving_g || 350),
        fat: parseFloat(item.fatPer100g) / 100 * (item.serving_g || 350),
        car: parseFloat(item.carbsPer100g) / 100 * (item.serving_g || 350),
        na: item.sodiumPer100g ? (parseFloat(item.sodiumPer100g) / 100 * (item.serving_g || 350)) : null,
      });
    }
  } catch (e) { console.log("⚠️  Starbucks data not found, skipping"); }

  // GYG
  try {
    const gyg = JSON.parse(fs.readFileSync("prisma/data/gyg-nutrition.json", "utf-8"));
    for (const item of gyg) {
      items.push({
        name: item.name,
        nameEn: item.nameEn || item.name.replace("[GYG] ", "GYG "),
        category: "western",
        subcategory: "mexican",
        size: 100,
        cal: item.calories || 0,
        pro: item.protein || 0,
        fat: item.fat || 0,
        car: item.carbs || 0,
        na: item.sodium || null,
      });
    }
  } catch (e) { console.log("⚠️  GYG data not found, skipping"); }

  return items;
}

// ─── USDA import ─────────────────────────────────────────────────────────────
async function importUSDA() {
  if (!USDA_API_KEY) {
    console.log("⚠️  USDA_API_KEY not set — skipping USDA import");
    return;
  }

  const BASE = "https://api.nal.usda.gov/fdc/v1";
  const existing = await prisma.food.findMany({
    where: { name: { startsWith: "[USDA]" } },
    select: { name: true },
  });
  const seen = new Set(existing.map(f => f.name.toLowerCase()));

  let imported = 0;
  for (const term of USDA_SEARCH_TERMS) {
    const url = `${BASE}/foods/search?query=${encodeURIComponent(term)}&dataType=Foundation,SR%20Legacy&pageSize=3&api_key=${USDA_API_KEY}`;
    try {
      const resp = await fetch(url);
      const data = await resp.json();
      for (const hit of (data.foods || [])) {
        const nameKey = hit.description.toLowerCase();
        if (seen.has(nameKey)) continue;

        await new Promise(r => setTimeout(r, 1200)); // rate limit
        const detailResp = await fetch(`${BASE}/food/${hit.fdcId}?api_key=${USDA_API_KEY}`);
        const detail = await detailResp.json();
        const nutrients = detail.foodNutrients || [];

        const find = (pat: string) => {
          const m = nutrients.find((n: any) => n.nutrient?.name?.toLowerCase().includes(pat));
          return m?.amount ?? 0;
        };

        const cal = find("energy");
        const pro = find("protein");
        const fat = find("total lipid");
        const car = find("carbohydrate, by difference") || find("carbohydrate");
        const na = find("sodium, na") || null;

        if (cal === 0 && pro === 0 && fat === 0) {
          seen.add(nameKey);
          continue;
        }

        const cat = (detail.foodCategory?.description || "").toLowerCase();
        let sub = "other";
        if (cat.includes("vegetable")) sub = "vegetable";
        else if (cat.includes("fruit")) sub = "fruit";
        else if (cat.includes("poultry") || cat.includes("beef") || cat.includes("pork")) sub = "meat";
        else if (cat.includes("fish") || cat.includes("seafood")) sub = "seafood";
        else if (cat.includes("grain") || cat.includes("cereal") || cat.includes("pasta")) sub = "grain";
        else if (cat.includes("dairy") || cat.includes("egg")) sub = "dairy";
        else if (cat.includes("nut") || cat.includes("seed")) sub = "nut";
        else if (cat.includes("oil") || cat.includes("fat")) sub = "oil";

        await prisma.food.create({
          data: {
            name: `[USDA] ${hit.description}`,
            nameEn: hit.description,
            category: "general",
            subcategory: sub,
            caloriesPer100g: Math.round(cal * 10) / 10,
            proteinPer100g: Math.round(pro * 10) / 10,
            fatPer100g: Math.round(fat * 10) / 10,
            carbsPer100g: Math.round(car * 10) / 10,
            sodiumPer100g: na ? Math.round(na * 10) / 10 : null,
            servings: {
              create: [
                { unitName: "100g", gramsPerUnit: 100 },
                { unitName: "g", gramsPerUnit: 1 },
              ],
            },
          },
        });

        imported++;
        seen.add(nameKey);
        process.stdout.write(".");
        if (imported % 20 === 0) console.log(` ${imported}`);
      }
    } catch (e) {
      // skip individual failures
    }
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log(`\n  USDA: ${imported} imported`);
}

// ─── Branded food import ─────────────────────────────────────────────────────
async function importBranded() {
  const items = loadBrandedFoods();
  const existing = await prisma.food.findMany({
    where: {
      OR: [
        { name: { startsWith: "[Subway]" } },
        { name: { startsWith: "[Starbucks]" } },
        { name: { startsWith: "[GYG]" } },
      ],
    },
    select: { name: true },
  });
  const seen = new Set(existing.map(f => f.name.toLowerCase()));

  let imported = 0;
  let skipped = 0;

  for (const item of items) {
    if (seen.has(item.name.toLowerCase())) {
      skipped++;
      continue;
    }

    const factor = 100 / item.size;
    await prisma.food.create({
      data: {
        name: item.name,
        nameEn: item.nameEn,
        category: item.category,
        subcategory: item.subcategory,
        caloriesPer100g: Math.round(item.cal * factor * 10) / 10,
        proteinPer100g: Math.round(item.pro * factor * 10) / 10,
        fatPer100g: Math.round(item.fat * factor * 10) / 10,
        carbsPer100g: Math.round(item.car * factor * 10) / 10,
        sodiumPer100g: item.na ? Math.round(item.na * factor * 10) / 10 : null,
        servings: {
          create: [
            { unitName: "개", gramsPerUnit: item.size },
            { unitName: "g", gramsPerUnit: 1 },
          ],
        },
      },
    });

    imported++;
    seen.add(item.name.toLowerCase());
  }

  console.log(`  Branded: ${imported} imported, ${skipped} already existed`);
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`🌱 Seeding foods into: ${dbUrl.replace(/\/\/.*@/, "//***@")}\n`);

  // Count before
  const before = await prisma.food.count();
  console.log(`  Before: ${before} foods`);

  // Import branded foods first (fast, no API calls)
  await importBranded();

  // Then USDA (slow, API rate-limited)
  await importUSDA();

  // Count after
  const after = await prisma.food.count();
  console.log(`\n  After: ${after} foods (+${after - before})`);
  console.log("✅ Done!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
