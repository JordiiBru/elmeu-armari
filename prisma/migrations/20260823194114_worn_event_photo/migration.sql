-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_WornEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "outfitId" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settledAt" DATETIME,
    "image" TEXT,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WornEvent_outfitId_fkey" FOREIGN KEY ("outfitId") REFERENCES "Outfit" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_WornEvent" ("date", "id", "outfitId", "settledAt") SELECT "date", "id", "outfitId", "settledAt" FROM "WornEvent";
DROP TABLE "WornEvent";
ALTER TABLE "new_WornEvent" RENAME TO "WornEvent";
CREATE INDEX "WornEvent_outfitId_idx" ON "WornEvent"("outfitId");
CREATE UNIQUE INDEX "WornEvent_date_key" ON "WornEvent"("date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
