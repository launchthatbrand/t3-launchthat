import type { ReactNode } from "react";

import { getActiveTenantFromHeaders } from "@/lib/tenant-headers";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { notFound } from "next/navigation";

import { getTenantOrganizationId } from "~/lib/tenant-fetcher";

import { CheckoutClient } from "launchthat-plugin-ecommerce";

export default async function CheckoutStepSlugPage(props: {
  params: Promise<{ stepSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<ReactNode> {
  const { stepSlug } = await props.params;
  const slug = String(stepSlug ?? "").trim();
  if (!slug) {
    notFound();
  }

  const tenant = await getActiveTenantFromHeaders();
  const organizationId = getTenantOrganizationId(tenant);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
  const apiAny = ((await import("@/convex/_generated/api")) as any).api;

  // Ensure default funnel + steps exist.
  await fetchMutation(apiAny.plugins.commerce.funnels.mutations.ensureDefaultFunnel, {
    ...(organizationId ? { organizationId } : {}),
  });
  await fetchMutation(apiAny.plugins.commerce.funnelSteps.mutations.ensureDefaultFunnelSteps, {
    ...(organizationId ? { organizationId } : {}),
  });

  const step: any = await fetchQuery(
    apiAny.plugins.commerce.funnelSteps.queries.getFunnelStepBySlug,
    {
      funnelSlug: "__default_funnel__",
      stepSlug: slug,
      ...(organizationId ? { organizationId } : {}),
    },
  );

  if (!step) {
    notFound();
  }

  // Gating for non-checkout steps will be enforced client-side initially; server can still
  // redirect if missing orderId for the default thank-you page.
  const searchParams = await props.searchParams;
  const orderIdParam = searchParams.orderId;
  const orderId =
    typeof orderIdParam === "string"
      ? orderIdParam
      : Array.isArray(orderIdParam)
        ? orderIdParam[0]
        : undefined;

  return (
    <main className="bg-background min-h-screen">
      <CheckoutClient
        organizationId={typeof organizationId === "string" ? organizationId : undefined}
        funnelId={typeof step?.funnelId === "string" ? step.funnelId : undefined}
        funnelSlug={typeof step?.funnelSlug === "string" ? step.funnelSlug : undefined}
        stepId={typeof step?.stepId === "string" ? step.stepId : undefined}
        stepSlug={typeof step?.stepSlug === "string" ? step.stepSlug : undefined}
        stepKind={typeof step?.kind === "string" ? step.kind : undefined}
        orderId={typeof orderId === "string" ? orderId : undefined}
      />
    </main>
  );
}


