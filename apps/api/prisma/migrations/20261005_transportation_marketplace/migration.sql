-- Transportation marketplace: airport transfers and car rentals.
-- This migration is idempotent so it can be applied safely to environments
-- that already have the Prisma relation fields from an earlier schema sync.

DO $$ BEGIN
  CREATE TYPE "TransportProviderStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'SUSPENDED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE "TransportVerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'EXPIRED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE "VehicleType" AS ENUM ('SEDAN', 'SUV', 'MINIVAN', 'MINIBUS', 'BUS', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE "VehicleStatus" AS ENUM ('AVAILABLE', 'UNAVAILABLE', 'MAINTENANCE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE "DriverStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE "TransportServiceType" AS ENUM ('AIRPORT_PICKUP', 'AIRPORT_DROP_OFF', 'HOTEL_TRANSFER', 'PRIVATE_DRIVER', 'CAR_RENTAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE "TransportBookingStatus" AS ENUM ('REQUESTED', 'ACCEPTED', 'REJECTED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "TransportProvider" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "businessName" TEXT NOT NULL,
  "legalName" TEXT,
  "phone" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "description" TEXT,
  "status" "TransportProviderStatus" NOT NULL DEFAULT 'DRAFT',
  "verificationStatus" "TransportVerificationStatus" NOT NULL DEFAULT 'PENDING',
  "verificationNotes" TEXT,
  "cityId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "TransportProvider_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "TransportVehicle" (
  "id" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "vehicleType" "VehicleType" NOT NULL,
  "make" TEXT,
  "model" TEXT,
  "year" INTEGER,
  "plateNumber" TEXT NOT NULL,
  "color" TEXT,
  "passengerCapacity" INTEGER NOT NULL,
  "luggageCapacity" INTEGER NOT NULL DEFAULT 0,
  "status" "VehicleStatus" NOT NULL DEFAULT 'AVAILABLE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TransportVehicle_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "TransportDriver" (
  "id" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "licenseNumber" TEXT,
  "status" "DriverStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TransportDriver_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "TransportService" (
  "id" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "serviceType" "TransportServiceType" NOT NULL,
  "description" TEXT,
  "fixedPrice" DECIMAL(10,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'ETB',
  "passengerLimit" INTEGER NOT NULL,
  "luggageLimit" INTEGER,
  "durationMinutes" INTEGER,
  "advanceBookingMinutes" INTEGER NOT NULL DEFAULT 60,
  "dailyRate" DECIMAL(10,2),
  "depositAmount" DECIMAL(10,2),
  "mileagePolicyKm" INTEGER,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TransportService_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "TransportBooking" (
  "id" TEXT NOT NULL,
  "bookingRef" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tripId" TEXT,
  "hotelBookingId" TEXT,
  "serviceId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "vehicleId" TEXT,
  "driverId" TEXT,
  "pickupAt" TIMESTAMP(3) NOT NULL,
  "pickupLocation" TEXT NOT NULL,
  "pickupLatitude" DECIMAL(9,6),
  "pickupLongitude" DECIMAL(9,6),
  "dropoffLocation" TEXT NOT NULL,
  "dropoffLatitude" DECIMAL(9,6),
  "dropoffLongitude" DECIMAL(9,6),
  "passengers" INTEGER NOT NULL,
  "luggageCount" INTEGER,
  "customerNotes" TEXT,
  "priceAmount" DECIMAL(10,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'ETB',
  "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "status" "TransportBookingStatus" NOT NULL DEFAULT 'REQUESTED',
  "cancellationReason" TEXT,
  "commissionRate" DECIMAL(5,4) NOT NULL DEFAULT 0.1500,
  "commissionAmount" DECIMAL(10,2),
  "partnerNetAmount" DECIMAL(10,2),
  "rentalStartDate" TIMESTAMP(3),
  "rentalEndDate" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "TransportBooking_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "TransportPayment" (
  "id" TEXT NOT NULL,
  "transportBookingId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "provider" TEXT NOT NULL DEFAULT 'CHAPA',
  "amount" DECIMAL(10,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'ETB',
  "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "txRef" TEXT,
  "chapaRef" TEXT,
  "failureReason" TEXT,
  "paidAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TransportPayment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "TransportProvider_userId_idx" ON "TransportProvider"("userId");
CREATE INDEX IF NOT EXISTS "TransportProvider_status_idx" ON "TransportProvider"("status");
CREATE INDEX IF NOT EXISTS "TransportProvider_verificationStatus_idx" ON "TransportProvider"("verificationStatus");
CREATE INDEX IF NOT EXISTS "TransportProvider_cityId_idx" ON "TransportProvider"("cityId");
CREATE INDEX IF NOT EXISTS "TransportVehicle_providerId_idx" ON "TransportVehicle"("providerId");
CREATE INDEX IF NOT EXISTS "TransportVehicle_status_idx" ON "TransportVehicle"("status");
CREATE INDEX IF NOT EXISTS "TransportDriver_providerId_idx" ON "TransportDriver"("providerId");
CREATE INDEX IF NOT EXISTS "TransportDriver_status_idx" ON "TransportDriver"("status");
CREATE INDEX IF NOT EXISTS "TransportService_providerId_idx" ON "TransportService"("providerId");
CREATE INDEX IF NOT EXISTS "TransportService_serviceType_idx" ON "TransportService"("serviceType");
CREATE INDEX IF NOT EXISTS "TransportService_isActive_idx" ON "TransportService"("isActive");
CREATE UNIQUE INDEX IF NOT EXISTS "TransportBooking_bookingRef_key" ON "TransportBooking"("bookingRef");
CREATE INDEX IF NOT EXISTS "TransportBooking_userId_idx" ON "TransportBooking"("userId");
CREATE INDEX IF NOT EXISTS "TransportBooking_providerId_idx" ON "TransportBooking"("providerId");
CREATE INDEX IF NOT EXISTS "TransportBooking_serviceId_idx" ON "TransportBooking"("serviceId");
CREATE INDEX IF NOT EXISTS "TransportBooking_vehicleId_idx" ON "TransportBooking"("vehicleId");
CREATE INDEX IF NOT EXISTS "TransportBooking_driverId_idx" ON "TransportBooking"("driverId");
CREATE INDEX IF NOT EXISTS "TransportBooking_tripId_idx" ON "TransportBooking"("tripId");
CREATE INDEX IF NOT EXISTS "TransportBooking_hotelBookingId_idx" ON "TransportBooking"("hotelBookingId");
CREATE INDEX IF NOT EXISTS "TransportBooking_status_idx" ON "TransportBooking"("status");
CREATE INDEX IF NOT EXISTS "TransportBooking_paymentStatus_idx" ON "TransportBooking"("paymentStatus");
CREATE INDEX IF NOT EXISTS "TransportBooking_pickupAt_idx" ON "TransportBooking"("pickupAt");
CREATE UNIQUE INDEX IF NOT EXISTS "TransportPayment_transportBookingId_key" ON "TransportPayment"("transportBookingId");
CREATE UNIQUE INDEX IF NOT EXISTS "TransportPayment_txRef_key" ON "TransportPayment"("txRef");
CREATE INDEX IF NOT EXISTS "TransportPayment_userId_idx" ON "TransportPayment"("userId");
CREATE INDEX IF NOT EXISTS "TransportPayment_status_idx" ON "TransportPayment"("status");

ALTER TABLE "TransportProvider" DROP CONSTRAINT IF EXISTS "TransportProvider_userId_fkey";
ALTER TABLE "TransportProvider" ADD CONSTRAINT "TransportProvider_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TransportProvider" DROP CONSTRAINT IF EXISTS "TransportProvider_cityId_fkey";
ALTER TABLE "TransportProvider" ADD CONSTRAINT "TransportProvider_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TransportVehicle" DROP CONSTRAINT IF EXISTS "TransportVehicle_providerId_fkey";
ALTER TABLE "TransportVehicle" ADD CONSTRAINT "TransportVehicle_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "TransportProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TransportDriver" DROP CONSTRAINT IF EXISTS "TransportDriver_providerId_fkey";
ALTER TABLE "TransportDriver" ADD CONSTRAINT "TransportDriver_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "TransportProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TransportService" DROP CONSTRAINT IF EXISTS "TransportService_providerId_fkey";
ALTER TABLE "TransportService" ADD CONSTRAINT "TransportService_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "TransportProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TransportBooking" DROP CONSTRAINT IF EXISTS "TransportBooking_userId_fkey";
ALTER TABLE "TransportBooking" ADD CONSTRAINT "TransportBooking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON UPDATE CASCADE;
ALTER TABLE "TransportBooking" DROP CONSTRAINT IF EXISTS "TransportBooking_tripId_fkey";
ALTER TABLE "TransportBooking" ADD CONSTRAINT "TransportBooking_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TransportBooking" DROP CONSTRAINT IF EXISTS "TransportBooking_hotelBookingId_fkey";
ALTER TABLE "TransportBooking" ADD CONSTRAINT "TransportBooking_hotelBookingId_fkey" FOREIGN KEY ("hotelBookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TransportBooking" DROP CONSTRAINT IF EXISTS "TransportBooking_serviceId_fkey";
ALTER TABLE "TransportBooking" ADD CONSTRAINT "TransportBooking_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "TransportService"("id") ON UPDATE CASCADE;
ALTER TABLE "TransportBooking" DROP CONSTRAINT IF EXISTS "TransportBooking_providerId_fkey";
ALTER TABLE "TransportBooking" ADD CONSTRAINT "TransportBooking_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "TransportProvider"("id") ON UPDATE CASCADE;
ALTER TABLE "TransportBooking" DROP CONSTRAINT IF EXISTS "TransportBooking_vehicleId_fkey";
ALTER TABLE "TransportBooking" ADD CONSTRAINT "TransportBooking_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "TransportVehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TransportBooking" DROP CONSTRAINT IF EXISTS "TransportBooking_driverId_fkey";
ALTER TABLE "TransportBooking" ADD CONSTRAINT "TransportBooking_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "TransportDriver"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TransportPayment" DROP CONSTRAINT IF EXISTS "TransportPayment_transportBookingId_fkey";
ALTER TABLE "TransportPayment" ADD CONSTRAINT "TransportPayment_transportBookingId_fkey" FOREIGN KEY ("transportBookingId") REFERENCES "TransportBooking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TransportPayment" DROP CONSTRAINT IF EXISTS "TransportPayment_userId_fkey";
ALTER TABLE "TransportPayment" ADD CONSTRAINT "TransportPayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON UPDATE CASCADE;
