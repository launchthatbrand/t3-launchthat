"use client";

import { CheckCircle, Zap } from "lucide-react";
import type {
  DialogConfig,
  StepProps,
} from "@acme/ui/multi-page-dialog-improved";
import {
  ImprovedMultiPageDialog,
  useStepData,
  useStepManagement,
  useStepNavigation,
} from "@acme/ui/multi-page-dialog-improved";
import React, { useState } from "react";

import { Button } from "@acme/ui/button";
import { DialogTrigger } from "@acme/ui/dialog";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Separator } from "@acme/ui/separator";
import { Textarea } from "@acme/ui/textarea";

// === TYPES ===
interface WizardData {
  selectedSteps: number;
  dynamicStepData: Record<string, string>;
}

// === STEP COMPONENTS ===

// Step Controller - handles dynamic step generation
function StepControllerStep(_props: StepProps<WizardData>) {
  const { data, updateData } = useStepData<WizardData>();
  const { replaceStepsAfter } = useStepManagement<WizardData>();
  const { goNext } = useStepNavigation();

  const [selectedSteps, setSelectedSteps] = useState<number>(
    data.selectedSteps || 2,
  );

  const handleStepCountChange = async (count: number) => {
    setSelectedSteps(count);
    updateData({ selectedSteps: count });

    // Generate dynamic steps
    const dynamicSteps = Array.from({ length: count }, (_, i) => ({
      id: `dynamic-step-${i + 1}`,
      title: `Dynamic Step ${i + 1}`,
      description: `This is dynamically generated step number ${i + 1}`,
      component: ({ data, updateData }: StepProps<WizardData>) => (
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Dynamic Step {i + 1}</h2>
            <p className="text-muted-foreground">
              This step was generated dynamically based on your selection
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor={`step-${i + 1}-input`}>Step {i + 1} Data</Label>
              <Input
                id={`step-${i + 1}-input`}
                placeholder={`Enter data for step ${i + 1}`}
                value={data.dynamicStepData[`step${i + 1}`] ?? ""}
                onChange={(e) =>
                  updateData({
                    dynamicStepData: {
                      ...data.dynamicStepData,
                      [`step${i + 1}`]: e.target.value,
                    },
                  })
                }
              />
            </div>

            <div>
              <Label htmlFor={`step-${i + 1}-notes`}>Notes</Label>
              <Textarea
                id={`step-${i + 1}-notes`}
                placeholder="Additional notes..."
                value={data.dynamicStepData[`step${i + 1}Notes`] ?? ""}
                onChange={(e) =>
                  updateData({
                    dynamicStepData: {
                      ...data.dynamicStepData,
                      [`step${i + 1}Notes`]: e.target.value,
                    },
                  })
                }
              />
            </div>
          </div>
        </div>
      ),
      validation: (data: WizardData) => {
        // Validate that required data is present
        return Boolean(data.dynamicStepData[`step${i + 1}`]);
      },
    }));

    // Add summary step
    const summaryStep = {
      id: "summary",
      title: "Summary",
      description: "Review your configuration",
      component: SummaryStep,
      validation: () => true,
    };

    // Replace all steps after the current step
    replaceStepsAfter("step-controller", [...dynamicSteps, summaryStep]);

    // Navigate to the first dynamic step
    await goNext();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">
          Enhanced Dynamic Steps Configuration
        </h2>
        <p className="text-muted-foreground">
          Choose how many steps you want to generate dynamically using the
          improved architecture
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

      <div className="rounded-lg border bg-gradient-to-r from-blue-50 to-purple-50 p-4">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium">
            Improved Architecture Features
          </span>
        </div>
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
          <li>• Cleaner step management APIs</li>
          <li>• Better TypeScript support</li>
          <li>• Synchronous state updates</li>
          <li>• No race conditions</li>
        </ul>
      </div>

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
            Using the improved step replacement API
          </p>
        </div>
      </div>
    </div>
  );
}

