"use client";

import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogContent as ShadcnDialogContent,
} from "./dialog";
import React, { createContext, useCallback, useContext, useState } from "react";

import { Badge } from "./badge";
import { Button } from "./button";
import { Progress } from "./progress";
import { cn } from "../@acme/utils";

// Types for the multi-page dialog system
export interface MultiPageDialogStep<TData = Record<string, unknown>> {
  id: string;
  title: string;
  description?: string;
  component: React.ComponentType<MultiPageDialogStepProps<TData>>;
  optional?: boolean;
  validation?: (data: TData) => Promise<boolean> | boolean;
  onEnter?: (data: TData) => Promise<void> | void;
  onExit?: (data: TData) => Promise<void> | void;
  nextLabel?: string;
  previousLabel?: string;
  showNext?: boolean;
  showPrevious?: boolean;
  showProgress?: boolean;
}

export interface MultiPageDialogStepProps<TData = Record<string, unknown>> {
  data: TData;
  updateData: (updates: Partial<TData>) => void;
  goToStep: (stepId: string) => void;
  goNext: () => void;
  goPrevious: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  currentStepIndex: number;
  totalSteps: number;
}

export interface MultiPageDialogConfig<TData = Record<string, unknown>> {
  title: string;
  description?: string;
  steps: MultiPageDialogStep<TData>[];
  initialData?: TData;
  onComplete?: (data: TData) => Promise<void> | void;
  onCancel?: () => void;
  showStepIndicator?: boolean;
  showProgress?: boolean;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  closeOnComplete?: boolean;
}

// Context for sharing state between components
interface MultiPageDialogContextType<TData = Record<string, unknown>> {
  currentStepIndex: number;
  currentStep: MultiPageDialogStep<TData> | null;
  data: TData;
  config: MultiPageDialogConfig<TData>;
  updateData: (updates: Partial<TData>) => void;
  goToStep: (stepId: string) => void;
  goNext: () => void;
  goPrevious: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
}

const MultiPageDialogContext = createContext<MultiPageDialogContextType | null>(
  null,
);

export const useMultiPageDialog = () => {
  const context = useContext(MultiPageDialogContext);
  if (!context) {
    throw new Error(
      "useMultiPageDialog must be used within a MultiPageDialogProvider",
    );
  }
  return context;
};

