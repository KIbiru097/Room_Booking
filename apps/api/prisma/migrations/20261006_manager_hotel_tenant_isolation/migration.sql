-- Enforce the manager -> hotel one-to-one ownership invariant.
-- Existing duplicate assignments are retained on the oldest hotel; later
-- hotels become unassigned and can be explicitly reassigned by an admin.
WITH ranked_manager_hotels AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY "managerId"
      ORDER BY "createdAt" ASC, id ASC
    ) AS manager_rank
  FROM "Hotel"
  WHERE "managerId" IS NOT NULL
)
UPDATE "Hotel" AS hotel
SET "managerId" = NULL
FROM ranked_manager_hotels AS ranked
WHERE hotel.id = ranked.id
  AND ranked.manager_rank > 1;

CREATE UNIQUE INDEX "Hotel_managerId_key" ON "Hotel"("managerId");
