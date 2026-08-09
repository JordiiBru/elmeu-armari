-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Outfit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "paletteId" INTEGER,
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Outfit" ("createdAt", "favorite", "id", "name", "paletteId", "updatedAt") SELECT "createdAt", "favorite", "id", "name", "paletteId", "updatedAt" FROM "Outfit";
DROP TABLE "Outfit";
ALTER TABLE "new_Outfit" RENAME TO "Outfit";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
