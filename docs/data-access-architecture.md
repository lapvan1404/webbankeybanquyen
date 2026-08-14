# Data Access Architecture

## Overview

The data access foundation now provides infrastructure for transactional work, repository composition, soft deletes, optimistic locking preparation, and audit hooks without introducing business logic.

## Components

- `UnitOfWork`: wraps Prisma transactions with automatic commit/rollback semantics.
- `RepositoryFactory`: centralizes repository construction for future typed repositories.
- `DatabaseTransaction`: exposes a transactional Prisma client for repository usage.
- `SoftDelete` helpers: provide reusable soft-delete markers and checks.
- `OptimisticLock` helpers: prepare the shape for concurrency control.
- `IAuditHelper`: defines the audit contract for future implementation.

## Responsibilities

- Repositories remain infrastructure-focused.
- Transaction boundaries are managed centrally.
- Concurrency and deletion behavior are standardized through shared helpers.

## Dependency Flow

1. Infrastructure components depend on the shared Prisma client.
2. Repositories can receive a transaction-aware client or the factory-created repository context.
3. Services can consume repositories without touching Prisma directly.

## Future Extension

- Add domain-specific repositories that extend the base infrastructure.
- Implement optimistic locking with version checks.
- Implement audit persistence through the `IAuditHelper` contract.

## Potential Risks

- Shared helpers must stay generic and not embed business rules.
- Transaction and audit behavior should remain explicit and composable.
