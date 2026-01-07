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
import { ConvexProviderWithAuth, ConvexReactClient, useQuery } from "convex/react";
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

// Initialize Convex client within the Client Component
const convex = new ConvexReactClient(env.NEXT_PUBLIC_CONVEX_URL);

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

  return (
    shouldUseClerk ? (
      <ClerkProvider publishableKey={env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
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
    )
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

function SupportChatWidgetBridgeAnonymous({
  organizationId,
  tenantName,
  isAdminRoute,
}: SupportChatWidgetBridgeProps) {
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

function TenantConvexProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = React.useState<string | null>(null);
  const [isTokenLoading, setIsTokenLoading] = React.useState(true);

  React.useEffect(() => {
    const read = () => {
      try {
        const t = localStorage.getItem(CONVEX_TOKEN_STORAGE_KEY);
        setToken(typeof t === "string" && t.length > 0 ? t : null);
      } catch {
        setToken(null);
      } finally {
        setIsTokenLoading(false);
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

  const tenantAuth = React.useMemo(() => {
    return {
      isLoading: isTokenLoading,
      isAuthenticated: Boolean(token),
      fetchAccessToken: async (_args: { forceRefreshToken: boolean }) => token,
    };
  }, [isTokenLoading, token]);

  const useTenantAuth = React.useCallback(() => tenantAuth, [tenantAuth]);

  return (
    <ConvexProviderWithAuth client={convex} useAuth={useTenantAuth}>
      {children}
    </ConvexProviderWithAuth>
  );
}