// Step indicator component
function StepIndicator() {
  const { config, currentStepIndex } = useMultiPageDialog();

  if (!config.showStepIndicator) return null;

  return (
    <div className="mb-6 flex items-center justify-center space-x-4">
      {config.steps.map((step, index) => {
        const isActive = index === currentStepIndex;
        const isCompleted = index < currentStepIndex;
        const isUpcoming = index > currentStepIndex;

        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors",
                  isCompleted && "bg-primary text-primary-foreground",
                  isActive &&
                    "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2",
                  isUpcoming &&
                    "border-2 border-muted-foreground bg-muted text-muted-foreground",
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <div className="mt-2 text-center">
                <p
                  className={cn(
                    "text-xs font-medium",
                    isActive && "text-primary",
                    isCompleted && "text-primary",
                    isUpcoming && "text-muted-foreground",
                  )}
                >
                  {step.title}
                </p>
                {step.optional && (
                  <Badge variant="secondary" className="mt-1 text-xs">
                    Optional
                  </Badge>
                )}
              </div>
            </div>
            {index < config.steps.length - 1 && (
              <div
                className={cn(
                  "mx-4 mt-[-24px] h-0.5 w-12 transition-colors",
                  index < currentStepIndex ? "bg-primary" : "bg-muted",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Progress bar component
function ProgressBar() {
  const { config, currentStepIndex } = useMultiPageDialog();

  if (!config.showProgress) return null;

  const progress = ((currentStepIndex + 1) / config.steps.length) * 100;

  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Step {currentStepIndex + 1} of {config.steps.length}
        </span>
        <span className="text-sm text-muted-foreground">
          {Math.round(progress)}% Complete
        </span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
}

// Navigation component
function DialogNavigation() {
  const {
    currentStep,
    currentStepIndex,
    config,
    goNext,
    goPrevious,
    isProcessing,
    setIsProcessing,
    setIsOpen,
    data,
  } = useMultiPageDialog();

  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === config.steps.length - 1;

  const handleComplete = async () => {
    if (config.onComplete) {
      setIsProcessing(true);
      try {
        await config.onComplete(data);
        if (config.closeOnComplete !== false) {
          setIsOpen(false);
        }
      } catch (error: unknown) {
        console.error(
          "Error completing dialog:",
          error instanceof Error ? error : new Error(String(error)),
        );
      } finally {
        setIsProcessing(false);
      }
    } else if (config.closeOnComplete !== false) {
      setIsOpen(false);
    }
  };

  const handleNext = async () => {
    if (isLastStep) {
      await handleComplete();
    } else {
      goNext();
    }
  };

  return (
    <div className="flex items-center justify-between border-t pt-6">
      <div>
        {!isFirstStep && currentStep?.showPrevious !== false && (
          <Button
            variant="outline"
            onClick={goPrevious}
            disabled={isProcessing}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            {currentStep?.previousLabel ?? "Previous"}
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => {
            config.onCancel?.();
            setIsOpen(false);
          }}
          disabled={isProcessing}
        >
          Cancel
        </Button>

        {currentStep?.showNext !== false && (
          <Button onClick={handleNext} disabled={isProcessing}>
            {isProcessing ? (
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
            ) : isLastStep ? (
              <Check className="mr-2 h-4 w-4" />
            ) : (
              <ChevronRight className="mr-2 h-4 w-4" />
            )}
            {isLastStep ? "Complete" : (currentStep?.nextLabel ?? "Next")}
          </Button>
        )}
      </div>
    </div>
  );
}

// Main content component
function StepContent() {
  const {
    currentStep,
    data,
    updateData,
    goToStep,
    goNext,
    goPrevious,
    currentStepIndex,
    config,
  } = useMultiPageDialog();

  if (!currentStep) return null;

  const StepComponent = currentStep.component;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === config.steps.length - 1;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">{currentStep.title}</h3>
        {currentStep.description && (
          <p className="mt-1 text-sm text-muted-foreground">
            {currentStep.description}
          </p>
        )}
      </div>

      <div className="min-h-[200px]">
        <StepComponent
          data={data}
          updateData={updateData}
          goToStep={goToStep}
          goNext={goNext}
          goPrevious={goPrevious}
          isFirstStep={isFirstStep}
          isLastStep={isLastStep}
          currentStepIndex={currentStepIndex}
          totalSteps={config.steps.length}
        />
      </div>
    </div>
  );
}

// Provider component
function MultiPageDialogProvider({
  config,
  isOpen,
  setIsOpen,
  children,
}: {
  config: MultiPageDialogConfig;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  children: React.ReactNode;
}) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [data, setData] = useState<Record<string, unknown>>(
    config.initialData ?? {},
  );
  const [isProcessing, setIsProcessing] = useState(false);

  const currentStep = config.steps[currentStepIndex] ?? null;

  const updateData = useCallback(
    (updates: Partial<Record<string, unknown>>) => {
      setData((prev) => ({ ...prev, ...updates }));
    },
    [],
  );

  const goToStep = useCallback(
    (stepId: string) => {
      const stepIndex = config.steps.findIndex((step) => step.id === stepId);
      if (stepIndex !== -1) {
        setCurrentStepIndex(stepIndex);
      }
    },
    [config.steps],
  );

  const goNext = useCallback(async () => {
    const step = config.steps[currentStepIndex];

    // Validate current step if validation function exists
    if (step?.validation) {
      setIsProcessing(true);
      try {
        const isValid = await step.validation(data);
        if (!isValid) {
          setIsProcessing(false);
          return;
        }
      } catch (error: unknown) {
        console.error(
          "Validation error:",
          error instanceof Error ? error : new Error(String(error)),
        );
        setIsProcessing(false);
        return;
      }
    }

    // Call onExit for current step
    if (step?.onExit) {
      try {
        await step.onExit(data);
      } catch (error: unknown) {
        console.error(
          "Step exit error:",
          error instanceof Error ? error : new Error(String(error)),
        );
      }
    }

    const nextIndex = currentStepIndex + 1;
    if (nextIndex < config.steps.length) {
      setCurrentStepIndex(nextIndex);

      // Call onEnter for next step
      const nextStep = config.steps[nextIndex];
      if (nextStep?.onEnter) {
        try {
          await nextStep.onEnter(data);
        } catch (error: unknown) {
          console.error(
            "Step enter error:",
            error instanceof Error ? error : new Error(String(error)),
          );
        }
      }
    }

    setIsProcessing(false);
  }, [currentStepIndex, config.steps, data]);

  const goPrevious = useCallback(() => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStepIndex(prevIndex);
    }
  }, [currentStepIndex]);

  // Reset state when dialog opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
      setData(config.initialData ?? {});
      setIsProcessing(false);
    }
  }, [isOpen, config.initialData]);

  const contextValue: MultiPageDialogContextType = {
    currentStepIndex,
    currentStep,
    data,
    config,
    updateData,
    goToStep,
    goNext,
    goPrevious,
    isOpen,
    setIsOpen,
    isProcessing,
    setIsProcessing,
  };

  return (
    <MultiPageDialogContext.Provider value={contextValue}>
      {children}
    </MultiPageDialogContext.Provider>
  );
}

// Main component
export function MultiPageDialog({
  config,
  trigger,
  open,
  onOpenChange,
}: {
  config: MultiPageDialogConfig;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  const isOpen = open ?? internalIsOpen;
  const setIsOpen = onOpenChange ?? setInternalIsOpen;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-[95vw] max-h-[95vh]",
  };

  return (
    <MultiPageDialogProvider
      config={config}
      isOpen={isOpen}
      setIsOpen={setIsOpen}
    >
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}

        <ShadcnDialogContent
          className={cn("overflow-y-auto", sizeClasses[config.size ?? "xl"])}
        >
          <DialogHeader>
            <DialogTitle>{config.title}</DialogTitle>
            {config.description && (
              <p className="text-sm text-muted-foreground">
                {config.description}
              </p>
            )}
          </DialogHeader>

          <div className="space-y-6">
            <StepIndicator />
            <ProgressBar />
            <StepContent />
            <DialogNavigation />
          </div>
        </ShadcnDialogContent>
      </Dialog>
    </MultiPageDialogProvider>
  );
}
