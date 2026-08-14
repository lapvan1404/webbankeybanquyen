# Auth API Contract

## Overview

This document defines the frontend contract for auth operations. The frontend must consume auth through interface abstractions so the future ASP.NET Core backend can replace the current implementation without requiring frontend changes.

## Auth API Client Interface

The frontend expects an `AuthApiClient` with the following methods:

- `login(credentials: AuthCredentials): Promise<AuthUser>`
- `register(payload: AuthRegisterPayload): Promise<AuthUser>`
- `logout(): Promise<void>`
- `fetchProfile(): Promise<AuthUser | null>`

### Types

```ts
export type AuthUser = { id: string; name: string; email: string };

export type AuthCredentials = {
  email: string;
  password: string;
};

export type AuthRegisterPayload = {
  name: string;
  email: string;
  password: string;
};
```

## Contracts

### `login`

- Input: `{ email, password }`
- Success: resolves to `AuthUser`
- Failure: rejects with an `Error` containing a user-facing message

### `register`

- Input: `{ name, email, password }`
- Success: resolves to `AuthUser`
- Failure: rejects with an `Error`

### `logout`

- Input: none
- Success: resolves to `void`
- Failure: rejects with an `Error`

### `fetchProfile`

- Input: none
- Success: resolves to `AuthUser | null`
- Failure: rejects with an `Error`

## Frontend Requirements

- The frontend must only import `authClient` from `src/lib/authClient.ts`.
- The `AuthProvider` and UI code should rely on the `AuthApiClient` interface, not on implementation details.
- The future ASP.NET Core backend implementation should match this contract exactly.

## Future Backend Mapping

When the ASP.NET Core backend is implemented, the frontend must remain unchanged. The backend should provide equivalent endpoints and a compatible auth service adapter that implements `AuthApiClient`.
