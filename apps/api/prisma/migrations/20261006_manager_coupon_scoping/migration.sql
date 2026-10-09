-- NULL hotelId means a platform-wide coupon. A non-null hotelId is visible
-- and usable only for that hotel's bookings and manager console.
ALTER TABLE "Coupon" ADD COLUMN "hotelId" TEXT;
CREATE INDEX "Coupon_hotelId_isActive_idx" ON "Coupon"("hotelId", "isActive");
ALTER TABLE "Coupon" ADD CONSTRAINT "Coupon_hotelId_fkey"
  FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
