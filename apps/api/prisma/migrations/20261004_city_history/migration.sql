CREATE TABLE IF NOT EXISTS "CityHistory" (
  "id" TEXT NOT NULL,
  "cityId" TEXT NOT NULL,
  "tagline" TEXT,
  "overview" TEXT,
  "timeline" JSONB NOT NULL,
  "stories" JSONB NOT NULL,
  "culture" JSONB NOT NULL,
  "sourceId" TEXT,
  "verifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CityHistory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CityHistory_cityId_key" ON "CityHistory"("cityId");
CREATE INDEX IF NOT EXISTS "CityHistory_sourceId_idx" ON "CityHistory"("sourceId");
CREATE INDEX IF NOT EXISTS "CityHistory_verifiedAt_idx" ON "CityHistory"("verifiedAt");

ALTER TABLE "CityHistory" DROP CONSTRAINT IF EXISTS "CityHistory_cityId_fkey";
ALTER TABLE "CityHistory" ADD CONSTRAINT "CityHistory_cityId_fkey"
  FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CityHistory" DROP CONSTRAINT IF EXISTS "CityHistory_sourceId_fkey";
ALTER TABLE "CityHistory" ADD CONSTRAINT "CityHistory_sourceId_fkey"
  FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;
