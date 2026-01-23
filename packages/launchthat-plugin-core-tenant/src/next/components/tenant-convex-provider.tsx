"use client";

import * as React from "react";
import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { usePathname } from "next/navigation";

import { CONVEX_TOKEN_STORAGE_KEY, CONVEX_TOKEN_UPDATED_EVENT } from "../tenant-session";

const readConvexTokenFromLocalStorage = (): string | null => {
  try {
    const raw = localStorage.getItem(CONVEX_TOKEN_STORAGE_KEY);
    const trimmed = typeof raw === "string" ? raw.trim() : "";
    return trimmed.length > 0 ? trimmed : null;
  } catch {
    return null;
  }
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

export function TenantConvexProvider(props: {
  convexUrl: string;
  nodeEnv: string;
  children: React.ReactNode;
  authRefreshPath?: string; // default: /api/auth/refresh
}) {
  const [token, setToken] = React.useState<string | null>(null);
  const [isTokenLoading, setIsTokenLoading] = React.useState(false);
  const pathname = usePathname();
  const authRefreshPath = props.authRefreshPath ?? "/api/auth/refresh";

  const tokenFetchInFlightRef = React.useRef<Promise<string | null> | null>(null);
  const lastTokenFetchMsRef = React.useRef<number>(0);

  const shouldDisableServerMintedTokensInThisEnv = React.useCallback((): boolean => {
    if (props.nodeEnv === "production") return false;
    if (typeof window === "undefined") return false;
    const hostname = window.location.hostname.toLowerCase();
    const isLocalHost =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.endsWith(".localhost") ||
      hostname.endsWith(".127.0.0.1");
    const isCloudConvex = props.convexUrl.includes(".convex.cloud");
    return isLocalHost && isCloudConvex;
  }, [props.convexUrl, props.nodeEnv]);

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
                window.removeEventListener(CONVEX_TOKEN_UPDATED_EVENT, onUpdated);
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

              window.addEventListener(CONVEX_TOKEN_UPDATED_EVENT, onUpdated as EventListener);
              window.addEventListener("storage", onStorage);
            });

          const iframe = document.createElement("iframe");
          iframe.style.display = "none";
          iframe.setAttribute("aria-hidden", "true");
          iframe.src = `${authRefreshPath}?return_to=${encodeURIComponent(returnTo)}`;
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
    [authRefreshPath, token],
  );

  const client = React.useMemo(() => {
    // Re-create when auth transitions to avoid websocket sticking unauthenticated.
    return new ConvexReactClient(props.convexUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Boolean(token), props.convexUrl]);

  React.useEffect(() => {
    const setFromLocalStorage = () => {
      const next = readConvexTokenFromLocalStorage();
      if (next) setToken(next);
      return next;
    };

    const initial = setFromLocalStorage();

    // Eagerly fetch server-minted token for admin routes (matches Portal behavior).
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
    window.addEventListener(CONVEX_TOKEN_UPDATED_EVENT, handleUpdated as EventListener);
    return () => {
      window.removeEventListener("storage", handleUpdated);
      window.removeEventListener(CONVEX_TOKEN_UPDATED_EVENT, handleUpdated as EventListener);
    };
  }, [disableServerMint, pathname]);

  const authImpl = React.useMemo(() => {
    const shouldForceAuthForAdmin =
      pathname.startsWith("/admin") ||
      pathname.startsWith("/platform") ||
      pathname.startsWith("/journal");

    return {
      isLoading: isTokenLoading,
      isAuthenticated: Boolean(token) || shouldForceAuthForAdmin,
      fetchAccessToken: async (args: { forceRefreshToken: boolean }) => {
        if (disableServerMint) {
          const ls = readConvexTokenFromLocalStorage();
          const expMs = ls ? parseJwtExpMs(ls) : null;
          const msRemaining = expMs ? expMs - Date.now() : null;
          if (!ls || (msRemaining !== null && msRemaining < 120_000)) {
            const returnTo = typeof window !== "undefined" ? window.location.href : "/";
            const refreshed = await refreshClerkTokenViaIframe(returnTo);
            return refreshed ?? ls;
          }
          if (ls && ls !== token) setToken(ls);
          return ls;
        }

        if (token) {
          const expMs = parseJwtExpMs(token);
          if (!expMs || expMs - Date.now() > 60_000) return token;
        }

        if (tokenFetchInFlightRef.current) return await tokenFetchInFlightRef.current;

        const nowMs = Date.now();
        if (nowMs - lastTokenFetchMsRef.current < 2_000) return token;
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
  }, [disableServerMint, isTokenLoading, pathname, refreshClerkTokenViaIframe, token]);

  const useAuth = React.useCallback(() => authImpl, [authImpl]);

  return (
    <ConvexProviderWithAuth client={client} useAuth={useAuth}>
      {props.children}
    </ConvexProviderWithAuth>
  );
}

