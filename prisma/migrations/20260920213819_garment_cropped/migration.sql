-- Cropped is a body length, not a fit: it could not be picked together with
-- OVERSIZED, and a boxy crop is a common look. It becomes its own flag.
-- A plain ADD COLUMN (no table rebuild) since SQLite can do it in place.
ALTER TABLE "Garment" ADD COLUMN "cropped" BOOLEAN NOT NULL DEFAULT false;

-- Pieces that carried CROPPED as their fit keep it as the flag. Their fit
-- becomes "not specified": the old value said nothing else about the cut.
UPDATE "Garment" SET "cropped" = 1, "fit" = NULL WHERE "fit" = 'CROPPED';
