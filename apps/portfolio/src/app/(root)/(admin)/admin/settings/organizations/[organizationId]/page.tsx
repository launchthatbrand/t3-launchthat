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
  CreditCard,
  Crown,
  Edit,
  Globe,
  Settings,
  Trash2,
  UserPlus,
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

import { LoadingSpinner } from "~/components/ui/loading-spinner";
import { OrganizationForm } from "../_components/OrganizationForm";

interface OrganizationDetailPageProps {
  params: Promise<{
    organizationId: string;
  }>;
}

export default function OrganizationDetailPage({
  params,
}: OrganizationDetailPageProps) {
  const resolvedParams = React.use(params);
  const router = useRouter();
  const organizationId = resolvedParams.organizationId as Id<"organizations">;

  // State
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Queries
  const organization = useQuery(api.organizations.queries.getById, {
    organizationId,
  });
  const plans = useQuery(api.organizations.queries.getPlans, {});

  // Mutations
  const deleteOrganization = useMutation(
    api.organizations.mutations.deleteOrganization,
  );

  // Get plan details
  const currentPlan = plans?.find((p: any) => p._id === organization?.planId);

  // Handlers
  const handleEdit = () => {
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteOrganization({ organizationId });
      toast.success("Organization deleted successfully");
      router.push("/admin/settings/organizations");
    } catch (error) {
      console.error("Error deleting organization:", error);
      toast.error("Failed to delete organization");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    toast.success("Organization updated successfully");
  };

  if (organization === undefined) {
    return <LoadingSpinner />;
  }

  if (organization === null) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Building2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-medium">Organization not found</h3>
          <p className="mb-4 text-muted-foreground">
            The requested organization could not be found.
          </p>
          <Button onClick={() => router.push("/admin/settings/organizations")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Organizations
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
            onClick={() => router.push("/admin/settings/organizations")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Organizations
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{organization.name}</h1>
            <p className="text-muted-foreground">
              Organization details and settings
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Organization
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
                <AlertDialogTitle>Delete Organization</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{organization.name}"? This
                  action cannot be undone and will remove all associated data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete Organization
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Organization Overview Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        {/* Basic Info */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organization</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{organization.name}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {organization.slug}
            </p>
          </CardContent>
        </Card>

        {/* Plan Info */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentPlan?.displayName ?? "No Plan"}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {currentPlan
                ? `$${(currentPlan.priceMonthly / 100).toFixed(2)}/mo`
                : "Not assigned"}
            </p>
          </CardContent>
        </Card>

        {/* Subscription Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {organization.subscriptionStatus}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Subscription status
            </p>
          </CardContent>
        </Card>

        {/* Owner */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Owner</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {organization.ownerId ? "Assigned" : "No Owner"}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Organization owner
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Organization Details */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Organization Settings
            </CardTitle>
            <CardDescription>Configuration and access settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Visibility</span>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <Badge
                  variant={organization.isPublic ? "default" : "secondary"}
                >
                  {organization.isPublic ? "Public" : "Private"}
                </Badge>
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Self Registration</span>
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-muted-foreground" />
                <Badge
                  variant={
                    organization.allowSelfRegistration ? "default" : "secondary"
                  }
                >
                  {organization.allowSelfRegistration ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Description</span>
              <span className="text-sm text-muted-foreground">
                {organization.description ?? "No description"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Metadata */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Organization Information
            </CardTitle>
            <CardDescription>Timestamps and metadata</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Created</span>
              <span className="text-sm">
                {new Date(
                  organization.createdAt ?? Date.now(),
                ).toLocaleDateString()}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Last Updated</span>
              <span className="text-sm">
                {new Date(
                  organization.updatedAt ?? Date.now(),
                ).toLocaleDateString()}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Organization ID</span>
              <span className="rounded bg-muted px-2 py-1 font-mono text-xs">
                {organization._id}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Slug</span>
              <span className="font-mono text-sm">{organization.slug}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Information */}
      {organization.description && (
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {organization.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Edit Form Dialog */}
      <OrganizationForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        organizationId={organizationId}
        onSuccess={handleFormSuccess}
        mode="dialog"
      />
    </div>
  );
}
