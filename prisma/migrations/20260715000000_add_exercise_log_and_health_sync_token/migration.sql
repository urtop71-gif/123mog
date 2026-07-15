-- AlterTable
ALTER TABLE "User" ADD COLUMN "healthSyncTokenHash" TEXT;

-- CreateTable
CREATE TABLE "ExerciseLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "calories" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ExerciseLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ExerciseLog_userId_date_idx" ON "ExerciseLog"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ExerciseLog_userId_date_key" ON "ExerciseLog"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "User_healthSyncTokenHash_key" ON "User"("healthSyncTokenHash");
