"use client";

import React from "react";
import { useQuery } from "convex/react";

import type {
  OnboardingGateStatus,
  OnboardingGateStep,
  OnboardingUiTheme,
} from "./OnboardingGateModal";
import { OnboardingGateModal } from "./OnboardingGateModal";

export type OnboardingGateApi = {
  queries: {
    getOnboardingStatus: any;
  };
};

export type OnboardingGateProviderProps = {
  api: OnboardingGateApi;
  statusArgs?: Record<string, unknown> | null;
  fallbackRoute?: string;
  renderContent?: (status: OnboardingGateStatus) => React.ReactNode;
  renderHeader?: (status: OnboardingGateStatus) => React.ReactNode;
  renderStep?: (step: OnboardingGateStep) => React.ReactNode;
  renderFooter?: (status: OnboardingGateStatus) => React.ReactNode;
  customComponent?: (args: {
    status: OnboardingGateStatus;
    fallbackRoute?: string;
    ui?: OnboardingUiTheme;
  }) => React.ReactNode;
  ui?: OnboardingUiTheme;
  children: React.ReactNode;
};

export function OnboardingGateProvider({
  api,
  statusArgs,
  fallbackRoute,
  renderContent,
  renderHeader,
  renderStep,
  renderFooter,
  customComponent,
  ui,
  children,
}: OnboardingGateProviderProps) {
  const args = statusArgs ?? "skip";
  const status = useQuery(api.queries.getOnboardingStatus, args as any) as
    | OnboardingGateStatus
    | undefined;

  React.useEffect(() => {
    if (!status?.shouldBlock) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [status?.shouldBlock]);

  if (!status || !status.shouldBlock) {
    return <>{children}</>;
  }

  if (renderContent) {
    return <>{renderContent(status)}</>;
  }

  return (
    <>
      {children}
      <OnboardingGateModal
        status={status}
        fallbackRoute={fallbackRoute}
        renderHeader={renderHeader}
        renderStep={renderStep}
        renderFooter={renderFooter}
        customComponent={customComponent}
        ui={ui}
      />
    </>
  );
}
