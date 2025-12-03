"use client";

import type { Id } from "@/convex/_generated/dataModel";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useConvexMutation, useConvexQuery } from "@/hooks/convex";
import { Edit, Plus, Trash } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui/dialog";
import { EntityList } from "@acme/ui/entity-list/EntityList";

import { FunnelFlowEditor } from "./_components/FunnelFlowEditor";
import { FunnelStepForm } from "./_components/FunnelStepForm";

interface StepRow extends Record<string, unknown> {
  _id: Id<"funnelSteps">;
  type: "landing" | "funnelCheckout" | "upsell" | "order_confirmation";
  position: number;
  label?: string;
}

export default function FunnelStepsPage() {
  const params = useParams<{ id: string }>();
  const funnelId = params.id as Id<"funnels">;
  const router = useRouter();

  const steps = useConvexQuery(api.ecommerce.funnels.queries.getFunnelSteps, {
    funnelId,
  }) as StepRow[] | undefined;

  const addStep = useConvexMutation(
    api.ecommerce.funnels.mutations.addFunnelStep,
  );
  const deleteStep = useConvexMutation(
    api.ecommerce.funnels.mutations.deleteFunnelStep,
  );

  const [dialogOpen, setDialogOpen] = useState(false);

  const columns: ColumnDef<StepRow>[] = useMemo(
    () => [
      { id: "position", header: "Pos", accessorKey: "position" },
      {
        id: "type",
        header: "Type",
        accessorKey: "type",
        cell: ({ row }) => (
          <Badge variant="outline" className="text-xs">
            {row.original.type}
          </Badge>
        ),
      },
      { id: "label", header: "Label", accessorKey: "label" },
    ],
    [],
  );

  const entityActions = [
    {
      id: "edit",
      label: "Edit",
      icon: <Edit className="h-4 w-4" />,
      onClick: (item: StepRow) => {
        router.push(`/admin/store/funnels/${funnelId}/steps/${item._id}`);
      },
      variant: "ghost" as const,
    },
    {
      id: "delete",
      label: "Delete",
      icon: <Trash className="h-4 w-4" />,
      onClick: async (item: StepRow) => {
        if (!confirm("Delete this step?")) return;
        try {
          await deleteStep({ stepId: item._id });
          toast.success("Step deleted");
        } catch {
          toast.error("Failed to delete step");
        }
      },
      variant: "ghost" as const,
    },
  ];

  return (
    <div className="container space-y-6 py-6">
      {/* React Flow Editor */}
      <FunnelFlowEditor funnelId={funnelId} />

      <Card>
        <CardHeader>
          <CardTitle>Funnel Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <EntityList<StepRow>
            title="Steps"
            description="Manage steps in this funnel"
            data={steps ?? []}
            isLoading={steps === undefined}
            columns={columns}
            entityActions={entityActions}
            actions={
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Step
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Step</DialogTitle>
                  </DialogHeader>
                  <FunnelStepForm
                    funnelId={funnelId}
                    onCancel={() => setDialogOpen(false)}
                    onSubmit={async (values) => {
                      try {
                        await addStep({
                          funnelId,
                          type: values.type,
                          label: values.label,
                          position: values.position,
                          config: values.config,
                        });
                        toast.success("Step added");
                        setDialogOpen(false);
                      } catch {
                        toast.error("Failed to add step");
                      }
                    }}
                  />
                </DialogContent>
              </Dialog>
            }
            enableSearch
          />
        </CardContent>
      </Card>
    </div>
  );
}
