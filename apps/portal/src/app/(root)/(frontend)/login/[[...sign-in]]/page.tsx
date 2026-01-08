import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { env } from "~/env";
import {
  getAuthHost,
  getHostFromHeaders,
  getHostnameFromHeaders,
  getProtoForHostFromHeaders,
  isAuthHost,
} from "~/lib/host";

export default async function Page() {
  const headerList = await headers();
  const host = getHostFromHeaders(headerList);
  const hostname = getHostnameFromHeaders(headerList);
  const onAuthHost = isAuthHost(hostname, env.NEXT_PUBLIC_ROOT_DOMAIN);
  const authHost = getAuthHost(env.NEXT_PUBLIC_ROOT_DOMAIN);
  const proto = getProtoForHostFromHeaders(host, headerList);

  // This legacy route should always land on the auth host now.
  if (!onAuthHost) {
    redirect(`${proto}://${authHost}/sign-in`);
  }

  redirect("/sign-in");
}
