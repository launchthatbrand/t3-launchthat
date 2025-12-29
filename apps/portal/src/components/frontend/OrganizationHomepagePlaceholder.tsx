import type { TenantSummary } from "~/lib/tenant-fetcher";

export function OrganizationHomepagePlaceholder({
  tenant,
}: {
  tenant: TenantSummary;
}) {
  return (
    <div className="container mx-auto max-w-5xl flex-1 space-y-6 py-16">
      <div className="space-y-3 text-center">
        {tenant.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={tenant.logo}
            alt={`${tenant.name} logo`}
            className="mx-auto h-16 w-16 rounded-md object-contain"
          />
        ) : null}
        <h1 className="text-4xl font-bold">{tenant.name}</h1>
        <p className="text-muted-foreground text-lg">
          This organization hasn’t set a homepage yet.
        </p>
      </div>

      <div className="bg-card rounded-lg border p-8">
        <h2 className="text-xl font-semibold">Coming soon</h2>
        <p className="text-muted-foreground mt-2">
          Check back later, or ask an administrator to configure the site’s
          front page.
        </p>
        <div className="mt-4">
          <a
            className="text-primary text-sm font-medium underline underline-offset-4"
            href="/admin/settings/site?tab=homepage"
          >
            Configure homepage
          </a>
        </div>
      </div>
    </div>
  );
}