// Summary Step
function SummaryStep(_props: StepProps<WizardData>) {
  const { data } = useStepData<WizardData>();

  const selectedSteps = data.selectedSteps || 0;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Summary</h2>
        <p className="text-muted-foreground">
          Review your enhanced dynamic step configuration
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
                const stepData = data.dynamicStepData[`step${stepNum}`] ?? "";
                const stepNotes =
                  data.dynamicStepData[`step${stepNum}Notes`] ?? "";

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

      <div className="rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 p-4">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-green-800">
            Enhanced Multi-Page Dialog Test Completed Successfully!
          </span>
        </div>
        <p className="mt-1 text-xs text-green-700">
          The improved dialog architecture successfully handled {selectedSteps}{" "}
          dynamically generated steps with better performance and cleaner APIs.
        </p>
      </div>
    </div>
  );
}

// === MAIN COMPONENT ===
export default function ImprovedMultiPageDialogExample() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const dialogConfig: DialogConfig<WizardData> = {
    title: "Enhanced Dynamic Steps Test",
    description: "Test the improved multi-page dialog architecture",
    initialSteps: [
      {
        id: "step-controller",
        title: "Configure Steps",
        description: "Choose how many dynamic steps to generate",
        component: StepControllerStep,
        validation: (data: WizardData) => {
          return Boolean(data.selectedSteps);
        },
      },
    ],
    initialData: {
      selectedSteps: 2,
      dynamicStepData: {},
    },
    onComplete: (data: WizardData) => {
      console.log("Dialog completed with data:", data);
      setIsDialogOpen(false);
    },
    showProgress: true,
    showStepIndicator: true,
    size: "lg",
  };

  return (
    <div className="container mx-auto space-y-8 py-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Improved Multi-Page Dialog</h1>
        <p className="mt-2 text-xl text-muted-foreground">
          Test the enhanced architecture with better APIs and performance
        </p>
      </div>

      <div className="flex justify-center">
        <ImprovedMultiPageDialog
          config={dialogConfig}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          trigger={
            <DialogTrigger asChild>
              <Button size="lg">
                <Zap className="mr-2 h-5 w-5" />
                Test Enhanced Dialog
              </Button>
            </DialogTrigger>
          }
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-muted/50 p-6">
          <h2 className="text-xl font-bold">How it works:</h2>
          <ol className="mt-4 space-y-2 text-sm">
            <li className="flex gap-2">
              <span className="font-medium">1.</span>
              <span>
                Click "Test Enhanced Dialog" to open the improved dialog
              </span>
            </li>
            <li className="flex gap-2">
              <span className="font-medium">2.</span>
              <span>Choose how many dynamic steps you want (2-5)</span>
            </li>
            <li className="flex gap-2">
              <span className="font-medium">3.</span>
              <span>
                Click "Generate Steps & Continue" to use the improved step
                management
              </span>
            </li>
            <li className="flex gap-2">
              <span className="font-medium">4.</span>
              <span>Fill out each dynamically generated step</span>
            </li>
            <li className="flex gap-2">
              <span className="font-medium">5.</span>
              <span>Review your data in the enhanced summary step</span>
            </li>
          </ol>
        </div>

        <div className="rounded-lg border bg-gradient-to-br from-blue-50 to-purple-50 p-6">
          <h2 className="text-xl font-bold">Key Improvements:</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li className="flex gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>
                <strong>Better APIs:</strong> Clean step management functions
              </span>
            </li>
            <li className="flex gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>
                <strong>Type Safety:</strong> Full TypeScript support
              </span>
            </li>
            <li className="flex gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>
                <strong>No Race Conditions:</strong> Synchronous state updates
              </span>
            </li>
            <li className="flex gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>
                <strong>Better Performance:</strong> Optimized re-renders
              </span>
            </li>
            <li className="flex gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>
                <strong>Utility Hooks:</strong> Composable step management
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
