"use client";

/* eslint-disable react-compiler/react-compiler */
import React from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { api } from "@convex-config/_generated/api";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import {
  OnboardingGateModal,
  OnboardingGateProvider,
} from "launchthat-plugin-onboarding/frontend";

import { DataModeProvider } from "~/components/dataMode/DataModeProvider";
import { TraderLaunchpadOnboardingDialog } from "~/components/onboarding/TraderLaunchpadOnboardingDialog";
import { env } from "~/env";

const convexUrl = String(env.NEXT_PUBLIC_CONVEX_URL ?? "");
if (!convexUrl) {
  console.warn(
    "Missing NEXT_PUBLIC_CONVEX_URL; Convex queries will fail until it is set.",
  );
}

const convex = new ConvexReactClient(convexUrl);

export function Providers(props: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <DataModeProvider>
          <TraderLaunchpadOnboardingGate>
            {props.children}
          </TraderLaunchpadOnboardingGate>
        </DataModeProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
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

  const { isSignedIn } = useAuth();
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
