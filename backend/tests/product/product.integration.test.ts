import request from 'supertest';
import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest';
import { createApp } from '../helpers/app';
import { setupTestDB, teardownTestDB } from '../setup';
import { prisma } from '../../src/common/database/prisma.js';
import { makeAdminToken, makeCustomerToken } from '../helpers/auth';

let app: ReturnType<typeof createApp>;

beforeAll(async () => {
  await setupTestDB();
  app = createApp();
});

afterAll(async () => {
  await teardownTestDB();
});

beforeEach(async () => {
  // Clean products and categories and brands
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.brand.deleteMany();
});

describe('Product integration', () => {
  it('allows public to list products (empty)', async () => {
    const res = await request(app).get('/api/products').expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });

  it('admin can create and then public can fetch by slug', async () => {
    const token = makeAdminToken();

    // create category & brand
    const category = await prisma.category.create({
      data: { id: 'c1', name: 'Cat 1', slug: 'cat-1' },
    });
    const brand = await prisma.brand.create({
      data: { id: 'b1', name: 'Brand 1', slug: 'brand-1' },
    });

    const payload = {
      sku: 'SKU-123',
      name: 'Test Product',
      slug: 'test-product',
      price: 100,
      categoryId: category.id,
      brandId: brand.id,
    };

    const createRes = await request(app)
      .post('/api/admin/products')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(201);

    expect(createRes.body.success).toBe(true);
    const slug = createRes.body.data.slug;

    const getRes = await request(app).get(`/api/products/${slug}`).expect(200);
    expect(getRes.body.success).toBe(true);
    expect(getRes.body.data.slug).toBe(slug);
  });

  it('rejects duplicate sku', async () => {
    const token = makeAdminToken();

    const category = await prisma.category.create({
      data: { id: 'c2', name: 'Cat 2', slug: 'cat-2' },
    });
    const brand = await prisma.brand.create({
      data: { id: 'b2', name: 'Brand 2', slug: 'brand-2' },
    });

    const payload = {
      sku: 'DUP-SKU',
      name: 'Product A',
      slug: 'product-a',
      price: 50,
      categoryId: category.id,
      brandId: brand.id,
    };

    await request(app)
      .post('/api/admin/products')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(201);

    const dup = { ...payload, name: 'Product B', slug: 'product-b' };
    const res = await request(app)
      .post('/api/admin/products')
      .set('Authorization', `Bearer ${token}`)
      .send(dup);
    expect([400, 409]).toContain(res.status);
  });

  it('prevents customer from accessing admin routes', async () => {
    const token = makeCustomerToken();
    const payload = { sku: 'CUST-SKU', name: 'C Prod', slug: 'c-prod', price: 10 };
    const res = await request(app)
      .post('/api/admin/products')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);
    expect([401, 403]).toContain(res.status);
  });

  it('soft delete hides product from public', async () => {
    const token = makeAdminToken();
    const category = await prisma.category.create({
      data: { id: 'c3', name: 'Cat 3', slug: 'cat-3' },
    });
    const brand = await prisma.brand.create({
      data: { id: 'b3', name: 'Brand 3', slug: 'brand-3' },
    });

    const payload = {
      sku: 'DEL-SKU',
      name: 'ToDelete',
      slug: 'to-delete',
      price: 20,
      categoryId: category.id,
      brandId: brand.id,
    };
    const createRes = await request(app)
      .post('/api/admin/products')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(201);
    const id = createRes.body.data.id;

    await request(app)
      .delete(`/api/admin/products/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    await request(app).get(`/api/products/${payload.slug}`).expect(404);
  });
});
