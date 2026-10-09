CREATE TABLE "DashboardLayout" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "layout" TEXT NOT NULL DEFAULT 'standard',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DashboardLayout_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DashboardWidget" (
    "id" TEXT NOT NULL,
    "layoutId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT,
    "config" JSONB,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DashboardWidget_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DashboardLayout_hotelId_name_key" ON "DashboardLayout"("hotelId", "name");
CREATE INDEX "DashboardLayout_hotelId_isDefault_idx" ON "DashboardLayout"("hotelId", "isDefault");
CREATE UNIQUE INDEX "DashboardWidget_layoutId_key_key" ON "DashboardWidget"("layoutId", "key");
CREATE INDEX "DashboardWidget_layoutId_position_idx" ON "DashboardWidget"("layoutId", "position");

ALTER TABLE "DashboardLayout" ADD CONSTRAINT "DashboardLayout_hotelId_fkey"
  FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DashboardWidget" ADD CONSTRAINT "DashboardWidget_layoutId_fkey"
  FOREIGN KEY ("layoutId") REFERENCES "DashboardLayout"("id") ON DELETE CASCADE ON UPDATE CASCADE;
