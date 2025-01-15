/*
  Warnings:

  - You are about to drop the column `isCorrect` on the `Guess` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Guess" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "wasCorrect" BOOLEAN NOT NULL DEFAULT false,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Guess_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Guess" ("gameId", "id", "timestamp", "userId", "word") SELECT "gameId", "id", "timestamp", "userId", "word" FROM "Guess";
DROP TABLE "Guess";
ALTER TABLE "new_Guess" RENAME TO "Guess";
CREATE INDEX "Guess_userId_gameId_idx" ON "Guess"("userId", "gameId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
