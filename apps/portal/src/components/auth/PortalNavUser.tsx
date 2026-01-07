"use client";

import * as React from "react";

import { useClerk, useSession } from "@clerk/nextjs";
import { NavUser } from "@acme/ui/general/nav-user";
import { Skeleton } from "@acme/ui/skeleton";

import { useHostContext } from "~/context/HostContext";
import { useTenant } from "~/context/TenantContext";

export function PortalNavUser() {
  const { isAuthHost } = useHostContext();

  return isAuthHost ? <PortalNavUserClerk /> : <PortalNavUserTenant />;
}

function PortalNavUserClerk() {
  // This component is only rendered on the auth host (where <ClerkProvider /> exists).
  const { session } = useSession();
  const { openSignIn, signOut } = useClerk();

  if (!session) {
    return (
      <NavUser
        className="ml-auto!"
        isAuthenticated={false}
        onSignIn={() => {
          if (openSignIn) {
            void openSignIn({});
          }
        }}
      />
    );
  }

  return (
    <NavUser
      className="ml-auto!"
      isAuthenticated
      user={{
        name: session.user.fullName ?? session.user.username ?? undefined,
        email: session.user.emailAddresses[0]?.emailAddress ?? undefined,
        avatar: session.user.imageUrl ?? undefined,
      }}
      onSignOut={() => signOut()}
    />
  );
}

interface TenantSessionUser {
  name?: string;
  email?: string;
  avatar?: string;
}

interface TenantMeResponse {
  user: TenantSessionUser | null;
}

function PortalNavUserTenant() {
  const { authHost } = useHostContext();
  const tenant = useTenant();
  const [me, setMe] = React.useState<TenantMeResponse | null>(null);
  const [isMeLoading, setIsMeLoading] = React.useState(true);
  const hasLoadedOnceRef = React.useRef(false);
  const inFlightRef = React.useRef(false);
  const lastFetchAtRef = React.useRef(0);

  const TENANT_SESSION_UPDATED_EVENT = "tenant-session-updated";

  const fetchMe = React.useCallback(async () => {
    // Avoid storms (multiple events firing in quick succession).
    const now = Date.now();
    if (inFlightRef.current) return;
    if (now - lastFetchAtRef.current < 500) return;
    lastFetchAtRef.current = now;
    inFlightRef.current = true;
    try {
      // Only show the "loading skeleton" on the initial load.
      if (!hasLoadedOnceRef.current) {
        setIsMeLoading(true);
      }
      const res = await fetch("/api/me", {
        method: "GET",
        headers: { "content-type": "application/json", "cache-control": "no-store" },
        cache: "no-store",
      });
      if (!res.ok) {
        setMe({ user: null });
        setIsMeLoading(false);
        hasLoadedOnceRef.current = true;
        return;
      }
      const json: unknown = await res.json();
      if (
        json &&
        typeof json === "object" &&
        "user" in json &&
        (json as { user?: unknown }).user !== undefined
      ) {
        setMe(json as TenantMeResponse);
      } else {
        setMe({ user: null });
      }
      setIsMeLoading(false);
      hasLoadedOnceRef.current = true;
    } catch {
      setMe({ user: null });
      setIsMeLoading(false);
      hasLoadedOnceRef.current = true;
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    const safeFetch = () => {
      if (cancelled) return;
      void fetchMe();
    };

    // Initial load
    safeFetch();

    // If the browser restores the page from bfcache (common after cross-origin redirects),
    // effects/state might be preserved. Refetch auth state on these lifecycle events.
    const handlePageShow = () => {
      safeFetch();
    };
    const handleFocus = () => {
      safeFetch();
    };
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        safeFetch();
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener(TENANT_SESSION_UPDATED_EVENT, handlePageShow as EventListener);

    return () => {
      cancelled = true;
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener(TENANT_SESSION_UPDATED_EVENT, handlePageShow as EventListener);
    };
  }, [fetchMe]);

  const handleSignIn = React.useCallback(() => {
    if (typeof window === "undefined") return;
    const tenantSlug =
      typeof (tenant as { slug?: unknown } | null)?.slug === "string"
        ? (tenant as { slug: string }).slug
        : "";
    const returnTo = window.location.href;
    const params = new URLSearchParams({
      return_to: returnTo,
      ...(tenantSlug ? { tenant: tenantSlug } : {}),
    });
    window.location.assign(
      `${window.location.protocol}//${authHost}/sign-in?${params.toString()}`,
    );
  }, [authHost, tenant]);

  const handleSignOut = React.useCallback(async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch {
      // ignore
    } finally {
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    }
  }, []);

  const user = me?.user ?? null;

  if (isMeLoading) {
    return (
      <NavUser
        className="ml-auto!"
        unauthenticatedSlot={<Skeleton className="ml-auto h-8 w-24 rounded-md" />}
      />
    );
  }

  if (!user) {
    return (
      <NavUser
        className="ml-auto!"
        isAuthenticated={false}
        onSignIn={handleSignIn}
      />
    );
  }

  return (
    <NavUser
      className="ml-auto!"
      isAuthenticated
      user={user}
      onSignOut={handleSignOut}
    />
  );
}
