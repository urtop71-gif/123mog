/**
 * Spot-check that raw staples from import-basic-ingredients.ts exist
 * in the database pointed at by DATABASE_URL.
 *
 * Run: npx tsx prisma/verify-basic-ingredients.ts
 * Exit 0 = all present; exit 1 = one or more missing.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const EXPECTED = [
  "토마토",
  "방울토마토",
  "오이",
  "당근",
  "양파",
  "양배추",
  "브로콜리",
  "시금치",
  "상추",
  "깻잎",
  "파프리카",
  "피망",
  "청양고추",
  "마늘",
  "대파",
  "애호박",
  "가지",
  "양송이버섯",
  "감자",
  "고구마",
  "무",
  "콩나물",
  "옥수수",
  "닭가슴살",
  "닭다리살",
  "소고기(등심)",
  "소고기(안심)",
  "돼지고기(삼겹살)",
  "돼지고기(안심)",
  "계란",
  "두부",
  "새우",
  "연어",
  "참치(생)",
] as const;

const dbUrl = process.env.DATABASE_URL || "file:./dev.db";
const safeUrl = dbUrl
  .replace(/\/\/.*@/, "//***@")
  .replace(/authToken=[^&]+/i, "authToken=***");

const prisma = new PrismaClient({
  adapter: new PrismaLibSql({ url: dbUrl }),
});

async function main() {
  console.log(`Checking foods in: ${safeUrl}\n`);

  const missing: string[] = [];
  for (const name of EXPECTED) {
    const row = await prisma.food.findFirst({
      where: { name, userId: null },
      select: { id: true },
    });
    if (!row) missing.push(name);
  }

  const total = await prisma.food.count();
  console.log(`Total foods: ${total}`);
  console.log(`Expected staples: ${EXPECTED.length}`);
  console.log(`Present: ${EXPECTED.length - missing.length}`);

  if (missing.length) {
    console.error(`\nMISSING (${missing.length}):`);
    for (const n of missing) console.error(`  - ${n}`);
    console.error("\nFix: npm run db:import:basic");
    process.exitCode = 1;
    return;
  }

  console.log("\nOK — all basic ingredients present.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
