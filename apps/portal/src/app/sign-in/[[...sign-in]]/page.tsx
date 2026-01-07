import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { fetchQuery } from "convex/nextjs";

import { env } from "~/env";
import {
  getAuthHostForHost,
  getHostFromHeaders,
  isAuthHostForHost,
} from "~/lib/host";
import SignInClient from "./SignInClient";

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const headerList = await headers();
  const host = getHostFromHeaders(headerList);
  const onAuthHost = isAuthHostForHost(host, env.NEXT_PUBLIC_ROOT_DOMAIN);
  const authHost = getAuthHostForHost(host, env.NEXT_PUBLIC_ROOT_DOMAIN);

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const returnToRaw = resolvedSearchParams?.return_to;
  const tenantRaw = resolvedSearchParams?.tenant;
  const uiRaw = resolvedSearchParams?.ui;
  const returnTo = Array.isArray(returnToRaw) ? returnToRaw[0] : returnToRaw;
  const tenantSlug = Array.isArray(tenantRaw) ? tenantRaw[0] : tenantRaw;
  const ui = Array.isArray(uiRaw) ? uiRaw[0] : uiRaw;

  if (!onAuthHost) {
    const proto = headerList.get("x-forwarded-proto") ?? "https";
    const url = new URL(
      `${proto}://${host}${headerList.get("x-pathname") ?? "/sign-in"}`,
    );
    const params = new URLSearchParams(url.searchParams);
    if (returnTo) params.set("return_to", returnTo);
    if (tenantSlug) params.set("tenant", tenantSlug);
    redirect(`${proto}://${authHost}/sign-in?${params.toString()}`);
  }

  // Resolve tenant branding for the auth host login screen (best effort).
  // Avoid importing Convex generated API at module scope to prevent TS “excessively deep” instantiation issues.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
  const apiAny = (await import("@/convex/_generated/api")).api as any;

  const org =
    typeof tenantSlug === "string" && tenantSlug.trim().length > 0
      ? await fetchQuery(apiAny.core.organizations.queries.getBySlug, {
          slug: tenantSlug.trim(),
        })
      : null;

  const tenantName =
    org && typeof org === "object" && typeof (org as any).name === "string"
      ? ((org as any).name as string)
      : null;
  const tenantLogo =
    org && typeof org === "object" && typeof (org as any).logo === "string"
      ? ((org as any).logo as string)
      : null;

  return (
    <SignInClient
      returnTo={typeof returnTo === "string" ? returnTo : null}
      tenantSlug={typeof tenantSlug === "string" ? tenantSlug : null}
      tenantName={tenantName}
      tenantLogo={tenantLogo}
      ui={ui === "clerk" ? "clerk" : "custom"}
    />
  );
}
