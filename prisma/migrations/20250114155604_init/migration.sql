-- CreateTable
CREATE TABLE "GameConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "randomSeed" TEXT NOT NULL,
    "playlistId" TEXT NOT NULL,
    "overrideSongId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Guess" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "gameConfigId" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Guess_gameConfigId_fkey" FOREIGN KEY ("gameConfigId") REFERENCES "GameConfig" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CachedSpotifyTrack" (
    "spotifyId" TEXT NOT NULL PRIMARY KEY,
    "data" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CachedSpotifyPlaylist" (
    "spotifyId" TEXT NOT NULL PRIMARY KEY,
    "data" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CachedGeniusLyrics" (
    "geniusId" TEXT NOT NULL PRIMARY KEY,
    "spotifyId" TEXT NOT NULL,
    "lyrics" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "GameConfig_date_key" ON "GameConfig"("date");

-- CreateIndex
CREATE INDEX "Guess_userId_gameConfigId_idx" ON "Guess"("userId", "gameConfigId");

-- CreateIndex
CREATE UNIQUE INDEX "CachedGeniusLyrics_spotifyId_key" ON "CachedGeniusLyrics"("spotifyId");
