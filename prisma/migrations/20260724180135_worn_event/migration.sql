-- CreateTable
CREATE TABLE "WornEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "outfitId" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WornEvent_outfitId_fkey" FOREIGN KEY ("outfitId") REFERENCES "Outfit" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "WornEvent_outfitId_idx" ON "WornEvent"("outfitId");

-- CreateIndex
CREATE INDEX "WornEvent_date_idx" ON "WornEvent"("date");
