/* eslint-disable react-compiler/react-compiler */
"use client";

import "~/lib/plugins/registerPaymentMethods.client";
import "~/lib/plugins/registerPermalinkResolvers.client";

import type { TenantSummary } from "@/lib/tenant-fetcher";
// Import Clerk provider and hook
import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { ClerkProvider, useAuth, useUser } from "@clerk/nextjs";
import { SessionProvider } from "convex-helpers/react/sessions";
import {
  ConvexProviderWithAuth,
  ConvexReactClient,
  useQuery,
} from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { SupportChatWidget } from "launchthat-plugin-support";
import { useLocalStorage } from "usehooks-ts";

import { ThemeProvider } from "@acme/ui/theme";
import { Toaster } from "@acme/ui/toast";

import { ContentProtectionProvider } from "~/components/access/ContentProtectionProvider";
import { HostProvider } from "~/context/HostContext";
import { TenantProvider } from "~/context/TenantContext";
import { env } from "~/env";
import { isAuthHostForHost } from "~/lib/host";
import { PORTAL_TENANT_ID, PORTAL_TENANT_SUMMARY } from "~/lib/tenant-fetcher";
import { ConvexUserEnsurer } from "./ConvexUserEnsurer";

// Import the correct Convex provider for Clerk integration

// Convex client used on the auth host (Clerk-backed).
const convexClerk = new ConvexReactClient(env.NEXT_PUBLIC_CONVEX_URL);

interface ProvidersProps {
  children: React.ReactNode;
  tenant: TenantSummary | null;
  host: string;
}

