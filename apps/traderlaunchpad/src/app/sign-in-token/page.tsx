import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { env } from "~/env";
import {
  getAuthHostForHost,
  getHostFromHeaders,
  getProtoForHostFromHeaders,
  isAuthHostForHost,
} from "~/lib/host";
import { SignInTokenClient } from "./SignInTokenClient";

export default async function Page() {
  const headerList = await headers();
  const host = getHostFromHeaders(headerList);
  const onAuthHost = isAuthHostForHost(host, String(env.NEXT_PUBLIC_ROOT_DOMAIN ?? "traderlaunchpad.com"));
  const authHost = getAuthHostForHost(host, String(env.NEXT_PUBLIC_ROOT_DOMAIN ?? "traderlaunchpad.com"));
  const proto = getProtoForHostFromHeaders(host, headerList);

  if (!onAuthHost) {
    const pathname = headerList.get("x-pathname") ?? "/sign-in-token";
    redirect(`${proto}://${authHost}${pathname}`);
  }

  return <SignInTokenClient />;
}

