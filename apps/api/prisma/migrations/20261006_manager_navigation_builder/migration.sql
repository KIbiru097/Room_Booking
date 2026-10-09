CREATE TABLE "NavigationItem" (
  "id" TEXT NOT NULL,
  "hotelId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "icon" TEXT,
  "route" TEXT NOT NULL,
  "position" INTEGER NOT NULL DEFAULT 0,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "requiredPermission" TEXT,
  "departmentId" TEXT,
  "isSystem" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NavigationItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NavigationItem_hotelId_route_key" ON "NavigationItem"("hotelId", "route");
CREATE INDEX "NavigationItem_hotelId_position_idx" ON "NavigationItem"("hotelId", "position");
CREATE INDEX "NavigationItem_departmentId_idx" ON "NavigationItem"("departmentId");

ALTER TABLE "NavigationItem" ADD CONSTRAINT "NavigationItem_hotelId_fkey"
  FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NavigationItem" ADD CONSTRAINT "NavigationItem_departmentId_fkey"
  FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
