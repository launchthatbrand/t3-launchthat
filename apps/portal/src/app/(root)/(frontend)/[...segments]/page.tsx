import "~/lib/pageTemplates";
import "~/lib/plugins/installHooks";

import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { resolveFrontendRoute as resolveFrontendRouteTyped } from "@/lib/frontendRouting/resolveFrontendRoute";
import { getActiveTenantFromHeaders } from "@/lib/tenant-headers";
import { fetchQuery } from "convex/nextjs";

import { getTenantOrganizationId } from "~/lib/tenant-fetcher";

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment */

export { generateMetadata } from "./metadata";

interface PageProps {
  params: Promise<{ segments?: string[] }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function FrontendCatchAllPage(
  props: PageProps,
): Promise<ReactNode> {
  const resolveFrontendRoute = resolveFrontendRouteTyped as unknown as (
    args: any,
  ) => Promise<ReactNode | null>;

  const resolvedParams = await props.params;
  const segments = (resolvedParams.segments ?? [])
    .map((s) => s.trim())
    .filter(Boolean);
  const resolvedSearchParams = props.searchParams
    ? await props.searchParams
    : undefined;

  const tenant = await getActiveTenantFromHeaders();
  const organizationId = getTenantOrganizationId(tenant);

  const node = await resolveFrontendRoute({
    segments,
    searchParams: resolvedSearchParams,
    organizationId: (organizationId ?? null) as any,
    fetchQuery,
  });

  if (!node) notFound();
  return node;
}
