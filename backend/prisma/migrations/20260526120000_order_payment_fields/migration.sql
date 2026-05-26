-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('NOT_REQUIRED', 'PENDING', 'PAID', 'FAILED');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "yookassaPaymentId" TEXT,
ADD COLUMN     "paidAt" TIMESTAMP(3);

-- Backfill: cash on delivery orders
UPDATE "Order" SET "paymentStatus" = 'NOT_REQUIRED' WHERE "paymentMethod" = 'При получении';

-- Backfill: already confirmed online orders (mock/real)
UPDATE "Order"
SET "paymentStatus" = 'PAID',
    "paidAt" = COALESCE("updatedAt", "createdAt")
WHERE "paymentMethod" = 'Онлайн' AND "status" = 'CONFIRMED';

-- Backfill: cancelled online orders after failed payment
UPDATE "Order"
SET "paymentStatus" = 'FAILED'
WHERE "paymentMethod" = 'Онлайн'
  AND "status" IN ('CANCELLED_OTHER', 'CANCELLED_BY_CLIENT', 'CANCELLED_NO_STOCK');
