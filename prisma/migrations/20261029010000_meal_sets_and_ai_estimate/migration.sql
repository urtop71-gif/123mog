-- AlterTable
ALTER TABLE "Food" ADD COLUMN "isAiEstimate" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "MealSet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mealType" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MealSet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MealSetItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mealSetId" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "unitName" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "MealSetItem_mealSetId_fkey" FOREIGN KEY ("mealSetId") REFERENCES "MealSet" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MealSetItem_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "MealSet_userId_idx" ON "MealSet"("userId");

-- CreateIndex
CREATE INDEX "MealSetItem_mealSetId_idx" ON "MealSetItem"("mealSetId");

-- CreateIndex
CREATE INDEX "MealSetItem_foodId_idx" ON "MealSetItem"("foodId");
