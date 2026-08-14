/*
  Warnings:

  - You are about to drop the column `activatedAt` on the `productkey` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `productkey` table. All the data in the column will be lost.
  - You are about to drop the column `keyCode` on the `productkey` table. All the data in the column will be lost.
  - You are about to drop the column `soldAt` on the `productkey` table. All the data in the column will be lost.
  - You are about to drop the column `value` on the `productkey` table. All the data in the column will be lost.
  - The values [ACTIVATED,EXPIRED,REVOKED] on the enum `productkey_status` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[productId,keyHash]` on the table `productkey` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `encryptedKey` to the `productkey` table without a default value. This is not possible if the table is not empty.
  - Added the required column `iv` to the `productkey` table without a default value. This is not possible if the table is not empty.
  - Added the required column `keyHash` to the `productkey` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bucket` to the `uploadedfile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `objectKey` to the `uploadedfile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `originalName` to the `uploadedfile` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `ProductKey_keyCode_key` ON `ProductKey`;

-- AlterTable
ALTER TABLE `Brand` ADD COLUMN `sortOrder` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `Product` ADD COLUMN `deliveryMethod` VARCHAR(191) NULL,
    ADD COLUMN `deviceLimit` INTEGER NULL,
    ADD COLUMN `licenseDuration` INTEGER NULL,
    ADD COLUMN `licenseType` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `ProductKey` DROP COLUMN `activatedAt`,
    DROP COLUMN `expiresAt`,
    DROP COLUMN `keyCode`,
    DROP COLUMN `soldAt`,
    DROP COLUMN `value`,
    ADD COLUMN `algorithm` ENUM('AES_256_GCM') NOT NULL DEFAULT 'AES_256_GCM',
    ADD COLUMN `assignedAt` DATETIME(3) NULL,
    ADD COLUMN `batchId` VARCHAR(191) NULL,
    ADD COLUMN `encryptedKey` TEXT NOT NULL,
    ADD COLUMN `importedAt` DATETIME(3) NULL,
    ADD COLUMN `iv` VARCHAR(32) NOT NULL,
    ADD COLUMN `keyHash` VARCHAR(64) NOT NULL,
    ADD COLUMN `keyVersion` INTEGER NULL,
    ADD COLUMN `reservedUntil` DATETIME(3) NULL,
    MODIFY `status` ENUM('AVAILABLE', 'RESERVED', 'SOLD', 'DISABLED') NOT NULL DEFAULT 'AVAILABLE';

-- AlterTable
ALTER TABLE `UploadedFile` ADD COLUMN `bucket` VARCHAR(191) NOT NULL,
    ADD COLUMN `objectKey` VARCHAR(191) NOT NULL,
    ADD COLUMN `originalName` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE INDEX `productkey_productId_status_idx` ON `ProductKey`(`productId`, `status`);

-- CreateIndex
CREATE INDEX `productkey_status_idx` ON `ProductKey`(`status`);

-- CreateIndex
CREATE INDEX `productkey_productId_keyHash_idx` ON `ProductKey`(`productId`, `keyHash`);

-- CreateIndex
CREATE UNIQUE INDEX `productkey_productId_keyHash_key` ON `ProductKey`(`productId`, `keyHash`);

-- AddForeignKey
ALTER TABLE `ProductKey` ADD CONSTRAINT `ProductKey_orderItemId_fkey` FOREIGN KEY (`orderItemId`) REFERENCES `OrderItem`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
