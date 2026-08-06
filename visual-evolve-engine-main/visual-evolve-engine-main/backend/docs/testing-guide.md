# Testing Guide

This project uses Vitest and Supertest for integration testing.

Quick start

1. Install dev dependencies:

```bash
cd backend
npm install
```

2. Provide a test database. Set `DATABASE_URL` to a test database (SQLite file or Postgres). Example using SQLite file:

```bash
export DATABASE_URL="file:./backend/tmp/test.db"
```

3. Run tests:

```bash
npm test
```

Notes

- The tests assume the database schema is already applied (use `prisma migrate deploy` or `prisma db push` as appropriate).
- Tests set default JWT and cookie secrets if not provided.
- Tests clean key tables between test cases to ensure isolation.
- For CI, configure a disposable database and set environment variables before running tests.
