/*
  Warnings:

  - You are about to alter the column `geniusData` on the `Song` table. The data in that column could be lost. The data in that column will be cast from `Unsupported("json")` to `Json`.
  - You are about to alter the column `maskedLyrics` on the `Song` table. The data in that column could be lost. The data in that column will be cast from `Unsupported("json")` to `Json`.
  - You are about to alter the column `spotifyData` on the `Song` table. The data in that column could be lost. The data in that column will be cast from `Unsupported("json")` to `Json`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Guess" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gameId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "valid" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Guess_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Guess" ("createdAt", "gameId", "id", "playerId", "word") SELECT "createdAt", "gameId", "id", "playerId", "word" FROM "Guess";
DROP TABLE "Guess";
ALTER TABLE "new_Guess" RENAME TO "Guess";
CREATE INDEX "Guess_gameId_idx" ON "Guess"("gameId");
CREATE INDEX "Guess_playerId_idx" ON "Guess"("playerId");
CREATE UNIQUE INDEX "Guess_gameId_playerId_word_key" ON "Guess"("gameId", "playerId", "word");
CREATE TABLE "new_Song" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "spotifyId" TEXT NOT NULL,
    "spotifyData" JSONB NOT NULL,
    "geniusData" JSONB,
    "lyrics" TEXT NOT NULL,
    "maskedLyrics" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Song" ("createdAt", "geniusData", "id", "lyrics", "maskedLyrics", "spotifyData", "spotifyId", "updatedAt") SELECT "createdAt", "geniusData", "id", "lyrics", "maskedLyrics", "spotifyData", "spotifyId", "updatedAt" FROM "Song";
DROP TABLE "Song";
ALTER TABLE "new_Song" RENAME TO "Song";
CREATE INDEX "Song_spotifyId_idx" ON "Song"("spotifyId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
