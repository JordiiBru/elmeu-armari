-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Garment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "texture" TEXT,
    "pattern" TEXT,
    "size" TEXT,
    "subtype" TEXT,
    "length" TEXT,
    "fit" TEXT,
    "notes" TEXT,
    "image" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Garment" ("category", "createdAt", "fit", "id", "image", "length", "notes", "pattern", "size", "subtype", "texture", "updatedAt") SELECT "category", "createdAt", "fit", "id", "image", "length", "notes", "pattern", "size", "subtype", "texture", "updatedAt" FROM "Garment";
DROP TABLE "Garment";
ALTER TABLE "new_Garment" RENAME TO "Garment";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
