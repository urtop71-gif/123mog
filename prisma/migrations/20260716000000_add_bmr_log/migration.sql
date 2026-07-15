-- CreateTable
CREATE TABLE "BmrLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "bmr" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BmrLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "BmrLog_userId_date_idx" ON "BmrLog"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "BmrLog_userId_date_key" ON "BmrLog"("userId", "date");
