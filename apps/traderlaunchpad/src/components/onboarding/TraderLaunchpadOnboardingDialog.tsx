"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card } from "@acme/ui/card";
import Carousel from "@acme/ui/components/ui/carousel";
import { Skeleton } from "@acme/ui/skeleton";

import { TradeLockerConnectionCard } from "~/components/settings/TradeLockerConnectionCard";
import { useOnboardingStatus } from "~/lib/onboarding/getOnboardingStatus";

export interface OnboardingGateStep {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
}

export interface OnboardingGateStatus {
  title?: string;
  description?: string;
  steps: OnboardingGateStep[];
}

const onboardingSlides = [
  {
    title: "Trade with clarity",
    button: "Track your edge",
    src: "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Review every session",
    button: "Build TradeIdeas",
    src: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Share outcomes fast",
    button: "Sync to Discord",
    src: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80",
  },
];

export function TraderLaunchpadOnboardingDialog({
  status,
}: {
  status: OnboardingGateStatus;
}) {
  const rawOnboardingStatus = useOnboardingStatus() as unknown;
  const connectedOk = Boolean(
    (rawOnboardingStatus as { connectedOk?: boolean }).connectedOk,
  );
  const isLoading = Boolean(
    (rawOnboardingStatus as { isLoading?: boolean }).isLoading,
  );
  const [activeStep, setActiveStep] = React.useState<string | null>(null);
  const [showExitPrompt, setShowExitPrompt] = React.useState(false);
  const [completedSteps, setCompletedSteps] = React.useState<
    Record<string, boolean>
  >({});

  const steps = status.steps
    .filter((step) => step.id === "connect")
    .map((step) => ({
      ...step,
      completed: completedSteps[step.id] ?? connectedOk,
    }));
  const allStepsComplete = steps.every((step) => step.completed);

  const handleCompleteStep = (stepId: string) => {
    setCompletedSteps((prev) => ({ ...prev, [stepId]: true }));
    setActiveStep(null);
  };

  const renderStepContent = (stepId: string) => {
    if (stepId === "connect") {
      return (
        <div className="space-y-4">
          <div className="text-foreground text-lg font-semibold">
            Connect broker
          </div>
          <p className="text-muted-foreground text-sm">
            Link your TradeLocker account to sync trades automatically.
          </p>
          <TradeLockerConnectionCard />
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => handleCompleteStep(stepId)}
              disabled={connectedOk}
            >
              {connectedOk ? "Broker connected" : "I connected my broker"}
            </Button>
            <Button variant="outline" onClick={() => setActiveStep(null)}>
              Back
            </Button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <Card className="border-border/60 bg-card/95 w-full max-w-2xl shadow-xl">
      <div className="border-border/60 border-b p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-foreground text-2xl font-semibold">
              {status.title ?? "Welcome to TraderLaunchpad"}
            </div>
            <p className="text-muted-foreground text-sm">
              {status.description ??
                "Complete onboarding to unlock your trading workspace."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">Onboarding</Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowExitPrompt(true)}
              aria-label="Exit onboarding"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <motion.div
        className="min-h-[420px] p-6"
        layout
        transition={{ type: "spring", stiffness: 220, damping: 28 }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {showExitPrompt ? (
            <motion.div
              key="exit"
              className="space-y-4"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-foreground text-lg font-semibold">
                Are you sure you want to exit onboarding?
              </div>
              <p className="text-muted-foreground text-sm">
                You can continue onboarding later from Settings.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button asChild>
                  <a href="/admin/dashboard">Go to dashboard</a>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowExitPrompt(false)}
                >
                  Stay here
                </Button>
              </div>
            </motion.div>
          ) : isLoading ? (
            <motion.div
              key="loading"
              className="space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Skeleton className="h-[260px] w-full rounded-2xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </motion.div>
          ) : activeStep ? (
            <motion.div
              key={`step-${activeStep}`}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
            >
              {renderStepContent(activeStep)}
            </motion.div>
          ) : (
            <motion.div
              key="main"
              className="space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex justify-center">
                <div className="relative w-full overflow-hidden pb-16">
                  <Carousel slides={onboardingSlides} />
                </div>
              </div>
              {allStepsComplete ? (
                <div className="border-border/60 bg-background/70 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
                  <div>
                    <div className="text-foreground text-base font-semibold">
                      All steps complete
                    </div>
                    <div className="text-muted-foreground mt-1 text-sm">
                      You’re ready to start reviewing trades.
                    </div>
                  </div>
                  <Button asChild>
                    <a href="/admin/dashboard">Go to dashboard</a>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {steps.map((step) => (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => setActiveStep(step.id)}
                      className="border-border/60 bg-background/70 hover:bg-background/90 flex w-full items-start justify-between gap-3 rounded-lg border p-4 text-left transition"
                    >
                      <div>
                        <div className="text-foreground text-base font-semibold">
                          {step.title}
                        </div>
                        {step.description ? (
                          <div className="text-muted-foreground mt-1 text-sm">
                            {step.description}
                          </div>
                        ) : null}
                      </div>
                      <Badge variant={step.completed ? "default" : "outline"}>
                        {step.completed ? "Connected" : "Connect"}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Card>
  );
}
