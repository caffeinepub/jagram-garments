# Jagram Garments

## Current State
App has admin panel at `/admin`. Admin role is granted via `_initializeAccessControlWithSecret` which requires a matching Caffeine admin token in the URL. When visiting the live URL directly (no token), users get registered as `#user` not `#admin`, so they see "Admin Access Nahi Hai" even if they should be the first admin. Image upload also fails because it requires admin-level access for the storage certificate call.

## Requested Changes (Diff)

### Add
- Backend: `claimFirstAdmin()` function that checks if no admin exists yet (`adminAssigned == false`) and if so, makes the caller admin automatically. Returns `Bool` indicating success.
- Frontend: `useClaimFirstAdmin` mutation hook
- Frontend: Auto-call `claimFirstAdmin` when user is logged in but `isAdmin` returns false — if it succeeds, refetch admin status and show admin panel

### Modify
- `backend.d.ts`: Add `claimFirstAdmin(): Promise<boolean>`
- `AdminPage.tsx`: Add auto-claim logic — if logged in and not admin, try `claimFirstAdmin` silently; if succeeds, reload admin; if fails, show existing "no access" message

### Remove
- Nothing removed

## Implementation Plan
1. Add `claimFirstAdmin` to `src/backend/main.mo`
2. Add to `src/frontend/src/backend.d.ts`
3. Add `useClaimFirstAdmin` to `useQueries.ts`
4. Update `AdminPage.tsx` to auto-claim on load
