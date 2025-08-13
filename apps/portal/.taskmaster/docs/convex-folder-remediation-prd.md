# PRD: Convex Folder Remediation and Best Practices Adoption

## Overview

Bring `apps/portal/convex` into full alignment with Convex best practices. Eliminate duplicate HTTP routers, standardize generated imports, replace table scans with indexed/paginated queries, and implement compliant HTTP endpoints and search patterns. Ensure maintainable, performant, and idiomatic Convex code.

## Goals

- Single authoritative HTTP router in `apps/portal/convex/http.ts`
- Only local generated imports: `./_generated/api` and `./_generated/server`
- Queries start from `withIndex` or `withSearchIndex` as appropriate; avoid table scans
- List endpoints are paginated using `paginationOptsValidator` and `.paginate()`
- Search endpoints use a proper search index
- Remove legacy files that do not belong in `convex/`
- Ensure actions that use Node APIs declare `"use node";`
- Pass lints; remove unused imports

## Non-Goals

- Business logic changes beyond query shape and retrieval patterns
- Schema redesign beyond adding missing indexes or search indexes

## Current Issues (Summarized)

- Duplicate HTTP routers:
  - `convex/http.ts` (correct)
  - `convex/core/media/http.ts` (incorrect — registers routes and exports router)
- Non-standard generated imports:
  - `@convex-config/_generated/*` instead of `./_generated/*`
- Table scans and in-memory filters:
  - e.g., `core/media/queries.ts` calling `.collect()` then filtering
- Filters without indexes / missing `withIndex`
- Unpaginated list endpoints returning unbounded arrays
- Search endpoint stub not using `withSearchIndex`
- Legacy file: `convex/convex.config.ts.old`
- Unused import: `core/media/queries.ts` (`api` unused)
- Potential missing `"use node";` in actions that use Node built-ins

## Requirements

- Remove all `httpRouter()` usage outside `convex/http.ts`
- `core/media/http.ts` should export only handlers (no default export, no local router)
- Replace `@convex-config/_generated/*` with `./_generated/*` across Convex files
- Add necessary indexes in `schema.ts` sub-schemas to support indexed queries used in remediation
- Convert list endpoints to accept `{ paginationOpts }` and return `.paginate(...)` results
- Implement `withSearchIndex` for media search and add corresponding search index in schema
- Delete `convex.config.ts.old`
- Fix lints and remove unused imports; keep function validators
- Add `"use node";` to action files that rely on Node APIs

## Acceptance Criteria

- Only `convex/http.ts` creates and exports the router; no other file exports a router
- No `@convex-config/_generated/*` imports remain in Convex code
- All modified queries use `withIndex` or `withSearchIndex` and avoid `.collect()` for bulk listing
- List endpoints accept `paginationOpts` and return paginated results with `page`, `isDone`, `continueCursor`
- Search endpoints use `withSearchIndex` with query text and filters
- `convex.config.ts.old` removed
- ESLint reports 0 new issues in Convex folder; unused imports removed
- If any action uses Node built-ins, the file begins with `"use node";`

## Milestones & Tasks

### Milestone 1: HTTP Router Consolidation

- Task 1.1: Remove local `httpRouter` and default export from `core/media/http.ts`
- Task 1.2: Ensure handlers from `core/media/http.ts` are exported and registered from `convex/http.ts`
- Task 1.3: Verify all routes are correctly defined in `convex/http.ts`

### Milestone 2: Generated Imports Standardization

- Task 2.1: Replace all `@convex-config/_generated/*` imports with `./_generated/*` in Convex files
- Task 2.2: Fix ESLint unused imports (e.g., remove `api` in `core/media/queries.ts`)

### Milestone 3: Query Indexing & Pagination

- Task 3.1: Identify list endpoints using `.collect()` and add `paginationOptsValidator` args
- Task 3.2: Replace `.collect()` with `.paginate(args.paginationOpts)`
- Task 3.3: Add or confirm relevant indexes in schema for these queries; switch to `withIndex`
- Task 3.4: Update calling code if any internal callers exist (Convex functions only)

### Milestone 4: Media Queries Refactor

- Task 4.1: Refactor `listMediaItemsWithUrl` to `withIndex` + pagination; resolve status/category filters server-side via indexes
- Task 4.2: Refactor `listMedia` to paginated version
- Task 4.3: Implement `searchMedia` using `withSearchIndex` and add `search index` for title/alt/caption
- Task 4.4: Ensure `getMediaById` returns URL properly (consistent with `getMediaItem`)

### Milestone 5: Search Index Support

- Task 5.1: Modify schema to add `search_*` index for `mediaItems` (e.g., search on `title`, `caption`, `alt` with channel/tenant filters as needed)
- Task 5.2: Implement `withSearchIndex(...)` in `searchMedia`

### Milestone 6: Cleanup & Consistency

- Task 6.1: Remove `convex.config.ts.old`
- Task 6.2: Add `"use node";` to action files using Node built-ins
- Task 6.3: Re-run lint/format; resolve lingering issues

## Risks & Mitigations

- Risk: Adding indexes requires schema changes → Mitigation: strictly additive, avoid breaking validators; coordinate with dependent queries
- Risk: Pagination changes affect callers → Mitigation: endpoints are internal Convex functions; update only Convex callers or add separate paginated variants
- Risk: Search index implementation complexity → Mitigation: start with media; expand later if needed

## Testing Strategy

- Unit-test Convex queries/mutations behavior where practical
- Manual verification via Convex dashboard:
  - HTTP routes respond with correct CORS
  - Paginated queries return expected shapes and cursors
  - Search returns relevant items
- Smoke test affected areas (media listing/search, notifications if touched)

## Rollout

- Implement Milestones 1–2 first (low risk)
- Land Milestones 3–5 behind feature branches and test in staging
- Final cleanup (Milestone 6), then merge
