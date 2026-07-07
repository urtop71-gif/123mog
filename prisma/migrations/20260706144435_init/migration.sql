-- CreateTable
CREATE TABLE "User" (
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Food" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "caloriesPer100g" REAL NOT NULL,
    "proteinPer100g" REAL NOT NULL,
    "fatPer100g" REAL NOT NULL,
    "carbsPer100g" REAL NOT NULL
);

-- CreateTable
CREATE TABLE "FoodServing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "foodId" TEXT NOT NULL,
    "unitName" TEXT NOT NULL,
    "gramsPerUnit" REAL NOT NULL,
    CONSTRAINT "FoodServing_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Meal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mealType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Meal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MealItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mealId" TEXT NOT NULL,
    "foodId" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "unitName" TEXT NOT NULL,
    "gramsPerUnit" REAL NOT NULL,
    "totalGrams" REAL NOT NULL,
    "totalCalories" REAL NOT NULL,
    "totalProtein" REAL NOT NULL,
    "totalFat" REAL NOT NULL,
    "totalCarbs" REAL NOT NULL,
    CONSTRAINT "MealItem_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MealItem_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
