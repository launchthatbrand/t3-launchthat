/* eslint-disable react-compiler/react-compiler */
"use client";

import { ClerkProvider, useAuth, useUser } from "@clerk/nextjs";
import { PORTAL_TENANT_ID, PORTAL_TENANT_SUMMARY } from "~/lib/tenant-fetcher";
import { ThemeProvider, ThemeToggle } from "@acme/ui/theme";

import { ContentProtectionProvider } from "~/components/access/ContentProtectionProvider";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { ConvexUserEnsurer } from "./ConvexUserEnsurer";
// Import Clerk provider and hook
import React from "react";
import { SessionProvider } from "convex-helpers/react/sessions";
import { SupportChatWidget } from "launchthat-plugin-support";
import { TenantProvider } from "~/context/TenantContext";
import type { TenantSummary } from "@/lib/tenant-fetcher";
import { Toaster } from "@acme/ui/toast";
import { env } from "~/env";
import { useLocalStorage } from "usehooks-ts";
import { usePathname } from "next/navigation";

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
                <div className="absolute right-4 bottom-4">
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