export function Providers({ children, tenant, host }: ProvidersProps) {
  const effectiveTenant = tenant ?? PORTAL_TENANT_SUMMARY;
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");
  const chatOrganizationId = isAdminRoute
    ? PORTAL_TENANT_ID
    : effectiveTenant._id;
  const chatTenantName = isAdminRoute
    ? PORTAL_TENANT_SUMMARY.name
    : effectiveTenant.name;
  const shouldUseClerk = isAuthHostForHost(host, env.NEXT_PUBLIC_ROOT_DOMAIN);

  // Ensure Clerk key exists, otherwise ClerkProvider will error
  if (shouldUseClerk && !env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    throw new Error("Missing Clerk Publishable Key");
  }

  return shouldUseClerk ? (
    <ClerkProvider publishableKey={env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      <ConvexProviderWithClerk client={convexClerk} useAuth={useAuth}>
        <SessionProvider storageKey="cart-session" useStorage={useLocalStorage}>
          <ContentProtectionProvider>
            <TenantProvider value={effectiveTenant}>
              <HostProvider host={host}>
                <ConvexUserEnsurer />
                {/* <GuestCartMerger /> */}

                <ThemeProvider>
                  {children}
                  {chatOrganizationId ? (
                    <SupportChatWidgetBridgeWithClerk
                      organizationId={chatOrganizationId}
                      tenantName={chatTenantName}
                      isAdminRoute={isAdminRoute}
                    />
                  ) : null}
                  <Toaster />
                </ThemeProvider>
              </HostProvider>
            </TenantProvider>
          </ContentProtectionProvider>
        </SessionProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  ) : (
    <TenantConvexProvider>
      <SessionProvider storageKey="cart-session" useStorage={useLocalStorage}>
        <ContentProtectionProvider>
          <TenantProvider value={effectiveTenant}>
            <HostProvider host={host}>
              <ThemeProvider>
                {children}
                {chatOrganizationId ? (
                  <SupportChatWidgetBridgeAnonymous
                    organizationId={chatOrganizationId}
                    tenantName={chatTenantName}
                    isAdminRoute={isAdminRoute}
                  />
                ) : null}
                <Toaster />
              </ThemeProvider>
            </HostProvider>
          </TenantProvider>
        </ContentProtectionProvider>
      </SessionProvider>
    </TenantConvexProvider>
  );
}

interface SupportChatWidgetBridgeProps {
  organizationId: string;
  tenantName: string;
  isAdminRoute: boolean;
}

function SupportChatWidgetBridgeWithClerk({
  organizationId,
  tenantName,
  isAdminRoute,
}: SupportChatWidgetBridgeProps) {
  const { user } = useUser();
  // `api.plugins.support` is provided by a plugin package and isn't always present in the typed API.
  // We avoid importing plugin APIs directly in this file to prevent TS instantiation-depth issues.
  const getSupportOption = (() => {
    const apiLoose = api as unknown as Record<string, unknown>;
    const plugins = apiLoose["plugins"] as Record<string, unknown> | undefined;
    const support = plugins?.["support"] as Record<string, unknown> | undefined;
    const options = support?.["options"] as Record<string, unknown> | undefined;
    return (options?.["getSupportOption"] as unknown) ?? null;
  })();

  const widgetKeyRaw = useQuery(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
    getSupportOption as any,
    getSupportOption
      ? ({
          organizationId,
          key: "supportWidgetKey",
        } as const)
      : ("skip" as const),
  ) as unknown;
  const widgetKey = typeof widgetKeyRaw === "string" ? widgetKeyRaw : null;

  useEffect(() => {
    if (env.NODE_ENV === "production") return;
    const rawType = widgetKeyRaw === null ? "null" : typeof widgetKeyRaw;
    const widgetKeyPreview =
      typeof widgetKey === "string" && widgetKey.length > 8
        ? `${widgetKey.slice(0, 4)}…${widgetKey.slice(-4)}`
        : widgetKey;
    console.info(
      "[support-chat] widget bridge",
      JSON.stringify({
        organizationId,
        tenantName,
        isAdminRoute,
        widgetKeyRawType: rawType,
        widgetKeyPresent: Boolean(widgetKey),
        widgetKeyPreview,
      }),
    );
    if (!widgetKey) {
      console.warn(
        "[support-chat] missing supportWidgetKey for organization; chat send will be disabled until configured",
      );
    }
  }, [organizationId, tenantName, isAdminRoute, widgetKey, widgetKeyRaw]);

  const defaultContact = user
    ? {
        contactId: `clerk:${user.id}`,
        fullName:
          user.fullName ??
          user.username ??
          user.primaryEmailAddress?.emailAddress ??
          undefined,
        email: user.primaryEmailAddress?.emailAddress ?? undefined,
      }
    : null;

  return (
    <SupportChatWidget
      organizationId={organizationId}
      tenantName={tenantName}
      widgetKey={widgetKey}
      defaultContact={defaultContact}
      bubbleVariant="flush-right-square"
    />
  );
}

function SupportChatWidgetBridgeAnonymous({
  organizationId,
  tenantName,
  isAdminRoute,
}: SupportChatWidgetBridgeProps) {
  // `api.plugins.support` is provided by a plugin package and isn't always present in the typed API.
  // We intentionally fall back to `any` here, but keep the variable itself typed to avoid TS
  // "excessively deep instantiation" issues in some builds.
  const getSupportOption = (() => {
    const apiLoose = api as unknown as Record<string, unknown>;
    const plugins = apiLoose["plugins"] as Record<string, unknown> | undefined;
    const support = plugins?.["support"] as Record<string, unknown> | undefined;
    const options = support?.["options"] as Record<string, unknown> | undefined;
    return (options?.["getSupportOption"] as unknown) ?? null;
  })();

  const widgetKeyRaw = useQuery(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
    getSupportOption as any,
    getSupportOption
      ? ({
          organizationId,
          key: "supportWidgetKey",
        } as const)
      : ("skip" as const),
  ) as unknown;
  const widgetKey = typeof widgetKeyRaw === "string" ? widgetKeyRaw : null;

  useEffect(() => {
    if (env.NODE_ENV === "production") return;
    const rawType = widgetKeyRaw === null ? "null" : typeof widgetKeyRaw;
    const widgetKeyPreview =
      typeof widgetKey === "string" && widgetKey.length > 8
        ? `${widgetKey.slice(0, 4)}…${widgetKey.slice(-4)}`
        : widgetKey;
    console.info(
      "[support-chat] widget bridge (anonymous)",
      JSON.stringify({
        organizationId,
        tenantName,
        isAdminRoute,
        widgetKeyRawType: rawType,
        widgetKeyPresent: Boolean(widgetKey),
        widgetKeyPreview,
      }),
    );
  }, [organizationId, tenantName, isAdminRoute, widgetKey, widgetKeyRaw]);

  return (
    <SupportChatWidget
      organizationId={organizationId}
      tenantName={tenantName}
      widgetKey={widgetKey}
      defaultContact={null}
      bubbleVariant="flush-right-square"
    />
  );
}

const CONVEX_TOKEN_STORAGE_KEY = "convex_token";
const TOKEN_UPDATED_EVENT = "convex-token-updated";

const readConvexTokenFromLocalStorage = (): string | null => {
  try {
    const raw = localStorage.getItem(CONVEX_TOKEN_STORAGE_KEY);
    const trimmed = typeof raw === "string" ? raw.trim() : "";
    return trimmed.length > 0 ? trimmed : null;
  } catch {
    return null;
  }
};

const shouldDisableServerMintedTokensInThisEnv = (): boolean => {
  // Client-safe heuristic:
  // If the app is running on localhost but the Convex deployment is in the cloud,
  // then a localhost JWT issuer cannot be validated by Convex (it can't fetch JWKS).
  // In that setup, we should skip `/api/convex-token` entirely and fall back to the
  // Clerk-minted Convex token from localStorage.
  if (env.NODE_ENV === "production") return false;
  if (typeof window === "undefined") return false;
  const hostname = window.location.hostname.toLowerCase();
  const isLocalHost =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".127.0.0.1");
  const isCloudConvex = env.NEXT_PUBLIC_CONVEX_URL.includes(".convex.cloud");
  return isLocalHost && isCloudConvex;
};

