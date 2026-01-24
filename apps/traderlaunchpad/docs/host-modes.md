## Host modes: platform vs whitelabel

TraderLaunchpad supports two runtime “modes” based on the current hostname.

### Platform mode (default)

**Hosts**
- `traderlaunchpad.com` (apex)
- `*.traderlaunchpad.com` (first-party tenant subdomains)

**UX**
- Org/team switchers show **TraderLaunchpad (Global)** plus **all orgs the user belongs to**
- Users can switch between org subdomains freely

**Auth**
- Uses **Clerk session** directly on the current host (no `auth.*` bounce for already-signed-in users)
- Production configuration should set Clerk cookie domain to **`.traderlaunchpad.com`**

### Whitelabel mode (vanity domains)

**Hosts**
- Any **verified** vanity domain in the `organizationDomains` mapping (e.g. `markets.wsatraining.com`)

**UX**
- Switchers show only:
  - current org
  - TraderLaunchpad (Global)
- No “community discovery” / switching to other orgs from vanity domains

**Auth (B2)**
- Vanity domains can bounce to `auth.traderlaunchpad.com` for sign-in/sign-up
- Once signed in for that vanity domain, the session is scoped to that domain (cookies cannot be shared across unrelated registrable domains)

## Implementation notes

### Host classification

- `isPlatformHost` in `apps/traderlaunchpad/src/lib/host-mode.ts`
  - In production, treats apex + subdomains under root domain as platform mode
  - In local dev (`rootDomain = localhost`), it intentionally disables platform mode to avoid relying on `.localhost` cookie sharing; local dev uses tenant-session auth like Portal

### Middleware auth gating

- `apps/traderlaunchpad/src/middleware.ts`:
  - Platform hosts: `auth.protect()` for protected routes (Clerk)
  - Vanity hosts: require `tenant_session` or redirect to auth host

### Providers

- `apps/traderlaunchpad/src/app/providers.tsx` mounts Clerk for:
  - auth host, or
  - platform mode hosts
  - otherwise uses `TenantConvexProvider` (tenant-session mode)

### Switchers

- `packages/launchthat-plugin-core-tenant/src/frontend/AdminTeamSwitcher.tsx`
- `packages/launchthat-plugin-core-tenant/src/frontend/OrganizationTeamSwitcher.tsx`

Both accept `mode?: "platform" | "whitelabel"` to restrict org lists on vanity domains.

## Manual test matrix

### Platform mode

1. Sign in once on `https://traderlaunchpad.com/admin/dashboard`
2. Navigate directly to `https://wsa.traderlaunchpad.com/admin/dashboard`
   - Expected: **no redirect to** `https://auth.traderlaunchpad.com/...`
3. Use org switcher to go to another org subdomain
   - Expected: **no auth bounce** (already signed in)

### Whitelabel mode

1. Visit `https://markets.wsatraining.com/admin`
2. Click “Sign in”
   - Expected: redirect to `https://auth.traderlaunchpad.com/sign-in?return_to=<markets...>&tenant=<orgSlug>`
3. After sign-in, return to `https://markets.wsatraining.com/...`
4. Open org switcher
   - Expected: only current org + TraderLaunchpad (Global)

