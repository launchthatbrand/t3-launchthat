"use client";

import type { Id } from "@/convex/_generated/dataModel";
import React from "react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Check,
  CreditCard,
  DollarSign,
  Edit,
  Trash2,
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
  AlertDialogTrigger,
} from "@acme/ui/alert-dialog";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Separator } from "@acme/ui/separator";

import { PlanForm } from "../_components/PlanForm";

interface PlanDetailPageProps {
  params: Promise<{
    planId: string;
  }>;
}

interface PlanData {
  _id: Id<"plans">;
  _creationTime: number;
  name: string;
  displayName: string;
  description?: string;
  priceMonthly: number;
  priceYearly?: number;
  maxOrganizations: number;
  features?: string[];
  isActive: boolean;
  sortOrder?: number;
  updatedAt?: number;
}

export default function PlanDetailPage({ params }: PlanDetailPageProps) {
  const resolvedParams = React.use(params);
  const router = useRouter();
  const planId = resolvedParams.planId as Id<"plans">;

  // State
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Queries
  const plans = useQuery(api.organizations.queries.getPlans, {});
  const currentPlan = plans?.find((p: PlanData) => p._id === planId);

  // Mutations
  const deletePlan = useMutation(api.organizations.mutations.deletePlan);

  // Handlers
  const handleEdit = () => {
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deletePlan({ planId });
      toast.success("Plan deleted successfully");
      router.push("/admin/settings/plans");
    } catch (error) {
      console.error("Error deleting plan:", error);
      toast.error("Failed to delete plan");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    toast.success("Plan updated successfully");
  };

  if (plans === undefined) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!currentPlan) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <CreditCard className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-medium">Plan not found</h3>
          <p className="mb-4 text-muted-foreground">
            The requested plan could not be found.
          </p>
          <Button onClick={() => router.push("/admin/settings/plans")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Plans
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/admin/settings/plans")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Plans
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{currentPlan.displayName}</h1>
            <p className="text-muted-foreground">
              Plan details and configuration
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Plan
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Plan</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete the "{currentPlan.displayName}
                  " plan? This action cannot be undone and may affect users
                  currently subscribed to this plan.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete Plan
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Plan Overview Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Basic Info */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plan Type</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {currentPlan.name}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {currentPlan.description}
            </p>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Price</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(currentPlan.priceMonthly / 100).toFixed(2)}
            </div>
            {currentPlan.priceYearly && (
              <p className="mt-1 text-xs text-muted-foreground">
                ${(currentPlan.priceYearly / 100).toFixed(2)}/year
              </p>
            )}
          </CardContent>
        </Card>

        {/* Organization Limit */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentPlan.maxOrganizations === -1
                ? "Unlimited"
                : currentPlan.maxOrganizations}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Maximum organizations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Plan Details */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              Features
            </CardTitle>
            <CardDescription>Features included in this plan</CardDescription>
          </CardHeader>
          <CardContent>
            {currentPlan.features && currentPlan.features.length > 0 ? (
              <ul className="space-y-2">
                {currentPlan.features.map((feature: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No features defined
              </p>
            )}
          </CardContent>
        </Card>

        {/* Plan Status & Metadata */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Plan Information
            </CardTitle>
            <CardDescription>Status and metadata</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status</span>
              <Badge variant={currentPlan.isActive ? "default" : "secondary"}>
                {currentPlan.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Sort Order</span>
              <span className="text-sm">{currentPlan.sortOrder ?? 0}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Created</span>
              <span className="text-sm">
                {new Date(
                  currentPlan._creationTime ?? Date.now(),
                ).toLocaleDateString()}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Last Updated</span>
              <span className="text-sm">
                {new Date(
                  currentPlan.updatedAt ?? Date.now(),
                ).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Form Dialog */}
      <PlanForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        planId={planId}
        onSuccess={handleFormSuccess}
        mode="dialog"
      />
    </div>
  );
}
