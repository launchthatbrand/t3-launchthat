/* eslint-disable react-compiler/react-compiler */
"use client";

import "~/lib/plugins/registerPaymentMethods.client";

import type { TenantSummary } from "@/lib/tenant-fetcher";
// Import Clerk provider and hook
import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { ClerkProvider, useAuth, useUser } from "@clerk/nextjs";
import { SessionProvider } from "convex-helpers/react/sessions";
import { ConvexReactClient, useQuery } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { SupportChatWidget } from "launchthat-plugin-support";
import { useLocalStorage } from "usehooks-ts";

import { ThemeProvider } from "@acme/ui/theme";
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
  const widgetKeyRaw = useQuery(api.plugins.support.options.getSupportOption, {
    organizationId,
    key: "supportWidgetKey",
  });
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
