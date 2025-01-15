/*
  Warnings:

  - You are about to drop the column `wasCorrect` on the `Guess` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Game" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "randomSeed" TEXT NOT NULL,
    "playlistId" TEXT NOT NULL,
    "overrideSongId" TEXT,
    "selectedTrackIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Game" ("createdAt", "date", "id", "overrideSongId", "playlistId", "randomSeed", "updatedAt") SELECT "createdAt", "date", "id", "overrideSongId", "playlistId", "randomSeed", "updatedAt" FROM "Game";
DROP TABLE "Game";
ALTER TABLE "new_Game" RENAME TO "Game";
CREATE UNIQUE INDEX "Game_date_key" ON "Game"("date");
CREATE TABLE "new_Guess" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Guess_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Guess" ("gameId", "id", "timestamp", "userId", "word") SELECT "gameId", "id", "timestamp", "userId", "word" FROM "Guess";
DROP TABLE "Guess";
ALTER TABLE "new_Guess" RENAME TO "Guess";
CREATE INDEX "Guess_userId_idx" ON "Guess"("userId");
CREATE INDEX "Guess_gameId_idx" ON "Guess"("gameId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
