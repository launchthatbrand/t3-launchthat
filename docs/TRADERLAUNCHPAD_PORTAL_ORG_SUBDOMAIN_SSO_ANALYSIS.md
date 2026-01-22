---
title: TraderLaunchpad ↔ Portal org + subdomain + SSO analysis
date: 2026-01-22
status: analysis
---

## Context

We currently have:

- **Portal** (LMS / course delivery) running on a whitelabel domain like `app.wsatraining.com` (internally mapped to `wall-street-academy.launchthat.app`).
- **TraderLaunchpad** (markets / journaling) intended to run on a whitelabel domain like `markets.wsatraining.com` (internally mapped to `wall-street-academy.traderlaunchpad.com`).
- **Two separate Clerk installations**: Portal has its own Clerk project; TraderLaunchpad has its own Clerk project.

Goal:

- Allow orgs who want it to have a **seamless whitelabeled experience** across Portal + TraderLaunchpad.
- Still allow TraderLaunchpad to be promoted and used as a **standalone product** (independent identity, domain, org model).

Key product requirement example:

- `wall-street-academy.traderlaunchpad.com/s/AUDJPY` shows **org-scoped** aggregated activity:
  - all trades / executions for the symbol, across all members of that organization
  - filters by user/time/side
  - ideally visual overlays on the chart

---

## What Portal does today (tenant routing pattern)

Portal resolves tenant/org from the request host in `apps/portal/src/middleware.ts`:

- Extract subdomain or use custom domain lookup.
- Resolve tenant by `slug` or `customDomain`.
- Inject tenant headers like `x-tenant-id`, `x-tenant-slug`.
- For protected/admin routes on non-auth hosts, it enforces a **`tenant_session` cookie gate** and redirects to the auth host (e.g. `auth.launchthat.app`) with `return_to=...`.

This pattern is important because Clerk cookies don’t automatically work across arbitrary custom domains unless you do Clerk multi-domain/satellite setup.

---

## Where TraderLaunchpad is today (single-org per deployment)

TraderLaunchpad Convex currently resolves org via an environment variable:

- `TRADERLAUNCHPAD_DEFAULT_ORG_ID` (one org per deployment)

To support multi-org and host-based routing like Portal, TraderLaunchpad must evolve to:

- resolve org/tenant from request host (subdomain/custom domain)
- enforce org scoping in Convex queries/mutations/actions

---

## Authentication: what’s possible with two different Clerk installations

### Reality check: “logged into Portal” ≠ “logged into TraderLaunchpad”

With two separate Clerk projects:

- Portal login session does not create a TraderLaunchpad login session.
- Browser cookies are issuer + domain scoped; sessions don’t carry between different Clerk projects automatically.

So without additional work:

- a user will have to login once in Portal and once in TraderLaunchpad (at least the first time per browser profile).

### “Login once” can still be achieved as *SSO handoff*, not shared cookies

We can make navigation feel seamless by implementing a **cross-app SSO handoff**:

- Portal remains the identity authority for Portal.
- TraderLaunchpad remains the identity authority for TraderLaunchpad.
- A user can link the two accounts and then Portal can *broker* TraderLaunchpad login when needed using short-lived tokens.

---

## Proposed UX: “Connect TraderLaunchpad” + optional seamless whitelabel

### High-level idea

Portal provides a “Connect TraderLaunchpad” button for orgs who want a unified experience.

This creates:

1) an **account link** between a Portal user and a TraderLaunchpad user
2) the ability for Portal to **bootstrap** a TraderLaunchpad session without re-entering credentials in common flows

### Flow A: user is a Portal member first, then connects TraderLaunchpad

1. User is logged into Portal (Portal Clerk).
2. User clicks **Connect TraderLaunchpad**.
3. Portal redirects to TraderLaunchpad with a **signed one-time link token**, including:
   - `portalUserId`
   - `portalOrgId`
   - `return_to` (Portal)
   - nonce + expiry
4. TraderLaunchpad requires the user to login into TraderLaunchpad (TraderLaunchpad Clerk) if no TL session exists.
5. TraderLaunchpad verifies the link token, stores a durable link record:
   - `portalUserId -> traderlaunchpadUserId`
   - plus org association (portal org ↔ TL org/slug)
6. TraderLaunchpad redirects back to Portal with success.

User experience:

- user may authenticate in TL once during connect
- after that, the relationship is established

### Flow B: user is a TraderLaunchpad user first, then later joins Portal

Same as above: they simply login to their existing TL account during connect.

---

## Seamless whitelabel navigation: Portal → Markets

Goal: user on `app.wsatraining.com` clicks “Markets” → arrives at `markets.wsatraining.com` without re-entering credentials.

### How it works in practice (with 2 Clerk projects)

On `markets.wsatraining.com`, TraderLaunchpad middleware checks for TL session:

