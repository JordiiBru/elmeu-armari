-- CreateTable
CREATE TABLE "WornEventGarment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "wornEventId" TEXT NOT NULL,
    "garmentId" TEXT NOT NULL,
    CONSTRAINT "WornEventGarment_wornEventId_fkey" FOREIGN KEY ("wornEventId") REFERENCES "WornEvent" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WornEventGarment_garmentId_fkey" FOREIGN KEY ("garmentId") REFERENCES "Garment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "WornEventGarment_wornEventId_idx" ON "WornEventGarment"("wornEventId");

-- CreateIndex
CREATE INDEX "WornEventGarment_garmentId_idx" ON "WornEventGarment"("garmentId");

-- CreateIndex
CREATE UNIQUE INDEX "WornEventGarment_wornEventId_garmentId_key" ON "WornEventGarment"("wornEventId", "garmentId");

-- The data steps below must run while `OutfitGarment.role` still exists,
-- i.e. before the table rebuild at the end of this file. Order is not
-- negotiable: backfill reads the extras off the outfit a day points at,
-- and the merge is only correct once nothing depends on those extras.

-- DataMigration: every existing worn day inherits the extras of the outfit
-- it points at. `id` is a plain String column, and cuid cannot be generated
-- in SQL, so a random hex stands in.
INSERT INTO "WornEventGarment" ("id", "wornEventId", "garmentId")
SELECT lower(hex(randomblob(16))), w."id", og."garmentId"
FROM "WornEvent" w
JOIN "OutfitGarment" og ON og."outfitId" = w."outfitId" AND og."role" = 'extra';

-- DataMigration: with extras gone, outfits that differed only by shoes are
-- the same outfit. The signature is paletteId + the sorted set of core
-- garment ids; group_concat over an already-ordered derived table is the
-- portable way to make it deterministic (`group_concat(... ORDER BY ...)`
-- is not guaranteed by the SQLite build behind `migrate deploy`).
CREATE TEMP TABLE "outfit_signature" AS
SELECT o."id" AS outfitId, o."createdAt" AS createdAt,
       o."paletteId" || ':' || IFNULL((
         SELECT group_concat(g."garmentId") FROM (
           SELECT "garmentId" FROM "OutfitGarment"
           WHERE "outfitId" = o."id" AND "role" = 'primary' ORDER BY "garmentId"
         ) g), '') AS sig
FROM "Outfit" o;

-- Oldest wins; the id breaks ties so the choice never depends on row order.
-- Every outfit gets a row, a unique one mapping to itself.
CREATE TEMP TABLE "outfit_merge" AS
SELECT s.outfitId AS loser,
       (SELECT s2.outfitId FROM "outfit_signature" s2
        WHERE s2.sig = s.sig ORDER BY s2.createdAt ASC, s2.outfitId ASC LIMIT 1) AS winner
FROM "outfit_signature" s;

UPDATE "Outfit" SET "favorite" = 1
WHERE "id" IN (SELECT m.winner FROM "outfit_merge" m
               JOIN "Outfit" o ON o."id" = m.loser WHERE o."favorite" = 1);

UPDATE "WornEvent" SET "outfitId" =
  (SELECT winner FROM "outfit_merge" WHERE loser = "WornEvent"."outfitId");

-- Dropped explicitly rather than through ON DELETE CASCADE: whether the
-- connection running this migration has `PRAGMA foreign_keys` on is not
-- something a migration should have to assume.
DELETE FROM "OutfitGarment"
WHERE "outfitId" IN (SELECT loser FROM "outfit_merge" WHERE loser <> winner);

DELETE FROM "Outfit"
WHERE "id" IN (SELECT loser FROM "outfit_merge" WHERE loser <> winner);

DROP TABLE "outfit_merge";
DROP TABLE "outfit_signature";

-- DataMigration: extras now live on the day, never on the outfit.
DELETE FROM "OutfitGarment" WHERE "role" = 'extra';

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_OutfitGarment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "outfitId" TEXT NOT NULL,
    "garmentId" TEXT NOT NULL,
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
