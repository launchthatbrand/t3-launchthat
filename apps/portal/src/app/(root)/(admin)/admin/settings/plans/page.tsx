"use client";

import type { Id } from "@/convex/_generated/dataModel";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import {
  Building2,
  CreditCard,
  DollarSign,
  Eye,
  EyeOff,
  Pencil,
  PencilIcon,
  PlusCircle,
  Trash2,
  Trash2Icon,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@acme/ui/alert-dialog";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";

import type {
  ColumnDef,
  EntityAction,
  FilterConfig,
} from "~/components/shared/EntityList/types";
import { EntityList } from "~/components/shared/EntityList/EntityList";
import { PlanForm } from "./_components/PlanForm";

// Plan data type
interface PlanData {
  _id: Id<"plans">;
  _creationTime: number;
  name: "free" | "starter" | "business" | "agency";
  displayName: string;
  description: string;
  maxOrganizations: number;
  priceMonthly: number;
  priceYearly?: number;
  features: string[];
  isActive: boolean;
  sortOrder: number;
  updatedAt: number;
}

export default function PlansSettingsPage() {
  const router = useRouter();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<Id<"plans"> | undefined>();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<Id<"plans"> | undefined>();

  // Queries
  const plans = useQuery(api.core.organizations.queries.getPlans, {});

  // Mutations
  const deletePlan = useMutation(api.core.organizations.mutations.deletePlan);

  // Transform data for EntityList with validation
  const plansData: PlanData[] = React.useMemo(() => {
    if (!plans || !Array.isArray(plans)) {
      return [];
    }

    return plans.map((plan) => ({
      _id: plan._id,
      _creationTime: plan._creationTime ?? Date.now(),
      name: plan.name || "unknown",
      displayName: plan.displayName || "Unnamed Plan",
      description: plan.description || "",
      maxOrganizations: plan.maxOrganizations || 1,
      priceMonthly: plan.priceMonthly || 0,
      priceYearly: plan.priceYearly,
      features: Array.isArray(plan.features) ? plan.features : [],
      isActive: plan.isActive ?? true,
      sortOrder: plan.sortOrder || 0,
      updatedAt: plan.updatedAt || Date.now(),
    }));
  }, [plans]);

  console.log("plansData", plansData);

  // Column definitions
  const columns: ColumnDef<PlanData>[] = [
    {
      accessorKey: "name",
      header: "Plan",
      cell: ({ row }) => {
        const plan = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <CreditCard className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="font-medium">
                {plan.displayName ?? "Unnamed Plan"}
              </div>
              <div className="text-xs capitalize text-muted-foreground">
                {plan.name ?? "unknown"}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => {
        const description = row.original.description ?? "No description";
        return (
          <div className="max-w-[300px]">
            <p className="truncate text-sm">{String(description)}</p>
          </div>
        );
      },
    },
    {
      accessorKey: "priceMonthly",
      header: "Pricing",
      cell: ({ row }) => {
        const plan = row.original;
        const monthlyPrice = (plan.priceMonthly ?? 0) / 100;
        const yearlyPrice = plan.priceYearly ? plan.priceYearly / 100 : null;

        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1">
              <DollarSign className="h-3 w-3 text-muted-foreground" />
              <span className="font-medium">${monthlyPrice.toFixed(2)}/mo</span>
            </div>
            {yearlyPrice && yearlyPrice > 0 && (
              <div className="text-xs text-muted-foreground">
                ${yearlyPrice.toFixed(2)}/yr
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "maxOrganizations",
      header: "Organizations",
      cell: ({ row }) => {
        const maxOrgs = row.original.maxOrganizations ?? 1;
        return (
          <div className="flex items-center gap-1">
            <Building2 className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm">
              {maxOrgs === -1 ? "Unlimited" : String(maxOrgs)}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "features",
      header: "Features",
      cell: ({ row }) => {
        const features = row.original.features;

        // Ensure features is an array and filter out any null/undefined values
        const safeFeatures = Array.isArray(features)
          ? features.filter((f) => f != null && f !== "")
          : [];

        if (safeFeatures.length === 0) {
          return (
            <span className="text-xs text-muted-foreground">No features</span>
          );
        }

        return (
          <div className="flex max-w-[200px] flex-wrap gap-1">
            {safeFeatures.slice(0, 2).map((feature, index) => {
              // Ensure feature is a string
              const featureText =
                typeof feature === "string" ? feature : String(feature);

              return (
                <Badge
                  key={`feature-${index}`}
                  variant="secondary"
                  className="text-xs"
                >
                  {featureText}
                </Badge>
              );
            })}
            {safeFeatures.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{safeFeatures.length - 2} more
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.original.isActive;
        return (
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "sortOrder",
      header: "Order",
      cell: ({ row }) => {
        const sortOrder = row.original.sortOrder ?? 0;
        return (
          <span className="text-sm text-muted-foreground">
            {String(sortOrder)}
          </span>
        );
      },
    },
  ];

  // Filter configuration
  const filters: FilterConfig<PlanData> = {
    searchFields: ["displayName", "description"],
    filterFields: [
      {
        key: "isActive",
        label: "Status",
        type: "select",
        options: [
          { value: "true", label: "Active" },
          { value: "false", label: "Inactive" },
        ],
      },
      {
        key: "name",
        label: "Plan Type",
        type: "select",
        options: [
          { value: "free", label: "Free" },
          { value: "starter", label: "Starter" },
          { value: "business", label: "Business" },
          { value: "agency", label: "Agency" },
        ],
      },
    ],
  };

  // Entity actions (row actions)
  const entityActions: EntityAction<PlanData>[] = [
    {
      id: "edit",
      label: "Edit",
      icon: <PencilIcon className="h-4 w-4" />,
      onClick: (plan) => {
        setEditingPlanId(plan._id);
        setIsFormOpen(true);
      },
    },
    {
      id: "delete",
      label: "Delete",
      icon: <Trash2Icon className="h-4 w-4" />,
      onClick: (plan) => {
        setPlanToDelete(plan._id);
        setIsDeleteDialogOpen(true);
      },
      variant: "destructive",
    },
  ];

  // Header actions
  const headerActions = (
    <Button onClick={() => setIsFormOpen(true)} className="gap-2">
      <PlusCircle className="h-4 w-4" />
      Create Plan
    </Button>
  );

  // Handle form success
  const handleFormSuccess = () => {
    setEditingPlanId(undefined);
    // Data will be automatically refetched by Convex
  };

  // Handle delete confirmation
  const handleConfirmDelete = async () => {
    if (!planToDelete) return;

    try {
      await deletePlan({ planId: planToDelete });
      toast.success("Plan deleted successfully");
      setIsDeleteDialogOpen(false);
      setPlanToDelete(undefined);
    } catch (error) {
      console.error("Failed to delete plan:", error);
      toast.error("Failed to delete plan");
    }
  };

  return (
    <div className="container mx-auto py-6">
      <EntityList<PlanData>
        data={plansData}
        columns={columns}
        filters={filters}
        isLoading={plans === undefined}
        title="Subscription Plans"
        description="Manage subscription plans, pricing, and features"
        defaultViewMode="list"
        viewModes={["list"]}
        entityActions={entityActions}
        actions={headerActions}
        emptyState={
          <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed">
            <CreditCard className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-medium">No Plans Found</h3>
            <p className="mb-4 text-muted-foreground">
              Create your first subscription plan to get started
            </p>
            <Button onClick={() => setIsFormOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Plan
            </Button>
          </div>
        }
      />

      {/* Plan Form Dialog */}
      <PlanForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        planId={editingPlanId}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              plan and remove it from all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
