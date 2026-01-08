import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { fetchQuery } from "convex/nextjs";

import { env } from "~/env";
import {
  getAuthHostForHost,
  getHostFromHeaders,
  getProtoForHostFromHeaders,
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
  const methodRaw = resolvedSearchParams?.method;
  const phoneRaw = resolvedSearchParams?.phone;
  const emailRaw = resolvedSearchParams?.email;
  const returnTo = Array.isArray(returnToRaw) ? returnToRaw[0] : returnToRaw;
  const tenantSlug = Array.isArray(tenantRaw) ? tenantRaw[0] : tenantRaw;
  const ui = Array.isArray(uiRaw) ? uiRaw[0] : uiRaw;
  const method = Array.isArray(methodRaw) ? methodRaw[0] : methodRaw;
  const phone = Array.isArray(phoneRaw) ? phoneRaw[0] : phoneRaw;
  const email = Array.isArray(emailRaw) ? emailRaw[0] : emailRaw;

  if (!onAuthHost) {
    const proto = getProtoForHostFromHeaders(host, headerList);
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

  const orgResult: unknown =
    typeof tenantSlug === "string" && tenantSlug.trim().length > 0
      ? // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        await fetchQuery(apiAny.core.organizations.queries.getBySlug, {
          slug: tenantSlug.trim(),
        })
      : null;

  const org =
    orgResult && typeof orgResult === "object"
      ? (orgResult as { name?: unknown; logo?: unknown })
      : null;

  const tenantName = typeof org?.name === "string" ? org.name : null;
  const tenantLogo = typeof org?.logo === "string" ? org.logo : null;

  const prefillMethod: "phone" | "email" | null =
    method === "phone" || method === "email" ? method : null;

  return (
    <SignInClient
      returnTo={typeof returnTo === "string" ? returnTo : null}
      tenantSlug={typeof tenantSlug === "string" ? tenantSlug : null}
      tenantName={tenantName}
      tenantLogo={tenantLogo}
      ui={ui === "clerk" ? "clerk" : "custom"}
      prefillMethod={prefillMethod}
      prefillPhone={typeof phone === "string" ? phone : null}
      prefillEmail={typeof email === "string" ? email : null}
    />
  );
}
