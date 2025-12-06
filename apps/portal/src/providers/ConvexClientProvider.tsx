"use client";

import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import type { ReactNode } from "react";
import { env } from "~/env";
import { useAuth } from "@clerk/nextjs";

// Reuse a single Convex client instance per module load
const embeddedConvexClient = new ConvexReactClient(env.NEXT_PUBLIC_CONVEX_URL);

interface PortalConvexProviderProps {
  children: ReactNode;
}

/**
 * Lightweight Convex provider wrapper for plugin contexts that need Convex hooks
 * but may be rendered outside the root-level Providers tree.
 */
export function PortalConvexProvider({ children }: PortalConvexProviderProps) {
  return (
    <ConvexProviderWithClerk client={embeddedConvexClient} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}
