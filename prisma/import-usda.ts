/**
 * USDA FoodData Central importer
 * 
 * Pulls basic ingredients from USDA Foundation Foods + SR Legacy databases.
 * Run: npx tsx prisma/import-usda.ts
 * 
 * API key required in USDA_API_KEY env var.
 * Rate limit: ~3,600 requests/hour (1/sec sustained).
 */

import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import "dotenv/config";

const API_KEY = process.env.USDA_API_KEY;
if (!API_KEY) {
  console.error("❌ USDA_API_KEY env var required. Get one at https://fdc.nal.usda.gov/api-guide.html");
  process.exit(1);
}

const BASE = "https://api.nal.usda.gov/fdc/v1";
const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL || "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

// ─── Food groups to pull ────────────────────────────────────────────────────
const SEARCH_TERMS = [
  // Proteins
  "chicken breast raw", "chicken thigh raw", "beef sirloin raw", "beef ground raw",
  "pork loin raw", "pork belly raw", "salmon raw", "tuna raw", "shrimp raw",
  "egg whole raw", "tofu firm", "tofu soft",
  // Grains & starches
  "white rice cooked", "brown rice cooked", "pasta cooked", "bread whole wheat",
  "oatmeal cooked", "quinoa cooked", "sweet potato raw", "potato raw",
  // Vegetables
  "broccoli raw", "spinach raw", "kale raw", "lettuce romaine", "cabbage raw",
  "carrot raw", "onion raw", "garlic raw", "tomato raw", "cucumber raw",
  "bell pepper raw", "mushroom raw", "zucchini raw", "celery raw",
  // Fruits
  "apple raw", "banana raw", "orange raw", "grape raw", "strawberry raw",
  "blueberry raw", "watermelon raw", "avocado raw",
  // Dairy & alternatives
  "milk whole", "milk skim", "yogurt plain", "cheese cheddar", "butter salted",
  // Fats & oils
  "olive oil", "vegetable oil", "sesame oil",
  // Nuts & seeds
  "almond raw", "walnut raw", "peanut raw", "sunflower seed raw",
  // Seasonings & basics
  "soy sauce", "salt table", "sugar white", "honey", "vinegar rice",
];

// USDA category → app category mapping
function mapCategory(usdaCategory: string): { category: string; subcategory: string } {
  const c = (usdaCategory || "").toLowerCase();
  if (c.includes("vegetable")) return { category: "general", subcategory: "vegetable" };
  if (c.includes("fruit")) return { category: "general", subcategory: "fruit" };
  if (c.includes("poultry") || c.includes("beef") || c.includes("pork") || c.includes("lamb"))
    return { category: "general", subcategory: "meat" };
  if (c.includes("fish") || c.includes("seafood") || c.includes("shellfish"))
    return { category: "general", subcategory: "seafood" };
  if (c.includes("grain") || c.includes("cereal") || c.includes("pasta") || c.includes("rice"))
    return { category: "general", subcategory: "grain" };
  if (c.includes("dairy") || c.includes("egg"))
    return { category: "general", subcategory: "dairy" };
  if (c.includes("nut") || c.includes("seed"))
    return { category: "general", subcategory: "nut" };
  if (c.includes("oil") || c.includes("fat"))
    return { category: "general", subcategory: "oil" };
  if (c.includes("spice") || c.includes("herb") || c.includes("condiment"))
    return { category: "general", subcategory: "seasoning" };
  if (c.includes("beverage"))
    return { category: "beverage", subcategory: "drink" };
  if (c.includes("legume") || c.includes("bean"))
    return { category: "general", subcategory: "legume" };
  return { category: "general", subcategory: "other" };
}

// ─── API helpers ─────────────────────────────────────────────────────────────
async function fetchJSON(url: string) {
  const resp = await fetch(url);
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`HTTP ${resp.status}: ${text.slice(0, 200)}`);
  }
  return resp.json();
}

async function searchFoods(query: string, limit = 10) {
  const url = `${BASE}/foods/search?query=${encodeURIComponent(query)}&dataType=Foundation,SR%20Legacy&pageSize=${limit}&api_key=${API_KEY}`;
  const data = await fetchJSON(url);
  return data.foods || [];
}

async function getFoodDetail(fdcId: number) {
  const url = `${BASE}/food/${fdcId}?api_key=${API_KEY}`;
  return fetchJSON(url);
}

