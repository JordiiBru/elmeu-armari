/*
  Every wardrobe used to be one shared pool. Each existing row now belongs to
  the oldest account, which is the owner: the app had a single user until
  accounts multiplied, and any later account starts with an empty wardrobe.
  The backfill is the subselect in each INSERT; a table with no rows never
  evaluates it, so a fresh database migrates without any user existing.
*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Garment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "texture" TEXT,
    "pattern" TEXT,
    "size" TEXT,
    "subtype" TEXT,
    "length" TEXT,
    "fit" TEXT,
    "notes" TEXT,
    "image" TEXT,
    "dirtySince" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Garment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Garment" ("userId", "category", "createdAt", "dirtySince", "fit", "id", "image", "length", "notes", "pattern", "size", "subtype", "texture", "updatedAt") SELECT (SELECT "id" FROM "User" ORDER BY "createdAt" ASC LIMIT 1), "category", "createdAt", "dirtySince", "fit", "id", "image", "length", "notes", "pattern", "size", "subtype", "texture", "updatedAt" FROM "Garment";
DROP TABLE "Garment";
ALTER TABLE "new_Garment" RENAME TO "Garment";
CREATE INDEX "Garment_userId_idx" ON "Garment"("userId");
CREATE TABLE "new_Outfit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT,
    "paletteId" INTEGER NOT NULL,
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Outfit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Outfit" ("userId", "createdAt", "favorite", "id", "name", "paletteId", "updatedAt") SELECT (SELECT "id" FROM "User" ORDER BY "createdAt" ASC LIMIT 1), "createdAt", "favorite", "id", "name", "paletteId", "updatedAt" FROM "Outfit";
DROP TABLE "Outfit";
ALTER TABLE "new_Outfit" RENAME TO "Outfit";
CREATE INDEX "Outfit_userId_idx" ON "Outfit"("userId");
CREATE TABLE "new_WornEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "outfitId" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settledAt" DATETIME,
    "image" TEXT,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WornEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WornEvent_outfitId_fkey" FOREIGN KEY ("outfitId") REFERENCES "Outfit" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_WornEvent" ("userId", "date", "id", "image", "outfitId", "settledAt", "updatedAt") SELECT (SELECT "id" FROM "User" ORDER BY "createdAt" ASC LIMIT 1), "date", "id", "image", "outfitId", "settledAt", "updatedAt" FROM "WornEvent";
DROP TABLE "WornEvent";
ALTER TABLE "new_WornEvent" RENAME TO "WornEvent";
CREATE INDEX "WornEvent_outfitId_idx" ON "WornEvent"("outfitId");
CREATE UNIQUE INDEX "WornEvent_userId_date_key" ON "WornEvent"("userId", "date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
