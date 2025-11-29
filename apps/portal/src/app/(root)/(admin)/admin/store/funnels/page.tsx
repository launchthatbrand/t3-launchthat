"use client";

import type { Id } from "@/convex/_generated/dataModel";
import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useConvexMutation, useConvexQuery } from "@/hooks/convex";
import { Edit, Plus, Trash } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent } from "@acme/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui/dialog";

import { EntityList } from "@acme/ui/entity-list/EntityList";
import { FunnelForm } from "./_components/FunnelForm";

export default function FunnelsPage() {
  return <AuthenticatedFunnelsPage />;
}

function AuthenticatedFunnelsPage() {
  const isAdminResult = useConvexQuery(
    api.core.accessControl.queries.checkIsAdmin,
    {},
  );

  if (isAdminResult === undefined) {
    return (
      <div className="container p-8">
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-muted-foreground">Verifying admin status...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isAdminResult === false) {
    return (
      <div className="container p-8">
        <p className="text-center text-muted-foreground">Redirecting...</p>
      </div>
    );
  }

  return <FunnelsContent />;
}

interface CheckoutScenarioListItem {
  _id: Id<"scenarios">;
  name: string;
  slug?: string;
  status: string;
}

function FunnelsContent() {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fetch scenarios of type checkout
  const scenarios = useConvexQuery(api.integrations.scenarios.queries.list, {
    scenarioType: "checkout",
  }) as CheckoutScenarioListItem[] | undefined | null;

  // Mutations
  const deleteScenario = useConvexMutation(
    api.integrations.scenarios.mutations.remove,
  );

  const handleDelete = async (id: Id<"scenarios">) => {
    if (confirm("Are you sure you want to delete this checkout flow?")) {
      try {
        await deleteScenario({ id });
        toast.success("Checkout flow deleted successfully");
      } catch (error) {
        console.error("Failed to delete checkout flow:", error);
        toast.error("Failed to delete checkout flow", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  };

  const columns: ColumnDef<CheckoutScenarioListItem>[] = [
    {
      id: "name",
      header: "Name",
      accessorKey: "name",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
    },
    {
      id: "slug",
      header: "Slug",
      accessorKey: "slug",
      cell: ({ row }) => (
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-sm">
          {row.original.slug ?? "—"}
        </code>
      ),
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.status === "active"
              ? "default"
              : row.original.status === "draft"
                ? "secondary"
                : "outline"
          }
        >
          {row.original.status}
        </Badge>
      ),
    },
  ];

  const entityActions = [
    {
      id: "edit",
      label: "Edit",
      icon: <Edit className="h-4 w-4" />,
      onClick: (item: CheckoutScenarioListItem) => {
        router.push(`/admin/integrations/scenarios/${item._id}`);
      },
      variant: "ghost" as const,
    },
    {
      id: "delete",
      label: "Delete",
      icon: <Trash className="h-4 w-4" />,
      onClick: (item: CheckoutScenarioListItem) => {
        void handleDelete(item._id);
      },
      variant: "ghost" as const,
    },
  ];

  const createActions = (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Funnel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Funnel</DialogTitle>
          <DialogDescription>
            Configure a funnel experience for your customers
          </DialogDescription>
        </DialogHeader>
        <FunnelForm
          onSuccess={() => {
            setDialogOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="container py-6">
      <Card>
        <CardContent className="p-6">
          <EntityList<CheckoutScenarioListItem>
            title="All Checkout Flows"
            description="Create and manage checkout flows (scenarios of type 'checkout')"
            data={Array.isArray(scenarios) ? scenarios : []}
            isLoading={scenarios === undefined}
            columns={columns}
            entityActions={entityActions}
            actions={createActions}
            enableSearch
          />
        </CardContent>
      </Card>
    </div>
  );
}
