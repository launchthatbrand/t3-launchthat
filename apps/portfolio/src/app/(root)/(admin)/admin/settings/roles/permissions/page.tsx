"use client";

import type { Doc } from "@convex-config/_generated/dataModel";
import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@convex-config/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Edit, Key, Lock, Plus, Shield, Trash2 } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { toast } from "@acme/ui/toast";

import type {
  EntityAction,
  FilterConfig,
} from "~/components/shared/EntityList/types";
import { EntityList } from "~/components/shared/EntityList/EntityList";

// Define the data structure for permissions
type PermissionData = Doc<"permissions"> & {
  roleCount: number;
};

export default function PermissionsAdminPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  // Queries
  const permissionsQuery = useQuery(api.core.getAllPermissions);
  const deletePermissionMutation = useMutation(api.core.revokeUserPermission);

  // Transform permissions data for EntityList
  const permissions: PermissionData[] = (permissionsQuery ?? []).map(
    (permission) => ({
      ...permission,
      roleCount: 0, // TODO: Add query to get role count per permission
    }),
  );

  // Filter permissions based on search
  const filteredPermissions = permissions.filter(
    (permission) =>
      permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (permission.description &&
        permission.description
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      permission.resource.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Handle permission deletion
  const handleDeletePermission = async (permission: PermissionData) => {
    if (permission.isSystem) {
      toast.error("Cannot delete system permissions");
      return;
    }

    try {
      await deletePermissionMutation({ permissionId: permission._id });
      toast.success("Permission deleted successfully");
    } catch (error) {
      console.error("Failed to delete permission:", error);
      toast.error("Failed to delete permission");
    }
  };

  // Define columns for EntityList
  const columns: ColumnDef<PermissionData>[] = [
    {
      id: "name",
      header: "Name",
      accessorKey: "name",
      cell: ({ row }) => {
        const permission = row.original;
        return (
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium">{permission.name}</div>
              <div className="font-mono text-xs text-muted-foreground">
                {permission.key}
              </div>
              {permission.isSystem && (
                <Badge variant="secondary" className="mt-1 text-xs">
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
        const permission = row.original;
        return (
          <div className="line-clamp-2 text-sm text-muted-foreground">
            {permission.description ?? "No description"}
          </div>
        );
      },
    },
    {
      id: "resource",
      header: "Resource",
      accessorKey: "resource",
      cell: ({ row }) => {
        const permission = row.original;
        return (
          <Badge variant="outline">
            {permission.resource.charAt(0).toUpperCase() +
              permission.resource.slice(1)}
          </Badge>
        );
      },
    },
    {
      id: "action",
      header: "Action",
      accessorKey: "action",
      cell: ({ row }) => {
        const permission = row.original;
        return (
          <Badge variant="secondary">
            {permission.action.charAt(0).toUpperCase() +
              permission.action.slice(1)}
          </Badge>
        );
      },
    },
    {
      id: "defaultLevel",
      header: "Default Level",
      accessorKey: "defaultLevel",
      cell: ({ row }) => {
        const permission = row.original;
        const levelColors = {
          none: "destructive",
          own: "secondary",
          group: "default",
          all: "default",
        } as const;

        return (
          <Badge
            variant={
              levelColors[
                permission.defaultLevel as keyof typeof levelColors
              ] ?? "secondary"
            }
          >
            {permission.defaultLevel.charAt(0).toUpperCase() +
              permission.defaultLevel.slice(1)}
          </Badge>
        );
      },
    },
    {
      id: "category",
      header: "Category",
      accessorKey: "category",
      cell: ({ row }) => {
        const permission = row.original;
        return (
          <Badge variant="outline">
            {permission.category
              ? permission.category.charAt(0).toUpperCase() +
                permission.category.slice(1)
              : "Uncategorized"}
          </Badge>
        );
      },
    },
    {
      id: "roleCount",
      header: "Roles",
      accessorKey: "roleCount",
      cell: ({ row }) => {
        const permission = row.original;
        return (
          <div className="flex items-center gap-1 text-sm">
            <Shield className="h-3 w-3" />
            {permission.roleCount}
          </div>
        );
      },
    },
  ];

  // Define entity actions
  const entityActions: EntityAction<PermissionData>[] = [
    {
      id: "edit",
      label: "Edit Permission",
      onClick: (permission) =>
        router.push(`/admin/settings/permissions/${permission._id}/edit`),
      variant: "outline",
      icon: <Edit className="mr-2 h-4 w-4" />,
    },
    {
      id: "roles",
      label: "View Roles",
      onClick: (permission) =>
        router.push(`/admin/settings/permissions/${permission._id}/roles`),
      variant: "outline",
      icon: <Shield className="mr-2 h-4 w-4" />,
    },
    {
      id: "delete",
      label: "Delete Permission",
      onClick: (permission) => void handleDeletePermission(permission),
      variant: "destructive",
      icon: <Trash2 className="mr-2 h-4 w-4" />,
      isDisabled: (permission) => permission.isSystem,
    },
  ];

  // Define filter config
  const filterConfig: FilterConfig<PermissionData> = {
    searchPlaceholder: "Search permissions by name, key, or resource...",
    filters: [
      {
        key: "resource",
        label: "Resource",
        type: "select",
        options: [
          { value: "orders", label: "Orders" },
          { value: "products", label: "Products" },
          { value: "users", label: "Users" },
          { value: "roles", label: "Roles" },
          { value: "permissions", label: "Permissions" },
          { value: "courses", label: "Courses" },
          { value: "system", label: "System" },
        ],
      },
      {
        key: "action",
        label: "Action",
        type: "select",
        options: [
          { value: "create", label: "Create" },
          { value: "read", label: "Read" },
          { value: "update", label: "Update" },
          { value: "delete", label: "Delete" },
          { value: "manage", label: "Manage" },
          { value: "view", label: "View" },
        ],
      },
      {
        key: "defaultLevel",
        label: "Default Level",
        type: "select",
        options: [
          { value: "none", label: "None" },
          { value: "own", label: "Own" },
          { value: "group", label: "Group" },
          { value: "all", label: "All" },
        ],
      },
      {
        key: "category",
        label: "Category",
        type: "select",
        options: [
          { value: "admin", label: "Admin" },
          { value: "content", label: "Content" },
          { value: "ecommerce", label: "E-commerce" },
          { value: "user", label: "User" },
          { value: "system", label: "System" },
        ],
      },
      {
        key: "isSystem",
        label: "Type",
        type: "select",
        options: [
          { value: "true", label: "System" },
          { value: "false", label: "Custom" },
        ],
      },
    ],
  };

  // Header actions
  const headerActions = (
    <Button
      onClick={() => router.push("/admin/settings/permissions/new")}
      className="gap-2"
    >
      <Plus className="h-4 w-4" />
      Create Permission
    </Button>
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Permissions</h1>
          <p className="text-muted-foreground">
            Manage system permissions and their role assignments
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Permission Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EntityList<PermissionData>
            data={filteredPermissions}
            columns={columns}
            filters={[]}
            hideFilters={true}
            initialFilters={{}}
            onFiltersChange={() => {}}
            isLoading={permissionsQuery === undefined}
            title="Permission Management"
            description="Manage system permissions and their role assignments"
            defaultViewMode="list"
            viewModes={["list"]}
            entityActions={entityActions}
            actions={headerActions}
            emptyState={
              <div className="flex h-40 flex-col items-center justify-center gap-2 text-center">
                <Key className="h-8 w-8 text-muted-foreground" />
                <p className="text-muted-foreground">No permissions found</p>
                <Button
                  variant="outline"
                  onClick={() => router.push("/admin/settings/permissions/new")}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create your first permission
                </Button>
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
