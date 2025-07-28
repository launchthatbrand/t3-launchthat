"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import type {
  ColumnDefinition,
  EntityAction,
  FilterConfig,
} from "~/components/shared/EntityList/types";
import type { Doc, Id } from "@convex-config/_generated/dataModel";
import { Edit, Plus, Shield, Trash2, Users } from "lucide-react";
import { useMutation, useQuery } from "convex/react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
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
  const [searchTerm, setSearchTerm] = useState("");

  // Queries
  const rolesQuery = useQuery(api.roles.functions.getRoles);
  const deleteRoleMutation = useMutation(api.roles.functions.deleteRole);

  // Transform roles data for EntityList
  const roles: RoleData[] = (rolesQuery ?? []).map((role) => ({
    ...role,
    userCount: 0, // TODO: Add query to get user count per role
    permissionCount: 0, // TODO: Add query to get permission count per role
  }));

  // Filter roles based on search
  const filteredRoles = roles.filter(
    (role) =>
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (role.description &&
        role.description.toLowerCase().includes(searchTerm.toLowerCase())),
  );

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
  const columns: ColumnDefinition<RoleData>[] = [
    {
      key: "name",
      title: "Name",
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">{value}</div>
            {row.isSystem && (
              <Badge variant="secondary" className="text-xs">
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
      key: "scope",
      title: "Scope",
      render: (value) => (
        <Badge variant="outline">
          {(value as string).charAt(0).toUpperCase() +
            (value as string).slice(1)}
        </Badge>
      ),
    },
    {
      key: "priority",
      title: "Priority",
      render: (value) => <Badge variant="secondary">{value}</Badge>,
    },
    {
      key: "userCount",
      title: "Users",
      render: (value) => (
        <div className="flex items-center gap-1 text-sm">
          <Users className="h-3 w-3" />
          {value}
        </div>
      ),
    },
    {
      key: "permissionCount",
      title: "Permissions",
      render: (value) => (
        <div className="flex items-center gap-1 text-sm">
          <Shield className="h-3 w-3" />
          {value}
        </div>
      ),
    },
    {
      key: "isAssignable",
      title: "Assignable",
      render: (value) => (
        <Badge variant={value ? "default" : "secondary"}>
          {value ? "Yes" : "No"}
        </Badge>
      ),
    },
  ];

  // Define entity actions
  const entityActions: EntityAction<RoleData>[] = [
    {
      id: "edit",
      label: "Edit Role",
      onClick: (role) => router.push(`/admin/settings/roles/${role._id}/edit`),
      variant: "outline",
      icon: Edit,
    },
    {
      id: "permissions",
      label: "Manage Permissions",
      onClick: (role) =>
        router.push(`/admin/settings/roles/${role._id}/permissions`),
      variant: "outline",
      icon: Shield,
    },
    {
      id: "delete",
      label: "Delete Role",
      onClick: (role) => handleDeleteRole(role),
      variant: "destructive",
      icon: Trash2,
      disabled: (role) => role.isSystem,
    },
  ];

  // Define filter config
  const filterConfig: FilterConfig = {
    searchPlaceholder: "Search roles by name or description...",
    filters: [
      {
        key: "scope",
        label: "Scope",
        type: "select",
        options: [
          { value: "global", label: "Global" },
          { value: "group", label: "Group" },
          { value: "course", label: "Course" },
          { value: "organization", label: "Organization" },
        ],
      },
      {
        key: "isAssignable",
        label: "Assignable",
        type: "select",
        options: [
          { value: "true", label: "Yes" },
          { value: "false", label: "No" },
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
          <EntityList
            data={filteredRoles}
            columns={columns}
            entityActions={entityActions}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filterConfig={filterConfig}
            actions={headerActions}
            emptyState={{
              icon: Shield,
              title: "No roles found",
              description: "Create your first role to get started",
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
