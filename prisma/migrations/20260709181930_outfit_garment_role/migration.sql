-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_OutfitGarment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "outfitId" TEXT NOT NULL,
    "garmentId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'primary',
    CONSTRAINT "OutfitGarment_outfitId_fkey" FOREIGN KEY ("outfitId") REFERENCES "Outfit" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OutfitGarment_garmentId_fkey" FOREIGN KEY ("garmentId") REFERENCES "Garment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_OutfitGarment" ("garmentId", "id", "outfitId") SELECT "garmentId", "id", "outfitId" FROM "OutfitGarment";
DROP TABLE "OutfitGarment";
ALTER TABLE "new_OutfitGarment" RENAME TO "OutfitGarment";
CREATE INDEX "OutfitGarment_outfitId_idx" ON "OutfitGarment"("outfitId");
CREATE INDEX "OutfitGarment_garmentId_idx" ON "OutfitGarment"("garmentId");
CREATE UNIQUE INDEX "OutfitGarment_outfitId_garmentId_key" ON "OutfitGarment"("outfitId", "garmentId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
