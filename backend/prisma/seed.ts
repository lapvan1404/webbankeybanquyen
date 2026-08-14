import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import {
  PrismaClient,
  ProductKeyAlgorithm,
  ProductKeyStatus,
  ProductStatus,
  order_status,
  payment_method,
  payment_status,
  paymenttransaction_provider,
  paymenttransaction_status,
  user_status,
} from '@prisma/client';
import { hash } from 'bcryptjs';
import { createCipheriv, createHash, randomBytes } from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(process.env.DATABASE_URL ?? ''),
});

const IDS = {
  roles: {
    admin: 'seed-role-admin',
    customer: 'seed-role-customer',
  },
  users: {
    admin: 'seed-user-admin',
    customer1: 'seed-user-customer-1',
    customer2: 'seed-user-customer-2',
    customer3: 'seed-user-customer-3',
  },
  categories: {
    windows: 'seed-category-windows',
    office: 'seed-category-office',
    antivirus: 'seed-category-antivirus',
  },
  brands: {
    microsoft: 'seed-brand-microsoft',
    kaspersky: 'seed-brand-kaspersky',
    eset: 'seed-brand-eset',
  },
  banners: {
    one: 'seed-banner-1',
    two: 'seed-banner-2',
    three: 'seed-banner-3',
  },
  products: {
    windows11Home: 'seed-product-windows-11-home',
    windows11Pro: 'seed-product-windows-11-pro',
    office2024Home: 'seed-product-office-2024-home',
    office2024Pro: 'seed-product-office-2024-pro',
    ms365Personal: 'seed-product-ms365-personal',
    ms365Family: 'seed-product-ms365-family',
    kasperskyStandard: 'seed-product-kaspersky-standard',
    kasperskyPlus: 'seed-product-kaspersky-plus',
    esetEssential: 'seed-product-eset-essential',
  },
  carts: {
    c1: 'seed-cart-1',
    c2: 'seed-cart-2',
  },
  addresses: {
    a1: 'seed-address-1',
    a2: 'seed-address-2',
  },
  orders: {
    o1: 'seed-order-1',
    o2: 'seed-order-2',
    o3: 'seed-order-3',
  },
  orderItems: {
    oi1: 'seed-order-item-1',
    oi2: 'seed-order-item-2',
    oi3: 'seed-order-item-3',
    oi4: 'seed-order-item-4',
  },
  payments: {
    p1: 'seed-payment-1',
    p2: 'seed-payment-2',
  },
  paymentTransactions: {
    t1: 'seed-payment-tx-1',
  },
  sessions: {
    s1: 'seed-session-1',
  },
  resetTokens: {
    r1: 'seed-reset-token-1',
  },
  refreshTokens: {
    r1: 'seed-refresh-token-1',
  },
  notifications: {
    n1: 'seed-notification-1',
    n2: 'seed-notification-2',
  },
  favorites: {
    f1: 'seed-favorite-1',
    f2: 'seed-favorite-2',
  },
  reviews: {
    rv1: 'seed-review-1',
    rv2: 'seed-review-2',
  },
  loginAttempts: {
    l1: 'seed-login-attempt-1',
  },
  auditLogs: {
    a1: 'seed-audit-log-1',
  },
  settings: {
    storeName: 'seed-setting-store-name',
    supportEmail: 'seed-setting-support-email',
  },
  uploadedFiles: {
    u1: 'seed-uploaded-file-1',
  },
} as const;

const RESOLVED = {
  roles: {
    admin: IDS.roles.admin,
    customer: IDS.roles.customer,
  },
  users: {
    admin: IDS.users.admin,
    customer1: IDS.users.customer1,
    customer2: IDS.users.customer2,
    customer3: IDS.users.customer3,
  },
};

type ProductSeed = {
  id: string;
  sku: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  thumbnailUrl: string;
  price: number;
  salePrice: number;
  stock: number;
  categoryId: string;
  brandId: string;
  licenseType: string;
  licenseDuration: number;
  deviceLimit: number;
  isFeatured?: boolean;
  gallery: string[];
};

