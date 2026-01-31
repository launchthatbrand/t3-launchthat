"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import {
  OnboardingGateModal,
  OnboardingGateProvider,
} from "launchthat-plugin-onboarding/frontend";

import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { DataModeProvider } from "~/components/dataMode/DataModeProvider";
/* eslint-disable react-compiler/react-compiler */
import React from "react";
import { Suspense } from "react";
import { ActiveAccountProvider } from "~/components/accounts/ActiveAccountProvider";
import { TraderLaunchpadOnboardingDialog } from "~/components/onboarding/TraderLaunchpadOnboardingDialog";
import { api } from "@convex-config/_generated/api";
import { env } from "~/env";
import { useSearchParams } from "next/navigation";
import type { TenantSummary } from "~/lib/tenant-fetcher";
import { isAuthHostForHost } from "~/lib/host";
import { HostProvider } from "~/context/HostContext";
import { TenantProvider } from "~/context/TenantContext";
import { useConvexAuth } from "convex/react";
import { ConvexUserEnsurer } from "~/app/ConvexUserEnsurer";
import { AffiliateSponsorOptInDialog } from "~/components/affiliates/AffiliateSponsorOptInDialog";
import { DiscordJoinDialog } from "~/components/discord/DiscordJoinDialog";
import { TenantConvexProvider } from "launchthat-plugin-core-tenant/next/components/tenant-convex-provider";
import { PushNotificationsClient } from "~/components/pwa/PushNotificationsClient";
import { JoinCodeProvider } from "~/components/join/JoinCodeProvider";

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

  return (
    shouldUseClerk ? (
      <ClerkProvider>
        <ConvexProviderWithClerk client={convexClerk} useAuth={useAuth}>
          <TenantProvider value={tenant}>
            <HostProvider host={host}>
              <ConvexUserEnsurer />
              <AffiliateSponsorOptInDialog />
              <DiscordJoinDialog />
              <JoinCodeProvider>
                <PushNotificationsClient />
                <DataModeProvider>
                  <ActiveAccountProvider>
                    <TraderLaunchpadOnboardingGate>{children}</TraderLaunchpadOnboardingGate>
                  </ActiveAccountProvider>
                </DataModeProvider>
              </JoinCodeProvider>
            </HostProvider>
          </TenantProvider>
        </ConvexProviderWithClerk>
      </ClerkProvider>
    ) : (
      <TenantProvider value={tenant}>
        <HostProvider host={host}>
          <TenantConvexProvider convexUrl={convexUrl} nodeEnv={env.NODE_ENV}>
            {process.env.NODE_ENV !== "production" ? <DevClerkGuard /> : null}
            <AffiliateSponsorOptInDialog />
            <DiscordJoinDialog />
            <JoinCodeProvider>
              <PushNotificationsClient />
              <DataModeProvider>
                <ActiveAccountProvider>
                  <TraderLaunchpadOnboardingGate>{children}</TraderLaunchpadOnboardingGate>
                </ActiveAccountProvider>
              </DataModeProvider>
            </JoinCodeProvider>
          </TenantConvexProvider>
        </HostProvider>
      </TenantProvider>
    )
  );
}

function DevClerkGuard() {
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if ((window as { Clerk?: unknown }).Clerk) {
      console.warn(
        "Clerk loaded on a non-auth host. UI components should not depend on Clerk here.",
      );
    }
  }, []);

  return null;
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
