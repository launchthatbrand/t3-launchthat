/* eslint-disable react-compiler/react-compiler */
"use client";

import type { TenantSummary } from "@/lib/tenant-fetcher";
// Import Clerk provider and hook
import React from "react";
import { usePathname } from "next/navigation";
import { ClerkProvider, useAuth, useUser } from "@clerk/nextjs";
import { SessionProvider } from "convex-helpers/react/sessions";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { SupportChatWidget } from "launchthat-plugin-support";
import { useLocalStorage } from "usehooks-ts";

import { ThemeProvider, ThemeToggle } from "@acme/ui/theme";
import { Toaster } from "@acme/ui/toast";

import { ContentProtectionProvider } from "~/components/access/ContentProtectionProvider";
import { TenantProvider } from "~/context/TenantContext";
import { env } from "~/env";
import { PORTAL_TENANT_ID, PORTAL_TENANT_SUMMARY } from "~/lib/tenant-fetcher";
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
  const isAdminRoute = pathname.startsWith("/admin");
  const chatOrganizationId = isAdminRoute
    ? PORTAL_TENANT_ID
    : effectiveTenant._id;
  const chatTenantName = isAdminRoute
    ? PORTAL_TENANT_SUMMARY.name
    : effectiveTenant.name;

  return (
    // Wrap everything with ClerkProvider - key is now guaranteed to be a string
    <ClerkProvider publishableKey={env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <SessionProvider storageKey="cart-session" useStorage={useLocalStorage}>
          <ContentProtectionProvider>
            <TenantProvider value={effectiveTenant}>
              <ConvexUserEnsurer />
              {/* <GuestCartMerger /> */}
              <ThemeProvider>
                {children}
                {chatOrganizationId ? (
                  <SupportChatWidgetBridge
                    organizationId={chatOrganizationId}
                    tenantName={chatTenantName}
                    isAdminRoute={isAdminRoute}
                  />
                ) : null}
                <div className="fixed right-4 bottom-20">
                  <ThemeToggle />
                </div>
                <Toaster />
              </ThemeProvider>
            </TenantProvider>
          </ContentProtectionProvider>
        </SessionProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}

interface SupportChatWidgetBridgeProps {
  organizationId: string;
  tenantName: string;
  isAdminRoute: boolean;
}

function SupportChatWidgetBridge({
  organizationId,
  tenantName,
  isAdminRoute,
}: SupportChatWidgetBridgeProps) {
  const { user } = useUser();

  const defaultContact =
    isAdminRoute && user
      ? {
          contactId: user.id,
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
      defaultContact={defaultContact}
    />
  );
}
