import "server-only";

import type { Id } from "@/convex/_generated/dataModel";
import { headers } from "next/headers";

import type { TenantSummary } from "./tenant-fetcher";

export function getActiveTenantFromHeaders(): TenantSummary | null {
  const headerList: Headers = headers();
  const id: string | null = headerList.get("x-tenant-id");
  const slug: string | null = headerList.get("x-tenant-slug");
  const encodedName: string | null = headerList.get("x-tenant-name");

  if (!id || !slug || !encodedName) {
    return null;
  }

  const planId: string | null = headerList.get("x-tenant-plan-id");
  const customDomain: string | null = headerList.get("x-tenant-custom-domain");

  return {
    _id: id as Id<"organizations">,
    slug,
    name: decodeURIComponent(encodedName),
    planId: planId ? (planId as Id<"plans">) : null,
    customDomain,
  };
}
