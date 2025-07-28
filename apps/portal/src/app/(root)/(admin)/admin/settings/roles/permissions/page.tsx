"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import type {
  ColumnDefinition,
  EntityAction,
  FilterConfig,
} from "~/components/shared/EntityList/types";
import type { Doc, Id } from "@convex-config/_generated/dataModel";
import { Edit, Key, Lock, Plus, Shield, Trash2 } from "lucide-react";
import { useMutation, useQuery } from "convex/react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { EntityList } from "~/components/shared/EntityList/EntityList";
import { api } from "@convex-config/_generated/api";
import { toast } from "@acme/ui/toast";
import { useRouter } from "next/navigation";
import { useState } from "react";

// Define the data structure for permissions
type PermissionData = Doc<"permissions"> & {
  roleCount: number;
};

export default function PermissionsAdminPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  // Queries
  const permissionsQuery = useQuery(api.permissions.functions.getPermissions);
  const deletePermissionMutation = useMutation(
    api.permissions.functions.deletePermission,
  );

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
  const columns: ColumnDefinition<PermissionData>[] = [
    {
      key: "name",
      title: "Name",
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <Key className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">{value}</div>
            <div className="font-mono text-xs text-muted-foreground">
              {row.key}
            </div>
            {row.isSystem && (
              <Badge variant="secondary" className="mt-1 text-xs">
                System
              </Badge>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "description",
      title: "Description",
      render: (value) => (
        <div className="line-clamp-2 text-sm text-muted-foreground">
          {value || "No description"}
        </div>
      ),
    },
    {
      key: "resource",
      title: "Resource",
      render: (value) => (
        <Badge variant="outline">
          {(value as string).charAt(0).toUpperCase() +
            (value as string).slice(1)}
        </Badge>
      ),
    },
    {
      key: "action",
      title: "Action",
      render: (value) => (
        <Badge variant="secondary">
          {(value as string).charAt(0).toUpperCase() +
            (value as string).slice(1)}
        </Badge>
      ),
    },
    {
      key: "defaultLevel",
      title: "Default Level",
      render: (value) => {
        const levelColors = {
          none: "destructive",
          own: "secondary",
          group: "default",
          all: "default",
        } as const;

        return (
          <Badge
            variant={
              levelColors[value as keyof typeof levelColors] || "secondary"
            }
          >
            {(value as string).charAt(0).toUpperCase() +
              (value as string).slice(1)}
          </Badge>
        );
      },
    },
    {
      key: "category",
      title: "Category",
      render: (value) => (
        <Badge variant="outline">
          {value
            ? (value as string).charAt(0).toUpperCase() +
              (value as string).slice(1)
            : "Uncategorized"}
        </Badge>
      ),
    },
    {
      key: "roleCount",
      title: "Roles",
      render: (value) => (
        <div className="flex items-center gap-1 text-sm">
          <Shield className="h-3 w-3" />
          {value}
        </div>
      ),
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
      icon: Edit,
    },
    {
      id: "roles",
      label: "View Roles",
      onClick: (permission) =>
        router.push(`/admin/settings/permissions/${permission._id}/roles`),
      variant: "outline",
      icon: Shield,
    },
    {
      id: "delete",
      label: "Delete Permission",
      onClick: (permission) => handleDeletePermission(permission),
      variant: "destructive",
      icon: Trash2,
      disabled: (permission) => permission.isSystem,
    },
  ];

  // Define filter config
  const filterConfig: FilterConfig = {
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
          <EntityList
            data={filteredPermissions}
            columns={columns}
            entityActions={entityActions}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filterConfig={filterConfig}
            actions={headerActions}
            emptyState={{
              icon: Key,
              title: "No permissions found",
              description: "Create your first permission to get started",
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
