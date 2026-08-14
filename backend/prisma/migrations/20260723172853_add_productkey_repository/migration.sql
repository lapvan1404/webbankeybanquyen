/*
  Warnings:

  - The values [PROCESSING,COMPLETED,REFUNDED] on the enum `order_status` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `price` on the `orderitem` table. All the data in the column will be lost.
  - You are about to alter the column `status` on the `payment` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(2))` to `Enum(EnumId(3))`.
  - A unique constraint covering the columns `[orderNumber]` on the table `order` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `orderNumber` to the `order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productName` to the `orderitem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sku` to the `orderitem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalPrice` to the `orderitem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unitPrice` to the `orderitem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `order` ADD COLUMN `orderNumber` VARCHAR(191) NOT NULL,
    ADD COLUMN `paymentStatus` ENUM('UNPAID', 'PAID') NOT NULL DEFAULT 'UNPAID',
    MODIFY `status` ENUM('PENDING', 'PAID', 'CANCELLED') NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `orderitem` DROP COLUMN `price`,
    ADD COLUMN `productName` VARCHAR(191) NOT NULL,
    ADD COLUMN `sku` VARCHAR(191) NOT NULL,
    ADD COLUMN `totalPrice` DECIMAL(65, 30) NOT NULL,
    ADD COLUMN `unitPrice` DECIMAL(65, 30) NOT NULL;

-- AlterTable
ALTER TABLE `payment` MODIFY `status` ENUM('UNPAID', 'PAID') NOT NULL DEFAULT 'UNPAID';

-- CreateIndex
CREATE UNIQUE INDEX `Order_orderNumber_key` ON `order`(`orderNumber`);