const productSeeds: ProductSeed[] = [
  {
    id: IDS.products.windows11Home,
    sku: 'WIN11-HOME-ESD',
    name: 'Windows 11 Home',
    slug: 'windows-11-home',
    shortDescription: 'Official digital license for Windows 11 Home.',
    description:
      'Genuine Windows 11 Home license key for 1 PC. Instant digital delivery after payment.',
    thumbnailUrl: 'https://example.com/demo/windows-11-home.webp',
    price: 129,
    salePrice: 109,
    stock: 300,
    categoryId: IDS.categories.windows,
    brandId: IDS.brands.microsoft,
    licenseType: 'Perpetual',
    licenseDuration: 0,
    deviceLimit: 1,
    isFeatured: true,
    gallery: [
      'https://example.com/demo/windows-11-home-1.webp',
      'https://example.com/demo/windows-11-home-2.webp',
    ],
  },
  {
    id: IDS.products.windows11Pro,
    sku: 'WIN11-PRO-ESD',
    name: 'Windows 11 Pro',
    slug: 'windows-11-pro',
    shortDescription: 'Professional edition for business and power users.',
    description: 'Genuine Windows 11 Pro digital key with advanced business and security features.',
    thumbnailUrl: 'https://example.com/demo/windows-11-pro.webp',
    price: 199,
    salePrice: 169,
    stock: 250,
    categoryId: IDS.categories.windows,
    brandId: IDS.brands.microsoft,
    licenseType: 'Perpetual',
    licenseDuration: 0,
    deviceLimit: 1,
    isFeatured: true,
    gallery: [
      'https://example.com/demo/windows-11-pro-1.webp',
      'https://example.com/demo/windows-11-pro-2.webp',
    ],
  },
  {
    id: IDS.products.office2024Home,
    sku: 'OFF24-HS-1PC',
    name: 'Office 2024 Home',
    slug: 'office-2024-home',
    shortDescription: 'Word, Excel and PowerPoint for home productivity.',
    description: 'One-time purchase Office 2024 Home license for a single PC with essential apps.',
    thumbnailUrl: 'https://example.com/demo/office-2024-home.webp',
    price: 149,
    salePrice: 129,
    stock: 200,
    categoryId: IDS.categories.office,
    brandId: IDS.brands.microsoft,
    licenseType: 'Perpetual',
    licenseDuration: 0,
    deviceLimit: 1,
    gallery: [
      'https://example.com/demo/office-2024-home-1.webp',
      'https://example.com/demo/office-2024-home-2.webp',
    ],
  },
  {
    id: IDS.products.office2024Pro,
    sku: 'OFF24-PRO-1PC',
    name: 'Office 2024 Professional',
    slug: 'office-2024-professional',
    shortDescription: 'Complete Office suite including Outlook and Access.',
    description:
      'Office 2024 Professional license with full desktop suite for individual and small business use.',
    thumbnailUrl: 'https://example.com/demo/office-2024-professional.webp',
    price: 249,
    salePrice: 219,
    stock: 180,
    categoryId: IDS.categories.office,
    brandId: IDS.brands.microsoft,
    licenseType: 'Perpetual',
    licenseDuration: 0,
    deviceLimit: 1,
    gallery: [
      'https://example.com/demo/office-2024-professional-1.webp',
      'https://example.com/demo/office-2024-professional-2.webp',
    ],
  },
  {
    id: IDS.products.ms365Personal,
    sku: 'M365-PERSONAL-1Y',
    name: 'Microsoft 365 Personal',
    slug: 'microsoft-365-personal',
    shortDescription: '1-year subscription for 1 user with cloud benefits.',
    description:
      'Microsoft 365 Personal annual subscription, premium Office apps and 1TB OneDrive.',
    thumbnailUrl: 'https://example.com/demo/microsoft-365-personal.webp',
    price: 69,
    salePrice: 59,
    stock: 500,
    categoryId: IDS.categories.office,
    brandId: IDS.brands.microsoft,
    licenseType: 'Subscription',
    licenseDuration: 12,
    deviceLimit: 5,
    gallery: [
      'https://example.com/demo/microsoft-365-personal-1.webp',
      'https://example.com/demo/microsoft-365-personal-2.webp',
    ],
  },
  {
    id: IDS.products.ms365Family,
    sku: 'M365-FAMILY-1Y',
    name: 'Microsoft 365 Family',
    slug: 'microsoft-365-family',
    shortDescription: '1-year subscription for up to 6 users.',
    description:
      'Microsoft 365 Family annual subscription for household productivity and cloud storage.',
    thumbnailUrl: 'https://example.com/demo/microsoft-365-family.webp',
    price: 99,
    salePrice: 89,
    stock: 450,
    categoryId: IDS.categories.office,
    brandId: IDS.brands.microsoft,
    licenseType: 'Subscription',
    licenseDuration: 12,
    deviceLimit: 6,
    gallery: [
      'https://example.com/demo/microsoft-365-family-1.webp',
      'https://example.com/demo/microsoft-365-family-2.webp',
    ],
  },
  {
    id: IDS.products.kasperskyStandard,
    sku: 'KASPERSKY-STANDARD-1Y',
    name: 'Kaspersky Standard',
    slug: 'kaspersky-standard',
    shortDescription: 'Core antivirus protection for daily use.',
    description:
      'Kaspersky Standard license with trusted antivirus, anti-phishing and privacy tools.',
    thumbnailUrl: 'https://example.com/demo/kaspersky-standard.webp',
    price: 39,
    salePrice: 29,
    stock: 700,
    categoryId: IDS.categories.antivirus,
    brandId: IDS.brands.kaspersky,
    licenseType: 'Subscription',
    licenseDuration: 12,
    deviceLimit: 1,
    gallery: [
      'https://example.com/demo/kaspersky-standard-1.webp',
      'https://example.com/demo/kaspersky-standard-2.webp',
    ],
  },
  {
    id: IDS.products.kasperskyPlus,
    sku: 'KASPERSKY-PLUS-1Y',
    name: 'Kaspersky Plus',
    slug: 'kaspersky-plus',
    shortDescription: 'Enhanced protection with performance tools.',
    description: 'Kaspersky Plus with stronger security controls and premium privacy features.',
    thumbnailUrl: 'https://example.com/demo/kaspersky-plus.webp',
    price: 59,
    salePrice: 49,
    stock: 650,
    categoryId: IDS.categories.antivirus,
    brandId: IDS.brands.kaspersky,
    licenseType: 'Subscription',
    licenseDuration: 12,
    deviceLimit: 3,
    gallery: [
      'https://example.com/demo/kaspersky-plus-1.webp',
      'https://example.com/demo/kaspersky-plus-2.webp',
    ],
  },
  {
    id: IDS.products.esetEssential,
    sku: 'ESET-ESSENTIAL-1Y',
    name: 'ESET HOME Security Essential',
    slug: 'eset-home-security-essential',
    shortDescription: 'Lightweight and powerful endpoint protection.',
    description: 'ESET HOME Security Essential annual license with proactive malware defense.',
    thumbnailUrl: 'https://example.com/demo/eset-home-security-essential.webp',
    price: 49,
    salePrice: 39,
    stock: 600,
    categoryId: IDS.categories.antivirus,
    brandId: IDS.brands.eset,
    licenseType: 'Subscription',
    licenseDuration: 12,
    deviceLimit: 1,
    gallery: [
      'https://example.com/demo/eset-home-security-essential-1.webp',
      'https://example.com/demo/eset-home-security-essential-2.webp',
    ],
  },
];

