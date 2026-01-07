"use client";

import * as React from "react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import type { ReactNode } from "react";
import { useAuth } from "@clerk/nextjs";

import { env } from "~/env";
import { isAuthHostForHost } from "~/lib/host";

// Reuse a single Convex client instance per module load
const embeddedConvexClient = new ConvexReactClient(env.NEXT_PUBLIC_CONVEX_URL);

interface PortalConvexProviderProps {
  children: ReactNode;
}

const CONVEX_TOKEN_STORAGE_KEY = "convex_token";
const TOKEN_UPDATED_EVENT = "convex-token-updated";

/**
 * Lightweight Convex provider wrapper for plugin contexts that need Convex hooks
 * but may be rendered outside the root-level Providers tree.
 */
export function PortalConvexProvider({ children }: PortalConvexProviderProps) {
  const shouldUseClerk = (() => {
    if (typeof window === "undefined") return false;
    return isAuthHostForHost(window.location.host, env.NEXT_PUBLIC_ROOT_DOMAIN);
  })();

  if (shouldUseClerk) {
    return (
      <ConvexProviderWithClerk client={embeddedConvexClient} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    );
  }

  return <PortalConvexProviderTenant>{children}</PortalConvexProviderTenant>;
}

function PortalConvexProviderTenant({ children }: { children: ReactNode }) {
  const [token, setToken] = React.useState<string | null>(null);

  React.useEffect(() => {
    const read = () => {
      try {
        const t = localStorage.getItem(CONVEX_TOKEN_STORAGE_KEY);
        setToken(typeof t === "string" && t.length > 0 ? t : null);
      } catch {
        setToken(null);
      }
    };
    read();

    const handleUpdated = () => read();
    window.addEventListener("storage", handleUpdated);
    window.addEventListener(TOKEN_UPDATED_EVENT, handleUpdated as EventListener);
    return () => {
      window.removeEventListener("storage", handleUpdated);
      window.removeEventListener(
        TOKEN_UPDATED_EVENT,
        handleUpdated as EventListener,
      );
    };
  }, []);

  React.useEffect(() => {
    embeddedConvexClient.setAuth(async () => token);
  }, [token]);

  return <ConvexProvider client={embeddedConvexClient}>{children}</ConvexProvider>;
}