- If TL session exists: show page.
- If not: redirect to Portal (or a shared “handoff” endpoint) to mint a short-lived TL login token, then bounce to TraderLaunchpad to consume it.

Suggested redirect chain:

1. `markets.wsatraining.com/...` → redirect to `app.wsatraining.com/api/sso/traderlaunchpad/start?return_to=...`
2. Portal verifies Portal login and account link exists → mints **one-time TL login token**
3. Redirect to `markets.wsatraining.com/sso/consume?token=...&return_to=...`
4. TraderLaunchpad verifies token and establishes a TL session (server-side) → redirects to `return_to`

Notes:

- This is not “cookie sharing”; it’s explicit SSO token exchange.
- If the user is not logged into Portal in that browser, Portal will send them through Portal login first.

---

## Data model & boundaries

### Organizations

Portal has tenant/org mapping.
TraderLaunchpad needs the same concept:

- org slug (`wall-street-academy`)
- custom domain(s) (`markets.wsatraining.com`)
- verification status

### Account linking

Store a link record somewhere (implementation decision):

- Portal-owned table, or
- TraderLaunchpad-owned table, or
- shared “core tenant” component table

Minimal fields:

- `portalOrgId`
- `portalUserId` (Portal Clerk subject or internal user id)
- `traderlaunchpadUserId` (TraderLaunchpad Clerk subject)
- timestamps + status

### Authorization for org-scoped aggregated pages

For `wall-street-academy.traderlaunchpad.com/s/AUDJPY`:

- Resolve org from host (subdomain/custom domain).
- Allow access only to users who are members of that org (via:
  - TL org membership, or
  - Portal membership via the account link).

---

## Org-scoped “symbol page” aggregation requirements

### Data source

TradeLocker “filledOrders” panel is unreliable across brokers; `/trade/accounts/{accountId}/executions` is the consistent fill stream for some brokers.

For aggregation across an org:

- choose the canonical unit: **executions** and/or **ordersHistory**
- use `instrumentId` (tradableInstrumentId) as the canonical symbol key

### Query shape (conceptual)

- Input:
  - `orgId`
  - `instrumentId` (resolved from `symbol` via PriceData mapping)
  - optional time range
  - optional user filter
  - optional side filter
- Output:
  - execution markers, grouped or raw
  - optional rollups by user / time bucket

### Performance (Convex indexing)

To avoid scanning all members:

- create indexes that support org-level queries:
  - `by_org_instrument_executedAt`
  - (or) `by_org_symbol_executedAt` if symbol is denormalized

This enables “all executions for org + instrument in a time window” efficiently.

---

## Security considerations (critical)

For any cross-app SSO token:

- **short TTL** (60–120s)
- **single-use nonce** stored server-side to prevent replay
- **audience binding** (token is valid only for TraderLaunchpad, and optionally only for a specific org/host)
- **return_to allowlist** (avoid open redirect vulnerabilities)
- **link enforcement** (only allow SSO if Portal user is linked to a TL user)

---

## Trade-offs / alternatives

### Single Clerk project (not chosen for now)

Pros:
- simplest “login once”
- fewer moving parts

Cons:
- less product independence
- harder to treat TL as a standalone product identity silo

### Shared parent-domain cookie (.wsatraining.com)

Works only for customer domains (not `*.launchthat.app` ↔ `*.traderlaunchpad.com`) and has high security/operational complexity.

---

## Open questions to settle before implementation

1) Where should the **account link** live (Portal vs TraderLaunchpad vs shared component)?
2) Who is the source of truth for **org membership** on TraderLaunchpad whitelabel domains:
   - Portal membership (via link)
   - TraderLaunchpad-native membership
   - both
3) Do we require a dedicated auth host for TraderLaunchpad (e.g. `auth.traderlaunchpad.com`) or reuse `auth.launchthat.app` for the SSO handoff?
4) What is the “canonical unit” for the org symbol page:
   - executions (fills) vs ordersHistory vs derived closed positions/trades
5) Privacy controls:
   - should org members see all members’ trades by default?
   - do we need opt-in/roles?

---

## Suggested phased rollout

### Phase 1: Org + domain mapping in TraderLaunchpad
- Host → org resolution (subdomain + custom domain).
- Org-scoped routing and headers similar to Portal middleware.
- TraderLaunchpad remains standalone for non-whitelabel usage.

### Phase 2: Portal “Connect TraderLaunchpad” account-link flow
- Link Portal user to TL user (requires TL login once).
- Store the durable link record.

### Phase 3: Seamless whitelabel SSO handoff (Portal → TraderLaunchpad)
- Implement one-time TL login token issuance + consumption.
- Ensure `markets.*` domains can bounce without prompting if Portal session exists.

### Phase 4: Org-scoped symbol aggregation pages
- Index + query org executions by instrument + time.
- UI filters and chart overlays.

