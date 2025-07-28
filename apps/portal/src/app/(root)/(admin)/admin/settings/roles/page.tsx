"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Edit, Plus, Shield, Trash2, Users } from "lucide-react";
import { useMutation, useQuery } from "convex/react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import type { ColumnDef } from "@tanstack/react-table";
import type { Doc } from "@convex-config/_generated/dataModel";
import type { EntityAction } from "~/components/shared/EntityList/types";
import { EntityList } from "~/components/shared/EntityList/EntityList";
import { api } from "@convex-config/_generated/api";
import { toast } from "@acme/ui/toast";
import { useRouter } from "next/navigation";
import { useState } from "react";

// Define the data structure for roles
type RoleData = Doc<"roles"> & {
  userCount: number;
  permissionCount: number;
};

export default function RolesAdminPage() {
  const router = useRouter();

  // Queries
  const rolesQuery = useQuery(api.roles.functions.getRoles);
  const deleteRoleMutation = useMutation(api.roles.functions.deleteRole);

  // Transform roles data for EntityList
  const roles: RoleData[] = (rolesQuery ?? []).map((role) => ({
    ...role,
    userCount: 0, // TODO: Add query to get user count per role
    permissionCount: 0, // TODO: Add query to get permission count per role
  }));

  // Handle role deletion
  const handleDeleteRole = async (role: RoleData) => {
    if (role.isSystem) {
      toast.error("Cannot delete system roles");
      return;
    }

    try {
      await deleteRoleMutation({ roleId: role._id });
      toast.success("Role deleted successfully");
    } catch (error) {
      console.error("Failed to delete role:", error);
      toast.error("Failed to delete role");
    }
  };

  // Define columns for EntityList
  const columns: ColumnDef<RoleData>[] = [
    {
      id: "name",
      header: "Name",
      accessorKey: "name",
      cell: ({ row }) => {
        const role = row.original;
        return (
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium">{role.name}</div>
              {role.isSystem && (
                <Badge variant="secondary" className="text-xs">
                  System
                </Badge>
              )}
            </div>
          </div>
        );
      },
    },
    {
      id: "description",
      header: "Description",
      accessorKey: "description",
      cell: ({ row }) => {
        const role = row.original;
        return (
          <div className="line-clamp-2 text-sm text-muted-foreground">
            {role.description || "No description"}
          </div>
        );
      },
    },
    {
      id: "scope",
      header: "Scope",
      accessorKey: "scope",
      cell: ({ row }) => {
        const role = row.original;
        return (
          <Badge variant="outline">
            {role.scope.charAt(0).toUpperCase() + role.scope.slice(1)}
          </Badge>
        );
      },
    },
    {
      id: "priority",
      header: "Priority",
      accessorKey: "priority",
      cell: ({ row }) => {
        const role = row.original;
        return <Badge variant="secondary">{role.priority}</Badge>;
      },
    },
    {
      id: "userCount",
      header: "Users",
      accessorKey: "userCount",
      cell: ({ row }) => {
        const role = row.original;
        return (
          <div className="flex items-center gap-1 text-sm">
            <Users className="h-3 w-3" />
            {role.userCount}
          </div>
        );
      },
    },
    {
      id: "permissionCount",
      header: "Permissions",
      accessorKey: "permissionCount",
      cell: ({ row }) => {
        const role = row.original;
        return (
          <div className="flex items-center gap-1 text-sm">
            <Shield className="h-3 w-3" />
            {role.permissionCount}
          </div>
        );
      },
    },
    {
      id: "isAssignable",
      header: "Assignable",
      accessorKey: "isAssignable",
      cell: ({ row }) => {
        const role = row.original;
        return (
          <Badge variant={role.isAssignable ? "default" : "secondary"}>
            {role.isAssignable ? "Yes" : "No"}
          </Badge>
        );
      },
    },
  ];

  // Define entity actions
  const entityActions: EntityAction<RoleData>[] = [
    {
      id: "edit",
      label: "Edit Role",
      onClick: (role) => router.push(`/admin/settings/roles/${role._id}/edit`),
      variant: "outline",
      icon: <Edit className="mr-2 h-4 w-4" />,
    },
    {
      id: "permissions",
      label: "Manage Permissions",
      onClick: (role) =>
        router.push(`/admin/settings/roles/${role._id}/permissions`),
      variant: "outline",
      icon: <Shield className="mr-2 h-4 w-4" />,
    },
    {
      id: "delete",
      label: "Delete Role",
      onClick: (role) => void handleDeleteRole(role),
      variant: "destructive",
      icon: <Trash2 className="mr-2 h-4 w-4" />,
      isDisabled: (role) => role.isSystem,
    },
  ];

  // Header actions
  const headerActions = (
    <Button
      onClick={() => router.push("/admin/settings/roles/new")}
      className="gap-2"
    >
      <Plus className="h-4 w-4" />
      Create Role
    </Button>
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Roles</h1>
          <p className="text-muted-foreground">
            Manage user roles and their permissions
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Role Management</CardTitle>
        </CardHeader>
        <CardContent>
          <EntityList<RoleData>
            data={roles}
            columns={columns}
            filters={[]}
            hideFilters={true}
            initialFilters={{}}
            onFiltersChange={() => {}}
            isLoading={rolesQuery === undefined}
            title="Role Management"
            description="Manage user roles and their permissions"
            defaultViewMode="list"
            viewModes={["list"]}
            entityActions={entityActions}
            actions={headerActions}
            emptyState={
              <div className="flex h-40 flex-col items-center justify-center gap-2 text-center">
                <Shield className="h-8 w-8 text-muted-foreground" />
                <p className="text-muted-foreground">No roles found</p>
                <Button
                  variant="outline"
                  onClick={() => router.push("/admin/settings/roles/new")}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create your first role
                </Button>
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
