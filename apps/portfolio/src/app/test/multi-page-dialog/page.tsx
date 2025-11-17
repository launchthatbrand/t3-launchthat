"use client";

import { CheckCircle, ExternalLink, Settings } from "lucide-react";
import React, { useState } from "react";

import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import Link from "next/link";
import { MultiPageDialog } from "@acme/ui/multi-page-dialog";
import type { MultiPageDialogStepProps } from "@acme/ui/multi-page-dialog";
import { Separator } from "@acme/ui/separator";
import { Textarea } from "@acme/ui/textarea";

// === UTILITY FUNCTIONS ===
function safeString(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return value.toString();
  return "";
}

// === STEP COMPONENTS ===

// Step Controller - handles dynamic step generation
function StepControllerStep({
  addStep,
  removeStep,
  data,
  updateData,
  goNext,
}: MultiPageDialogStepProps) {
  const [selectedSteps, setSelectedSteps] = useState<number>(
    Number(safeString(data.selectedSteps)) || 2,
  );

  // Initialize the data with default value if not set
  React.useEffect(() => {
    if (!data.selectedSteps) {
      updateData({ selectedSteps: 2 });
    }
  }, [data.selectedSteps, updateData]);

  const handleStepCountChange = (count: number) => {
    setSelectedSteps(count);
    updateData({ selectedSteps: count });

    // Clear any existing dynamic steps first
    if (removeStep) {
      // Remove all existing dynamic steps
      for (let i = 1; i <= 10; i++) {
        // Remove up to 10 possible existing steps
        removeStep(`dynamic-step-${i}`);
      }
    }

    // Add the requested number of dynamic steps
    if (addStep) {
      for (let i = 1; i <= count; i++) {
        addStep({
          id: `dynamic-step-${i}`,
          title: `Dynamic Step ${i}`,
          description: `This is dynamically generated step number ${i}`,
          component: ({ data, updateData }: MultiPageDialogStepProps) => (
            <div className="space-y-4">
              <div className="text-center">
                <h2 className="text-2xl font-bold">Dynamic Step {i}</h2>
                <p className="text-muted-foreground">
                  This step was generated dynamically based on your selection
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor={`step-${i}-input`}>Step {i} Data</Label>
                  <Input
                    id={`step-${i}-input`}
                    placeholder={`Enter data for step ${i}`}
                    value={safeString(data[`step${i}Data`])}
                    onChange={(e) =>
                      updateData({ [`step${i}Data`]: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor={`step-${i}-notes`}>Notes</Label>
                  <Textarea
                    id={`step-${i}-notes`}
                    placeholder="Additional notes..."
                    value={safeString(data[`step${i}Notes`])}
                    onChange={(e) =>
                      updateData({ [`step${i}Notes`]: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          ),
          validation: (data) => {
            // Validate that required data is present
            return Boolean(data[`step${i}Data`]);
          },
        });
      }
    }

    // Add the summary step at the end
    if (addStep) {
      addStep({
        id: "summary",
        title: "Summary",
        description: "Review your configuration",
        component: SummaryStep,
        validation: () => true,
      });
    }

    // Mark that steps have been initialized
    updateData({ stepsInitialized: true });

    // Navigate to the next step after adding dynamic steps
    setTimeout(() => {
      console.log("🔧 Calling goNext() after step generation");
      goNext();
    }, 100);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Dynamic Steps Configuration</h2>
        <p className="text-muted-foreground">
          Choose how many steps you want to generate dynamically
        </p>
      </div>

      <div className="space-y-4">
        <Label>Number of Dynamic Steps</Label>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {[2, 3, 4, 5].map((count) => (
            <Button
              key={count}
              onClick={() => setSelectedSteps(count)}
              variant={selectedSteps === count ? "secondary" : "outline"}
              className="h-16"
            >
              <div className="text-center">
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-xs">Steps</div>
              </div>
            </Button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border bg-muted/50 p-4">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium">Dynamic Steps Enabled</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Steps will be generated dynamically based on your selection
        </p>
      </div>

      {Boolean(data.stepsInitialized) && (
        <div className="space-y-4">
          <Separator />
          <div className="flex flex-col gap-4">
            <p className="text-sm font-medium">Ready to proceed?</p>
            <Button
              onClick={() => handleStepCountChange(selectedSteps)}
              className="w-full"
            >
              Generate {selectedSteps} Step{selectedSteps !== 1 ? "s" : ""} &
              Continue
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Or click Next in the dialog footer to proceed with current
              configuration
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Summary Step
function SummaryStep({ data }: MultiPageDialogStepProps) {
  const selectedSteps = Number(safeString(data.selectedSteps)) || 0;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Summary</h2>
        <p className="text-muted-foreground">
          Review your dynamic step configuration
        </p>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border p-4">
          <h3 className="font-medium">Configuration Summary</h3>
          <div className="mt-2 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Dynamic Steps Generated:</span>
              <span className="font-medium">{selectedSteps}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Steps Completed:</span>
              <span className="font-medium">{selectedSteps + 2}</span>
            </div>
          </div>
        </div>

        {selectedSteps > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Step Data:</h4>
            {Array.from({ length: selectedSteps }, (_, i) => i + 1).map(
              (stepNum) => {
                const stepData = safeString(data[`step${stepNum}Data`]);
                const stepNotes = safeString(data[`step${stepNum}Notes`]);

                return (
                  <div key={stepNum} className="rounded border p-3 text-sm">
                    <div className="font-medium">Step {stepNum}:</div>
                    {stepData && <div>Data: {stepData}</div>}
                    {stepNotes && <div>Notes: {stepNotes}</div>}
                    {!stepData && !stepNotes && (
                      <div className="text-muted-foreground">
                        No data entered
                      </div>
                    )}
                  </div>
                );
              },
            )}
          </div>
        )}
      </div>

      <div className="rounded-lg bg-green-50 p-4">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-green-800">
            Dynamic Steps Test Completed Successfully!
          </span>
        </div>
        <p className="mt-1 text-xs text-green-700">
          The multi-page dialog successfully handled {selectedSteps} dynamically
          generated steps.
        </p>
      </div>
    </div>
  );
}

// === MAIN COMPONENT ===
export default function MultiPageDialogTestPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="container mx-auto space-y-8 py-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Multi-Page Dialog Test</h1>
        <p className="mt-2 text-xl text-muted-foreground">
          Test the dynamic step functionality of the MultiPageDialog component
        </p>

        <div className="mt-4">
          <Link href="/test/multi-page-dialog/improved">
            <Button variant="outline" size="sm">
              <ExternalLink className="mr-2 h-4 w-4" />
              Try the Improved Version
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex justify-center">
        <MultiPageDialog
          config={{
            persistenceKey: "dynamic-steps-test",
            title: "Dynamic Steps Test",
            description: "Test dynamic step generation in multi-page dialogs",
            steps: [
              {
                id: "step-controller",
                title: "Configure Steps",
                description: "Choose how many dynamic steps to generate",
                component: StepControllerStep,
                validation: (data) => {
                  return Boolean(data.selectedSteps);
                },
              },
            ],
            initialData: {
              selectedSteps: 2,
              stepsInitialized: false,
            },
          }}
          trigger={
            <Button size="lg">
              <Settings className="mr-2 h-5 w-5" />
              Test Dynamic Steps
            </Button>
          }
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
        />
      </div>

      <div className="rounded-lg border bg-muted/50 p-6">
        <h2 className="text-xl font-bold">How it works:</h2>
        <ol className="mt-4 space-y-2 text-sm">
          <li className="flex gap-2">
            <span className="font-medium">1.</span>
            <span>Click "Test Dynamic Steps" to open the dialog</span>
          </li>
          <li className="flex gap-2">
            <span className="font-medium">2.</span>
            <span>Choose how many dynamic steps you want (2-5)</span>
          </li>
          <li className="flex gap-2">
            <span className="font-medium">3.</span>
            <span>
              Click "Generate Steps & Continue" to add the dynamic steps
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-medium">4.</span>
            <span>Fill out each dynamically generated step</span>
          </li>
          <li className="flex gap-2">
            <span className="font-medium">5.</span>
            <span>Review your data in the summary step</span>
          </li>
        </ol>
      </div>
    </div>
  );
}
