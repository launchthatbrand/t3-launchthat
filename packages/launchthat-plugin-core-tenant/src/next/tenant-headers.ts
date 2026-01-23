import { headers } from "next/headers";

export interface TenantHeadersSummary {
  _id: string;
  slug: string;
  name?: string;
  logo?: string | null;
  planId?: string | null;
  customDomain?: string | null;
}

export const getActiveTenantFromHeaders = async (): Promise<TenantHeadersSummary | null> => {
  const headerList = await headers();
  const id = (headerList.get("x-tenant-id") ?? "").trim();
  const slug = (headerList.get("x-tenant-slug") ?? "").trim();
  if (!id || !slug) return null;

  const nameRaw = headerList.get("x-tenant-name");
  const customDomainRaw = headerList.get("x-tenant-custom-domain");
  const logoRaw = headerList.get("x-tenant-logo");
  const planIdRaw = headerList.get("x-tenant-plan-id");

  return {
    _id: id,
    slug,
    name: typeof nameRaw === "string" && nameRaw.trim() ? nameRaw : undefined,
    logo: typeof logoRaw === "string" && logoRaw.trim() ? logoRaw : null,
    planId: typeof planIdRaw === "string" && planIdRaw.trim() ? planIdRaw : null,
    customDomain:
      typeof customDomainRaw === "string" && customDomainRaw.trim()
        ? customDomainRaw
        : null,
  };
};