function encryptionKey() {
  return createHash('sha256')
    .update(process.env.PRODUCT_KEY_ENCRYPTION_KEY ?? process.env.JWT_SECRET ?? 'default-secret')
    .digest();
}

function encryptProductKey(rawKey: string) {
  const key = encryptionKey();
  const ivBuffer = randomBytes(16);
  const cipher = createCipheriv('aes-256-gcm', key, ivBuffer);
  const encrypted = Buffer.concat([cipher.update(rawKey, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    encryptedKey: Buffer.concat([encrypted, authTag]).toString('base64'),
    iv: ivBuffer.toString('hex'),
    keyHash: createHash('sha256').update(rawKey).digest('hex'),
  };
}

function formatDemoLicenseKey(productSlug: string, index: number) {
  const prefix = productSlug
    .replace(/[^a-z0-9]/gi, '')
    .toUpperCase()
    .slice(0, 8)
    .padEnd(8, 'X');
  return `${prefix}-${(1000 + index).toString()}-${(2000 + index).toString()}-${(3000 + index).toString()}-${(4000 + index).toString()}`;
}

async function seedRoles(now: Date) {
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {
      description: 'Administrator role with full access',
      updatedAt: now,
    },
    create: {
      id: IDS.roles.admin,
      name: 'admin',
      description: 'Administrator role with full access',
      createdAt: now,
      updatedAt: now,
    },
  });

  const customerRole = await prisma.role.upsert({
    where: { name: 'customer' },
    update: {
      description: 'Standard customer role',
      updatedAt: now,
    },
    create: {
      id: IDS.roles.customer,
      name: 'customer',
      description: 'Standard customer role',
      createdAt: now,
      updatedAt: now,
    },
  });

  RESOLVED.roles.admin = adminRole.id;
  RESOLVED.roles.customer = customerRole.id;
}

async function seedUsers(now: Date) {
  const adminPasswordHash = await hash('Admin@1234', 10);
  const customerPasswordHash = await hash('Customer@1234', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {
      firstName: 'System',
      lastName: 'Admin',
      roleId: RESOLVED.roles.admin,
      passwordHash: adminPasswordHash,
      avatarUrl: 'https://example.com/demo/avatar-admin.webp',
      emailVerified: true,
      status: user_status.ACTIVE,
      updatedAt: now,
    },
    create: {
      id: IDS.users.admin,
      email: 'admin@example.com',
      passwordHash: adminPasswordHash,
      firstName: 'System',
      lastName: 'Admin',
      roleId: RESOLVED.roles.admin,
      avatarUrl: 'https://example.com/demo/avatar-admin.webp',
      status: user_status.ACTIVE,
      emailVerified: true,
      phone: '0900000001',
      createdAt: now,
      updatedAt: now,
    },
  });

  RESOLVED.users.admin = adminUser.id;

  const customers = [
    {
      id: IDS.users.customer1,
      email: 'customer1@example.com',
      firstName: 'Linh',
      lastName: 'Nguyen',
      phone: '0900000002',
      avatarUrl: 'https://example.com/demo/avatar-customer-1.webp',
    },
    {
      id: IDS.users.customer2,
      email: 'customer2@example.com',
      firstName: 'Minh',
      lastName: 'Tran',
      phone: '0900000003',
      avatarUrl: 'https://example.com/demo/avatar-customer-2.webp',
    },
    {
      id: IDS.users.customer3,
      email: 'customer3@example.com',
      firstName: 'An',
      lastName: 'Pham',
      phone: '0900000004',
      avatarUrl: 'https://example.com/demo/avatar-customer-3.webp',
    },
  ];

  for (const customer of customers) {
    const user = await prisma.user.upsert({
      where: { email: customer.email },
      update: {
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
        roleId: RESOLVED.roles.customer,
        passwordHash: customerPasswordHash,
        avatarUrl: customer.avatarUrl,
        emailVerified: true,
        status: user_status.ACTIVE,
        updatedAt: now,
      },
      create: {
        id: customer.id,
        email: customer.email,
        passwordHash: customerPasswordHash,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
        roleId: RESOLVED.roles.customer,
        avatarUrl: customer.avatarUrl,
        status: user_status.ACTIVE,
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      },
    });

    if (customer.email === 'customer1@example.com') {
      RESOLVED.users.customer1 = user.id;
    }
    if (customer.email === 'customer2@example.com') {
      RESOLVED.users.customer2 = user.id;
    }
    if (customer.email === 'customer3@example.com') {
      RESOLVED.users.customer3 = user.id;
    }
  }
}

