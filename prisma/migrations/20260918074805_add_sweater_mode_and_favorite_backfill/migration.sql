-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "mustChangePw" BOOLEAN NOT NULL DEFAULT true,
    "sweaterMode" TEXT NOT NULL DEFAULT 'AUTO',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" DATETIME
);
INSERT INTO "new_User" ("createdAt", "id", "lastLoginAt", "mustChangePw", "passwordHash", "username") SELECT "createdAt", "id", "lastLoginAt", "mustChangePw", "passwordHash", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- Outfit.favorite has sat unused since it was added (every row is still its
-- column default, false). It becomes the gate for what "què em poso?" shows,
-- so existing saved outfits — already a deliberate keep under the one-tier
-- model that preceded favouriting — start favourited rather than vanishing
-- from that screen on first load.
UPDATE "Outfit" SET "favorite" = true WHERE "favorite" = false;
