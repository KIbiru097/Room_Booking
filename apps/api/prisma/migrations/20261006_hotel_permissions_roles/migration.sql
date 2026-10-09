-- Hotel-scoped roles and permissions. The existing User.role enum remains the
-- coarse portal role; these tables govern operational access per hotel.
CREATE TABLE "Department" (
  "id" TEXT NOT NULL,
  "hotelId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "color" TEXT,
  "icon" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HotelRole" (
  "id" TEXT NOT NULL,
  "hotelId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "departmentId" TEXT,
  "isSystem" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HotelRole_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Permission" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "module" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "description" TEXT,
  "isSystem" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HotelRolePermission" (
  "roleId" TEXT NOT NULL,
  "permissionId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HotelRolePermission_pkey" PRIMARY KEY ("roleId", "permissionId")
);

CREATE TABLE "StaffRoleAssignment" (
  "id" TEXT NOT NULL,
  "staffId" TEXT NOT NULL,
  "roleId" TEXT NOT NULL,
  "hotelId" TEXT NOT NULL,
  "startAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endAt" TIMESTAMP(3),
  "assignedBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StaffRoleAssignment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Department_hotelId_name_key" ON "Department"("hotelId", "name");
CREATE INDEX "Department_hotelId_isActive_idx" ON "Department"("hotelId", "isActive");
CREATE UNIQUE INDEX "HotelRole_hotelId_name_key" ON "HotelRole"("hotelId", "name");
CREATE INDEX "HotelRole_hotelId_isActive_idx" ON "HotelRole"("hotelId", "isActive");
CREATE INDEX "HotelRole_departmentId_idx" ON "HotelRole"("departmentId");
CREATE UNIQUE INDEX "Permission_key_key" ON "Permission"("key");
CREATE INDEX "HotelRolePermission_permissionId_idx" ON "HotelRolePermission"("permissionId");
CREATE UNIQUE INDEX "StaffRoleAssignment_staffId_roleId_hotelId_key" ON "StaffRoleAssignment"("staffId", "roleId", "hotelId");
CREATE INDEX "StaffRoleAssignment_staffId_hotelId_endAt_idx" ON "StaffRoleAssignment"("staffId", "hotelId", "endAt");
CREATE INDEX "StaffRoleAssignment_roleId_idx" ON "StaffRoleAssignment"("roleId");
CREATE INDEX "StaffRoleAssignment_hotelId_idx" ON "StaffRoleAssignment"("hotelId");

ALTER TABLE "Department" ADD CONSTRAINT "Department_hotelId_fkey"
  FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HotelRole" ADD CONSTRAINT "HotelRole_hotelId_fkey"
  FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HotelRole" ADD CONSTRAINT "HotelRole_departmentId_fkey"
  FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "HotelRolePermission" ADD CONSTRAINT "HotelRolePermission_roleId_fkey"
  FOREIGN KEY ("roleId") REFERENCES "HotelRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HotelRolePermission" ADD CONSTRAINT "HotelRolePermission_permissionId_fkey"
  FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StaffRoleAssignment" ADD CONSTRAINT "StaffRoleAssignment_staffId_fkey"
  FOREIGN KEY ("staffId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StaffRoleAssignment" ADD CONSTRAINT "StaffRoleAssignment_roleId_fkey"
  FOREIGN KEY ("roleId") REFERENCES "HotelRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StaffRoleAssignment" ADD CONSTRAINT "StaffRoleAssignment_hotelId_fkey"
  FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StaffRoleAssignment" ADD CONSTRAINT "StaffRoleAssignment_assignedBy_fkey"
  FOREIGN KEY ("assignedBy") REFERENCES "User"("id") ON UPDATE CASCADE;