// ─── Nutrient extraction per 100g ────────────────────────────────────────────
function extractMacros(foodDetail: any) {
  const nutrients = foodDetail.foodNutrients || [];
  const find = (namePattern: string) => {
    const match = nutrients.find((n: any) =>
      n.nutrient?.name?.toLowerCase().includes(namePattern)
    );
    return match?.amount ?? null;
  };

  return {
    caloriesPer100g: find("energy") ?? 0,
    proteinPer100g: find("protein") ?? 0,
    fatPer100g: find("total lipid") ?? 0,
    carbsPer100g: find("carbohydrate, by difference") ?? find("carbohydrate") ?? 0,
    sodiumPer100g: find("sodium, na") ?? null,
  };
}

// ─── Serving units ───────────────────────────────────────────────────────────
function extractServings(foodDetail: any) {
  const portions = foodDetail.foodPortions || [];
  const servings: { unitName: string; gramsPerUnit: number }[] = [];

  // Always add 100g and 1g base units
  servings.push({ unitName: "100g", gramsPerUnit: 100 });
  servings.push({ unitName: "g", gramsPerUnit: 1 });

  for (const p of portions) {
    if (!p.gramWeight || p.gramWeight <= 0) continue;
    const unit = (p.measureUnit?.name || p.modifier || "serving").toLowerCase();
    const name = unit === "undetermined" ? "serving" : unit;
    // Avoid duplicates and weird units
    if (name === "g" || name === "100g") continue;
    if (servings.find(s => s.unitName === name)) continue;
    servings.push({ unitName: name, gramsPerUnit: Math.round(p.gramWeight) });
  }

  return servings.slice(0, 6); // Max 6 serving units
}

// ─── Main import ─────────────────────────────────────────────────────────────
async function main() {
  console.log("🔍 Fetching USDA food data...\n");

  let imported = 0;
  let skipped = 0;
  const seen = new Set<string>();

  // Load existing food names for dedup
  const existing = await prisma.food.findMany({
    select: { name: true, nameEn: true },
    where: { userId: null }, // only check shared foods
  });
  for (const f of existing) {
    seen.add(f.name.toLowerCase());
    if (f.nameEn) seen.add(f.nameEn.toLowerCase());
    // Also add English translation via parentheses
    const enName = f.nameEn || "";
    seen.add(enName.toLowerCase());
  }

  for (const term of SEARCH_TERMS) {
    console.log(`Searching: "${term}"...`);
    const results = await searchFoods(term, 5);
    
    for (const hit of results) {
      const name = `[USDA] ${hit.description}`;
      const nameKey = hit.description.toLowerCase();
      
      if (seen.has(nameKey)) {
        skipped++;
        continue;
      }

      // Rate limit: 1 req/sec
      await new Promise(r => setTimeout(r, 1200));

      try {
        const detail = await getFoodDetail(hit.fdcId);
        const macros = extractMacros(detail);
        
        // Skip foods with no meaningful macros
        if (macros.caloriesPer100g === 0 && macros.proteinPer100g === 0 && macros.fatPer100g === 0) {
          skipped++;
          continue;
        }

        const { category, subcategory } = mapCategory(
          detail.foodCategory?.description || detail.foodCategory || ""
        );
        const servings = extractServings(detail);
        const nameEn = hit.description;

        await prisma.food.create({
          data: {
            name,
            nameEn,
            category,
            subcategory,
            caloriesPer100g: macros.caloriesPer100g,
            proteinPer100g: macros.proteinPer100g,
            fatPer100g: macros.fatPer100g,
            carbsPer100g: macros.carbsPer100g,
            sodiumPer100g: macros.sodiumPer100g,
            servings: {
              create: servings.map(s => ({
                unitName: s.unitName,
                gramsPerUnit: s.gramsPerUnit,
              })),
            },
          },
        });

        imported++;
        seen.add(nameKey);
        process.stdout.write(".");

        // Batch commit every 20 to avoid runaway memory
        if (imported % 20 === 0) {
          console.log(` ${imported} imported, ${skipped} skipped`);
        }
      } catch (err: any) {
        // Skip individual food errors silently
        skipped++;
      }
    }

    // Longer pause between search terms
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log(`\n\n✅ Done: ${imported} imported, ${skipped} skipped`);
  
  // Show final counts
  const counts = await prisma.food.groupBy({
    by: ["category"],
    _count: true,
    orderBy: { _count: { category: "desc" } },
  });
  console.log("\n📊 Database summary:");
  for (const c of counts) {
    console.log(`  ${c.category}: ${c._count.category} foods`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