async function seedCategories(now: Date) {
  const categories = [
    {
      id: IDS.categories.windows,
      name: 'Windows',
      slug: 'windows',
      description: 'Microsoft Windows operating system licenses.',
      imageUrl: 'https://example.com/demo/category-windows.webp',
      sortOrder: 1,
    },
    {
      id: IDS.categories.office,
      name: 'Office',
      slug: 'office',
      description: 'Office productivity suites and subscriptions.',
      imageUrl: 'https://example.com/demo/category-office.webp',
      sortOrder: 2,
    },
    {
      id: IDS.categories.antivirus,
      name: 'Antivirus',
      slug: 'antivirus',
      description: 'Security and antivirus software licenses.',
      imageUrl: 'https://example.com/demo/category-antivirus.webp',
      sortOrder: 3,
    },
  ];

  for (const item of categories) {
    await prisma.category.upsert({
      where: { id: item.id },
      update: {
        name: item.name,
        slug: item.slug,
        description: item.description,
        imageUrl: item.imageUrl,
        sortOrder: item.sortOrder,
        isActive: true,
        seoTitle: item.name,
        seoDescription: item.description,
        seoKeywords: `${item.name}, license, digital`,
        updatedAt: now,
      },
      create: {
        id: item.id,
        name: item.name,
        slug: item.slug,
        description: item.description,
        imageUrl: item.imageUrl,
        sortOrder: item.sortOrder,
        isActive: true,
        seoTitle: item.name,
        seoDescription: item.description,
        seoKeywords: `${item.name}, license, digital`,
        createdAt: now,
        updatedAt: now,
      },
    });
  }
}

async function seedBrands(now: Date) {
  const brands = [
    {
      id: IDS.brands.microsoft,
      name: 'Microsoft',
      slug: 'microsoft',
      logoUrl: 'https://example.com/demo/brand-microsoft.webp',
      website: 'https://www.microsoft.com',
      description: 'Official Microsoft software products.',
      sortOrder: 1,
    },
    {
      id: IDS.brands.kaspersky,
      name: 'Kaspersky',
      slug: 'kaspersky',
      logoUrl: 'https://example.com/demo/brand-kaspersky.webp',
      website: 'https://www.kaspersky.com',
      description: 'Antivirus and endpoint security solutions.',
      sortOrder: 2,
    },
    {
      id: IDS.brands.eset,
      name: 'ESET',
      slug: 'eset',
      logoUrl: 'https://example.com/demo/brand-eset.webp',
      website: 'https://www.eset.com',
      description: 'Cybersecurity products for home and business.',
      sortOrder: 3,
    },
  ];

  for (const item of brands) {
    await prisma.brand.upsert({
      where: { id: item.id },
      update: {
        name: item.name,
        slug: item.slug,
        logoUrl: item.logoUrl,
        website: item.website,
        description: item.description,
        sortOrder: item.sortOrder,
        isActive: true,
        seoTitle: item.name,
        seoDescription: item.description,
        seoKeywords: `${item.name}, software, license`,
        updatedAt: now,
      },
      create: {
        id: item.id,
        name: item.name,
        slug: item.slug,
        logoUrl: item.logoUrl,
        website: item.website,
        description: item.description,
        sortOrder: item.sortOrder,
        isActive: true,
        seoTitle: item.name,
        seoDescription: item.description,
        seoKeywords: `${item.name}, software, license`,
        createdAt: now,
        updatedAt: now,
      },
    });
  }
}

