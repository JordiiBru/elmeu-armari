-- AlterTable
ALTER TABLE "WornEvent" ADD COLUMN "settledAt" DATETIME;

-- Existing rows predate the lazy end-of-day dirtying model: under the old
-- one-action behaviour, wearing an outfit dirtied its pieces immediately,
-- so calendar history up to this point has already had its effect. Mark
-- it settled so the new lazy settle logic (added in the same release)
-- only applies going forward, instead of mass-dirtying garments the first
-- time this migration runs.
UPDATE "WornEvent" SET "settledAt" = CURRENT_TIMESTAMP;
