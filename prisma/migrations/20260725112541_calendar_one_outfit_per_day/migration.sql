-- WornEvent moves from "one row per click" to "one row per calendar day"
-- (the weekly planner). Existing rows carry a click timestamp, not a
-- clean day, so this migration has to reconcile data before the new
-- unique constraint can be added.

-- 1. Where the old semantics logged more than one event on the same
--    calendar day (for the same or different outfits), keep only the
--    most recent one — the calendar model allows exactly one outfit
--    per day, so older same-day entries are superseded.
DELETE FROM "WornEvent"
WHERE "id" NOT IN (
  SELECT "id" FROM (
    SELECT "id",
           ROW_NUMBER() OVER (PARTITION BY date("date") ORDER BY "date" DESC) AS rn
    FROM "WornEvent"
  )
  WHERE rn = 1
);

-- 2. Truncate the surviving rows to day granularity so `date` reads as
--    a calendar day going forward, matching the new semantics.
UPDATE "WornEvent" SET "date" = date("date") || 'T00:00:00.000Z';

-- 3. Enforce "at most one outfit per day".
DROP INDEX IF EXISTS "WornEvent_date_idx";
CREATE UNIQUE INDEX "WornEvent_date_key" ON "WornEvent"("date");
