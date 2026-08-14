# RBAC Design

## Overview

This document defines the server-side role-based access control (RBAC) infrastructure for the backend. The goal is to enforce authorization centrally and consistently without trusting any client-supplied role data.

## Core Principles

- Authentication must happen first.
- Authorization decisions must be made on the server.
- Roles are authoritative server-side values.
- Protected endpoints must verify permissions before allowing access.
- Guest users remain unauthenticated and should only access public routes.

## Roles

- ADMIN
- CUSTOMER

## Permission Model

Permissions are grouped by module and are enforced server-side.

### Product permissions

- product.read
- product.create
- product.update
- product.delete

### Banner permissions

- banner.read
- banner.create
- banner.update
- banner.delete

### Order permissions

- order.read
- order.update
- order.cancel

### Payment permissions

- payment.read
- payment.refund

### User permissions

- user.read
- user.update
- user.delete

### Dashboard permissions

- dashboard.read

### System permissions

- system.manage

## Role-to-Permission Mapping

- ADMIN: all permissions above
- CUSTOMER: dashboard.read

## Middleware API

- requireAuth(): ensures the request is authenticated.
- requireRole(...roles): ensures the user has one of the specified roles.
- requirePermission(...permissions): ensures the user has at least one of the specified permissions.
- AdminGuard: alias for requireRole('ADMIN')
- CustomerGuard: alias for requireRole('CUSTOMER')

## Security Notes

- 401 Unauthorized is returned for unauthenticated requests.
- 403 Forbidden is returned for authenticated requests that lack permission.
- No implementation details are exposed in authorization errors.
