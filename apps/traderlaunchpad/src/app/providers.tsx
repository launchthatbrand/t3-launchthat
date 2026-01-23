"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import {
  OnboardingGateModal,
  OnboardingGateProvider,
} from "launchthat-plugin-onboarding/frontend";

import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { DataModeProvider } from "~/components/dataMode/DataModeProvider";
/* eslint-disable react-compiler/react-compiler */
import React from "react";
import { Suspense } from "react";
import { ActiveAccountProvider } from "~/components/accounts/ActiveAccountProvider";
import { TraderLaunchpadOnboardingDialog } from "~/components/onboarding/TraderLaunchpadOnboardingDialog";
import { api } from "@convex-config/_generated/api";
import { env } from "~/env";
import { usePathname, useSearchParams } from "next/navigation";
import type { TenantSummary } from "~/lib/tenant-fetcher";
import { isAuthHostForHost } from "~/lib/host";
import { HostProvider } from "~/context/HostContext";
import { TenantProvider } from "~/context/TenantContext";
import { useConvexAuth } from "convex/react";
import { ConvexUserEnsurer } from "~/app/ConvexUserEnsurer";

const convexUrl = String(env.NEXT_PUBLIC_CONVEX_URL ?? "");
if (!convexUrl) {
  console.warn(
    "Missing NEXT_PUBLIC_CONVEX_URL; Convex queries will fail until it is set.",
  );
}

// Convex client used on the auth host (Clerk-backed).
const convexClerk = new ConvexReactClient(convexUrl);

interface ProvidersProps {
  children: React.ReactNode;
  tenant: TenantSummary | null;
  host: string;
}

export function Providers({ children, tenant, host }: ProvidersProps) {
  const rootDomain = String(env.NEXT_PUBLIC_ROOT_DOMAIN ?? "traderlaunchpad.com");
  const shouldUseClerk = isAuthHostForHost(host, rootDomain);

  return shouldUseClerk ? (
    <ClerkProvider>
      <ConvexProviderWithClerk client={convexClerk} useAuth={useAuth}>
        <TenantProvider value={tenant}>
          <HostProvider host={host}>
            <ConvexUserEnsurer />
            <DataModeProvider>
              <ActiveAccountProvider>
                <TraderLaunchpadOnboardingGate>{children}</TraderLaunchpadOnboardingGate>
              </ActiveAccountProvider>
            </DataModeProvider>
          </HostProvider>
        </TenantProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  ) : (
    <TenantProvider value={tenant}>
      <HostProvider host={host}>
        <TenantConvexProvider>
          <DataModeProvider>
            <ActiveAccountProvider>
              <TraderLaunchpadOnboardingGate>{children}</TraderLaunchpadOnboardingGate>
            </ActiveAccountProvider>
          </DataModeProvider>
        </TenantConvexProvider>
      </HostProvider>
    </TenantProvider>
  );
}

