"use client";

import type { GenericId as Id } from "convex/values";
import { useMemo, useState } from "react";
import { api } from "@portal/convexspec";
import { useMutation, useQuery } from "convex/react";
import {
  Building2,
  CreditCard,
  DollarSign,
  PencilIcon,
  PlusCircle,
  Trash2Icon,
} from "lucide-react";

import type {
  ColumnDefinition,
  EntityAction,
  FilterConfig,
} from "@acme/ui/entity-list/types";
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
import { EntityList } from "@acme/ui/entity-list/EntityList";
import { toast } from "@acme/ui/toast";

import { PlanForm } from "./PlanForm";

export interface PlanRecord extends Record<string, unknown> {
  _id: Id<"plans">;
  _creationTime: number;
  name: "free" | "starter" | "business" | "agency" | string;
  displayName: string;
  description: string;
  maxOrganizations: number;
  priceMonthly: number;
  priceYearly?: number;
  features: string[];
  isActive: boolean;
  sortOrder: number;
  updatedAt?: number;
}

export const PlansManager = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<Id<"plans"> | undefined>();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<Id<"plans"> | undefined>();

  const plans = useQuery(api.core.organizations.queries.getPlans, {});
  const deletePlan = useMutation(api.core.organizations.mutations.deletePlan);

  const plansData: PlanRecord[] = useMemo(() => {
    if (!plans || !Array.isArray(plans)) {
      return [];
    }
    return plans.map((plan) => ({
      _id: plan._id,
      _creationTime: plan._creationTime ?? Date.now(),
      name: plan.name ?? "unknown",
      displayName: plan.displayName ?? "Unnamed Plan",
      description: plan.description ?? "",
      maxOrganizations: plan.maxOrganizations ?? 1,
      priceMonthly: plan.priceMonthly ?? 0,
      priceYearly: plan.priceYearly,
      features: Array.isArray(plan.features) ? (plan.features as string[]) : [],
      isActive: plan.isActive ?? true,
      sortOrder: plan.sortOrder ?? 0,
      updatedAt: plan.updatedAt,
    }));
  }, [plans]);

  const columns: ColumnDefinition<PlanRecord>[] = [
    {
      id: "plan",
      accessorKey: "name",
      header: "Plan",
      cell: (plan: PlanRecord) => {
        return (
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full">
              <CreditCard className="text-primary h-4 w-4" />
            </div>
            <div>
              <div className="font-medium">
                {plan.displayName ?? "Unnamed Plan"}
              </div>
              <div className="text-muted-foreground text-xs capitalize">
                {plan.name ?? "unknown"}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      id: "description",
      accessorKey: "description",
      header: "Description",
      cell: (plan: PlanRecord) => (
        <div className="max-w-[300px]">
          <p className="truncate text-sm">
            {plan.description ?? "No description"}
          </p>
        </div>
      ),
    },
    {
      id: "pricing",
      accessorKey: "priceMonthly",
      header: "Pricing",
      cell: (plan: PlanRecord) => {
        const monthlyPrice = (plan.priceMonthly ?? 0) / 100;
        const yearlyPrice = plan.priceYearly
          ? (plan.priceYearly ?? 0) / 100
          : null;
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1">
              <DollarSign className="text-muted-foreground h-3 w-3" />
              <span className="font-medium">${monthlyPrice.toFixed(2)}/mo</span>
            </div>
            {yearlyPrice && yearlyPrice > 0 && (
              <div className="text-muted-foreground text-xs">
                ${yearlyPrice.toFixed(2)}/yr
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: "organizations",
      accessorKey: "maxOrganizations",
      header: "Organizations",
      cell: (plan: PlanRecord) => {
        const maxOrgs = plan.maxOrganizations ?? 1;
        return (
          <div className="flex items-center gap-1">
            <Building2 className="text-muted-foreground h-3 w-3" />
            <span className="text-sm">
              {maxOrgs === -1 ? "Unlimited" : String(maxOrgs)}
            </span>
          </div>
        );
      },
    },
    {
      id: "features",
      accessorKey: "features",
      header: "Features",
      cell: (plan: PlanRecord) => {
        const features = plan.features ?? [];
        const safeFeatures = Array.isArray(features)
          ? features.filter((feature) => feature)
          : [];
        if (safeFeatures.length === 0) {
          return (
            <span className="text-muted-foreground text-xs">No features</span>
          );
        }
        return (
          <div className="flex max-w-[200px] flex-wrap gap-1">
            {safeFeatures.slice(0, 2).map((feature, index) => (
              <Badge
                key={`${feature}-${index}`}
                variant="secondary"
                className="text-xs"
              >
                {feature}
              </Badge>
            ))}
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
      id: "status",
      accessorKey: "isActive",
      header: "Status",
      cell: (plan: PlanRecord) => (
        <Badge variant={plan.isActive ? "default" : "secondary"}>
          {plan.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      id: "sortOrder",
      accessorKey: "sortOrder",
      header: "Order",
      cell: (plan: PlanRecord) => (
        <span className="text-muted-foreground text-sm">
          {String(plan.sortOrder ?? 0)}
        </span>
      ),
    },
  ];

  const filters: FilterConfig<PlanRecord>[] = [
    {
      id: "status",
      label: "Status",
      type: "select",
      field: "isActive",
      options: [
        { value: "true", label: "Active" },
        { value: "false", label: "Inactive" },
      ],
    },
    {
      id: "planType",
      label: "Plan Type",
      type: "select",
      field: "name",
      options: [
        { value: "free", label: "Free" },
        { value: "starter", label: "Starter" },
        { value: "business", label: "Business" },
        { value: "agency", label: "Agency" },
      ],
    },
  ];

  const entityActions: EntityAction<PlanRecord>[] = [
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

  const handleConfirmDelete = async () => {
    if (!planToDelete) {
      return;
    }
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
      <EntityList<PlanRecord>
        enableSearch
        data={plansData}
        columns={columns}
        filters={filters}
        isLoading={plans === undefined}
        title="Subscription Plans"
        description="Manage subscription plans, pricing, and features"
        defaultViewMode="list"
        viewModes={["list"]}
        entityActions={entityActions}
        actions={
          <Button onClick={() => setIsFormOpen(true)} className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Create Plan
          </Button>
        }
        emptyState={
          <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed">
            <CreditCard className="text-muted-foreground mb-4 h-12 w-12" />
            <h3 className="text-lg font-medium">No Plans Found</h3>
            <p className="text-muted-foreground mb-4">
              Create your first subscription plan to get started
            </p>
            <Button onClick={() => setIsFormOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Plan
            </Button>
          </div>
        }
      />

      <PlanForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        planId={editingPlanId}
        onSuccess={() => setEditingPlanId(undefined)}
      />

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete plan?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The plan will be removed from all
              associated data.
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
};
