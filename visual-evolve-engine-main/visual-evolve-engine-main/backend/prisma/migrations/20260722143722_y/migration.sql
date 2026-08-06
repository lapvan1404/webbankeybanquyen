/*
  Warnings:

  - You are about to drop the column `key` on the `productkey` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `brand` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[keyCode]` on the table `productkey` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `brand` table without a default value. This is not possible if the table is not empty.
  - Added the required column `keyCode` to the `productkey` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `brand` ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `logoUrl` VARCHAR(191) NULL,
    ADD COLUMN `seoDescription` VARCHAR(191) NULL,
    ADD COLUMN `seoKeywords` VARCHAR(191) NULL,
    ADD COLUMN `seoTitle` VARCHAR(191) NULL,
    ADD COLUMN `slug` VARCHAR(191) NOT NULL,
    ADD COLUMN `website` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `category` ADD COLUMN `imageUrl` VARCHAR(191) NULL,
    ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `seoDescription` VARCHAR(191) NULL,
    ADD COLUMN `seoKeywords` VARCHAR(191) NULL,
    ADD COLUMN `seoTitle` VARCHAR(191) NULL,
    ADD COLUMN `sortOrder` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `product` ADD COLUMN `costPrice` DECIMAL(65, 30) NULL,
    ADD COLUMN `isDigital` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `publishedAt` DATETIME(3) NULL,
    ADD COLUMN `salePrice` DECIMAL(65, 30) NULL,
    ADD COLUMN `seoDescription` VARCHAR(191) NULL,
    ADD COLUMN `seoKeywords` VARCHAR(191) NULL,
    ADD COLUMN `seoTitle` VARCHAR(191) NULL,
    ADD COLUMN `shortDescription` VARCHAR(191) NULL,
    ADD COLUMN `soldCount` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `status` ENUM('DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED', 'DELETED') NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN `thumbnailUrl` VARCHAR(191) NULL,
    ADD COLUMN `viewCount` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `productkey` DROP COLUMN `key`,
    ADD COLUMN `activatedAt` DATETIME(3) NULL,
    ADD COLUMN `expiresAt` DATETIME(3) NULL,
    ADD COLUMN `keyCode` VARCHAR(191) NOT NULL,
    ADD COLUMN `orderItemId` VARCHAR(191) NULL,
    ADD COLUMN `soldAt` DATETIME(3) NULL,
    ADD COLUMN `status` ENUM('AVAILABLE', 'ACTIVATED', 'SOLD', 'EXPIRED', 'REVOKED') NOT NULL DEFAULT 'AVAILABLE';

-- CreateIndex
CREATE UNIQUE INDEX `Brand_slug_key` ON `brand`(`slug`);

-- CreateIndex
CREATE INDEX `Product_status_idx` ON `product`(`status`);

-- CreateIndex
CREATE INDEX `Product_price_idx` ON `product`(`price`);

-- CreateIndex
CREATE INDEX `Product_publishedAt_idx` ON `product`(`publishedAt`);

-- CreateIndex
CREATE INDEX `Product_isFeatured_idx` ON `product`(`isFeatured`);

-- CreateIndex
CREATE UNIQUE INDEX `ProductKey_keyCode_key` ON `productkey`(`keyCode`);

-- CreateIndex
CREATE INDEX `ProductKey_orderItemId_idx` ON `productkey`(`orderItemId`);
