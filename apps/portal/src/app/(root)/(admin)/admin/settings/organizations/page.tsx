"use client";

import type { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import {
  Building2,
  Crown,
  Eye,
  Pencil,
  PlusCircle,
  Settings,
  Trash2,
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
} from "@acme/ui/entity-list/types";
import { EntityList } from "@acme/ui/entity-list/EntityList";
import { OrganizationForm } from "./_components/OrganizationForm";

// Organization data type
interface OrganizationData {
  _id: Id<"organizations">;
  _creationTime: number;
  name: string;
  slug: string;
  description?: string;
  ownerId: Id<"users">;
  planId: Id<"plans">;
  planName?: string;
  planDisplayName?: string;
  isPublic: boolean;
  allowSelfRegistration: boolean;
  subscriptionStatus:
    | "active"
    | "trialing"
    | "past_due"
    | "canceled"
    | "unpaid"
    | "incomplete";
  memberCount?: number;
  updatedAt: number;
}

export default function OrganizationsSettingsPage() {
  const router = useRouter();

  // State for dialogs
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOrganizationId, setEditingOrganizationId] = useState<
    Id<"organizations"> | undefined
  >();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [organizationToDelete, setOrganizationToDelete] =
    useState<OrganizationData | null>(null);

  // Queries
  const organizations = useQuery(
    api.core.organizations.queries.myOrganizations,
    {},
  );
  const plans = useQuery(api.core.organizations.queries.getPlans, {});

  // Mutations
  const deleteOrganization = useMutation(
    api.core.organizations.mutations.deleteOrganization,
  );

  // Transform organizations data for display
  const organizationsData: OrganizationData[] = (organizations || []).map(
    (org) => ({
      ...org,
      planName: plans?.find((p) => p._id === org.planId)?.name,
      planDisplayName: plans?.find((p) => p._id === org.planId)?.displayName,
      memberCount: 0, // TODO: Add member count from userOrganizations
    }),
  );

  // Column definitions for EntityList
  const columns: ColumnDef<OrganizationData>[] = [
    {
      id: "name",
      header: "Organization",
      accessorKey: "name",
      cell: ({ row }) => {
        const organization = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="font-medium">{organization.name}</div>
              <div className="text-sm text-muted-foreground">
                /{organization.slug}
              </div>
            </div>
          </div>
        );
      },
      sortable: true,
    },
    // {
    //   id: "plan",
    //   header: "Plan",
    //   accessorKey: "planDisplayName",
    //   cell: (organization) => (
    //     <Badge variant="secondary">
    //       {organization.planDisplayName || "Unknown Plan"}
    //     </Badge>
    //   ),
    //   sortable: true,
    // },
    // {
    //   id: "status",
    //   header: "Status",
    //   accessorKey: "subscriptionStatus",
    //   cell: (organization) => {
    //     const statusColors = {
    //       active: "bg-green-100 text-green-800",
    //       trialing: "bg-blue-100 text-blue-800",
    //       past_due: "bg-orange-100 text-orange-800",
    //       canceled: "bg-red-100 text-red-800",
    //       unpaid: "bg-red-100 text-red-800",
    //       incomplete: "bg-yellow-100 text-yellow-800",
    //     };

    //     return (
    //       <Badge
    //         variant="secondary"
    //         className={statusColors[organization.subscriptionStatus] || ""}
    //       >
    //         {organization.subscriptionStatus.replace("_", " ")}
    //       </Badge>
    //     );
    //   },
    //   sortable: true,
    // },
    // {
    //   id: "visibility",
    //   header: "Visibility",
    //   accessorKey: "isPublic",
    //   cell: (organization) => (
    //     <div className="flex items-center gap-2">
    //       <Badge variant={organization.isPublic ? "default" : "secondary"}>
    //         {organization.isPublic ? "Public" : "Private"}
    //       </Badge>
    //       {organization.allowSelfRegistration && (
    //         <Badge variant="outline" className="text-xs">
    //           Self-Join
    //         </Badge>
    //       )}
    //     </div>
    //   ),
    //   sortable: true,
    // },
    // {
    //   id: "members",
    //   header: "Members",
    //   accessorKey: "memberCount",
    //   cell: (organization) => (
    //     <div className="flex items-center gap-2">
    //       <Users className="h-4 w-4 text-muted-foreground" />
    //       <span>{organization.memberCount || 0}</span>
    //     </div>
    //   ),
    //   sortable: true,
    // },
    // {
    //   id: "created",
    //   header: "Created",
    //   accessorKey: "_creationTime",
    //   cell: (organization) => (
    //     <span className="text-sm text-muted-foreground">
    //       {new Date(organization._creationTime).toLocaleDateString()}
    //     </span>
    //   ),
    //   sortable: true,
    // },
  ];

  // Filter configurations for EntityList
  const filters: FilterConfig<OrganizationData>[] = [
    {
      id: "name",
      label: "Name",
      type: "text",
      field: "name",
    },
    {
      id: "plan",
      label: "Plan",
      type: "select",
      field: "planName",
      options: [
        { label: "All Plans", value: "" },
        ...(plans?.map((plan) => ({
          label: plan.displayName,
          value: plan.name,
        })) || []),
      ],
    },
    {
      id: "status",
      label: "Status",
      type: "select",
      field: "subscriptionStatus",
      options: [
        { label: "All Statuses", value: "" },
        { label: "Active", value: "active" },
        { label: "Trialing", value: "trialing" },
        { label: "Past Due", value: "past_due" },
        { label: "Canceled", value: "canceled" },
        { label: "Unpaid", value: "unpaid" },
        { label: "Incomplete", value: "incomplete" },
      ],
    },
    {
      id: "visibility",
      label: "Visibility",
      type: "select",
      field: "isPublic",
      options: [
        { label: "All", value: "" },
        { label: "Public", value: true },
        { label: "Private", value: false },
      ],
    },
  ];

  // Entity actions for each row
  const entityActions: EntityAction<OrganizationData>[] = [
    {
      id: "view",
      label: "View Details",
      icon: <Eye className="h-4 w-4" />,
      onClick: (organization) => {
        router.push(`/admin/settings/organizations/${organization._id}`);
      },
      variant: "outline",
    },
    {
      id: "manage",
      label: "Manage",
      icon: <Settings className="h-4 w-4" />,
      onClick: (organization) => {
        router.push(`/admin/settings/organizations/${organization._id}`);
      },
      variant: "secondary",
    },
    {
      id: "edit",
      label: "Edit",
      icon: <Pencil className="h-4 w-4" />,
      onClick: (organization) => {
        setEditingOrganizationId(organization._id);
        setIsFormOpen(true);
      },
      variant: "secondary",
    },
    {
      id: "delete",
      label: "Delete",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (organization) => {
        setOrganizationToDelete(organization);
        setIsDeleteDialogOpen(true);
      },
      variant: "destructive",
    },
  ];

  // Header actions
  const headerActions = (
    <Button onClick={() => setIsFormOpen(true)}>
      <PlusCircle className="mr-2 h-4 w-4" />
      Create Organization
    </Button>
  );

  // Handle form success
  const handleFormSuccess = () => {
    setEditingOrganizationId(undefined);
    // Optionally refresh data here if needed
  };

  // Handle delete confirmation
  const handleConfirmDelete = async () => {
    if (!organizationToDelete) return;

    try {
      await deleteOrganization({
        organizationId: organizationToDelete._id,
      });

      toast.success(
        `Organization "${organizationToDelete.name}" deleted successfully`,
      );
      setIsDeleteDialogOpen(false);
      setOrganizationToDelete(null);
    } catch (error) {
      console.error("Error deleting organization:", error);
      toast.error("Failed to delete organization");
    }
  };

  return (
    <div className="container mx-auto py-6">
      <EntityList<OrganizationData>
        data={organizationsData}
        columns={columns}
        filters={filters}
        isLoading={organizations === undefined}
        title="Organizations"
        description="Manage organizations, plans, and member access"
        defaultViewMode="list"
        viewModes={["list"]}
        entityActions={entityActions}
        actions={headerActions}
        emptyState={
          <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed">
            <Building2 className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-medium">No Organizations Found</h3>
            <p className="mb-4 text-muted-foreground">
              Create your first organization to get started
            </p>
            <Button onClick={() => setIsFormOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Organization
            </Button>
          </div>
        }
      />

      {/* Organization Form Dialog */}
      <OrganizationForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        organizationId={editingOrganizationId}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Organization</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{organizationToDelete?.name}"?
              This action cannot be undone and will remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Organization
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
