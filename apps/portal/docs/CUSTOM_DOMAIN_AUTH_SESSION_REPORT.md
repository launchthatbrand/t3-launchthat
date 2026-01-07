### Custom domain auth + Convex realtime: architecture report

This document captures the current state of the portal auth architecture and a proposed path to support:

- `launchthat.app` (root portal tenant)
- `wall-street-academy.launchthat.app` (tenant subdomain)
- `dev.wsatraining.com` (custom domain mapped to the same tenant)

…with **custom sign-in and user details in the header** and **Convex realtime** on tenant/custom domains, while keeping Clerk as the identity provider and continuing to use **Clerk Organizations**.

---

### Executive summary

Your current deployment is **Clerk-first everywhere** (Clerk frontend SDK initialized on all hosts). This fails on tenant-owned custom domains because Clerk production keys are domain-restricted, and Clerk’s “multi-domain session” features are monetized (satellite domains).

To support tenant/custom domains *without* Clerk satellites, the workable architecture is:

- **Central auth host** (recommended: `auth.launchthat.app`) is the only place where Clerk runs.
- Tenant subdomains + custom domains do **not** initialize Clerk.
- After login on the auth host, we redirect back to the tenant host with a **one-time exchange code** stored in Convex.
- The tenant host exchanges that code for:
  - a **tenant-domain session cookie** (your session layer), and
  - a **Convex auth token** (short-lived) so the tenant host can use **Convex realtime**.

Clerk continues to be the authoritative identity provider and organization membership system; your session layer is responsible for making the user “present” on any tenant-owned domain/app.

---

### Current architecture (observations from code)

#### Tenant resolution is already solved (Convex-backed)

- `apps/portal/src/middleware.ts`
  - Extracts subdomain and resolves tenant by slug.
  - Resolves custom domains via `fetchTenantByCustomDomain(hostname)`.
  - Injects `x-tenant-id`, `x-tenant-slug`, `x-tenant-name`, etc.

- `apps/portal/src/lib/tenant-fetcher.ts`
  - Fetches tenant by slug/domain via Convex:
    - `api.core.organizations.queries.getBySlug`
    - `api.core.organizations.queries.getByCustomDomain`

This is a strong foundation: **host → tenant is already reliable and centralized**.

#### Clerk is initialized globally (root providers)

- `apps/portal/src/app/providers.tsx`
  - Wraps all routes in:
    - `ClerkProvider`
    - `ConvexProviderWithClerk`
  - Uses Clerk hooks directly (e.g. support widget defaultContact uses Clerk user id).

This is the primary reason custom domains fail: the tenant host tries to run Clerk frontend SDK on a non-approved domain.

#### Header auth UI is Clerk-only today

- `apps/portal/src/app/@header/default.tsx` uses `PortalNavUser`.
- `apps/portal/src/components/auth/PortalNavUser.tsx`
  - Uses `useSession()` and `useClerk().openSignIn()` / `signOut()`.

This is a good news single integration point: one component can be refactored to support both “Clerk host” and “tenant host session”.

#### Convex auth is configured to trust Clerk JWT issuer

- `apps/portal/convex/auth.config.ts`:
  - `domain: process.env.CLERK_JWT_ISSUER_DOMAIN`
  - `applicationID: "convex"`
  - `allowUnauthenticatedRequests: true` (currently permissive)

This means Convex can validate tokens issued by your Clerk issuer for the `"convex"` application/audience.

---

### Requirements (confirmed)

- **Custom domains must support logged-in dashboard/admin areas**.
- **Convex realtime must work on custom domains** (not just server-to-server data fetching).
- Clerk Organizations remain the membership/roles authority.
- Convex is used as the storage layer (including for exchange codes/sessions).

---

### Proposed architecture

#### Principle: Clerk runs only on the auth host

- `auth.launchthat.app` (or `launchthat.app` if you prefer) is the only host that:
  - initializes Clerk frontend,
  - renders `<SignIn />` / `<SignUp />`,
  - can call Clerk client APIs.

Tenant subdomains and custom domains do not mount `ClerkProvider` and do not call Clerk hooks.

#### Tenant/custom domains use a session cookie + Convex token

After authenticating on the auth host:

1) auth host creates a short-lived **exchange code** in Convex
2) tenant host calls `POST /api/auth/exchange` with that code
3) server consumes the code, verifies membership, then returns:
   - **Set-Cookie**: tenant session cookie scoped to the tenant host
   - a short-lived **Convex auth token** usable by the client to enable realtime

---

### Mermaid: end-to-end flow with Convex realtime on tenant/custom domains

```mermaid
sequenceDiagram
  autonumber
  participant U as Browser
  participant TD as Tenant host<br/>dev.wsatraining.com
  participant AD as Auth host<br/>auth.launchthat.app
  participant Clerk as Clerk
  participant Convex as Convex
  participant API as Next.js API (portal)

  U->>TD: Visit /dashboard (custom domain)
  TD->>API: GET /api/me (cookie?)
  API-->>TD: 401 (no tenant session)
  TD-->>U: Header shows "Sign in"

  U->>TD: Click Sign in
  TD-->>U: Redirect/popup to AD /sign-in?return_to=TD&tenant=wall-street-academy

  U->>AD: Load SignIn
  AD->>Clerk: Authenticate + select Clerk Organization
  Clerk-->>AD: Clerk session established (auth host)

  AD->>Convex: createExchangeCode({clerkUserId, tenantId, expiresAt})
  Convex-->>AD: exchangeCode=XYZ

  AD-->>U: Redirect back to TD /auth/callback?code=XYZ
  U->>TD: Load callback URL

  TD->>API: POST /api/auth/exchange { code: XYZ }
  API->>Convex: consumeExchangeCode(XYZ) -> { clerkUserId, tenantId }
  API->>Clerk: verify user/org membership (server-side)
  API->>Convex: createTenantSession({tenantId, clerkUserId, ...})
  API->>API: mint ConvexAuthToken (short-lived JWT compatible with apps/portal/convex/auth.config.ts)

  API-->>TD: Set-Cookie tenant_session=...; return { user, tenant, convexToken }
  TD->>Convex: convexClient.setAuth(convexToken)
  Convex-->>TD: realtime queries now authenticated
  TD-->>U: Header shows user; dashboard works on custom domain
```

