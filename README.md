# 🚀 Web Bán Key Phần Mềm Bản Quyền — Công Ty TNHH Công Nghệ Nam Nguyễn

Hệ thống Website Thương mại điện tử phân phối phần mềm bản quyền chính hãng (Windows, Office, Antivirus, Adobe, v.v.) với tính năng giao key tự động qua Email, tích hợp Cổng thanh toán QR (MoMo, VNPay, VietQR MBBank), tự động trừ kho hàng, đối soát giao dịch ngân hàng và trang Quản trị Admin hoàn chỉnh.

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

### Frontend
- **Framework**: React 18, [TanStack Router](https://tanstack.com/router) (TanStack Start SSR), [TanStack Query](https://tanstack.com/query)
- **Styling**: TailwindCSS, CSS Variables (Tông màu chủ đạo `#35B7BC`)
- **Icons & UI Components**: Lucide React, Sonner (Toast notifications)

### Backend
- **Core**: Node.js, Express.js (TypeScript)
- **ORM & Database**: Prisma ORM, MySQL / MariaDB (XAMPP / Port 3306)
- **Lưu trữ ảnh (Object Storage)**: Cloudflare R2 / AWS S3 API
- **Xác thực & Mã hóa**: JWT (JSON Web Tokens) + Cookie HttpOnly + AES-256-GCM Key Encryption

---

## 📋 Yêu Cầu Tiền Trạm (Prerequisites)

1. **Node.js**: Phiên bản `v18.0.0` trở lên ([Tải tại đây](https://nodejs.org/))
2. **XAMPP Control Panel**: Chạy MySQL Service ([Tải tại đây](https://www.apachefriends.org/))
3. **Git**: Dùng để quản lý mã nguồn

---

## 🔒 Cấu Hình Môi Trường (.env)

Vui lòng tạo các file `.env` trong từng thư mục từ file mẫu bên dưới (không commit file `.env` thật lên Git):

### `backend/.env` (Backend Configuration)
```env
PORT=4000
DATABASE_URL="mysql://root:@localhost:3306/webtmdt"

# Secret Key cho Token xác thực & Mã hóa Key
JWT_SECRET="YOUR_SECRET_JWT_KEY_HERE"
JWT_REFRESH_SECRET="YOUR_SECRET_REFRESH_KEY_HERE"
ENCRYPTION_KEY="YOUR_AES_256_GCM_SECRET_32_BYTES"

# Cấu hình Lưu trữ Cloudflare R2
R2_ACCOUNT_ID="YOUR_CLOUDFLARE_ACCOUNT_ID"
R2_ACCESS_KEY_ID="YOUR_R2_ACCESS_KEY_ID"
R2_SECRET_ACCESS_KEY="YOUR_R2_SECRET_ACCESS_KEY"
R2_BUCKET_NAME="YOUR_BUCKET_NAME"
```

---

## 📥 Hướng Dẫn Cài Đặt Chi Tiết

### 1. Clone Repository về máy
```bash
git clone https://github.com/lapvan1404/webbankeybanquyen.git
cd webbankeybanquyen
```

### 2. Cài đặt Dependencies (Thư viện)

#### Cài đặt thư viện cho Frontend:
```bash
npm install
```

#### Cài đặt thư viện cho Backend:
```bash
cd backend
npm install
cd ..
```

---

### 3. Cấu hình Cơ sở dữ liệu MySQL (XAMPP)

1. Mở **XAMPP Control Panel** và nhấn **Start** tại mục **MySQL** (cổng `3306`).
2. Vào trang quản trị `phpMyAdmin` (`http://localhost/phpmyadmin`).
3. Tạo 1 Cơ sở dữ liệu (Database) mới tên là: `webtmdt` (Collation: `utf8mb4_unicode_ci`).

---

### 4. Khởi tạo Prisma Database & Dữ liệu mẫu (Seed Data)

```bash
cd backend

# Cập nhật cấu trúc bảng vào MySQL
npx prisma db push

# Chạy seed dữ liệu mẫu danh mục & sản phẩm
npx tsx prisma/seed.ts

cd ..
```

---

## ⚡ Hướng Dẫn Khởi Chạy Dự Án (Run Project)

Cần mở **2 Cửa sổ Terminal (CMD/PowerShell)** song song:

### Terminal 1: Chạy Backend Dev Server (Port 4000)
```bash
cd backend
npm run dev
```
=> Backend API: `http://localhost:4000`

### Terminal 2: Chạy Frontend Dev Server (Port 8080)
```bash
# Ở thư mục gốc dự án
npm run dev
```
=> Giao diện Website: `http://localhost:8080`

---

## 🔐 Tài Khoản Quản Trị Admin

- **Đường dẫn trang Admin**: `http://localhost:8080/admin`
- **Tài khoản mặc định**:
  - **Email**: `admin@example.com`
  - **Mật khẩu**: `Admin@1234`

---

## ✨ Các Tính Năng Nổi Bật

1. **Trang Khách hàng (FE)**:
   - Giao diện phối màu `#35B7BC` hiện đại, mượt mà trên cả Desktop & Mobile.
   - Tìm kiếm sản phẩm theo từ khóa, lọc theo Danh mục, Thương hiệu & Khoảng giá.
   - **Mã Giảm Giá (Coupon System)**: Nhập mã giảm giá (ví dụ: `GIAM10`) tự động tính và trừ trực tiếp số tiền % giảm giá trên tổng đơn hàng VietQR.
   - **Thanh Toán VietQR MBBank**: Tự động sinh mã VietQR chứa chính xác số tiền sau giảm giá và nội dung chuyển khoản `CK [Mã_Đơn_Hàng]`.
   - **Đối Soát Giao Dịch 3 Bước**: Khi bấm *"Tôi đã thanh toán thành công"*, hệ thống chạy quy trình 3 bước đối soát giao dịch ngân hàng thời gian thực trước khi cấp key bản quyền.
   - **Mô Tả & Thông Tin Chi Tiết Riêng Biệt**: Hiển thị tách biệt Mô tả ngắn tổng quan và Thông tin chi tiết sản phẩm.

2. **Trang Quản trị (Admin)**:
   - **Quản lý Sản phẩm**: Thêm/Sửa/Xóa sản phẩm, nhập riêng ô Mô tả ngắn và ô Thông tin chi tiết, upload ảnh sản phẩm trực tiếp.
   - **Quản lý Mã Giảm Giá**: Quản lý danh sách coupon, phần trăm giảm giá và trạng thái kích hoạt.
   - **Quản lý Đơn hàng & Tự Động Trừ Kho**: Đơn hàng thanh toán thành công tự động trừ tồn kho (`stock`) và tăng số lượng bán (`soldCount`). Duyệt key bản quyền gửi trực tiếp qua Email.
   - **Hệ thống Thông Báo**: Đánh dấu đã đọc đơn lẻ hoặc 1-Click *"Đánh dấu tất cả đã đọc"*.
   - **Tổng Quan (Dashboard)**: Thống kê dữ liệu thực về doanh thu, đơn hàng, khách hàng và biến động kho từ MySQL.

---

© 2026 **Công Ty TNHH Công Nghệ Nam Nguyễn**. All Rights Reserved.
