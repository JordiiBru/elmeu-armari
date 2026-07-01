-- CreateTable
CREATE TABLE "Garment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "texture" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "fit" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Color" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hex" TEXT NOT NULL,
    "garmentId" TEXT NOT NULL,
    CONSTRAINT "Color_garmentId_fkey" FOREIGN KEY ("garmentId") REFERENCES "Garment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GarmentSeason" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "garmentId" TEXT NOT NULL,
    "season" TEXT NOT NULL,
    CONSTRAINT "GarmentSeason_garmentId_fkey" FOREIGN KEY ("garmentId") REFERENCES "Garment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Color_garmentId_idx" ON "Color"("garmentId");

-- CreateIndex
CREATE INDEX "GarmentSeason_garmentId_idx" ON "GarmentSeason"("garmentId");

-- CreateIndex
CREATE UNIQUE INDEX "GarmentSeason_garmentId_season_key" ON "GarmentSeason"("garmentId", "season");
