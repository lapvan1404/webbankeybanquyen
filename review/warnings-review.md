# Warnings Review

## Warning 1

File:
src/components/ui/badge.tsx

Rule:
react-refresh/only-export-components

Reason:
This file exports both the `Badge` component and the `badgeVariants` constant.

Risk:
React Fast Refresh may fail for this file during development, causing stale component state after hot updates.

Decision:

- Ignore (with justification): This is a component library pattern that exports helper constants intentionally. The runtime behavior is not broken in production.

Status:
Ignored

## Warning 2

File:
src/components/ui/button.tsx

Rule:
react-refresh/only-export-components

Reason:
This file exports the `Button` component and the `buttonVariants` constant.

Risk:
Fast Refresh may not work reliably for this file in development.

Decision:

- Ignore (with justification): The component pattern is deliberate and does not affect production build correctness. Refactoring would be out of scope for Priority 1.

Status:
Ignored

## Warning 3

File:
src/components/ui/form.tsx

Rule:
react-refresh/only-export-components

Reason:
This file exports several form components alongside utility functions from `useFormField`.

Risk:
Potential Fast Refresh issues while editing form components in development.

Decision:

- Ignore (with justification): The file is intentionally a shared component module. No production risk, and refactoring is outside current Priority 1 scope.

Status:
Ignored

## Warning 4

File:
src/components/ui/navigation-menu.tsx

Rule:
react-refresh/only-export-components

Reason:
This file exports components and shared helper initialization values for the navigation menu.

Risk:
Fast Refresh may not fully preserve component state during dev hot reload.

Decision:

- Ignore (with justification): This is common in Radix-based shared UI modules and does not impact production. Fixing would require nontrivial refactor.

Status:
Ignored

## Warning 5

File:
src/components/ui/sidebar.tsx

Rule:
react-refresh/only-export-components

Reason:
This file exports the sidebar components plus shared utility hooks/constants.

Risk:
Development Fast Refresh may be degraded for this large shared UI file.

Decision:

- Ignore (with justification): The exports are intentional for component reuse. Production functionality is unaffected and refactor is outside current work.

Status:
Ignored

## Warning 6

File:
src/components/ui/toggle.tsx

Rule:
react-refresh/only-export-components

Reason:
This file exports the `Toggle` component and `toggleVariants` constant.

Risk:
Possible stale updates during development with Fast Refresh.

Decision:

- Ignore (with justification): Standard component library export pattern. Acceptable for current priority since production behavior is unchanged.

Status:
Ignored

## Warning 7

File:
src/lib/auth.tsx

Rule:
react-hooks/exhaustive-deps

Reason:
`useMemo` depends on `login` and `register` functions but only declares `[user, accounts]`, which may omit updates if those callbacks changed.

Risk:
If `login` or `register` were to change identity, memoized context value could become stale, causing inconsistent auth behavior.

Decision:

- Fixed: Add `login` and `register` to the dependency array or restructure the memo to avoid the lint warning.

Status:
Fixed

## Warning 8

File:
src/lib/cart.tsx

Rule:
react-refresh/only-export-components

Reason:
This file exports the cart hook or module along with helper constants/functions.

Risk:
Potential Fast Refresh issues in development.

Decision:

- Ignore (with justification): This is a standard hook/module pattern and does not affect runtime correctness in production.

Status:
Ignored

## Warning 9

File:
src/routes/admin/index.tsx

Rule:
react-hooks/exhaustive-deps

Reason:
A `useEffect` callback reads `sseConnected` but omits it from dependencies.

Risk:
The polling fallback may not respond correctly if `sseConnected` changes, causing stale or redundant polling behavior.

Decision:

- Fixed: Add `sseConnected` to the dependency array or refactor the effect logic to ensure correct behavior and satisfy the linter.

Status:
Fixed

## Warning 10

File:
src/lib/auth.tsx

Rule:
react-refresh/only-export-components

Reason:
This file exports multiple items from the auth module, not just React components.

Risk:
Fast Refresh may not fully preserve state during auth-related edits.

Decision:

- Ignore (with justification): The file structure is intentional and production is unaffected. Prioritizing functional fixes over dev-only Fast Refresh concerns.

Status:
Ignored
