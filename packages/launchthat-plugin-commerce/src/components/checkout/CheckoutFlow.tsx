"use client";

import React from "react";

import { Button } from "@acme/ui/button";

import type { CheckoutStep } from "../../store/checkoutStore";
import { useCheckoutStore } from "../../store/checkoutStore";
import { BillingStep } from "./BillingStep";
import { ConfirmationStep } from "./ConfirmationStep";
import { PaymentStep } from "./PaymentStep";
import { ReviewStep } from "./ReviewStep";
// Import actual Step Components
import { ShippingStep } from "./ShippingStep";

interface StepDefinition {
  id: CheckoutStep;
  label: string;
  component: () => React.ReactNode;
}

const steps: StepDefinition[] = [
  { id: "shipping", label: "Shipping", component: ShippingStep },
  { id: "billing", label: "Billing", component: BillingStep },
  { id: "payment", label: "Payment", component: PaymentStep },
  { id: "review", label: "Review", component: ReviewStep },
  { id: "confirmation", label: "Confirmation", component: ConfirmationStep },
];

export const CheckoutFlow = () => {
  const { currentStep, setCurrentStep } = useCheckoutStore();

  const activeStepIndex = steps.findIndex((step) => step.id === currentStep);
  const ActiveComponent = steps[activeStepIndex]?.component ?? ShippingStep;

  const handleNext = () => {
    const nextStepIndex = activeStepIndex + 1;
    if (nextStepIndex < steps.length) {
      const nextStep = steps[nextStepIndex];
      if (nextStep && nextStep.id !== "confirmation") {
        // Do not auto-navigate to confirmation
        setCurrentStep(nextStep.id);
      }
    }
  };

  const handlePrevious = () => {
    const previousStepIndex = activeStepIndex - 1;
    if (previousStepIndex >= 0) {
      const previousStep = steps[previousStepIndex];
      if (previousStep) {
        setCurrentStep(previousStep.id);
      }
    }
  };

  const getStepStatus = (index: number) => {
    if (index < activeStepIndex) return "completed";
    if (index === activeStepIndex) return "current";
    return "upcoming";
  };

  return (
    <div className="container mx-auto max-w-3xl py-8">
      <h1 className="mb-8 text-center text-3xl font-bold">Checkout</h1>

      {/* Step Indicator */}
      <div className="mb-12 flex items-center justify-between">
        {steps.map((step, index) => {
          // Always show confirmation step in the indicator once it's reached or passed
          if (
            step.id === "confirmation" &&
            currentStep !== "confirmation" &&
            getStepStatus(index) !== "completed"
          )
            return null;

          const status = getStepStatus(index);
          return (
            <div key={step.id} className="flex flex-col items-center">
              <div
                className={`mb-2 flex h-10 w-10 items-center justify-center rounded-full border-2 font-semibold ${status === "completed" ? "border-green-500 bg-green-500 text-white" : ""} ${status === "current" ? "border-blue-500 bg-blue-500 text-white" : ""} ${status === "upcoming" ? "border-gray-300 bg-gray-100 text-gray-500" : ""} `}
              >
                {status === "completed" ? "✓" : index + 1}
              </div>
              <p
                className={`text-sm ${status === "current" ? "font-semibold text-blue-600" : "text-gray-500"} ${status === "completed" ? "text-green-600" : ""} `}
              >
                {step.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Active Step Component */}
      <div className="bg-card rounded-lg border p-6 shadow-sm">
        <ActiveComponent />
      </div>

      {/* Navigation Buttons (conditional rendering) */}
      {/* Hide buttons on review (handled internally) and confirmation steps */}
      {currentStep !== "review" && currentStep !== "confirmation" && (
        <div className="mt-8 flex justify-between">
          <Button
            onClick={handlePrevious}
            disabled={activeStepIndex === 0}
            variant="outline"
          >
            Previous
          </Button>
          <Button
            onClick={handleNext}
            // Disable Next if it's the step before Review, as Review has its own progression.
            // Or if it's the last non-confirmation step already.
            disabled={
              activeStepIndex >= steps.findIndex((s) => s.id === "review") - 1
            }
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};
