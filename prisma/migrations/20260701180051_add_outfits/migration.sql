-- CreateTable
CREATE TABLE "Outfit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "paletteId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "OutfitGarment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "outfitId" TEXT NOT NULL,
    "garmentId" TEXT NOT NULL,
    CONSTRAINT "OutfitGarment_outfitId_fkey" FOREIGN KEY ("outfitId") REFERENCES "Outfit" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OutfitGarment_garmentId_fkey" FOREIGN KEY ("garmentId") REFERENCES "Garment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "OutfitGarment_outfitId_idx" ON "OutfitGarment"("outfitId");

-- CreateIndex
CREATE INDEX "OutfitGarment_garmentId_idx" ON "OutfitGarment"("garmentId");

-- CreateIndex
CREATE UNIQUE INDEX "OutfitGarment_outfitId_garmentId_key" ON "OutfitGarment"("outfitId", "garmentId");
