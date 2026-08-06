# CI/CD for Backend

This repository includes a GitHub Actions workflow to run the backend CI pipeline.

Workflow: `.github/workflows/backend-ci.yml`

What it does

- Runs on `push` and `pull_request` to `main`/`master`.
- Uses Node.js LTS.
- Spins up a disposable MySQL 8 service container.
- Sets `DATABASE_URL` to connect to the MySQL service.
- Runs `npm ci`, `npm run lint`, `npm run build`, `npm run typecheck`, runs Prisma migrations, and finally runs tests (`npm test`).
- Uploads test artifacts (if any) as workflow artifacts.

Notes

- The workflow expects the Prisma schema to be compatible with MySQL. If you use another DB in production, ensure migrations support MySQL for CI.
- For faster runs, the cache keys use `package-lock.json` hashing.
- Tests rely on a running MySQL instance; adjust `DATABASE_URL` in the workflow if you need a different DB user or network configuration.
