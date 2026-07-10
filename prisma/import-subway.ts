/**
 * Subway Singapore nutrition importer
 * Run: npx tsx prisma/import-subway.ts
 */

import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import "dotenv/config";
import fs from "fs";

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL || "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

interface SubwayItem {
  size: string;
  cal: string;
  pro: string;
  fat: string;
  car: string;
  na: string;
}

const data: [string, SubwayItem][] = JSON.parse(
  fs.readFileSync("prisma/data/subway-nutrition.json", "utf-8")
);

// Serving units per category
function getServings(name: string) {
  if (name.includes("Soup")) {
    return [
      { unitName: "컵", gramsPerUnit: 240 },
      { unitName: "g", gramsPerUnit: 1 },
    ];
  }
  // 6-inch sub: ~230g including veggies + bread
  return [
    { unitName: "개", gramsPerUnit: 230 },
    { unitName: "g", gramsPerUnit: 1 },
  ];
}

async function main() {
  console.log(`Importing ${data.length} Subway Singapore items...\n`);

  const existing = await prisma.food.findMany({
    where: { name: { startsWith: "[Subway]" } },
    select: { name: true },
  });
  const seen = new Set(existing.map(f => f.name.toLowerCase()));

  let imported = 0;
  let skipped = 0;

  for (const [name, item] of data) {
    const foodName = `[Subway] ${name}`;
    if (seen.has(foodName.toLowerCase())) {
      skipped++;
      continue;
    }

    const servingG = parseFloat(item.size);
    const factor = 100 / servingG;

    await prisma.food.create({
      data: {
        name: foodName,
        nameEn: `Subway ${name}`,
        category: "western",
        subcategory: name.includes("Soup") ? "soup" : "sandwich",
        caloriesPer100g: Math.round(parseFloat(item.cal) * factor * 10) / 10,
        proteinPer100g: Math.round(parseFloat(item.pro) * factor * 10) / 10,
        fatPer100g: Math.round(parseFloat(item.fat) * factor * 10) / 10,
        carbsPer100g: Math.round(parseFloat(item.car) * factor * 10) / 10,
        sodiumPer100g: Math.round(parseFloat(item.na) * factor * 10) / 10,
        servings: { create: getServings(name) },
      },
    });

    const cal100 = Math.round(parseFloat(item.cal) * factor);
    console.log(`  ${name.padEnd(40)} ${cal100}kcal/100g`);
    imported++;
    seen.add(foodName.toLowerCase());
  }

  console.log(`\n✅ ${imported} imported, ${skipped} skipped`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
