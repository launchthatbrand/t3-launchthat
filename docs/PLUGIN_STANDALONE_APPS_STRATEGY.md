# Plugin → Standalone App Strategy (LaunchThat Monorepo)

This document captures an architectural approach for building a large portal app with logic separated into **plugin packages** and **Convex components**, while also enabling selected plugins (e.g. TraderLaunchpad) to be shipped as fully **standalone apps** (separate Next.js deployment + separate Convex deployment) using the **same plugin package** and **same Convex component**.

The goal is that:

- The “all-in-one” portal can bundle many plugins behind one login/dashboard (e.g. $1000/mo).
- At any time, a plugin can be “productized” into its own standalone app (e.g. a dedicated TraderLaunchpad trading journal).
- Development remains “single source of truth” as much as possible: shared domain logic, minimal duplication, host-specific adapters only.

---

## Context

Example plugin packages in this repo:

- `packages/launchthat-plugin-calendar`
- `packages/launchthat-plugin-lms`
- `packages/launchthat-plugin-traderlaunchpad`

TraderLaunchpad already exports a reusable Convex component:

- `launchthat-plugin-traderlaunchpad/convex/component`
- `launchthat-plugin-traderlaunchpad/convex/component/convex.config`

And also includes “portal plugin system” glue (plugin definition, hook slots, admin pages, etc).

---

## High-level model: 3 layers

To support both **portal** and **standalone** without duplication, think of each plugin as these layers:

### 1) Domain layer (portable)

Must be usable by:

- the portal app
- a standalone app
- future hosts

Contains:

- Convex component schema and functions (tables/indexes/queries/mutations/actions)
- pure TS domain logic and types
- frontend “screens” that are host-agnostic (don’t assume portal hook slots)

**Rule**: The domain layer must never import portal app code.

### 2) Host integration layer (portal-specific)

Contains:

- portal plugin definition (`plugin.ts`)
- hook-slot wiring, menu integration
- portal routing integration (e.g. `FRONTEND_ROUTE_HANDLERS_FILTER`)
- portal-only assumptions (tenant/subdomain/org selection UX)

This layer should be optional and **not** imported by standalone apps.

### 3) Application layer (standalone app)

Contains:

- Next.js routing for the feature (`/journal/*`, `/admin/trades`, etc)
- auth configuration for the standalone product
- Convex deployment configuration for the standalone product
- environment variables and deployment setup

This layer consumes the domain layer, not the portal integration layer.

---

## Recommended approach: Standalone mounts the Convex component

For a standalone app like “TraderLaunchpad”:

- Use a **separate Next.js deployment**
- Use a **separate Convex deployment**
- In the standalone Convex deployment, **mount the plugin’s Convex component**

This yields maximal code reuse and keeps the Convex component as the canonical backend for the feature.

### Why this is the best default

- avoids copying schema and functions into each app
- keeps indexes/validators/idempotency logic consistent
- enables “portal” and “standalone” to share the same domain behavior

---

## Organizations: “single-org-by-default” strategy (future-proof)

Requirement:

- Standalone app is **multi-user**
- Keep organizations “for future proofing”
- Make it easy to run with **no org switching** today, but enable orgs later

### Strategy

Keep the domain tables **org-aware**, but make org-selection a host concern.

In the standalone app, run in **single-org mode**:

- the app has exactly one organization (default org)
- all users belong to that org (implicitly or via membership)
- no org switching UI required

Later, enable multi-org mode by changing only the host adapter:

- introduce org creation / membership / switching UI
- change `resolveOrganizationId()` to return the selected org
- keep all domain tables and indexes unchanged (still keyed by organizationId)

### Implementation contract (host-side)

In each host (portal or standalone), define:

- **`resolveOrganizationId()`**
  - portal: derived from tenant/subdomain/custom-domain resolution
  - standalone (single-org): a constant org id from env or slug lookup
  - standalone (multi-org later): selected org from session/user preference

All feature calls that require `organizationId` use this resolver.

---

## Authentication and “viewer identity”: keep it consistent across hosts

### What the domain layer wants

Convex functions that need auth should rely on:

- `ctx.auth.getUserIdentity()` (Convex auth identity)
- mapping identity → `users` table (by tokenIdentifier/clerk subject)

### Portal vs Standalone reality

- Portal may have more complex auth (auth host vs tenant host, session cookies, token refresh).
- Standalone app should pick the simplest setup: **one host, one auth provider**, no auth-host bouncing.

### Recommended for standalone

- Use **Clerk everywhere** in the standalone app (single domain)
- Use `ConvexProviderWithClerk` to supply Convex auth tokens
- Keep `getAuthenticatedUserId()` working unchanged

This avoids the “tenant_session + iframe refresh” complexity entirely in standalone mode.

---

## Routing: portal resolver vs standalone Next routes

### Portal

The portal uses a catch-all route + a plugin route handler filter system to resolve dynamic routes.

### Standalone

The standalone app should use **normal Next.js routes**:

- `/journal/dashboard`
- `/journal/orders`
- `/journal/settings`
- etc

No portal hook slots required.

---

## Avoiding coupling: what standalone should not import

Standalone apps should not import the portal plugin integration surface:

- `plugin.ts` (portal plugin definition)
- portal hook-slot wiring
- portal-only routing resolver integration

Standalone apps should import:

- `launchthat-plugin-<name>/convex/component` (backend)
- `launchthat-plugin-<name>/frontend` or other host-agnostic UI exports (frontend)

If a plugin’s UI currently lives only in portal-specific directories, promote the reusable screens into a stable package export (e.g. `src/frontend/`).

---

## Practical roadmap: turning TraderLaunchpad into a standalone app

### Step 1: Create a new Next app

- `apps/traderlaunchpad/` (standalone Next.js)
- Reuse shared UI packages (`@acme/ui`) and the plugin package

### Step 2: Create a new Convex deployment for the standalone

- `apps/traderlaunchpad/convex/` with its own env and deployment
- Mount `launchthat-plugin-traderlaunchpad/convex/component` via the standalone `convex.config.ts`

### Step 3: Implement “single-org-by-default” in the standalone host

- Create one organization row (or reuse existing) and store:
  - `NEXT_PUBLIC_DEFAULT_ORG_ID` (or a slug)
- Add a host-side `resolveOrganizationId()` helper and use it consistently

### Step 4: Auth

- Use Clerk + `ConvexProviderWithClerk`
- Ensure identity mapping to `users` table exists

### Step 5: UI

- Use Next routes for `/journal/*` or `/admin/trades` etc
- Import and render TraderLaunchpad “screens” from the plugin package
- Keep portal-specific integration in the portal app only

---

## Notes / gotchas to expect

### Convex component ID scoping

When calling component-owned tables/functions from a host app, IDs can become “namespaced” and may not validate against `v.id("tableName")` in the host unless you:

- use `v.string()` in host wrappers for component-sourced `_id`, or
- define host wrapper functions that return host-validated shapes

This is not a blocker, but it’s a design constraint: keep “component boundary” types explicit.

### Org strategy should be host-owned

Do not bake org switching UI into the domain layer.
Keep it in the host adapter so standalone can start in single-org mode and evolve later.

---

## Summary

You can safely design your portal plugins so each one can later become a standalone product:

- Keep the Convex component + domain logic host-agnostic.
- Treat portal integration as an optional adapter layer.
- Build standalone apps by mounting the same Convex component and reusing portable UI/screens.
- Use “single-org-by-default” to keep organizations in the model without needing org UX day one.


