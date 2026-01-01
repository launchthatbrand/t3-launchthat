import type { ReactNode } from "react";
import { api } from "@/convex/_generated/api";
import { getActiveTenantFromHeaders } from "@/lib/tenant-headers";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { CheckoutClient } from "launchthat-plugin-ecommerce";

import { getTenantOrganizationId } from "~/lib/tenant-fetcher";

export default async function CheckoutPage(): Promise<ReactNode> {
  const tenant = await getActiveTenantFromHeaders();
  const organizationId = getTenantOrganizationId(tenant);

  // Import Convex API dynamically (typed as any) to avoid TS deep-instantiation issues.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
  const apiAny = ((await import("@/convex/_generated/api")) as any).api;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
  const checkoutId: string = await fetchMutation(
    apiAny.plugins.commerce.checkouts.mutations.ensureGeneralCheckout,
    {
      ...(organizationId ? { organizationId } : {}),
    },
  );

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
  const config: { slug?: unknown } | null = await fetchQuery(
    apiAny.plugins.commerce.checkouts.queries.getCheckoutConfigById,
    {
      id: checkoutId,
      ...(organizationId ? { organizationId } : {}),
    },
  );

  return (
    <main className="bg-background min-h-screen">
      <CheckoutClient
        organizationId={
          typeof organizationId === "string" ? organizationId : undefined
        }
        checkoutId={typeof checkoutId === "string" ? checkoutId : undefined}
        checkoutSlug={
          typeof config?.slug === "string" ? config.slug : undefined
        }
      />
    </main>
  );
}
