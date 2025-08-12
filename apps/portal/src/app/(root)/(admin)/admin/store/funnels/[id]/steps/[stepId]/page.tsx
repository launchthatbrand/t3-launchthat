/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use client";

import type { Id } from "@/convex/_generated/dataModel";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useConvexMutation, useConvexQuery } from "@/hooks/convex";
import { Loader2, Trash } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

import { FunnelCheckoutForm } from "../_components/FunnelCheckoutForm";
import { FunnelStepForm } from "../_components/FunnelStepForm";

export default function EditFunnelStepPage() {
  const params = useParams<{ id: string; stepId: string }>();
  const router = useRouter();
  const funnelId = params.id as Id<"funnels">;
  const stepId = params.stepId as Id<"funnelSteps">;

  const step = useConvexQuery(api.ecommerce.funnels.queries.getFunnelStepById, {
    stepId,
  });

  const updateStep = useConvexMutation(
    api.ecommerce.funnels.mutations.updateFunnelStep,
  );
  const deleteStep = useConvexMutation(
    api.ecommerce.funnels.mutations.deleteFunnelStep,
  );

  if (step === undefined) {
    return (
      <div className="container p-8">
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (step === null) {
    return (
      <div className="container p-8">
        <p className="text-center text-muted-foreground">Step not found</p>
      </div>
    );
  }

  const isCheckout = step.type === "funnelCheckout" || step.type === "checkout";

  return (
    <div className="container py-6">
      <div className="mb-4 flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => router.push(`/admin/store/funnels/${funnelId}/steps`)}
        >
          Back to Steps
        </Button>
        <Button
          variant="destructive"
          onClick={async () => {
            if (!confirm("Delete this step?")) return;
            try {
              await deleteStep({ stepId });
              toast.success("Step deleted");
              router.push(`/admin/store/funnels/${funnelId}/steps`);
            } catch {
              toast.error("Failed to delete step");
            }
          }}
        >
          <Trash className="mr-2 h-4 w-4" /> Delete Step
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Step</CardTitle>
        </CardHeader>
        <CardContent>
          {isCheckout ? (
            <FunnelCheckoutForm stepId={stepId} initial={step} />
          ) : (
            <FunnelStepForm
              funnelId={funnelId}
              initial={{
                type: step.type,
                position: step.position,
                label: step.label,
                config: step.config,
              }}
              onCancel={() =>
                router.push(`/admin/store/funnels/${funnelId}/steps`)
              }
              onSubmit={async (values) => {
                try {
                  await updateStep({
                    stepId,
                    type: values.type,
                    position: values.position,
                    label: values.label,
                    config: values.config,
                  });
                  toast.success("Step updated");
                } catch {
                  toast.error("Failed to update step");
                }
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
