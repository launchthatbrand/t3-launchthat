/* eslint-disable react-compiler/react-compiler */
"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ThemeProvider, ThemeToggle } from "@acme/ui/theme";

import { ContentProtectionProvider } from "~/components/access/ContentProtectionProvider";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { ConvexUserEnsurer } from "./ConvexUserEnsurer";
import { PORTAL_TENANT_SUMMARY } from "~/lib/tenant-fetcher";
// Import Clerk provider and hook
import React from "react";
import { SessionProvider } from "convex-helpers/react/sessions";
import { SidebarProvider } from "@acme/ui/sidebar";
import { TenantProvider } from "~/context/TenantContext";
import type { TenantSummary } from "@/lib/tenant-fetcher";
import { Toaster } from "@acme/ui/toast";
import { env } from "~/env";
import { useLocalStorage } from "usehooks-ts";

// Import the correct Convex provider for Clerk integration

// Ensure Clerk key exists, otherwise ClerkProvider will error
if (!env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key");
}

// Initialize Convex client within the Client Component
const convex = new ConvexReactClient(env.NEXT_PUBLIC_CONVEX_URL);

interface ProvidersProps {
  children: React.ReactNode;
  tenant: TenantSummary | null;
}

export function Providers({ children, tenant }: ProvidersProps) {
  const effectiveTenant = tenant ?? PORTAL_TENANT_SUMMARY;
  return (
    // Wrap everything with ClerkProvider - key is now guaranteed to be a string
    <ClerkProvider publishableKey={env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <SessionProvider storageKey="cart-session" useStorage={useLocalStorage}>
          <ContentProtectionProvider>
            <TenantProvider value={effectiveTenant}>
              <SidebarProvider>
                <ConvexUserEnsurer />
                {/* <GuestCartMerger /> */}
                <ThemeProvider
                  attribute="class"
                  defaultTheme="system"
                  enableSystem
                >
                  {children}
                  <div className="absolute bottom-4 right-4">
                    <ThemeToggle />
                  </div>
                  <Toaster />
                </ThemeProvider>
              </SidebarProvider>
            </TenantProvider>
          </ContentProtectionProvider>
        </SessionProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
