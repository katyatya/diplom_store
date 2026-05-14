-- CreateEnum
CREATE TYPE "OrderStatus_new" AS ENUM (
  'NEW',
  'CONFIRMED',
  'ASSEMBLING',
  'READY_FOR_PICKUP',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED_NO_STOCK',
  'CANCELLED_BY_CLIENT',
  'CANCELLED_OTHER'
);

-- AlterTable
ALTER TABLE "Order"
  ADD COLUMN "cancelReason" TEXT;

-- Migrate status values from old enum to new enum
ALTER TABLE "Order"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "OrderStatus_new"
  USING (
    CASE
      WHEN "status"::text = 'PAID' THEN 'CONFIRMED'
      WHEN "status"::text = 'COMPLETED' THEN 'DELIVERED'
      WHEN "status"::text = 'CANCELLED' THEN 'CANCELLED_OTHER'
      ELSE "status"::text
    END
  )::"OrderStatus_new";

ALTER TABLE "Order"
  ALTER COLUMN "status" SET DEFAULT 'NEW';

-- Drop old enum and rename new one
DROP TYPE "OrderStatus";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
