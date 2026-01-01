import type { ReactNode } from "react";

import { api } from "@/convex/_generated/api";
import { getActiveTenantFromHeaders } from "@/lib/tenant-headers";
import { fetchQuery } from "convex/nextjs";
import { notFound, redirect } from "next/navigation";

import { getTenantOrganizationId } from "~/lib/tenant-fetcher";

import { CheckoutClient } from "launchthat-plugin-ecommerce";

const DEFAULT_CHECKOUT_SLUG = "__default_checkout__";

export default async function CheckoutSlugPage(props: {
  params: Promise<{ checkoutSlug: string }>;
}): Promise<ReactNode> {
  const { checkoutSlug } = await props.params;
  const slug = String(checkoutSlug ?? "").trim();
  if (!slug) {
    notFound();
  }
  if (slug === DEFAULT_CHECKOUT_SLUG) {
    redirect("/checkout");
  }

  const tenant = await getActiveTenantFromHeaders();
  const organizationId = getTenantOrganizationId(tenant);

  const config = await fetchQuery(api.plugins.commerce.checkouts.queries.getCheckoutConfigBySlug, {
    slug,
    ...(organizationId ? { organizationId } : {}),
  });

  if (!config) {
    notFound();
  }

  return (
    <main className="bg-background min-h-screen">
      <CheckoutClient
        organizationId={typeof organizationId === "string" ? organizationId : undefined}
        checkoutSlug={slug}
      />
    </main>
  );
}


