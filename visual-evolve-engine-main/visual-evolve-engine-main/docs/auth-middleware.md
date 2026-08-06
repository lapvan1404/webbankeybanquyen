# Auth Middleware

## Purpose

Define the frontend-side route guards and middleware expectations for auth-related navigation.

## Goal

Frontend route guarding must be interface-driven and not depend on backend auth implementation details.

## Route Guard Behavior

### Public routes

- `/login` and `/register` are accessible when unauthenticated.
- If the user is already authenticated, redirect to `/` or `/profile`.

### Protected routes

- `/profile` and other authenticated user pages require `user` from auth state.
- If `user` is null, redirect to `/login`.

### Admin routes

- `/admin` and `/admin/login` remain decoupled from backend auth in this sprint.
- The admin login page continues to use API client calls to the current Node backend.
- The admin dashboard route protections are preserved in the current app until the ASP.NET Core backend is available.

## Implementation Notes

- Use `useAuth()` directly in route components or wrapper components to enforce auth state.
- Avoid embedding token checks or cookie logic in the guard.
- Keep the guard logic focused on `user` presence and `loading` state.

## Future Backend Middleware Mapping

- The future ASP.NET Core backend should provide auth middleware on the server side.
- Frontend route guards should continue to rely only on `AuthApiClient` for login/logout/profile state.
- The backend should not require frontend changes when auth middleware is introduced.
