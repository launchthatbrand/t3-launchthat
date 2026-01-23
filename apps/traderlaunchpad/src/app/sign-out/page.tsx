import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { env } from "~/env";
import {
  getAuthHostForHost,
  getHostFromHeaders,
  getProtoForHostFromHeaders,
  isAuthHostForHost,
} from "~/lib/host";
import { SignOutClient } from "./SignOutClient";

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const headerList = await headers();
  const host = getHostFromHeaders(headerList);
  const onAuthHost = isAuthHostForHost(
    host,
    String(env.NEXT_PUBLIC_ROOT_DOMAIN ?? "traderlaunchpad.com"),
  );
  const authHost = getAuthHostForHost(
    host,
    String(env.NEXT_PUBLIC_ROOT_DOMAIN ?? "traderlaunchpad.com"),
  );

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const returnToRaw = resolvedSearchParams?.return_to;
  const returnTo =
    typeof returnToRaw === "string"
      ? returnToRaw
      : Array.isArray(returnToRaw)
        ? returnToRaw[0]
        : null;

  const proto = getProtoForHostFromHeaders(host, headerList);

  // Portal parity: if somehow rendered off auth host, bounce to auth host.
  if (!onAuthHost) {
    const url = new URL(
      `${proto}://${host}${headerList.get("x-pathname") ?? "/sign-out"}`,
    );
    const params = new URLSearchParams(url.searchParams);
    if (returnTo) params.set("return_to", returnTo);
    redirect(`${proto}://${authHost}/sign-out?${params.toString()}`);
  }

  const returnToSafe =
    returnTo && returnTo.trim().length > 0 ? returnTo : `${proto}://${host}/`;

  return <SignOutClient returnTo={returnToSafe} />;
}

