-- CreateTable
CREATE TABLE "Song" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "spotifyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "previewUrl" TEXT,
    "lyrics" TEXT NOT NULL,
    "maskedLyrics" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Game_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Song_spotifyId_key" ON "Song"("spotifyId");

-- CreateIndex
CREATE INDEX "Song_spotifyId_idx" ON "Song"("spotifyId");

-- CreateIndex
CREATE UNIQUE INDEX "Game_date_key" ON "Game"("date");

-- CreateIndex
CREATE INDEX "Game_date_idx" ON "Game"("date");

-- CreateIndex
CREATE INDEX "Game_songId_idx" ON "Game"("songId");
