import {
  getAuthHostForHost,
  getHostFromHeaders,
  getProtoForHostFromHeaders,
} from "~/lib/host";

import { env } from "~/env";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const coerceFirst = (
  value: string | string[] | undefined,
): string | undefined => {
  if (Array.isArray(value)) return value[0];
  return value;
};

const safeAbsoluteReturnTo = (args: {
  proto: string;
  host: string;
  redirectUrl: string | null;
  returnTo: string | null;
}): string => {
  const origin = `${args.proto}://${args.host}`;
  const raw = args.returnTo ?? args.redirectUrl ?? "/";
  try {
    // If it's already absolute, keep it.
    const asUrl = new URL(raw);
    return asUrl.toString();
  } catch {
    // Otherwise treat as a path on this origin.
    const path = raw.startsWith("/") ? raw : `/${raw}`;
    return new URL(path, origin).toString();
  }
};

export default async function AuthSignInRedirectPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const headerList = await headers();
  const host = getHostFromHeaders(headerList);
  const proto = getProtoForHostFromHeaders(host, headerList);

  const resolvedSearchParams = props.searchParams
    ? await props.searchParams
    : undefined;

  const redirectUrl = coerceFirst(resolvedSearchParams?.redirect_url) ?? null;
  const returnTo = coerceFirst(resolvedSearchParams?.return_to) ?? null;
  const tenantFromQuery = coerceFirst(resolvedSearchParams?.tenant) ?? null;
  const tenantFromHeader = (headerList.get("x-tenant-slug") ?? "").trim();
  const tenantSlug = tenantFromQuery ?? (tenantFromHeader ? tenantFromHeader : null);

  const authHost = getAuthHostForHost(host, env.NEXT_PUBLIC_ROOT_DOMAIN);
  const returnToAbs = safeAbsoluteReturnTo({ proto, host, redirectUrl, returnTo });

  const params = new URLSearchParams();
  params.set("return_to", returnToAbs);
  if (tenantSlug) params.set("tenant", tenantSlug);

  redirect(`${proto}://${authHost}/sign-in?${params.toString()}`);
}


