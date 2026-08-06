# Database Seed

## Purpose

This seed system creates a complete local demo dataset for the current Prisma schema so a developer can clone the repository, run one command, and work with a functional database immediately.

The seed is designed to be idempotent:

- Uses deterministic IDs for demo records.
- Uses `upsert` for stable entities.
- Safely updates existing demo records on repeated runs.
- Avoids creating duplicate demo data.

## Demo data included

The seed creates demo data for existing tables where appropriate, including:

- Roles: `admin`, `customer`
- Users: 1 admin + 3 customers
- Categories: Windows, Office, Antivirus
- Brands: Microsoft, Kaspersky, ESET
- Products: 9 realistic digital products with category/brand relations
- Product images: gallery images for each product
- Banners: 3 homepage banners
- Product keys: multiple keys per product (AVAILABLE)
- Orders: PAID, PENDING, CANCELLED examples
- Payments and payment transaction examples
- Supporting records: cart, cart items, address, favorites, reviews, notifications, sessions, reset token, refresh token, audit log, system settings, uploaded file metadata

## Prerequisites

1. Configure environment variables (especially `DATABASE_URL`).
2. Ensure database schema is already migrated.
3. Install dependencies.

## How to run seed

From `backend`:

```bash
npm install
npx prisma db seed
```

You can also run the script directly:

```bash
npm run prisma:seed
```

## How to reset database

From `backend`:

```bash
npx prisma migrate reset --skip-seed
```

This command drops and recreates the database using existing migrations.

## How to reseed

After reset or anytime you need fresh demo records:

```bash
npx prisma db seed
```

Because the seed is idempotent, running it multiple times is safe for demo data.
