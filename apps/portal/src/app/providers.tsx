/* eslint-disable react-compiler/react-compiler */
"use client";

import type { TenantSummary } from "@/lib/tenant-fetcher";
// Import Clerk provider and hook
import React from "react";
import { usePathname } from "next/navigation";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { SessionProvider } from "convex-helpers/react/sessions";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useLocalStorage } from "usehooks-ts";

import { SidebarProvider } from "@acme/ui/sidebar";
import { ThemeProvider, ThemeToggle } from "@acme/ui/theme";
import { Toaster } from "@acme/ui/toast";

import { ContentProtectionProvider } from "~/components/access/ContentProtectionProvider";
import { SupportChatWidget } from "~/components/support/SupportChatWidget";
import { TenantProvider } from "~/context/TenantContext";
import { env } from "~/env";
import { PORTAL_TENANT_SUMMARY } from "~/lib/tenant-fetcher";
import { ConvexUserEnsurer } from "./ConvexUserEnsurer";

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
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

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
                  {!isAdminRoute && <SupportChatWidget />}
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