async function seedProducts(now: Date) {
  for (const product of productSeeds) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: {
        sku: product.sku,
        name: product.name,
        slug: product.slug,
        shortDescription: product.shortDescription,
        description: product.description,
        thumbnailUrl: product.thumbnailUrl,
        price: product.price,
        salePrice: product.salePrice,
        costPrice: Math.max(1, Math.floor(product.salePrice * 0.7)),
        stock: product.stock,
        soldCount: 0,
        viewCount: 0,
        status: ProductStatus.ACTIVE,
        isFeatured: product.isFeatured ?? false,
        isDigital: true,
        licenseType: product.licenseType,
        licenseDuration: product.licenseDuration,
        deviceLimit: product.deviceLimit,
        deliveryMethod: 'EMAIL',
        seoTitle: product.name,
        seoDescription: product.shortDescription,
        seoKeywords: `${product.name}, ${product.sku}, key`,
        publishedAt: now,
        isPublished: true,
        categoryId: product.categoryId,
        brandId: product.brandId,
        updatedAt: now,
      },
      create: {
        id: product.id,
        sku: product.sku,
        name: product.name,
        slug: product.slug,
        shortDescription: product.shortDescription,
        description: product.description,
        thumbnailUrl: product.thumbnailUrl,
        price: product.price,
        salePrice: product.salePrice,
        costPrice: Math.max(1, Math.floor(product.salePrice * 0.7)),
        stock: product.stock,
        soldCount: 0,
        viewCount: 0,
        status: ProductStatus.ACTIVE,
        isFeatured: product.isFeatured ?? false,
        isDigital: true,
        licenseType: product.licenseType,
        licenseDuration: product.licenseDuration,
        deviceLimit: product.deviceLimit,
        deliveryMethod: 'EMAIL',
        seoTitle: product.name,
        seoDescription: product.shortDescription,
        seoKeywords: `${product.name}, ${product.sku}, key`,
        publishedAt: now,
        isPublished: true,
        categoryId: product.categoryId,
        brandId: product.brandId,
        createdAt: now,
        updatedAt: now,
      },
    });
  }

  for (const product of productSeeds) {
    for (let idx = 0; idx < product.gallery.length; idx += 1) {
      const imageId = `seed-image-${product.id}-${idx + 1}`;
      const imageUrl = product.gallery[idx];
      await prisma.productimage.upsert({
        where: { id: imageId },
        update: {
          productId: product.id,
          url: imageUrl,
          altText: `${product.name} image ${idx + 1}`,
          position: idx + 1,
          updatedAt: now,
        },
        create: {
          id: imageId,
          productId: product.id,
          url: imageUrl,
          altText: `${product.name} image ${idx + 1}`,
          position: idx + 1,
          createdAt: now,
          updatedAt: now,
        },
      });
    }
  }
}

