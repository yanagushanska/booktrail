# BookTrail — Agent Instructions

## Purpose
Multi-page reading tracker. Users browse a shared book catalog, add books to a
personal library (want_to_read / reading / finished), rate and review books,
and manage their profile. Admins manage the catalog and user roles.

## Tech stack — STRICT, do not deviate
- Vanilla JavaScript (ES modules). No React, Vue, or TypeScript.
- Bootstrap 5 for all UI/layout.
- Vite multi-page app: one .html entry per screen, no client-side router.
- Supabase (Postgres, Auth, Storage) via @supabase/supabase-js.

## Architecture rules
- Every screen = its own .html file + matching .js entry module.
- All Supabase calls go through src/services/*.js. Never call supabase.from()
  directly from a page script.
- Shared UI lives in src/components/*.js as functions returning DOM elements
  or HTML strings. No component framework.
- Security is enforced by Supabase RLS policies, not client-side checks.
  Hiding the admin nav link is UX only — it is never the real access gate.
- Env vars (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) live in .env.local,
  never hardcoded, never committed.

## Conventions
- camelCase for JS identifiers, kebab-case for filenames and CSS classes.
- async/await, not .then() chains.
- Conventional Commits: feat:, fix:, chore:, docs:, style:.
- Page scripts call service functions and update the DOM; they should not
  contain business logic.

## Database — already migrated, treat as source of truth
Tables: profiles, user_roles, books, user_books, reviews.
Schema and RLS live in supabase/migrations/. Do not regenerate them.

## When implementing a new screen
1. Create the .html file: Bootstrap layout, clearly-id'd containers.
2. Create the matching .js file importing needed services/components.
3. Register the new page in vite.config.js rollupOptions.input.
4. Always show loading and error states (Bootstrap spinner/alert) — never
   fail silently.