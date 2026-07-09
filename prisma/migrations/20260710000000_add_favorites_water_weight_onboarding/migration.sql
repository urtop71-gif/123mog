-- CreateTable
CREATE TABLE "FavoriteFood" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FavoriteFood_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FavoriteFood_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WeightLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "weight" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WeightLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WaterLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "ml" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WaterLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Food" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "caloriesPer100g" REAL NOT NULL,
    "proteinPer100g" REAL NOT NULL,
    "fatPer100g" REAL NOT NULL,
    "carbsPer100g" REAL NOT NULL,
    "sodiumPer100g" REAL,
    "healthTags" TEXT,
    "userId" TEXT,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Food_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Food" ("caloriesPer100g", "carbsPer100g", "category", "fatPer100g", "healthTags", "id", "name", "nameEn", "proteinPer100g", "sodiumPer100g", "subcategory") SELECT "caloriesPer100g", "carbsPer100g", "category", "fatPer100g", "healthTags", "id", "name", "nameEn", "proteinPer100g", "sodiumPer100g", "subcategory" FROM "Food";
DROP TABLE "Food";
ALTER TABLE "new_Food" RENAME TO "Food";
CREATE INDEX "Food_name_idx" ON "Food"("name");
CREATE INDEX "Food_nameEn_idx" ON "Food"("nameEn");
CREATE INDEX "Food_userId_idx" ON "Food"("userId");
CREATE TABLE "new_FoodServing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "foodId" TEXT NOT NULL,
    "unitName" TEXT NOT NULL,
    "gramsPerUnit" REAL NOT NULL,
    CONSTRAINT "FoodServing_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_FoodServing" ("foodId", "gramsPerUnit", "id", "unitName") SELECT "foodId", "gramsPerUnit", "id", "unitName" FROM "FoodServing";
DROP TABLE "FoodServing";
ALTER TABLE "new_FoodServing" RENAME TO "FoodServing";
CREATE INDEX "FoodServing_foodId_idx" ON "FoodServing"("foodId");
CREATE TABLE "new_Meal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mealType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Meal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Meal" ("createdAt", "date", "id", "mealType", "userId") SELECT "createdAt", "date", "id", "mealType", "userId" FROM "Meal";
DROP TABLE "Meal";
ALTER TABLE "new_Meal" RENAME TO "Meal";
CREATE INDEX "Meal_userId_date_idx" ON "Meal"("userId", "date");
CREATE INDEX "Meal_userId_mealType_idx" ON "Meal"("userId", "mealType");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "age" INTEGER,
    "gender" TEXT,
    "height" REAL,
    "weight" REAL,
    "goalWeight" REAL,
    "activityLevel" TEXT,
    "bmr" REAL,
    "tdee" REAL,
    "dailyTarget" REAL,
    "proteinTarget" REAL,
    "fatTarget" REAL,
    "carbsTarget" REAL,
    "sodiumTarget" REAL,
    "targetsManual" BOOLEAN NOT NULL DEFAULT false,
    "waterTargetMl" INTEGER NOT NULL DEFAULT 2000,
    "healthConditions" TEXT,
    "onboardingDone" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("activityLevel", "age", "bmr", "carbsTarget", "createdAt", "dailyTarget", "email", "fatTarget", "gender", "goalWeight", "healthConditions", "height", "id", "name", "password", "proteinTarget", "sodiumTarget", "tdee", "updatedAt", "weight") SELECT "activityLevel", "age", "bmr", "carbsTarget", "createdAt", "dailyTarget", "email", "fatTarget", "gender", "goalWeight", "healthConditions", "height", "id", "name", "password", "proteinTarget", "sodiumTarget", "tdee", "updatedAt", "weight" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "FavoriteFood_userId_idx" ON "FavoriteFood"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FavoriteFood_userId_foodId_key" ON "FavoriteFood"("userId", "foodId");

-- CreateIndex
CREATE INDEX "WeightLog_userId_date_idx" ON "WeightLog"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "WeightLog_userId_date_key" ON "WeightLog"("userId", "date");

-- CreateIndex
CREATE INDEX "WaterLog_userId_date_idx" ON "WaterLog"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "WaterLog_userId_date_key" ON "WaterLog"("userId", "date");

-- CreateIndex
CREATE INDEX "MealItem_mealId_idx" ON "MealItem"("mealId");

-- CreateIndex
CREATE INDEX "MealItem_foodId_idx" ON "MealItem"("foodId");