---

### File touch list (what changes where)

#### Header / user details UI

- `apps/portal/src/components/auth/PortalNavUser.tsx`
  - Convert from Clerk-only to host-aware:
    - **Auth host / root domain**: keep Clerk behavior
    - **Tenant/custom domains**: use your session (`/api/me`) and show redirect/popup sign-in

- `apps/portal/src/app/@header/default.tsx`
  - Likely unchanged; it already uses `PortalNavUser`.

#### Root providers (stop mounting Clerk on tenant/custom domains)

- `apps/portal/src/app/providers.tsx`
  - Split into:
    - `AuthHostProviders` (ClerkProvider + ConvexProviderWithClerk)
    - `TenantHostProviders` (no ClerkProvider; uses tenant session + Convex auth token)
  - Replace any direct `useUser()` usage with a host-aware user source (Clerk on auth hosts, session on tenant/custom hosts).

- `apps/portal/src/providers/ConvexClientProvider.tsx`
  - Add a non-Clerk provider variant for tenant/custom domains.

#### Middleware protection (custom domain must support dashboard/admin)

- `apps/portal/src/middleware.ts`
  - Must support two protection strategies:
    - For hosts where Clerk runs: use `auth.protect()` (existing)
    - For custom domains: verify your tenant session cookie and enforce role/permissions without Clerk frontend

#### New API routes (auth exchange, session, current user)

New Next.js route handlers under `apps/portal/src/app/api/auth/`:

- `/api/auth/callback` (auth host)
  - After Clerk login, create exchange code in Convex and redirect to tenant `return_to`.

- `/api/auth/exchange` (tenant/custom host)
  - Consume exchange code, verify membership, set tenant session cookie, return Convex auth token.

- `/api/me` (tenant/custom host)
  - Returns the currently authenticated user + role + tenant context from your session.

- `/api/logout` (tenant/custom host)
  - Clears tenant session cookie; optional redirect to auth host sign-out.

Optional but useful:
- `/api/auth/popup/complete` (auth host)
  - For popup UX: posts message to opener with code then closes.

#### Convex storage (exchange codes + sessions)

- `apps/portal/convex/schema.ts`
  - Add:
    - `authExchangeCodes` table: `{ codeHash, tenantId, clerkUserId, expiresAt, usedAt }`
    - `tenantSessions` table: `{ sessionIdHash, tenantId, clerkUserId, expiresAt, revokedAt }`

- New Convex functions:
  - `createExchangeCode`
  - `consumeExchangeCode`
  - `createTenantSession`
  - `getSessionByCookie`
  - `revokeSession`

#### Existing Clerk organization sync endpoints (mostly unchanged)

- `apps/portal/src/app/api/clerk/organizations/sync/route.ts`
- `apps/portal/src/app/api/clerk/organizations/join-tenant/route.ts`

These are useful when Clerk is available (auth host / internal admin flows) to ensure Convex org ↔ Clerk org mapping remains consistent.

---

### Critical design decisions (resolved)

You confirmed:

- Logged-in areas must work on custom domains.
- Convex realtime must work on custom domains.

That implies:

- Custom domains require a real session cookie validation in middleware/routes.
- Tenant/custom domains need a valid Convex auth token (no Clerk cookies there).

---

### Staged rollout (recommended order)

#### Stage 1: Header auth UX (lowest risk, visible win)

- Implement host-aware `PortalNavUser`:
  - auth hosts: Clerk UI
  - tenant/custom: session UI + redirect/popup sign-in

#### Stage 2: Providers split (stop Clerk on custom domains)

- Update `app/providers.tsx` to avoid mounting Clerk on custom domains.
- Add tenant-session context provider and non-Clerk Convex provider.

#### Stage 3: Implement exchange + session (Convex-backed)

- Add Convex tables + functions for exchange codes and sessions.
- Add Next API routes:
  - callback → create code
  - exchange → consume code → set cookie → return convex token
  - me/logout

#### Stage 4: Convex realtime on tenant/custom domains

- Ensure tenant host’s Convex client calls `setAuth(convexToken)`.
- Ensure token refresh strategy (short lived tokens) via session cookie refresh route.

#### Stage 5: Middleware protection on custom domains

- Update `middleware.ts` to enforce auth on custom domains using your session cookie.
- Preserve Clerk middleware for `launchthat.app` + `*.launchthat.app` during transition.

---

### Notes / risks

- `allowUnauthenticatedRequests: true` in `apps/portal/convex/auth.config.ts` is permissive.
  - For a production-grade “logged-in areas” model, you’ll likely want to enforce auth at the query/mutation level and eventually reduce reliance on unauthenticated access for sensitive data.

- Popup vs redirect UX:
  - Redirect is simplest.
  - Popup is possible with `postMessage` + strict origin checks + one-time codes.

---

### Appendix: why this is needed with Clerk

Clerk’s own docs describe “Platforms” as a scenario where customers have their own domains/branding/user pools and notes that Clerk does not fully support this today ([multi-tenant architecture → Platforms](https://clerk.com/docs/guides/how-clerk-works/multi-tenant-architecture#platforms)). The central auth host + redirect back pattern is a common way to approximate “platform custom domains” without embedding the auth provider on every tenant domain.



