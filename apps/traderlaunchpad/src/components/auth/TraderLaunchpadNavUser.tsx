"use client";

import * as React from "react";

import { useHostContext } from "~/context/HostContext";
import { useTenant } from "~/context/TenantContext";
import { useClerk, useSession } from "@clerk/nextjs";
import { LogOut, Settings, User } from "lucide-react";
import { isPlatformHost } from "~/lib/host-mode";

import { Button } from "@acme/ui/button";
import { useDataMode } from "~/components/dataMode/DataModeProvider";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

export function TraderLaunchpadNavUser(props: { afterSignOutUrl?: string }) {
  const { isAuthHost, hostname, rootDomain } = useHostContext();
  const shouldUseClerk =
    isAuthHost ||
    isPlatformHost({
      hostOrHostname: hostname,
      rootDomain,
    });

  return shouldUseClerk ? (
    <TraderLaunchpadNavUserClerk afterSignOutUrl={props.afterSignOutUrl} />
  ) : (
    <TraderLaunchpadNavUserTenant />
  );
}

function TraderLaunchpadNavUserClerk(props: { afterSignOutUrl?: string }) {
  const { session } = useSession();
  const { openSignIn, signOut } = useClerk();
  const dataMode = useDataMode();

  if (!session) {
    return (
      <Button
        type="button"
        variant="ghost"
        className="text-gray-200 hover:bg-white/10 hover:text-white"
        onClick={() => void openSignIn({})}
      >
        Sign in
      </Button>
    );
  }

  const name = session.user.fullName ?? session.user.username ?? "User";
  const email = session.user.emailAddresses[0]?.emailAddress ?? "";
  const avatar = session.user.imageUrl;
  const initials = name
    .split(" ")
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white/90 hover:bg-white/10"
        >
          <Avatar className="h-7 w-7 border border-white/10">
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback className="bg-white/10 text-xs text-white/80">
              {initials || "U"}
            </AvatarFallback>
          </Avatar>
          <span className="hidden max-w-40 truncate font-medium sm:inline">
            {name}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="space-y-0.5">
          <div className="truncate text-sm font-medium">{name}</div>
          {email ? (
            <div className="text-muted-foreground truncate text-xs">{email}</div>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            if (typeof window === "undefined") return;
            window.location.assign("/admin/dashboard");
          }}
        >
          <Settings className="h-4 w-4" />
          Dashboard
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            if (typeof window === "undefined") return;
            window.location.assign("/admin/settings");
          }}
        >
          <User className="h-4 w-4" />
          Account settings
        </DropdownMenuItem>
        {dataMode.isSignedIn && dataMode.isAdmin ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={dataMode.dataMode === "demo"}
              onCheckedChange={(checked) => {
                void dataMode.setDataMode(checked ? "demo" : "live");
              }}
            >
              Use demo/mock data
            </DropdownMenuCheckboxItem>
          </>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={async () => {
            await signOut();
            if (props.afterSignOutUrl && typeof window !== "undefined") {
              window.location.assign(props.afterSignOutUrl);
            }
          }}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface TenantSessionUser {
  name?: string;
  email?: string;
  image?: string;
  role?: string;
}

interface TenantMeResponse {
  user: TenantSessionUser | null;
}

function TraderLaunchpadNavUserTenant() {
  const { authHost } = useHostContext();
  const tenant = useTenant();
  const dataMode = useDataMode();

  const [me, setMe] = React.useState<TenantMeResponse | null>(null);
  const [isMeLoading, setIsMeLoading] = React.useState(true);
  const hasLoadedOnceRef = React.useRef(false);
  const inFlightRef = React.useRef(false);
  const lastFetchAtRef = React.useRef(0);

  const TENANT_SESSION_UPDATED_EVENT = "tenant-session-updated";
  const CONVEX_TOKEN_STORAGE_KEY = "convex_token";
  const CONVEX_TOKEN_UPDATED_EVENT = "convex-token-updated";

  const fetchMe = React.useCallback(async () => {
    const now = Date.now();
    if (inFlightRef.current) return;
    if (now - lastFetchAtRef.current < 500) return;
    lastFetchAtRef.current = now;
    inFlightRef.current = true;

    try {
      if (!hasLoadedOnceRef.current) setIsMeLoading(true);

      const res = await fetch("/api/me", {
        method: "GET",
        headers: {
          "content-type": "application/json",
          "cache-control": "no-store",
        },
        cache: "no-store",
      });

      if (!res.ok) {
        setMe({ user: null });
        setIsMeLoading(false);
        hasLoadedOnceRef.current = true;
        return;
      }

      const json: unknown = await res.json();
      if (json && typeof json === "object" && "user" in json) {
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

    safeFetch();

    const handlePageShow = () => safeFetch();
    const handleFocus = () => safeFetch();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") safeFetch();
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
      try {
        localStorage.removeItem(CONVEX_TOKEN_STORAGE_KEY);
        window.dispatchEvent(new Event(CONVEX_TOKEN_UPDATED_EVENT));
        window.dispatchEvent(new Event(TENANT_SESSION_UPDATED_EVENT));
      } catch {
        // ignore
      }

      if (typeof window !== "undefined") {
        const returnTo = window.location.href;
        window.location.assign(
          `${window.location.protocol}//${authHost}/sign-out?return_to=${encodeURIComponent(returnTo)}`,
        );
      }
    }
  }, [authHost]);

  const user = me?.user ?? null;
  const name = user?.name ?? "User";
  const email = user?.email ?? "";
  const avatar = user?.image ?? "";
  const initials = name
    .split(" ")
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
  const isAdmin = user?.role === "admin";

  if (isMeLoading) {
    return (
      <Button
        type="button"
        variant="ghost"
        className="text-gray-200 hover:bg-white/10 hover:text-white opacity-60"
        disabled
      >
        Loading…
      </Button>
    );
  }

  if (!user) {
    return (
      <Button
        type="button"
        variant="ghost"
        className="text-gray-200 hover:bg-white/10 hover:text-white"
        onClick={handleSignIn}
      >
        Sign in
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white/90 hover:bg-white/10"
        >
          <Avatar className="h-7 w-7 border border-white/10">
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback className="bg-white/10 text-xs text-white/80">
              {initials || "U"}
            </AvatarFallback>
          </Avatar>
          <span className="hidden max-w-40 truncate font-medium sm:inline">
            {name}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="space-y-0.5">
          <div className="truncate text-sm font-medium">{name}</div>
          {email ? (
            <div className="text-muted-foreground truncate text-xs">{email}</div>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isAdmin ? (
          <>
            <DropdownMenuItem
              onClick={() => {
                if (typeof window === "undefined") return;
                window.location.assign("/admin/dashboard");
              }}
            >
              <Settings className="h-4 w-4" />
              Dashboard
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                if (typeof window === "undefined") return;
                window.location.assign("/admin/settings");
              }}
            >
              <User className="h-4 w-4" />
              Account settings
            </DropdownMenuItem>
          </>
        ) : null}

        {dataMode.isSignedIn && dataMode.isAdmin ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={dataMode.dataMode === "demo"}
              onCheckedChange={(checked) => {
                void dataMode.setDataMode(checked ? "demo" : "live");
              }}
            >
              Use demo/mock data
            </DropdownMenuCheckboxItem>
          </>
        ) : null}

        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
          <LogOut className="h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

