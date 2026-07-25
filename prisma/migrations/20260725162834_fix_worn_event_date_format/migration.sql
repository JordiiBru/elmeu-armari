-- The one-outfit-per-day migration (20260725112541) normalized existing
-- WornEvent.date values with a literal "Z" suffix, but WornEvent.date is
-- a TEXT column and Prisma's better-sqlite3 driver adapter actually
-- serializes JS Date values with a "+00:00" suffix when the app writes
-- through it. "...T00:00:00.000Z" and "...T00:00:00.000+00:00" are the
-- same instant but different TEXT strings — the unique index on `date`
-- never caught them as duplicates, and any app-level upsert/delete using
-- an exact-match `date` filter never found rows written by that migration
-- (only rows the app itself had written). In production this let a
-- migrated old row and a new app-written row coexist for the same
-- calendar day: the calendar's range query picked up both, but exact-
-- match reads (Desats "portat avui", assign/clear) only ever saw the
-- app-written one — "treure" appeared to succeed but the day still
-- looked assigned.
--
-- Re-normalize to the format the app actually writes, and dedupe again
-- in case this let two rows accumulate for the same day (most recent
-- wins, same rule as the original migration).

DELETE FROM "WornEvent"
WHERE "id" NOT IN (
  SELECT "id" FROM (
    SELECT "id",
           ROW_NUMBER() OVER (PARTITION BY date("date") ORDER BY "date" DESC) AS rn
    FROM "WornEvent"
  )
  WHERE rn = 1
);

UPDATE "WornEvent" SET "date" = date("date") || 'T00:00:00.000+00:00';
