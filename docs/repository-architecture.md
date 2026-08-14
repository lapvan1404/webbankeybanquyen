# Repository Architecture

## Overview

The repository foundation provides a reusable data-access layer for the backend. It centralizes Prisma access, shared query helpers, and database error handling so services remain free of direct database logic.

## Architecture

- `src/common/database` contains the Prisma singleton and repository contracts.
- `src/repositories/base` contains the shared base repository implementation.
- Future repositories can extend `BaseRepository` without implementing business logic.

## Responsibilities

- Prisma singleton: one shared client instance for the application.
- Connection lifecycle: connect and disconnect helpers for startup and shutdown.
- Transaction wrapper: provide a consistent transaction boundary.
- Base repository: shared CRUD helpers, sorting, filtering, pagination, and database error mapping.

## Dependency Flow

1. Services depend on repositories.
2. Repositories depend on the shared Prisma client.
3. Prisma access stays inside the repository layer.

## Future Extension

- Add typed repositories for specific domain models.
- Compose domain-specific query helpers on top of the base implementation.
- Extend error mapping for application-specific database failures.

## Potential Risks

- Repositories should stay generic and avoid embedding business rules.
- Shared helpers must remain model-agnostic to support future expansion.
