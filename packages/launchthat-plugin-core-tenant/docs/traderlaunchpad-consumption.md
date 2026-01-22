## TraderLaunchpad consumption notes (core-tenant domains)

This note describes how TraderLaunchpad should consume `launchthat-plugin-core-tenant` for:

- `host -> organization` resolution (subdomain + custom domain)
- later removal of `TRADERLAUNCHPAD_DEFAULT_ORG_ID` in Convex

### 1) Add TraderLaunchpad Next middleware

Create `apps/traderlaunchpad/src/middleware.ts` modeled after Portal:

- Parse host (`x-forwarded-host` / `host`) and extract:\n  - subdomain under root domain (e.g. `wall-street-academy.traderlaunchpad.com`)\n  - or treat as custom domain (e.g. `markets.wsatraining.com`)
- Resolve org:\n  - if subdomain: call core-tenant `getOrganizationBySlug`\n  - else: call core-tenant `getOrganizationByHostname({ appKey: 'traderlaunchpad', hostname, requireVerified: true })`
- Inject headers for server components and route handlers:\n  - `x-org-id`, `x-org-slug`, `x-org-name`\n  - `x-host`, `x-pathname` (optional, matches Portal conventions)

Suggested helper usage:

```ts
import { createCoreTenantResolver } from "launchthat-plugin-core-tenant";
import { api } from "@convex-config/_generated/api";
import { env } from "~/env";

const resolver = createCoreTenantResolver({
  convexUrl: env.NEXT_PUBLIC_CONVEX_URL,
  api,
});
```

### 2) Org scoping inside Convex

Today TraderLaunchpad uses `TRADERLAUNCHPAD_DEFAULT_ORG_ID` via:

- `apps/traderlaunchpad/convex/traderlaunchpad/lib/resolve.ts`

To become multi-tenant:\n
- pass org id into Convex through an auth/session mechanism (similar to Portal’s `tenant_session` cookie) or by including orgId in authenticated identity claims.\n
- replace `resolveOrganizationId()` with a context-aware version that reads the org id from request/session.\n

### 3) Data access patterns for org-scoped symbol pages

Org-scoped aggregation requires queries indexed by:\n
- `organizationId + instrumentId + time`\n
so a single org symbol page can fetch executions across all members efficiently.

