-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sizeLabel" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- Seed variants for existing products
INSERT INTO "ProductVariant" ("id", "productId", "sizeLabel", "isActive", "createdAt", "updatedAt")
SELECT
  CONCAT('pv_', SUBSTRING(MD5(p.id || ':' || sz.size_label), 1, 24)) AS id,
  p.id AS "productId",
  sz.size_label AS "sizeLabel",
  true AS "isActive",
  NOW() AS "createdAt",
  NOW() AS "updatedAt"
FROM "Product" p
CROSS JOIN LATERAL (
  SELECT UNNEST(
    CASE
      WHEN LOWER(p.category) LIKE '%обув%' THEN ARRAY['35','36','37','38','39','40','41']
      WHEN LOWER(p.category) LIKE '%сумк%' OR LOWER(p.category) LIKE '%аксессуар%' THEN ARRAY['ONE_SIZE']
      ELSE ARRAY['XS','S','M','L','XL']
    END
  ) AS size_label
) sz;

-- AlterTable CartItem
ALTER TABLE "CartItem" ADD COLUMN "variantId" TEXT;

UPDATE "CartItem" ci
SET "variantId" = pv.id
FROM "Product" p
JOIN "ProductVariant" pv
  ON pv."productId" = p.id
 AND pv."sizeLabel" = (
    CASE
      WHEN LOWER(p.category) LIKE '%обув%' THEN '38'
      WHEN LOWER(p.category) LIKE '%сумк%' OR LOWER(p.category) LIKE '%аксессуар%' THEN 'ONE_SIZE'
      ELSE 'M'
    END
  )
WHERE ci."productId" = p.id;

UPDATE "CartItem" ci
SET "variantId" = (
  SELECT pv.id
  FROM "ProductVariant" pv
  WHERE pv."productId" = ci."productId"
  ORDER BY pv."createdAt" ASC
  LIMIT 1
)
WHERE ci."variantId" IS NULL;

ALTER TABLE "CartItem" ALTER COLUMN "variantId" SET NOT NULL;

ALTER TABLE "CartItem" DROP CONSTRAINT IF EXISTS "CartItem_productId_fkey";
ALTER TABLE "CartItem" DROP CONSTRAINT IF EXISTS "CartItem_cartId_productId_key";
ALTER TABLE "CartItem" DROP COLUMN "productId";
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE UNIQUE INDEX "CartItem_cartId_variantId_key" ON "CartItem"("cartId", "variantId");

-- AlterTable OrderItem
ALTER TABLE "OrderItem" ADD COLUMN "sizeLabel" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN "variantId" TEXT;

UPDATE "OrderItem" oi
SET "variantId" = pv.id,
    "sizeLabel" = pv."sizeLabel"
FROM "Product" p
JOIN "ProductVariant" pv
  ON pv."productId" = p.id
 AND pv."sizeLabel" = (
    CASE
      WHEN LOWER(p.category) LIKE '%обув%' THEN '38'
      WHEN LOWER(p.category) LIKE '%сумк%' OR LOWER(p.category) LIKE '%аксессуар%' THEN 'ONE_SIZE'
      ELSE 'M'
    END
  )
WHERE oi."productId" = p.id;

UPDATE "OrderItem" oi
SET "variantId" = (
  SELECT pv.id
  FROM "ProductVariant" pv
  WHERE pv."productId" = oi."productId"
  ORDER BY pv."createdAt" ASC
  LIMIT 1
)
WHERE oi."variantId" IS NULL;

UPDATE "OrderItem" oi
SET "sizeLabel" = pv."sizeLabel"
FROM "ProductVariant" pv
WHERE oi."variantId" = pv.id
  AND oi."sizeLabel" IS NULL;

ALTER TABLE "OrderItem" ALTER COLUMN "variantId" SET NOT NULL;
ALTER TABLE "OrderItem" ALTER COLUMN "sizeLabel" SET NOT NULL;

ALTER TABLE "OrderItem" DROP CONSTRAINT IF EXISTS "OrderItem_productId_fkey";
ALTER TABLE "OrderItem" DROP COLUMN "productId";
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Indexes
CREATE UNIQUE INDEX "ProductVariant_productId_sizeLabel_key" ON "ProductVariant"("productId", "sizeLabel");

-- ForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