async function seedBanners(now: Date) {
  const banners = [
    {
      id: IDS.banners.one,
      title: 'Windows & Office Digital Week',
      subtitle: 'Save up to 25% on genuine license keys',
      imageUrl: 'https://example.com/demo/banner-1.webp',
      linkUrl: '/products?campaign=windows-office-week',
    },
    {
      id: IDS.banners.two,
      title: 'Security Essentials For Every Device',
      subtitle: 'Kaspersky and ESET licenses from trusted sources',
      imageUrl: 'https://example.com/demo/banner-2.webp',
      linkUrl: '/products?category=antivirus',
    },
    {
      id: IDS.banners.three,
      title: 'Work Smarter With Microsoft 365',
      subtitle: 'Personal and Family plans ready for instant activation',
      imageUrl: 'https://example.com/demo/banner-3.webp',
      linkUrl: '/products?search=microsoft-365',
    },
  ];

  for (const banner of banners) {
    await prisma.banner.upsert({
      where: { id: banner.id },
      update: {
        title: banner.title,
        subtitle: banner.subtitle,
        imageUrl: banner.imageUrl,
        linkUrl: banner.linkUrl,
        isActive: true,
        updatedAt: now,
      },
      create: {
        id: banner.id,
        title: banner.title,
        subtitle: banner.subtitle,
        imageUrl: banner.imageUrl,
        linkUrl: banner.linkUrl,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    });
  }
}

async function seedProductKeys(now: Date) {
  const records: Array<{
    id: string;
    productId: string;
    keyText: string;
  }> = [];

  for (const product of productSeeds) {
    for (let i = 1; i <= 6; i += 1) {
      records.push({
        id: `seed-product-key-${product.id}-${i}`,
        productId: product.id,
        keyText: formatDemoLicenseKey(product.slug, i),
      });
    }
  }

  for (const record of records) {
    const { encryptedKey, iv, keyHash } = encryptProductKey(record.keyText);
    await prisma.productkey.upsert({
      where: { id: record.id },
      update: {
        productId: record.productId,
        orderItemId: null,
        encryptedKey,
        keyHash,
        iv,
        algorithm: ProductKeyAlgorithm.AES_256_GCM,
        keyVersion: 1,
        status: ProductKeyStatus.AVAILABLE,
        reservedUntil: null,
        assignedAt: null,
        batchId: 'seed-batch-001',
        importedAt: now,
        updatedAt: now,
      },
      create: {
        id: record.id,
        productId: record.productId,
        orderItemId: null,
        encryptedKey,
        keyHash,
        iv,
        algorithm: ProductKeyAlgorithm.AES_256_GCM,
        keyVersion: 1,
        status: ProductKeyStatus.AVAILABLE,
        reservedUntil: null,
        assignedAt: null,
        batchId: 'seed-batch-001',
        importedAt: now,
        createdAt: now,
        updatedAt: now,
      },
    });
  }
}

async function seedOrdersAndPayments(now: Date) {
  const orderSeeds = [
    {
      id: IDS.orders.o1,
      orderNumber: 'SEED-ORD-0001',
      userId: RESOLVED.users.customer1,
      status: order_status.PAID,
      paymentStatus: payment_status.PAID,
      totalAmount: 168,
      items: [
        {
          id: IDS.orderItems.oi1,
          productId: IDS.products.windows11Home,
          productName: 'Windows 11 Home',
          sku: 'WIN11-HOME-ESD',
          unitPrice: 109,
          quantity: 1,
          totalPrice: 109,
        },
        {
          id: IDS.orderItems.oi2,
          productId: IDS.products.kasperskyStandard,
          productName: 'Kaspersky Standard',
          sku: 'KASPERSKY-STANDARD-1Y',
          unitPrice: 29,
          quantity: 2,
          totalPrice: 58,
        },
      ],
    },
    {
      id: IDS.orders.o2,
      orderNumber: 'SEED-ORD-0002',
      userId: RESOLVED.users.customer2,
      status: order_status.PENDING,
      paymentStatus: payment_status.UNPAID,
      totalAmount: 89,
      items: [
        {
          id: IDS.orderItems.oi3,
          productId: IDS.products.ms365Family,
          productName: 'Microsoft 365 Family',
          sku: 'M365-FAMILY-1Y',
          unitPrice: 89,
          quantity: 1,
          totalPrice: 89,
        },
      ],
    },
    {
      id: IDS.orders.o3,
      orderNumber: 'SEED-ORD-0003',
      userId: RESOLVED.users.customer3,
      status: order_status.CANCELLED,
      paymentStatus: payment_status.UNPAID,
      totalAmount: 219,
      items: [
        {
          id: IDS.orderItems.oi4,
          productId: IDS.products.office2024Pro,
          productName: 'Office 2024 Professional',
          sku: 'OFF24-PRO-1PC',
          unitPrice: 219,
          quantity: 1,
          totalPrice: 219,
        },
      ],
    },
  ];

  for (const order of orderSeeds) {
    await prisma.order.upsert({
      where: { id: order.id },
      update: {
        orderNumber: order.orderNumber,
        userId: order.userId,
        status: order.status,
        paymentStatus: order.paymentStatus,
        totalAmount: order.totalAmount,
        shippingCost: 0,
        placedAt: now,
        updatedAt: now,
      },
      create: {
        id: order.id,
        orderNumber: order.orderNumber,
        userId: order.userId,
        status: order.status,
        paymentStatus: order.paymentStatus,
        totalAmount: order.totalAmount,
        shippingCost: 0,
        placedAt: now,
        createdAt: now,
        updatedAt: now,
      },
    });

    for (const item of order.items) {
      await prisma.orderitem.upsert({
        where: { id: item.id },
        update: {
          orderId: order.id,
          productId: item.productId,
          productName: item.productName,
          sku: item.sku,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          totalPrice: item.totalPrice,
          updatedAt: now,
        },
        create: {
          id: item.id,
          orderId: order.id,
          productId: item.productId,
          productName: item.productName,
          sku: item.sku,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          totalPrice: item.totalPrice,
          createdAt: now,
          updatedAt: now,
        },
      });
    }
  }

  await prisma.payment.upsert({
    where: { id: IDS.payments.p1 },
    update: {
      orderId: IDS.orders.o1,
      amount: 168,
      method: payment_method.MOMO,
      status: payment_status.PAID,
      updatedAt: now,
    },
    create: {
      id: IDS.payments.p1,
      orderId: IDS.orders.o1,
      amount: 168,
      method: payment_method.MOMO,
      status: payment_status.PAID,
      createdAt: now,
      updatedAt: now,
    },
  });

  await prisma.payment.upsert({
    where: { id: IDS.payments.p2 },
    update: {
      orderId: IDS.orders.o2,
      amount: 89,
      method: payment_method.BANK_TRANSFER,
      status: payment_status.UNPAID,
      updatedAt: now,
    },
    create: {
      id: IDS.payments.p2,
      orderId: IDS.orders.o2,
      amount: 89,
      method: payment_method.BANK_TRANSFER,
      status: payment_status.UNPAID,
      createdAt: now,
      updatedAt: now,
    },
  });

  await prisma.paymenttransaction.upsert({
    where: { id: IDS.paymentTransactions.t1 },
    update: {
      paymentId: IDS.payments.p1,
      transactionId: 'SEED-TX-0001',
      amount: 168,
      status: paymenttransaction_status.SUCCESS,
      provider: paymenttransaction_provider.MOMO,
      updatedAt: now,
    },
    create: {
      id: IDS.paymentTransactions.t1,
      paymentId: IDS.payments.p1,
      transactionId: 'SEED-TX-0001',
      amount: 168,
      status: paymenttransaction_status.SUCCESS,
      provider: paymenttransaction_provider.MOMO,
      createdAt: now,
      updatedAt: now,
    },
  });
}

async function seedAuxiliaryTables(now: Date) {
  await prisma.address.upsert({
    where: { id: IDS.addresses.a1 },
    update: {
      userId: RESOLVED.users.customer1,
      label: 'Home',
      street: '123 Demo Street',
      city: 'Ho Chi Minh City',
      state: 'HCM',
      postalCode: '700000',
      country: 'VN',
      isPrimary: true,
      updatedAt: now,
    },
    create: {
      id: IDS.addresses.a1,
      userId: RESOLVED.users.customer1,
      label: 'Home',
      street: '123 Demo Street',
      city: 'Ho Chi Minh City',
      state: 'HCM',
      postalCode: '700000',
      country: 'VN',
      isPrimary: true,
      createdAt: now,
      updatedAt: now,
    },
  });

  await prisma.address.upsert({
    where: { id: IDS.addresses.a2 },
    update: {
      userId: RESOLVED.users.customer2,
      label: 'Office',
      street: '88 Seed Avenue',
      city: 'Ha Noi',
      state: 'HN',
      postalCode: '100000',
      country: 'VN',
      isPrimary: true,
      updatedAt: now,
    },
    create: {
      id: IDS.addresses.a2,
      userId: RESOLVED.users.customer2,
      label: 'Office',
      street: '88 Seed Avenue',
      city: 'Ha Noi',
      state: 'HN',
      postalCode: '100000',
      country: 'VN',
      isPrimary: true,
      createdAt: now,
      updatedAt: now,
    },
  });

  await prisma.cart.upsert({
    where: { id: IDS.carts.c1 },
    update: {
      userId: RESOLVED.users.customer1,
      updatedAt: now,
    },
    create: {
      id: IDS.carts.c1,
      userId: RESOLVED.users.customer1,
      createdAt: now,
      updatedAt: now,
    },
  });

  await prisma.cart.upsert({
    where: { id: IDS.carts.c2 },
    update: {
      userId: RESOLVED.users.customer2,
      updatedAt: now,
    },
    create: {
      id: IDS.carts.c2,
      userId: RESOLVED.users.customer2,
      createdAt: now,
      updatedAt: now,
    },
  });

  await prisma.cartitem.upsert({
    where: { id: 'seed-cart-item-1' },
    update: {
      cartId: IDS.carts.c1,
      productId: IDS.products.kasperskyPlus,
      quantity: 1,
      price: 49,
      updatedAt: now,
    },
    create: {
      id: 'seed-cart-item-1',
      cartId: IDS.carts.c1,
      productId: IDS.products.kasperskyPlus,
      quantity: 1,
      price: 49,
      createdAt: now,
      updatedAt: now,
    },
  });

  await prisma.favorite.upsert({
    where: { id: IDS.favorites.f1 },
    update: {
      userId: RESOLVED.users.customer1,
      productId: IDS.products.windows11Pro,
    },
    create: {
      id: IDS.favorites.f1,
      userId: RESOLVED.users.customer1,
      productId: IDS.products.windows11Pro,
      createdAt: now,
    },
  });

  await prisma.favorite.upsert({
    where: { id: IDS.favorites.f2 },
    update: {
      userId: RESOLVED.users.customer2,
      productId: IDS.products.ms365Personal,
    },
    create: {
      id: IDS.favorites.f2,
      userId: RESOLVED.users.customer2,
      productId: IDS.products.ms365Personal,
      createdAt: now,
    },
  });

  await prisma.review.upsert({
    where: { id: IDS.reviews.rv1 },
    update: {
      userId: RESOLVED.users.customer1,
      productId: IDS.products.windows11Home,
      rating: 5,
      title: 'Fast activation',
      body: 'Received and activated within minutes.',
      updatedAt: now,
    },
    create: {
      id: IDS.reviews.rv1,
      userId: RESOLVED.users.customer1,
      productId: IDS.products.windows11Home,
      rating: 5,
      title: 'Fast activation',
      body: 'Received and activated within minutes.',
      createdAt: now,
      updatedAt: now,
    },
  });

  await prisma.review.upsert({
    where: { id: IDS.reviews.rv2 },
    update: {
      userId: RESOLVED.users.customer2,
      productId: IDS.products.kasperskyStandard,
      rating: 4,
      title: 'Good value',
      body: 'Works well for my laptop and easy to install.',
      updatedAt: now,
    },
    create: {
      id: IDS.reviews.rv2,
      userId: RESOLVED.users.customer2,
      productId: IDS.products.kasperskyStandard,
      rating: 4,
      title: 'Good value',
      body: 'Works well for my laptop and easy to install.',
      createdAt: now,
      updatedAt: now,
    },
  });

  await prisma.notification.upsert({
    where: { id: IDS.notifications.n1 },
    update: {
      userId: RESOLVED.users.customer1,
      title: 'Welcome to demo store',
      message: 'Your demo account is ready. Explore products and checkout flow.',
      read: false,
      updatedAt: now,
    },
    create: {
      id: IDS.notifications.n1,
      userId: RESOLVED.users.customer1,
      title: 'Welcome to demo store',
      message: 'Your demo account is ready. Explore products and checkout flow.',
      read: false,
      createdAt: now,
      updatedAt: now,
    },
  });

  await prisma.notification.upsert({
    where: { id: IDS.notifications.n2 },
    update: {
      userId: RESOLVED.users.customer2,
      title: 'Demo order update',
      message: 'Your seeded pending order is waiting for payment.',
      read: false,
      updatedAt: now,
    },
    create: {
      id: IDS.notifications.n2,
      userId: RESOLVED.users.customer2,
      title: 'Demo order update',
      message: 'Your seeded pending order is waiting for payment.',
      read: false,
      createdAt: now,
      updatedAt: now,
    },
  });

  await prisma.usersession.upsert({
    where: { id: IDS.sessions.s1 },
    update: {
      userId: RESOLVED.users.customer1,
      ipAddress: '127.0.0.1',
      userAgent: 'SeedAgent/1.0',
      lastActiveAt: now,
      revoked: false,
      updatedAt: now,
    },
    create: {
      id: IDS.sessions.s1,
      userId: RESOLVED.users.customer1,
      ipAddress: '127.0.0.1',
      userAgent: 'SeedAgent/1.0',
      lastActiveAt: now,
      createdAt: now,
      updatedAt: now,
      revoked: false,
    },
  });

  await prisma.passwordresettoken.upsert({
    where: { id: IDS.resetTokens.r1 },
    update: {
      userId: RESOLVED.users.customer2,
      tokenHash: createHash('sha256').update('seed-reset-token').digest('hex'),
      expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      used: false,
      updatedAt: now,
    },
    create: {
      id: IDS.resetTokens.r1,
      userId: RESOLVED.users.customer2,
      tokenHash: createHash('sha256').update('seed-reset-token').digest('hex'),
      expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      used: false,
      createdAt: now,
      updatedAt: now,
    },
  });

  await prisma.refreshtoken.upsert({
    where: { id: IDS.refreshTokens.r1 },
    update: {
      tokenHash: createHash('sha256').update('seed-refresh-token').digest('hex'),
      userId: RESOLVED.users.customer1,
      revoked: false,
      expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      updatedAt: now,
    },
    create: {
      id: IDS.refreshTokens.r1,
      tokenHash: createHash('sha256').update('seed-refresh-token').digest('hex'),
      userId: RESOLVED.users.customer1,
      revoked: false,
      expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      createdAt: now,
      updatedAt: now,
    },
  });

  await prisma.loginattempt.upsert({
    where: { id: IDS.loginAttempts.l1 },
    update: {
      userId: RESOLVED.users.customer3,
      success: true,
      ipAddress: '127.0.0.1',
      userAgent: 'SeedAgent/1.0',
      reason: 'Demo successful login',
      createdAt: now,
    },
    create: {
      id: IDS.loginAttempts.l1,
      userId: RESOLVED.users.customer3,
      success: true,
      ipAddress: '127.0.0.1',
      userAgent: 'SeedAgent/1.0',
      reason: 'Demo successful login',
      createdAt: now,
    },
  });

  await prisma.auditlog.upsert({
    where: { id: IDS.auditLogs.a1 },
    update: {
      userId: RESOLVED.users.admin,
      event: 'SEED_EXECUTED',
      metadata: JSON.stringify({ source: 'prisma-seed', demo: true }),
      createdAt: now,
    },
    create: {
      id: IDS.auditLogs.a1,
      userId: RESOLVED.users.admin,
      event: 'SEED_EXECUTED',
      metadata: JSON.stringify({ source: 'prisma-seed', demo: true }),
      createdAt: now,
    },
  });

  await prisma.systemsetting.upsert({
    where: { key: 'store.name' },
    update: {
      value: 'Visual Evolve Demo Store',
      updatedAt: now,
    },
    create: {
      id: IDS.settings.storeName,
      key: 'store.name',
      value: 'Visual Evolve Demo Store',
      createdAt: now,
      updatedAt: now,
    },
  });

  await prisma.systemsetting.upsert({
    where: { key: 'store.supportEmail' },
    update: {
      value: 'support@example.com',
      updatedAt: now,
    },
    create: {
      id: IDS.settings.supportEmail,
      key: 'store.supportEmail',
      value: 'support@example.com',
      createdAt: now,
      updatedAt: now,
    },
  });

  await prisma.uploadedfile.upsert({
    where: { id: IDS.uploadedFiles.u1 },
    update: {
      originalName: 'demo-banner.webp',
      fileName: 'seed-demo-banner.webp',
      mimeType: 'image/webp',
      size: 24576,
      bucket: 'demo-assets',
      objectKey: 'banners/seed-demo-banner.webp',
      url: 'https://example.com/demo/seed-demo-banner.webp',
      uploadedById: RESOLVED.users.admin,
      updatedAt: now,
    },
    create: {
      id: IDS.uploadedFiles.u1,
      originalName: 'demo-banner.webp',
      fileName: 'seed-demo-banner.webp',
      mimeType: 'image/webp',
      size: 24576,
      bucket: 'demo-assets',
      objectKey: 'banners/seed-demo-banner.webp',
      url: 'https://example.com/demo/seed-demo-banner.webp',
      uploadedById: RESOLVED.users.admin,
      createdAt: now,
      updatedAt: now,
    },
  });
}

async function main() {
  const now = new Date();

  await prisma.$transaction(async () => {
    await seedRoles(now);
    await seedUsers(now);
    await seedCategories(now);
    await seedBrands(now);
    await seedProducts(now);
    await seedBanners(now);
    await seedProductKeys(now);
    await seedOrdersAndPayments(now);
    await seedAuxiliaryTables(now);
  });

  const [categoryCount, brandCount, productCount, bannerCount, userCount, orderCount, keyCount] =
    await Promise.all([
      prisma.category.count(),
      prisma.brand.count(),
      prisma.product.count(),
      prisma.banner.count(),
      prisma.user.count(),
      prisma.order.count(),
      prisma.productkey.count(),
    ]);

  console.log('Seed completed successfully.');
  console.log(
    JSON.stringify(
      {
        categories: categoryCount,
        brands: brandCount,
        products: productCount,
        banners: bannerCount,
        users: userCount,
        orders: orderCount,
        productKeys: keyCount,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
