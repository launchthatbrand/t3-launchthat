import "server-only";

import { headers } from "next/headers";

import type { TenantSummary } from "./tenant-fetcher";

export async function getActiveTenantFromHeaders(): Promise<TenantSummary | null> {
  const headerList: Headers = await headers();
  const id = headerList.get("x-tenant-id");
  const slug = headerList.get("x-tenant-slug");
  const encodedName = headerList.get("x-tenant-name");
  const customDomain = headerList.get("x-tenant-custom-domain");

  if (!id || !slug || !encodedName) {
    return null;
  }

  return {
    _id: id,
    slug,
    name: decodeURIComponent(encodedName),
    customDomain,
  };
}