function TenantConvexProvider({ children }: { children: React.ReactNode }) {
  // Portal parity: tenant domains authenticate Convex via either:
  // - server-minted tokens derived from `tenant_session` (/api/convex-token), OR
  // - Clerk-minted tokens stored in localStorage (`convex_token`) with a hidden-iframe refresh flow.
  const [token, setToken] = React.useState<string | null>(null);
  const [isTokenLoading, setIsTokenLoading] = React.useState(false);
  const pathname = usePathname();

  const CONVEX_TOKEN_STORAGE_KEY = "convex_token";
  const TOKEN_UPDATED_EVENT = "convex-token-updated";

  const readConvexTokenFromLocalStorage = React.useCallback((): string | null => {
    try {
      const raw = localStorage.getItem(CONVEX_TOKEN_STORAGE_KEY);
      const trimmed = typeof raw === "string" ? raw.trim() : "";
      return trimmed.length > 0 ? trimmed : null;
    } catch {
      return null;
    }
  }, []);

  const shouldDisableServerMintedTokensInThisEnv = React.useCallback((): boolean => {
    // Client-safe heuristic:
    // If the app is running on localhost but the Convex deployment is in the cloud,
    // then a localhost JWT issuer cannot be validated by Convex (it can't fetch JWKS).
    if (env.NODE_ENV === "production") return false;
    if (typeof window === "undefined") return false;
    const hostname = window.location.hostname.toLowerCase();
    const isLocalHost =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.endsWith(".localhost") ||
      hostname.endsWith(".127.0.0.1");
    const isCloudConvex = convexUrl.includes(".convex.cloud");
    return isLocalHost && isCloudConvex;
  }, []);

  const parseJwtExpMs = React.useCallback((jwt: string): number | null => {
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
  }, []);

  const tokenFetchInFlightRef = React.useRef<Promise<string | null> | null>(null);
  const lastTokenFetchMsRef = React.useRef<number>(0);
  const disableServerMint = shouldDisableServerMintedTokensInThisEnv();

  const refreshClerkTokenViaIframe = React.useCallback(
    async (returnTo: string): Promise<string | null> => {
      if (typeof window === "undefined") return null;
      if (tokenFetchInFlightRef.current) return await tokenFetchInFlightRef.current;

      const nowMs = Date.now();
      if (nowMs - lastTokenFetchMsRef.current < 2_000) {
        return readConvexTokenFromLocalStorage();
      }
      lastTokenFetchMsRef.current = nowMs;

      tokenFetchInFlightRef.current = (async () => {
        setIsTokenLoading(true);
        try {
          const waitForToken = () =>
            new Promise<string | null>((resolve) => {
              const timeout = window.setTimeout(() => {
                cleanup();
                resolve(readConvexTokenFromLocalStorage());
              }, 12_000);

              const cleanup = () => {
                window.clearTimeout(timeout);
                window.removeEventListener(TOKEN_UPDATED_EVENT, onUpdated);
                window.removeEventListener("storage", onStorage);
              };

              const onUpdated = () => {
                const next = readConvexTokenFromLocalStorage();
                if (next) {
                  cleanup();
                  resolve(next);
                }
              };

              const onStorage = (e: StorageEvent) => {
                if (e.key === CONVEX_TOKEN_STORAGE_KEY) {
                  const next = readConvexTokenFromLocalStorage();
                  if (next) {
                    cleanup();
                    resolve(next);
                  }
                }
              };

              window.addEventListener(TOKEN_UPDATED_EVENT, onUpdated as EventListener);
              window.addEventListener("storage", onStorage);
            });

          const iframe = document.createElement("iframe");
          iframe.style.display = "none";
          iframe.setAttribute("aria-hidden", "true");
          iframe.src = `/api/auth/refresh?return_to=${encodeURIComponent(returnTo)}`;
          document.body.appendChild(iframe);

          const next = await waitForToken();
          try {
            iframe.remove();
          } catch {
            // ignore
          }

          if (next && next !== token) setToken(next);
          return next;
        } finally {
          setIsTokenLoading(false);
          tokenFetchInFlightRef.current = null;
        }
      })();

      return await tokenFetchInFlightRef.current;
    },
    [readConvexTokenFromLocalStorage, token],
  );

  // Re-create the client when auth transitions (anon <-> authed) so websockets don't
  // "stick" in an unauthenticated state.
  const tenantConvex = React.useMemo(() => {
    return new ConvexReactClient(convexUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Boolean(token)]);

  React.useEffect(() => {
    const setFromLocalStorage = () => {
      const next = readConvexTokenFromLocalStorage();
      if (next) setToken(next);
      return next;
    };

    const initial = setFromLocalStorage();

    // Eagerly fetch a server-minted token for admin routes if we don't have a token yet.
    if (!initial && pathname.startsWith("/admin") && !disableServerMint) {
      let cancelled = false;
      const run = async () => {
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
    window.addEventListener(TOKEN_UPDATED_EVENT, handleUpdated as EventListener);
    return () => {
      window.removeEventListener("storage", handleUpdated);
      window.removeEventListener(TOKEN_UPDATED_EVENT, handleUpdated as EventListener);
    };
  }, [disableServerMint, pathname, readConvexTokenFromLocalStorage]);

  const tenantAuth = React.useMemo(() => {
    const shouldForceAuthForAdmin =
      pathname.startsWith("/admin") ||
      pathname.startsWith("/platform") ||
      pathname.startsWith("/journal");

    return {
      isLoading: isTokenLoading,
      // Important: Convex will only call `fetchAccessToken` when `isAuthenticated` is true.
      isAuthenticated: Boolean(token) || shouldForceAuthForAdmin,
      fetchAccessToken: async (args: { forceRefreshToken: boolean }) => {
        // In local dev with a localhost issuer + cloud Convex deployment, server-minted tokens
        // cannot be validated. Fall back to Clerk-minted tokens from localStorage.
        if (disableServerMint) {
          const ls = readConvexTokenFromLocalStorage();
          const expMs = ls ? parseJwtExpMs(ls) : null;
          const msRemaining = expMs ? expMs - Date.now() : null;
          if (!ls || (msRemaining !== null && msRemaining < 120_000)) {
            const returnTo =
              typeof window !== "undefined" ? window.location.href : "/";
            const refreshed = await refreshClerkTokenViaIframe(returnTo);
            return refreshed ?? ls;
          }
          if (ls && ls !== token) setToken(ls);
          return ls;
        }

        // If we already have a token that's still valid, return it.
        if (token) {
          const expMs = parseJwtExpMs(token);
          if (!expMs || expMs - Date.now() > 60_000) {
            return token;
          }
        }

        // De-dupe concurrent fetches + cooldown to avoid storms.
        if (tokenFetchInFlightRef.current) {
          return await tokenFetchInFlightRef.current;
        }
        const nowMs = Date.now();
        if (nowMs - lastTokenFetchMsRef.current < 2_000) {
          return token;
        }
        lastTokenFetchMsRef.current = nowMs;

        try {
          tokenFetchInFlightRef.current = (async () => {
            setIsTokenLoading(true);
            const res = await fetch("/api/convex-token", {
              cache: "no-store",
              credentials: "include",
            });

            if (res.status === 503) {
              const ls = readConvexTokenFromLocalStorage();
              if (ls && ls !== token) setToken(ls);
              return ls ?? token;
            }

            if (res.status === 401 && shouldForceAuthForAdmin) {
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
              if (retryToken && retryToken !== token) setToken(retryToken);
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
            if (next && next !== token) setToken(next);
            return next;
          })();

          // If Convex asks for a "forced refresh" and server-mint isn't disabled,
          // we still allow returning the current token if it's usable (avoid loops).
          if (!args.forceRefreshToken && token) return token;

          return await tokenFetchInFlightRef.current;
        } catch {
          return token;
        } finally {
          tokenFetchInFlightRef.current = null;
          setIsTokenLoading(false);
        }
      },
    };
  }, [
    disableServerMint,
    isTokenLoading,
    parseJwtExpMs,
    pathname,
    readConvexTokenFromLocalStorage,
    refreshClerkTokenViaIframe,
    token,
  ]);

  const useTenantAuth = React.useCallback(() => tenantAuth, [tenantAuth]);

  return (
    <ConvexProviderWithAuth client={tenantConvex} useAuth={useTenantAuth}>
      {children}
    </ConvexProviderWithAuth>
  );
}

function TraderLaunchpadOnboardingGate({
  children,
}: {
  children: React.ReactNode;
}) {
  // Next.js requires a Suspense boundary around any usage of `useSearchParams`
  // in routes that may be statically prerendered (including /_not-found).
  return (
    <Suspense fallback={<>{children}</>}>
      <TraderLaunchpadOnboardingGateInner>{children}</TraderLaunchpadOnboardingGateInner>
    </Suspense>
  );
}

function TraderLaunchpadOnboardingGateInner({
  children,
}: {
  children: React.ReactNode;
}) {
  interface OnboardingGateStep {
    id: string;
    title: string;
    description?: string;
    completed: boolean;
  }

  interface OnboardingGateStatus {
    shouldBlock: boolean;
    enabled: boolean;
    title?: string;
    description?: string;
    ctaLabel?: string;
    ctaRoute?: string;
    steps: OnboardingGateStep[];
  }

  // Auth-agnostic: rely on Convex auth state (Clerk-backed on auth host, tenant-session-backed on tenant hosts).
  const { isAuthenticated: isSignedIn } = useConvexAuth();
  const searchParams = useSearchParams();
  const forceOnboarding = searchParams.get("onboarding") === "1";
  // Example trigger: pretend onboarding is required until "connected" flag is true
  const [connected] = React.useState(false);
  const shouldGate = forceOnboarding || (isSignedIn && !connected);

  // Only fetch onboarding status when we want to enforce gate
  const statusArgs = shouldGate ? {} : null;
  interface OnboardingQueries {
    getOnboardingStatus: unknown;
  }
  const onboardingQueries = (
    api as unknown as { onboarding?: { queries?: OnboardingQueries } }
  ).onboarding?.queries;

  if (!onboardingQueries) {
    return <>{children}</>;
  }

  if (forceOnboarding) {
    const demoSteps: OnboardingGateStep[] = [
      {
        id: "slides",
        title: "Getting started",
        description: "Learn the workflow in 2 minutes.",
        completed: false,
      },
      {
        id: "connect",
        title: "Connect broker",
        description: "Link your TradeLocker account.",
        completed: false,
      },
      {
        id: "sync",
        title: "Sync trades",
        description: "Import your recent trades.",
        completed: false,
      },
    ];
    const demoStatus: OnboardingGateStatus = {
      shouldBlock: true,
      enabled: true,
      title: "Welcome to TraderLaunchpad",
      description: "Let’s set up your journal and sync your trades.",
      ctaLabel: "Continue onboarding",
      ctaRoute: "/admin/onboarding",
      steps: demoSteps,
    };

    return (
      <>
        {children}
        <OnboardingGateModal
          status={demoStatus}
          fallbackRoute="/admin/onboarding"
          customComponent={({ status }: { status: OnboardingGateStatus }) => (
            <TraderLaunchpadOnboardingDialog status={status} />
          )}
          ui={{
            overlayClassName: "backdrop-blur-md bg-slate-950/60",
            cardClassName:
              "border border-slate-800/80 bg-slate-950/90 shadow-[0_24px_80px_rgba(0,0,0,0.4)]",
          }}
        />
      </>
    );
  }

  return (
    <OnboardingGateProvider
      api={{ queries: onboardingQueries }}
      statusArgs={statusArgs}
      fallbackRoute="/admin/onboarding"
      customComponent={({ status }: { status: OnboardingGateStatus }) => (
        <TraderLaunchpadOnboardingDialog status={status} />
      )}
      ui={{
        overlayClassName: "backdrop-blur-md bg-slate-950/60",
        cardClassName:
          "border border-slate-800/80 bg-slate-950/90 shadow-[0_24px_80px_rgba(0,0,0,0.4)]",
      }}
    >
      {children}
    </OnboardingGateProvider>
  );
}
