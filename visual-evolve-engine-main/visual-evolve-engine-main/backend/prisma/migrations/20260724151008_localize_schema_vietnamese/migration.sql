/*
  Warnings:

  - You are about to drop the column `createdAt` on the `banner` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `banner` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `banner` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `banner` table. All the data in the column will be lost.
  - You are about to drop the column `linkUrl` on the `banner` table. All the data in the column will be lost.
  - You are about to drop the column `subtitle` on the `banner` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `banner` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `banner` table. All the data in the column will be lost.
  - You are about to drop the `address` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `auditlog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `brand` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cart` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cartitem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `category` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `favorite` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `loginattempt` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `notification` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `order` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `orderitem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `passwordresettoken` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `payment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `paymenttransaction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `product` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `productimage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `productkey` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `refreshtoken` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `review` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `role` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `systemsetting` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `uploadedfile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `usersession` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `ngay_cap_nhat` to the `Banner` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tieu_de` to the `Banner` table without a default value. This is not possible if the table is not empty.
  - Added the required column `url_hinh_anh` to the `Banner` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `address` DROP FOREIGN KEY `Address_userId_fkey`;

-- DropForeignKey
ALTER TABLE `auditlog` DROP FOREIGN KEY `AuditLog_userId_fkey`;

-- DropForeignKey
ALTER TABLE `cart` DROP FOREIGN KEY `Cart_userId_fkey`;

-- DropForeignKey
ALTER TABLE `cartitem` DROP FOREIGN KEY `CartItem_cartId_fkey`;

-- DropForeignKey
ALTER TABLE `cartitem` DROP FOREIGN KEY `CartItem_productId_fkey`;

-- DropForeignKey
ALTER TABLE `favorite` DROP FOREIGN KEY `Favorite_productId_fkey`;

-- DropForeignKey
ALTER TABLE `favorite` DROP FOREIGN KEY `Favorite_userId_fkey`;

-- DropForeignKey
ALTER TABLE `loginattempt` DROP FOREIGN KEY `LoginAttempt_userId_fkey`;

-- DropForeignKey
ALTER TABLE `notification` DROP FOREIGN KEY `Notification_userId_fkey`;

-- DropForeignKey
ALTER TABLE `order` DROP FOREIGN KEY `Order_userId_fkey`;

-- DropForeignKey
ALTER TABLE `orderitem` DROP FOREIGN KEY `OrderItem_orderId_fkey`;

-- DropForeignKey
ALTER TABLE `orderitem` DROP FOREIGN KEY `OrderItem_productId_fkey`;

-- DropForeignKey
ALTER TABLE `passwordresettoken` DROP FOREIGN KEY `PasswordResetToken_userId_fkey`;

-- DropForeignKey
ALTER TABLE `payment` DROP FOREIGN KEY `Payment_orderId_fkey`;

-- DropForeignKey
ALTER TABLE `paymenttransaction` DROP FOREIGN KEY `PaymentTransaction_paymentId_fkey`;

-- DropForeignKey
ALTER TABLE `product` DROP FOREIGN KEY `Product_brandId_fkey`;

-- DropForeignKey
ALTER TABLE `product` DROP FOREIGN KEY `Product_categoryId_fkey`;

-- DropForeignKey
ALTER TABLE `productimage` DROP FOREIGN KEY `ProductImage_productId_fkey`;

-- DropForeignKey
ALTER TABLE `productkey` DROP FOREIGN KEY `ProductKey_orderItemId_fkey`;

-- DropForeignKey
ALTER TABLE `productkey` DROP FOREIGN KEY `ProductKey_productId_fkey`;

-- DropForeignKey
ALTER TABLE `refreshtoken` DROP FOREIGN KEY `RefreshToken_userId_fkey`;

-- DropForeignKey
ALTER TABLE `review` DROP FOREIGN KEY `Review_productId_fkey`;

-- DropForeignKey
ALTER TABLE `review` DROP FOREIGN KEY `Review_userId_fkey`;

-- DropForeignKey
ALTER TABLE `uploadedfile` DROP FOREIGN KEY `UploadedFile_uploadedById_fkey`;

-- DropForeignKey
ALTER TABLE `user` DROP FOREIGN KEY `User_roleId_fkey`;

-- DropForeignKey
ALTER TABLE `usersession` DROP FOREIGN KEY `UserSession_userId_fkey`;

-- AlterTable
ALTER TABLE `banner` DROP COLUMN `createdAt`,
    DROP COLUMN `deletedAt`,
    DROP COLUMN `imageUrl`,
    DROP COLUMN `isActive`,
    DROP COLUMN `linkUrl`,
    DROP COLUMN `subtitle`,
    DROP COLUMN `title`,
    DROP COLUMN `updatedAt`,
    ADD COLUMN `hoat_dong` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `ngay_cap_nhat` DATETIME(3) NOT NULL,
    ADD COLUMN `ngay_tao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `ngay_xoa` DATETIME(3) NULL,
    ADD COLUMN `tieu_de` VARCHAR(191) NOT NULL,
    ADD COLUMN `tieu_de_phu` VARCHAR(191) NULL,
    ADD COLUMN `url_hinh_anh` VARCHAR(191) NOT NULL,
    ADD COLUMN `url_lien_ket` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `address`;

-- DropTable
DROP TABLE `auditlog`;

-- DropTable
DROP TABLE `brand`;

-- DropTable
DROP TABLE `cart`;

-- DropTable
DROP TABLE `cartitem`;

-- DropTable
DROP TABLE `category`;

-- DropTable
DROP TABLE `favorite`;

-- DropTable
DROP TABLE `loginattempt`;

-- DropTable
DROP TABLE `notification`;

-- DropTable
DROP TABLE `order`;

-- DropTable
DROP TABLE `orderitem`;

-- DropTable
DROP TABLE `passwordresettoken`;

-- DropTable
DROP TABLE `payment`;

-- DropTable
DROP TABLE `paymenttransaction`;

-- DropTable
DROP TABLE `product`;

-- DropTable
DROP TABLE `productimage`;

-- DropTable
DROP TABLE `productkey`;

-- DropTable
DROP TABLE `refreshtoken`;

-- DropTable
DROP TABLE `review`;

-- DropTable
DROP TABLE `role`;

-- DropTable
DROP TABLE `systemsetting`;

-- DropTable
DROP TABLE `uploadedfile`;

-- DropTable
DROP TABLE `user`;

-- DropTable
DROP TABLE `usersession`;

-- CreateTable
CREATE TABLE `DiaChi` (
    `id` VARCHAR(191) NOT NULL,
    `nguoi_dung_id` VARCHAR(191) NOT NULL,
    `nhan` VARCHAR(191) NULL,
    `duong` VARCHAR(191) NOT NULL,
    `thanh_pho` VARCHAR(191) NOT NULL,
    `tinh` VARCHAR(191) NOT NULL,
    `ma_buu_dien` VARCHAR(191) NOT NULL,
    `quoc_gia` VARCHAR(191) NOT NULL,
    `la_mac_dinh` BOOLEAN NOT NULL DEFAULT false,
    `ngay_tao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ngay_cap_nhat` DATETIME(3) NOT NULL,
    `ngay_xoa` DATETIME(3) NULL,

    INDEX `Address_userId_idx`(`nguoi_dung_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NhatKyHeThong` (
    `id` VARCHAR(191) NOT NULL,
    `nguoi_dung_id` VARCHAR(191) NULL,
    `su_kien` VARCHAR(191) NOT NULL,
    `metadata` LONGTEXT NULL,
    `ngay_tao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditLog_userId_idx`(`nguoi_dung_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ThuongHieu` (
    `id` VARCHAR(191) NOT NULL,
    `ten` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `url_logo` VARCHAR(191) NULL,
    `website` VARCHAR(191) NULL,
    `mo_ta` VARCHAR(191) NULL,
    `thu_tu_sap_xep` INTEGER NOT NULL DEFAULT 0,
    `hoat_dong` BOOLEAN NOT NULL DEFAULT true,
    `tieu_de_seo` VARCHAR(191) NULL,
    `mo_ta_seo` VARCHAR(191) NULL,
    `tu_khoa_seo` VARCHAR(191) NULL,
    `ngay_tao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ngay_cap_nhat` DATETIME(3) NOT NULL,
    `ngay_xoa` DATETIME(3) NULL,

    UNIQUE INDEX `Brand_name_key`(`ten`),
    UNIQUE INDEX `Brand_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GioHang` (
    `id` VARCHAR(191) NOT NULL,
    `nguoi_dung_id` VARCHAR(191) NOT NULL,
    `ngay_tao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ngay_cap_nhat` DATETIME(3) NOT NULL,

    INDEX `Cart_userId_idx`(`nguoi_dung_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChiTietGioHang` (
    `id` VARCHAR(191) NOT NULL,
    `gio_hang_id` VARCHAR(191) NOT NULL,
    `san_pham_id` VARCHAR(191) NOT NULL,
    `so_luong` INTEGER NOT NULL DEFAULT 1,
    `gia` DECIMAL(65, 30) NOT NULL,
    `ngay_tao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ngay_cap_nhat` DATETIME(3) NOT NULL,

    INDEX `CartItem_cartId_idx`(`gio_hang_id`),
    INDEX `CartItem_productId_idx`(`san_pham_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DanhMuc` (
    `id` VARCHAR(191) NOT NULL,
    `ten` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `mo_ta` VARCHAR(191) NULL,
    `url_hinh_anh` VARCHAR(191) NULL,
    `thu_tu_sap_xep` INTEGER NOT NULL DEFAULT 0,
    `hoat_dong` BOOLEAN NOT NULL DEFAULT true,
    `tieu_de_seo` VARCHAR(191) NULL,
    `mo_ta_seo` VARCHAR(191) NULL,
    `tu_khoa_seo` VARCHAR(191) NULL,
    `ngay_tao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ngay_cap_nhat` DATETIME(3) NOT NULL,
    `ngay_xoa` DATETIME(3) NULL,

    UNIQUE INDEX `Category_name_key`(`ten`),
    UNIQUE INDEX `Category_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `YeuThich` (
    `id` VARCHAR(191) NOT NULL,
    `nguoi_dung_id` VARCHAR(191) NOT NULL,
    `san_pham_id` VARCHAR(191) NOT NULL,
    `ngay_tao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Favorite_productId_idx`(`san_pham_id`),
    INDEX `Favorite_userId_idx`(`nguoi_dung_id`),
    UNIQUE INDEX `Favorite_userId_productId_key`(`nguoi_dung_id`, `san_pham_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NhatKyDangNhap` (
    `id` VARCHAR(191) NOT NULL,
    `nguoi_dung_id` VARCHAR(191) NULL,
    `thanh_cong` BOOLEAN NOT NULL DEFAULT false,
    `dia_chi_ip` VARCHAR(191) NULL,
    `user_agent` VARCHAR(191) NULL,
    `ly_do` VARCHAR(191) NULL,
    `ngay_tao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `LoginAttempt_userId_idx`(`nguoi_dung_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ThongBao` (
    `id` VARCHAR(191) NOT NULL,
    `nguoi_dung_id` VARCHAR(191) NOT NULL,
    `tieu_de` VARCHAR(191) NOT NULL,
    `thong_diep` VARCHAR(191) NOT NULL,
    `da_doc` BOOLEAN NOT NULL DEFAULT false,
    `ngay_tao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ngay_cap_nhat` DATETIME(3) NOT NULL,

    INDEX `Notification_userId_idx`(`nguoi_dung_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DonHang` (
    `id` VARCHAR(191) NOT NULL,
    `so_don_hang` VARCHAR(191) NOT NULL,
    `nguoi_dung_id` VARCHAR(191) NOT NULL,
    `trang_thai` ENUM('PENDING', 'PAID', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `trang_thai_thanh_toan` ENUM('UNPAID', 'PAID') NOT NULL DEFAULT 'UNPAID',
    `tong_tien` DECIMAL(65, 30) NOT NULL,
    `phi_van_chuyen` DECIMAL(65, 30) NOT NULL DEFAULT 0.000000000000000000000000000000,
    `ngay_dat` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ngay_tao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ngay_cap_nhat` DATETIME(3) NOT NULL,
    `ngay_xoa` DATETIME(3) NULL,

    UNIQUE INDEX `Order_orderNumber_key`(`so_don_hang`),
    INDEX `Order_userId_idx`(`nguoi_dung_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChiTietDonHang` (
    `id` VARCHAR(191) NOT NULL,
    `don_hang_id` VARCHAR(191) NOT NULL,
    `san_pham_id` VARCHAR(191) NOT NULL,
    `ten_san_pham` VARCHAR(191) NOT NULL,
    `sku` VARCHAR(191) NOT NULL,
    `gia_don_vi` DECIMAL(65, 30) NOT NULL,
    `so_luong` INTEGER NOT NULL DEFAULT 1,
    `tong_gia` DECIMAL(65, 30) NOT NULL,
    `ngay_tao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ngay_cap_nhat` DATETIME(3) NOT NULL,

    INDEX `OrderItem_orderId_idx`(`don_hang_id`),
    INDEX `OrderItem_productId_idx`(`san_pham_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MaKhoiPhucMatKhau` (
    `id` VARCHAR(191) NOT NULL,
    `nguoi_dung_id` VARCHAR(191) NOT NULL,
    `ma_hash_token` VARCHAR(191) NOT NULL,
    `ngay_het_han` DATETIME(3) NOT NULL,
    `da_su_dung` BOOLEAN NOT NULL DEFAULT false,
    `ngay_tao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ngay_cap_nhat` DATETIME(3) NOT NULL,

    INDEX `PasswordResetToken_userId_idx`(`nguoi_dung_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ThanhToan` (
    `id` VARCHAR(191) NOT NULL,
    `don_hang_id` VARCHAR(191) NOT NULL,
    `so_tien` DECIMAL(65, 30) NOT NULL,
    `phuong_thuc` ENUM('MOMO', 'BANK_TRANSFER') NOT NULL,
    `trang_thai` ENUM('UNPAID', 'PAID') NOT NULL DEFAULT 'UNPAID',
    `ngay_tao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ngay_cap_nhat` DATETIME(3) NOT NULL,

    INDEX `Payment_orderId_idx`(`don_hang_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GiaoDichThanhToan` (
    `id` VARCHAR(191) NOT NULL,
    `thanh_toan_id` VARCHAR(191) NOT NULL,
    `ma_giao_dich` VARCHAR(191) NOT NULL,
    `so_tien` DECIMAL(65, 30) NOT NULL,
    `trang_thai` ENUM('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED') NOT NULL,
    `nha_cung_cap` ENUM('MOMO', 'BANK_TRANSFER') NOT NULL,
    `ngay_tao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ngay_cap_nhat` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PaymentTransaction_transactionId_key`(`ma_giao_dich`),
    INDEX `PaymentTransaction_paymentId_idx`(`thanh_toan_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SanPham` (
    `id` VARCHAR(191) NOT NULL,
    `sku` VARCHAR(191) NOT NULL,
    `ten` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `mo_ta_ngan` VARCHAR(191) NULL,
    `mo_ta` VARCHAR(191) NULL,
    `url_hinh_dai_dien` VARCHAR(191) NULL,
    `gia` DECIMAL(65, 30) NOT NULL,
    `gia_khuyen_mai` DECIMAL(65, 30) NULL,
    `gia_goc` DECIMAL(65, 30) NULL,
    `ton_kho` INTEGER NOT NULL DEFAULT 0,
    `so_luong_ban` INTEGER NOT NULL DEFAULT 0,
    `so_luong_xem` INTEGER NOT NULL DEFAULT 0,
    `trang_thai` ENUM('DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED', 'DELETED') NOT NULL DEFAULT 'ACTIVE',
    `noi_bat` BOOLEAN NOT NULL DEFAULT false,
    `la_so_hoa` BOOLEAN NOT NULL DEFAULT false,
    `loai_giay_phep` VARCHAR(191) NULL,
    `thoi_han_giay_phep` INTEGER NULL,
    `gioi_han_thiet_bi` INTEGER NULL,
    `phuong_thuc_giao_hang` VARCHAR(191) NULL,
    `tieu_de_seo` VARCHAR(191) NULL,
    `mo_ta_seo` VARCHAR(191) NULL,
    `tu_khoa_seo` VARCHAR(191) NULL,
    `ngay_xuat_ban` DATETIME(3) NULL,
    `da_xuat_ban` BOOLEAN NOT NULL DEFAULT false,
    `danh_muc_id` VARCHAR(191) NULL,
    `thuong_hieu_id` VARCHAR(191) NULL,
    `ngay_tao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ngay_cap_nhat` DATETIME(3) NOT NULL,
    `ngay_xoa` DATETIME(3) NULL,

    UNIQUE INDEX `Product_sku_key`(`sku`),
    UNIQUE INDEX `Product_slug_key`(`slug`),
    INDEX `Product_brandId_idx`(`thuong_hieu_id`),
    INDEX `Product_categoryId_idx`(`danh_muc_id`),
    INDEX `Product_status_idx`(`trang_thai`),
    INDEX `Product_price_idx`(`gia`),
    INDEX `Product_publishedAt_idx`(`ngay_xuat_ban`),
    INDEX `Product_isFeatured_idx`(`noi_bat`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HinhAnhSanPham` (
    `id` VARCHAR(191) NOT NULL,
    `san_pham_id` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `alt_text` VARCHAR(191) NULL,
    `vi_tri` INTEGER NOT NULL DEFAULT 0,
    `ngay_tao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ngay_cap_nhat` DATETIME(3) NOT NULL,

    INDEX `ProductImage_productId_idx`(`san_pham_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `KhoaBanQuyen` (
    `id` VARCHAR(191) NOT NULL,
    `san_pham_id` VARCHAR(191) NOT NULL,
    `chi_tiet_don_hang_id` VARCHAR(191) NULL,
    `khoa_ma_hoa` TEXT NOT NULL,
    `hash_khoa` VARCHAR(64) NOT NULL,
    `iv` VARCHAR(32) NOT NULL,
    `giai_thuat` ENUM('AES_256_GCM') NOT NULL DEFAULT 'AES_256_GCM',
    `phien_ban_khoa` INTEGER NULL,
    `trang_thai` ENUM('AVAILABLE', 'RESERVED', 'SOLD', 'DISABLED') NOT NULL DEFAULT 'AVAILABLE',
    `ngay_giu_cho` DATETIME(3) NULL,
    `ngay_gan` DATETIME(3) NULL,
    `batch_id` VARCHAR(191) NULL,
    `ngay_nhap` DATETIME(3) NULL,
    `ngay_tao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ngay_cap_nhat` DATETIME(3) NOT NULL,

    INDEX `ProductKey_productId_idx`(`san_pham_id`),
    INDEX `ProductKey_orderItemId_idx`(`chi_tiet_don_hang_id`),
    INDEX `KhoaBanQuyen_san_pham_id_trang_thai_idx`(`san_pham_id`, `trang_thai`),
    INDEX `KhoaBanQuyen_trang_thai_idx`(`trang_thai`),
    INDEX `KhoaBanQuyen_san_pham_id_hash_khoa_idx`(`san_pham_id`, `hash_khoa`),
    UNIQUE INDEX `KhoaBanQuyen_san_pham_id_hash_khoa_key`(`san_pham_id`, `hash_khoa`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TokenLamMoi` (
    `id` VARCHAR(191) NOT NULL,
    `hash_token` VARCHAR(191) NOT NULL,
    `nguoi_dung_id` VARCHAR(191) NOT NULL,
    `bi_huy` BOOLEAN NOT NULL DEFAULT false,
    `ngay_het_han` DATETIME(3) NOT NULL,
    `ngay_tao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ngay_cap_nhat` DATETIME(3) NOT NULL,

    INDEX `RefreshToken_userId_idx`(`nguoi_dung_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DanhGia` (
    `id` VARCHAR(191) NOT NULL,
    `nguoi_dung_id` VARCHAR(191) NOT NULL,
    `san_pham_id` VARCHAR(191) NOT NULL,
    `xep_hang` INTEGER NOT NULL,
    `tieu_de` VARCHAR(191) NULL,
    `noi_dung` VARCHAR(191) NULL,
    `ngay_tao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ngay_cap_nhat` DATETIME(3) NOT NULL,
    `ngay_xoa` DATETIME(3) NULL,

    INDEX `Review_productId_idx`(`san_pham_id`),
    INDEX `Review_userId_idx`(`nguoi_dung_id`),
    UNIQUE INDEX `Review_userId_productId_key`(`nguoi_dung_id`, `san_pham_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VaiTro` (
    `id` VARCHAR(191) NOT NULL,
    `ten` VARCHAR(191) NOT NULL,
    `mo_ta` VARCHAR(191) NULL,
    `ngay_tao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ngay_cap_nhat` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Role_name_key`(`ten`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CauHinhHeThong` (
    `id` VARCHAR(191) NOT NULL,
    `khoa` VARCHAR(191) NOT NULL,
    `gia_tri` VARCHAR(191) NOT NULL,
    `ngay_tao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ngay_cap_nhat` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SystemSetting_key_key`(`khoa`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TepTaiLen` (
    `id` VARCHAR(191) NOT NULL,
    `ten_goc` VARCHAR(191) NOT NULL,
    `ten_tep` VARCHAR(191) NOT NULL,
    `loai_mime` VARCHAR(191) NOT NULL,
    `kich_thuoc` INTEGER NOT NULL,
    `bucket` VARCHAR(191) NOT NULL,
    `object_key` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `nguoi_tai_len_id` VARCHAR(191) NULL,
    `ngay_tao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ngay_cap_nhat` DATETIME(3) NOT NULL,
    `ngay_xoa` DATETIME(3) NULL,

    INDEX `UploadedFile_uploadedById_idx`(`nguoi_tai_len_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NguoiDung` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `hash_mat_khau` VARCHAR(191) NOT NULL,
    `ten` VARCHAR(191) NULL,
    `ho` VARCHAR(191) NULL,
    `vai_tro_id` VARCHAR(191) NOT NULL,
    `ngay_tao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ngay_cap_nhat` DATETIME(3) NOT NULL,
    `ngay_xoa` DATETIME(3) NULL,
    `url_avatar` VARCHAR(191) NULL,
    `da_xac_thuc_email` BOOLEAN NOT NULL DEFAULT false,
    `so_lan_dang_nhap_that_bai` INTEGER NOT NULL DEFAULT 0,
    `ngay_dang_nhap_cuoi` DATETIME(3) NULL,
    `ngay_khoa_den` DATETIME(3) NULL,
    `dien_thoai` VARCHAR(191) NULL,
    `trang_thai` ENUM('ACTIVE', 'LOCKED', 'INACTIVE', 'DELETED') NOT NULL DEFAULT 'ACTIVE',

    UNIQUE INDEX `User_email_key`(`email`),
    UNIQUE INDEX `User_phone_key`(`dien_thoai`),
    INDEX `User_deletedAt_idx`(`ngay_xoa`),
    INDEX `User_phone_idx`(`dien_thoai`),
    INDEX `User_roleId_idx`(`vai_tro_id`),
    INDEX `User_status_idx`(`trang_thai`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PhienNguoiDung` (
    `id` VARCHAR(191) NOT NULL,
    `nguoi_dung_id` VARCHAR(191) NOT NULL,
    `dia_chi_ip` VARCHAR(191) NULL,
    `user_agent` VARCHAR(191) NULL,
    `ngay_hoat_dong_cuoi` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ngay_tao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ngay_cap_nhat` DATETIME(3) NOT NULL,
    `bi_huy` BOOLEAN NOT NULL DEFAULT false,

    INDEX `UserSession_userId_idx`(`nguoi_dung_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `DiaChi` ADD CONSTRAINT `Address_userId_fkey` FOREIGN KEY (`nguoi_dung_id`) REFERENCES `NguoiDung`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NhatKyHeThong` ADD CONSTRAINT `AuditLog_userId_fkey` FOREIGN KEY (`nguoi_dung_id`) REFERENCES `NguoiDung`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GioHang` ADD CONSTRAINT `Cart_userId_fkey` FOREIGN KEY (`nguoi_dung_id`) REFERENCES `NguoiDung`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChiTietGioHang` ADD CONSTRAINT `CartItem_cartId_fkey` FOREIGN KEY (`gio_hang_id`) REFERENCES `GioHang`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChiTietGioHang` ADD CONSTRAINT `CartItem_productId_fkey` FOREIGN KEY (`san_pham_id`) REFERENCES `SanPham`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `YeuThich` ADD CONSTRAINT `Favorite_productId_fkey` FOREIGN KEY (`san_pham_id`) REFERENCES `SanPham`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `YeuThich` ADD CONSTRAINT `Favorite_userId_fkey` FOREIGN KEY (`nguoi_dung_id`) REFERENCES `NguoiDung`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NhatKyDangNhap` ADD CONSTRAINT `LoginAttempt_userId_fkey` FOREIGN KEY (`nguoi_dung_id`) REFERENCES `NguoiDung`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ThongBao` ADD CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`nguoi_dung_id`) REFERENCES `NguoiDung`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DonHang` ADD CONSTRAINT `Order_userId_fkey` FOREIGN KEY (`nguoi_dung_id`) REFERENCES `NguoiDung`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChiTietDonHang` ADD CONSTRAINT `OrderItem_orderId_fkey` FOREIGN KEY (`don_hang_id`) REFERENCES `DonHang`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChiTietDonHang` ADD CONSTRAINT `OrderItem_productId_fkey` FOREIGN KEY (`san_pham_id`) REFERENCES `SanPham`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MaKhoiPhucMatKhau` ADD CONSTRAINT `PasswordResetToken_userId_fkey` FOREIGN KEY (`nguoi_dung_id`) REFERENCES `NguoiDung`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ThanhToan` ADD CONSTRAINT `Payment_orderId_fkey` FOREIGN KEY (`don_hang_id`) REFERENCES `DonHang`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GiaoDichThanhToan` ADD CONSTRAINT `PaymentTransaction_paymentId_fkey` FOREIGN KEY (`thanh_toan_id`) REFERENCES `ThanhToan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SanPham` ADD CONSTRAINT `Product_brandId_fkey` FOREIGN KEY (`thuong_hieu_id`) REFERENCES `ThuongHieu`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SanPham` ADD CONSTRAINT `Product_categoryId_fkey` FOREIGN KEY (`danh_muc_id`) REFERENCES `DanhMuc`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HinhAnhSanPham` ADD CONSTRAINT `ProductImage_productId_fkey` FOREIGN KEY (`san_pham_id`) REFERENCES `SanPham`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KhoaBanQuyen` ADD CONSTRAINT `ProductKey_productId_fkey` FOREIGN KEY (`san_pham_id`) REFERENCES `SanPham`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KhoaBanQuyen` ADD CONSTRAINT `ProductKey_orderItemId_fkey` FOREIGN KEY (`chi_tiet_don_hang_id`) REFERENCES `ChiTietDonHang`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TokenLamMoi` ADD CONSTRAINT `RefreshToken_userId_fkey` FOREIGN KEY (`nguoi_dung_id`) REFERENCES `NguoiDung`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DanhGia` ADD CONSTRAINT `Review_productId_fkey` FOREIGN KEY (`san_pham_id`) REFERENCES `SanPham`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DanhGia` ADD CONSTRAINT `Review_userId_fkey` FOREIGN KEY (`nguoi_dung_id`) REFERENCES `NguoiDung`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TepTaiLen` ADD CONSTRAINT `UploadedFile_uploadedById_fkey` FOREIGN KEY (`nguoi_tai_len_id`) REFERENCES `NguoiDung`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NguoiDung` ADD CONSTRAINT `User_roleId_fkey` FOREIGN KEY (`vai_tro_id`) REFERENCES `VaiTro`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhienNguoiDung` ADD CONSTRAINT `UserSession_userId_fkey` FOREIGN KEY (`nguoi_dung_id`) REFERENCES `NguoiDung`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
