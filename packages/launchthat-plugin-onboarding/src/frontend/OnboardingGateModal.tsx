"use client";

import React from "react";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

export type OnboardingGateStep = {
  id: string;
  title: string;
  description?: string;
  route?: string;
  completed: boolean;
};

export type OnboardingGateStatus = {
  shouldBlock: boolean;
  enabled: boolean;
  title?: string;
  description?: string;
  ctaLabel?: string;
  ctaRoute?: string;
  steps: OnboardingGateStep[];
};

export type OnboardingGateModalProps = {
  status: OnboardingGateStatus;
  fallbackRoute?: string;
  renderHeader?: (status: OnboardingGateStatus) => React.ReactNode;
  renderStep?: (step: OnboardingGateStep) => React.ReactNode;
  renderFooter?: (status: OnboardingGateStatus) => React.ReactNode;
  customComponent?: (args: {
    status: OnboardingGateStatus;
    fallbackRoute?: string;
    ui?: OnboardingUiTheme;
  }) => React.ReactNode;
  ui?: OnboardingUiTheme;
};

export type OnboardingUiTheme = {
  overlayClassName?: string;
  cardClassName?: string;
  headerClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  stepsClassName?: string;
  stepClassName?: string;
  stepIndicatorClassName?: string;
  stepTitleClassName?: string;
  stepDescriptionClassName?: string;
  footerClassName?: string;
  ctaButtonClassName?: string;
  ctaLinkClassName?: string;
};

export function OnboardingGateModal({
  status,
  fallbackRoute,
  renderHeader,
  renderStep,
  renderFooter,
  customComponent,
  ui,
}: OnboardingGateModalProps) {
  const ctaLabel = status.ctaLabel ?? "Continue onboarding";
  const ctaRoute = status.ctaRoute ?? fallbackRoute ?? "/onboarding";
  const steps = status.steps ?? [];

  return (
    <div
      className={`bg-background/80 fixed inset-0 z-[60] flex items-center justify-center p-6 backdrop-blur ${
        ui?.overlayClassName ?? ""
      }`}
    >
      {customComponent ? (
        customComponent({ status, fallbackRoute, ui })
      ) : (
        <Card
          className={`border-border/60 bg-card/95 w-full max-w-xl shadow-xl ${
            ui?.cardClassName ?? ""
          }`}
        >
          <CardHeader className={ui?.headerClassName}>
            {renderHeader ? (
              renderHeader(status)
            ) : (
              <CardTitle
                className={`text-foreground text-2xl font-semibold ${
                  ui?.titleClassName ?? ""
                }`}
              >
                {status.title ?? "Finish onboarding"}
              </CardTitle>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <p
              className={`text-muted-foreground text-sm ${
                ui?.descriptionClassName ?? ""
              }`}
            >
              {status.description ??
                "Complete the steps below before continuing."}
            </p>
            <div className={`space-y-3 ${ui?.stepsClassName ?? ""}`}>
              {steps.map((step) => (
                <div key={step.id}>
                  {renderStep ? (
                    renderStep(step)
                  ) : (
                    <div
                      className={`border-border/60 bg-background/60 flex items-start gap-3 rounded-lg border p-3 ${
                        ui?.stepClassName ?? ""
                      }`}
                    >
                      <div
                        className={`${
                          step.completed
                            ? "mt-1 h-2.5 w-2.5 rounded-full bg-emerald-500"
                            : "bg-muted-foreground/40 mt-1 h-2.5 w-2.5 rounded-full"
                        } ${ui?.stepIndicatorClassName ?? ""}`}
                      />
                      <div>
                        <p
                          className={`text-foreground text-sm font-medium ${
                            ui?.stepTitleClassName ?? ""
                          }`}
                        >
                          {step.title}
                        </p>
                        {step.description ? (
                          <p
                            className={`text-muted-foreground text-xs ${
                              ui?.stepDescriptionClassName ?? ""
                            }`}
                          >
                            {step.description}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {renderFooter ? (
              renderFooter(status)
            ) : (
              <div className={`flex justify-end ${ui?.footerClassName ?? ""}`}>
                <Button className={ui?.ctaButtonClassName} asChild>
                  <a className={ui?.ctaLinkClassName} href={ctaRoute}>
                    {ctaLabel}
                  </a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
