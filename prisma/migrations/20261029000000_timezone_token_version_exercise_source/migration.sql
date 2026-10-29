-- AlterTable
ALTER TABLE "User" ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'Asia/Seoul';

-- AlterTable
ALTER TABLE "User" ADD COLUMN "tokenVersion" INTEGER NOT NULL DEFAULT 0;

-- Existing rows keep their source. The old unique allowed only one row per
-- day, so dropping it and adding (userId, date, source) cannot collide.
DROP INDEX "ExerciseLog_userId_date_key";

-- CreateIndex
CREATE UNIQUE INDEX "ExerciseLog_userId_date_source_key" ON "ExerciseLog"("userId", "date", "source");
