# Auth State

## Purpose

Define the frontend auth state model for the app during Sprint 2.

## Auth State Model

The frontend auth state is intentionally simple and agnostic to backend implementation.

### `AuthState`

```ts
export type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
};
```

## State Transitions

### Initial

- `user`: `null`
- `loading`: `true` while `fetchProfile()` is pending
- `error`: `null`

### Authenticated

- `user`: populated with `AuthUser`
- `loading`: `false`
- `error`: `null`

### Unauthenticated

- `user`: `null`
- `loading`: `false`
- `error`: `null`

### Error

- `user`: remains `null` or current user
- `loading`: `false`
- `error`: set to the error message

## Auth Context Interface

The `AuthProvider` exposes:

- `user: AuthUser | null`
- `loading: boolean`
- `error: string | null`
- `login(email: string, password: string): Promise<void>`
- `register(name: string, email: string, password: string): Promise<void>`
- `logout(): Promise<void>`

## Design Principles

- Keep auth state in memory only; avoid localStorage for auth persistence.
- Persist only non-sensitive UI state in the current sprint.
- Treat auth as a replaceable service boundary.
- Frontend components should derive behavior from `user` and `loading` only.
