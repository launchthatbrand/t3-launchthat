"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useConvexAuth, useMutation } from "convex/react";

import { toast } from "@acme/ui/toast";
import { api } from "@convex-config/_generated/api";
import { useHostContext } from "~/context/HostContext";

type JoinCodeProviderProps = {
  children: React.ReactNode;
};

const extractOrgSlug = (pathname: string): string | null => {
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] !== "org") return null;
  return segments[1] ?? null;
};

const parseHostAndPort = (host: string): { hostname: string; port: string } => {
  const [hostname, port] = String(host ?? "").split(":");
  return { hostname: hostname ?? "", port: port ?? "" };
};

const resolveTenantOrigin = (host: string, pathname: string): string => {
  const { hostname, port } = parseHostAndPort(host);
  const baseHost = hostname.startsWith("auth.")
    ? hostname.slice("auth.".length)
    : hostname;
  const isLocal =
    baseHost === "localhost" ||
    baseHost === "127.0.0.1" ||
    baseHost.endsWith(".localhost") ||
    baseHost.endsWith(".127.0.0.1");
  const orgSlug = extractOrgSlug(pathname);
  const tenantHost = orgSlug
    ? isLocal
      ? `${orgSlug}.${baseHost}${port ? `:${port}` : ""}`
      : `${orgSlug}.${baseHost}`
    : isLocal
      ? `${baseHost}${port ? `:${port}` : ""}`
      : baseHost;

  const protocol = typeof window !== "undefined" ? window.location.protocol : "https:";
  return `${protocol}//${tenantHost}`;
};

const buildReturnToUrl = (
  tenantOrigin: string,
  currentUrl: URL,
  joinCode: string,
): string => {
  const url = new URL(currentUrl.pathname + currentUrl.search, tenantOrigin);
  if (!url.searchParams.get("join")) {
    url.searchParams.set("join", joinCode);
  }
  return url.toString();
};

const cleanJoinFromUrl = (currentUrl: URL): string => {
  currentUrl.searchParams.delete("join");
  currentUrl.searchParams.delete("return_to");
  return currentUrl.pathname + currentUrl.search;
};

function JoinCodeProviderInner({ children }: JoinCodeProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { host } = useHostContext();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const redeemPlatformJoinCode = useMutation(
    api.traderlaunchpad.mutations.redeemPlatformJoinCode,
  );
  const redeemOrgJoinCode = useMutation(
    api.traderlaunchpad.mutations.redeemOrgJoinCode,
  );
  const lastRedeemedRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    const joinCode = String(searchParams.get("join") ?? "").trim();
    if (!joinCode) return;
    if (isLoading) return;

    const currentUrl = new URL(window.location.href);
    const tenantOrigin = resolveTenantOrigin(host, pathname);
    const returnTo = buildReturnToUrl(tenantOrigin, currentUrl, joinCode);
    const isSignInRoute = pathname.startsWith("/sign-in");
    const returnToParam = searchParams.get("return_to");

    if (!isAuthenticated) {
      if (isSignInRoute) {
        if (!returnToParam) {
          const signInUrl = new URL(window.location.href);
          signInUrl.searchParams.set("return_to", returnTo);
          router.replace(
            signInUrl.pathname + "?" + signInUrl.searchParams.toString(),
          );
        }
        return;
      }

      router.replace(`/sign-in?return_to=${encodeURIComponent(returnTo)}`);
      return;
    }

    if (lastRedeemedRef.current === joinCode) return;
    lastRedeemedRef.current = joinCode;

    const redeem = async () => {
      try {
        const isOrgJoin = Boolean(extractOrgSlug(pathname));
        const result = isOrgJoin
          ? await redeemOrgJoinCode({ code: joinCode })
          : await redeemPlatformJoinCode({ code: joinCode });
        const ok = isOrgJoin
          ? Boolean((result as { organizationId?: string } | null)?.organizationId)
          : Boolean((result as { ok?: boolean } | null)?.ok);

        if (!ok) {
          lastRedeemedRef.current = null;
          toast.error("Join code could not be redeemed.");
          return;
        }

        const cleanedPath = cleanJoinFromUrl(new URL(window.location.href));
        if (window.location.origin !== tenantOrigin) {
          window.location.assign(`${tenantOrigin}${cleanedPath}`);
          return;
        }
        router.replace(cleanedPath || "/");
      } catch (error) {
        lastRedeemedRef.current = null;
        console.error("Failed to redeem join code", error);
        toast.error("Join code redemption failed.");
      }
    };

    void redeem();
  }, [
    host,
    isAuthenticated,
    isLoading,
    pathname,
    redeemOrgJoinCode,
    redeemPlatformJoinCode,
    router,
    searchParams,
  ]);

  return <>{children}</>;
}

export function JoinCodeProvider({ children }: JoinCodeProviderProps) {
  return (
    <React.Suspense fallback={<>{children}</>}>
      <JoinCodeProviderInner>{children}</JoinCodeProviderInner>
    </React.Suspense>
  );
}
