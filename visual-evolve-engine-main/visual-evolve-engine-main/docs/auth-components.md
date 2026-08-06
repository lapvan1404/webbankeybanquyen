# Auth Components

## Purpose

Document the frontend auth UI components and their responsibilities.

## Components

### `LoginPage`

- Renders email and password fields.
- Calls `authContext.login(email, password)`.
- Displays error messages from auth failures.
- Redirects authenticated users to the homepage.
- Uses `AuthProvider` context.

### `RegisterPage`

- Renders name, email, password, and confirm password fields.
- Calls `authContext.register(name, email, password)`.
- Validates password confirmation on the client.
- Redirects new users to `/login` or home after registration.

### `ProfilePage`

- Displays logged-in user information.
- Shows login/register prompts when unauthenticated.
- Calls `authContext.logout()`.

### `SiteHeader`

- Uses `authContext.user` to decide whether to render profile or login links.
- Does not depend on backend token mechanics.
- Provides a consistent navigation experience.

### `AuthProvider`

- Manages auth state and mock auth service interactions.
- Exposes `user`, `loading`, `error`, `login`, `register`, and `logout`.
- Loads profile state from `authClient.fetchProfile()` on mount.

## Component Contracts

- All auth UI components consume auth state only via `useAuth()`.
- No component should use localStorage/sessionStorage for auth data.
- No component should make backend auth assumptions such as cookies or JWTs.
- UI should render based on `user` presence and `loading` state.
