## Portal refactor notes (consume core-tenant domains)

Portal currently resolves tenant/org using:

- Next middleware: `apps/portal/src/middleware.ts`
- Convex HTTP lookups: `apps/portal/src/lib/tenant-fetcher.ts`
  - `api.core.organizations.queries.getBySlug`
  - `api.core.organizations.queries.getByCustomDomain`

To migrate Portal to the shared component:

### 1) Replace tenant-fetcher lookups

Update `apps/portal/src/lib/tenant-fetcher.ts` to call core-tenant component queries instead of Portal’s app-local `api.core.organizations.*`.

New call sites should target:

- `api.launchthat_core_tenant.queries.getOrganizationBySlug`
- `api.launchthat_core_tenant.queries.getOrganizationByHostname` with `appKey: 'portal'`

Suggested approach:

- Keep the existing `TenantSummary` type.\n
- Change only the Convex query targets and the returned field mapping.\n
- Preserve caching behavior.\n

### 2) Keep middleware structure, change resolver backend

Portal’s `apps/portal/src/middleware.ts` can largely remain as-is:

- subdomain extraction\n
- custom domain path\n
- header injection\n

But when it needs to resolve tenant for a hostname, it should use the new core-tenant backed `tenant-fetcher.ts`.

### 3) Domain verification actions (deferred)

Portal has extensive Vercel domain verification actions in:

- `apps/portal/convex/core/organizations/domains.ts`\n

For now, those actions can remain Portal-owned.\n
Later, once core-tenant `organizationDomains` is the source of truth, you can either:\n
- re-point Portal’s actions to read/write core-tenant `organizationDomains`, or\n
- port the actions into core-tenant.\n

### 4) Data migration considerations

If Portal currently stores the verified custom domain on an organization record (Portal’s organization schema includes `customDomain` + status fields), you’ll need a one-time migration to populate:\n
`launchthat_core_tenant.organizationDomains` rows with:\n
- `appKey='portal'`\n
- `hostname=<customDomain>`\n
- `status='verified'` (or current status)\n
\n
Once migrated, Portal’s tenant resolver should prefer core-tenant.\n