const parseJwtExpMs = (jwt: string): number | null => {
  const parts = jwt.split(".");
  if (parts.length < 2) return null;
  const payload = parts[1] ?? "";
  const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  try {
    const json = atob(padded);
    const data = JSON.parse(json) as { exp?: unknown };
    const exp = typeof data.exp === "number" ? data.exp : null;
    return exp ? exp * 1000 : null;
  } catch {
    return null;
  }
};

const parseJwtClaims = (
  jwt: string,
): {
  iss: string | null;
  aud: string | string[] | null;
  sub: string | null;
} => {
  const parts = jwt.split(".");
  if (parts.length < 2) return { iss: null, aud: null, sub: null };
  const payload = parts[1] ?? "";
  const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  try {
    const json = atob(padded);
    const data = JSON.parse(json) as {
      iss?: unknown;
      aud?: unknown;
      sub?: unknown;
    };
    const iss = typeof data.iss === "string" ? data.iss : null;
    const sub = typeof data.sub === "string" ? data.sub : null;
    const aud =
      typeof data.aud === "string"
        ? data.aud
        : Array.isArray(data.aud) &&
            data.aud.every((v) => typeof v === "string")
          ? data.aud
          : null;
    return { iss, aud, sub };
  } catch {
    return { iss: null, aud: null, sub: null };
  }
};

function TenantConvexProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = React.useState<string | null>(null);
  const [isTokenLoading, setIsTokenLoading] = React.useState(false);
  const pathname = usePathname();
  const disableServerMint = shouldDisableServerMintedTokensInThisEnv();

  // Always mount a tenant Convex client so logged-out pages can render.
  // Re-create the client when auth transitions (anon <-> authed) so websockets
  // don't "stick" in an unauthenticated state.
  const tenantConvex = React.useMemo(() => {
    return new ConvexReactClient(env.NEXT_PUBLIC_CONVEX_URL);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Boolean(token)]);

  // Transitional fallback: if a Clerk-minted Convex token exists in localStorage
  // (from the auth host redirect flow), use it. This will be removed once
  // server-minted tokens are fully rolled out everywhere.
  React.useEffect(() => {
    const readFromLocalStorage = (): string | null => {
      try {
        const t = localStorage.getItem(CONVEX_TOKEN_STORAGE_KEY);
        return typeof t === "string" && t.trim() ? t.trim() : null;
      } catch {
        return null;
      }
    };
    const setFromLocalStorage = () => {
      const next = readFromLocalStorage();
      if (next) setToken(next);
      return next;
    };

    // First preference: any Clerk-minted token already in localStorage.
    const initial = setFromLocalStorage();

    // If we're on an admin route and there's no localStorage token yet, eagerly fetch a
    // server-minted token derived from the tenant_session cookie.
    // This avoids admin tables appearing empty on first load.
    if (!initial && pathname.startsWith("/admin") && !disableServerMint) {
      let cancelled = false;
      const run = async () => {
        // Retry a few times because right after login the tenant_session cookie can be
        // in-flight while the browser navigates across origins.
        const maxAttempts = 6;
        let attempt = 0;
        while (!cancelled && attempt < maxAttempts) {
          attempt += 1;
          try {
            setIsTokenLoading(true);
            const res = await fetch("/api/convex-token", {
              cache: "no-store",
              credentials: "include",
            });
            if (res.status === 401) {
              // Likely cookie not committed yet — backoff and retry.
              await new Promise((r) => setTimeout(r, 150 * attempt));
              continue;
            }
            if (!res.ok) {
              setToken(null);
              return;
            }
            const body = (await res.json()) as { token?: unknown };
            const next =
              typeof body.token === "string" && body.token.trim()
                ? body.token.trim()
                : null;
            setToken(next);
            return;
          } catch {
            await new Promise((r) => setTimeout(r, 150 * attempt));
          } finally {
            setIsTokenLoading(false);
          }
        }
      };
      void run();
      return () => {
        cancelled = true;
      };
    }

    const handleUpdated = () => {
      void setFromLocalStorage();
    };
    window.addEventListener("storage", handleUpdated);
    window.addEventListener(
      TOKEN_UPDATED_EVENT,
      handleUpdated as EventListener,
    );
    return () => {
      window.removeEventListener("storage", handleUpdated);
      window.removeEventListener(
        TOKEN_UPDATED_EVENT,
        handleUpdated as EventListener,
      );
    };
  }, [disableServerMint, pathname]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (env.NODE_ENV === "production") return;
    if (isTokenLoading) return;
    if (!token) {
      console.info("[tenant-auth] convex_token:missing");
      return;
    }
    const expMs = parseJwtExpMs(token);
    const claims = parseJwtClaims(token);
    console.info(
      "[tenant-auth] convex_token:present",
      JSON.stringify({
        convexUrl: env.NEXT_PUBLIC_CONVEX_URL,
        expMs,
        expInSec: expMs ? Math.round((expMs - Date.now()) / 1000) : null,
        iss: claims.iss,
        aud: claims.aud,
        sub: claims.sub ? `${claims.sub.slice(0, 10)}…` : null,
      }),
    );
  }, [isTokenLoading, token]);

  const tenantAuth = React.useMemo(() => {
    const shouldForceAuthForAdmin = pathname.startsWith("/admin");
    return {
      isLoading: isTokenLoading,
      // Important: Convex will only call `fetchAccessToken` when `isAuthenticated` is true.
      // On tenant domains we mint tokens from `tenant_session` via `/api/convex-token`, but
      // the token isn't always available on the very first render (and we don't want to
      // rely on localStorage timing). Admin routes are already server-gated by the
      // `tenant_session` cookie in middleware, so it's safe to treat them as authenticated
      // and allow Convex to fetch the token immediately.
      isAuthenticated: Boolean(token) || shouldForceAuthForAdmin,
      fetchAccessToken: async (args: { forceRefreshToken: boolean }) => {
        if (env.NODE_ENV !== "production") {
          console.info(
            "[tenant-auth] fetchAccessToken",
            JSON.stringify({
              forceRefreshToken: args.forceRefreshToken,
              tokenPresent: Boolean(token),
            }),
          );
        }

        // In local dev with a localhost issuer + cloud Convex deployment, server-minted tokens
        // cannot be validated. Immediately fall back to Clerk-minted tokens from localStorage.
        if (disableServerMint) {
          const ls = readConvexTokenFromLocalStorage();
          if (ls && ls !== token) setToken(ls);
          return ls;
        }

        // Prefer server-minted tokens derived from the tenant session cookie.
        // This is same-origin and avoids redirect loops.
        if (!args.forceRefreshToken && token) {
          const expMs = parseJwtExpMs(token);
          if (!expMs || expMs - Date.now() > 30_000) {
            return token;
          }
        }

        try {
          setIsTokenLoading(true);
          const res = await fetch("/api/convex-token", {
            cache: "no-store",
            credentials: "include",
          });
          if (res.status === 503) {
            // Not configured (or intentionally disabled in local dev). Fall back to any
            // Clerk-minted Convex token stored in localStorage.
            const ls = readConvexTokenFromLocalStorage();
            if (ls && ls !== token) setToken(ls);
            return ls ?? token;
          }
          if (res.status === 401 && shouldForceAuthForAdmin) {
            // Immediately after login, the tenant_session cookie can lag slightly.
            // Retry once before giving up to avoid "empty admin tables until refresh".
            await new Promise((r) => setTimeout(r, 250));
            const retry = await fetch("/api/convex-token", {
              cache: "no-store",
              credentials: "include",
            });
            if (!retry.ok) {
              setToken(null);
              return null;
            }
            if (retry.status === 503) {
              const ls = readConvexTokenFromLocalStorage();
              if (ls && ls !== token) setToken(ls);
              return ls ?? token;
            }
            const retryBody = (await retry.json()) as { token?: unknown };
            const retryToken =
              typeof retryBody.token === "string" && retryBody.token.trim()
                ? retryBody.token.trim()
                : null;
            setToken(retryToken);
            return retryToken;
          }
          if (!res.ok) {
            setToken(null);
            return null;
          }
          const body = (await res.json()) as { token?: unknown };
          const next =
            typeof body.token === "string" && body.token.trim()
              ? body.token.trim()
              : null;
          setToken(next);
          return next;
        } catch {
          // Last resort: do not redirect; return whatever we have.
          return token;
        } finally {
          setIsTokenLoading(false);
        }
      },
    };
  }, [disableServerMint, isTokenLoading, pathname, token]);

  const useTenantAuth = React.useCallback(() => tenantAuth, [tenantAuth]);

  return (
    <ConvexProviderWithAuth client={tenantConvex} useAuth={useTenantAuth}>
      {children}
    </ConvexProviderWithAuth>
  );
}
