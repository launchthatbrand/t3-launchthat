"use client";

import type { Doc } from "@convex-config/_generated/dataModel";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@convex-config/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Edit, Loader2, Plus, Shield, Trash2, Users } from "lucide-react";

import type { ColumnDefinition, EntityAction } from "@acme/ui/entity-list";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui/dialog";
import { EntityList } from "@acme/ui/entity-list";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { Switch } from "@acme/ui/switch";
import { Textarea } from "@acme/ui/textarea";
import { toast } from "@acme/ui/toast";

// Define the data structure for roles
type RoleData = Doc<"roles"> & {
  userCount: number;
  permissionCount: number;
};

interface NewRoleState {
  name: string;
  description: string;
  scope: "global" | "group" | "course" | "organization";
  isAssignable: boolean;
  priority: number;
  parentId?: string;
}

const defaultRoleState: NewRoleState = {
  name: "",
  description: "",
  scope: "global",
  isAssignable: true,
  priority: 1,
  parentId: undefined,
};

export default function RolesAdminPage() {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState<NewRoleState>(defaultRoleState);
  const [isCreatingRole, setIsCreatingRole] = useState(false);

  // Queries
  const rolesQuery = useQuery(api.core.permissions.queries.getRoles);
  const createRoleMutation = useMutation(
    api.core.permissions.mutations.createRole,
  );
  const deleteRoleMutation = useMutation(
    api.core.permissions.mutations.deleteRole,
  );

  // Transform roles data for EntityList
  const roles: RoleData[] = (rolesQuery ?? []).map((role) => ({
    ...role,
    userCount: 0, // TODO: Add query to get user count per role
    permissionCount: 0, // TODO: Add query to get permission count per role
  }));

  const parentRoleOptions = useMemo(
    () =>
      roles
        .filter((role) => role._id !== newRole.parentId)
        .map((role) => ({
          label: role.name,
          value: role._id,
        })),
    [roles, newRole.parentId],
  );

  const handleCreateRole = async () => {
    if (!newRole.name.trim()) {
      toast.error("Role name is required");
      return;
    }
    setIsCreatingRole(true);
    try {
      await createRoleMutation({
        name: newRole.name.trim(),
        description: newRole.description.trim(),
        scope: newRole.scope,
        isAssignable: newRole.isAssignable,
        priority: Number(newRole.priority) || 1,
        parentId: newRole.parentId ?? undefined,
      });
      toast.success("Role created");
      setNewRole(defaultRoleState);
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Failed to create role", error);
      toast.error("Failed to create role");
    } finally {
      setIsCreatingRole(false);
    }
  };

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
      id: "name",
      header: "Name",
      accessorKey: "name",
      cell: (role) => (
        <div className="flex items-center gap-2">
          <Shield className="text-muted-foreground h-4 w-4" />
          <div>
            <div className="font-medium">{role.name}</div>
            {role.isSystem && (
              <Badge variant="secondary" className="text-xs">
                System
              </Badge>
            )}
          </div>
        </div>
      ),
    },
    {
      id: "description",
      header: "Description",
      accessorKey: "description",
      cell: (role) => (
        <div className="text-muted-foreground line-clamp-2 text-sm">
          {role.description || "No description"}
        </div>
      ),
    },
    {
      id: "scope",
      header: "Scope",
      accessorKey: "scope",
      cell: (role) => (
        <Badge variant="outline">
          {role.scope.charAt(0).toUpperCase() + role.scope.slice(1)}
        </Badge>
      ),
    },
    {
      id: "priority",
      header: "Priority",
      accessorKey: "priority",
      cell: (role) => <Badge variant="secondary">{role.priority}</Badge>,
    },
    {
      id: "userCount",
      header: "Users",
      accessorKey: "userCount",
      cell: (role) => (
        <div className="flex items-center gap-1 text-sm">
          <Users className="h-3 w-3" />
          {role.userCount}
        </div>
      ),
    },
    {
      id: "permissionCount",
      header: "Permissions",
      accessorKey: "permissionCount",
      cell: (role) => (
        <div className="flex items-center gap-1 text-sm">
          <Shield className="h-3 w-3" />
          {role.permissionCount}
        </div>
      ),
    },
    {
      id: "isAssignable",
      header: "Assignable",
      accessorKey: "isAssignable",
      cell: (role) => (
        <Badge variant={role.isAssignable ? "default" : "secondary"}>
          {role.isAssignable ? "Yes" : "No"}
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
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Role
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Create New Role</DialogTitle>
          <DialogDescription>
            Define role metadata and availability
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="role-name">Name</Label>
            <Input
              id="role-name"
              placeholder="e.g., Marketing Manager"
              value={newRole.name}
              onChange={(e) =>
                setNewRole((prev) => ({ ...prev, name: e.target.value }))
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="role-description">Description</Label>
            <Textarea
              id="role-description"
              placeholder="Describe the responsibilities for this role"
              value={newRole.description}
              onChange={(e) =>
                setNewRole((prev) => ({ ...prev, description: e.target.value }))
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="role-scope">Scope</Label>
            <Select
              value={newRole.scope}
              onValueChange={(value) =>
                setNewRole((prev) => ({
                  ...prev,
                  scope: value as NewRoleState["scope"],
                }))
              }
            >
              <SelectTrigger id="role-scope">
                <SelectValue placeholder="Select scope" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="global">Global</SelectItem>
                <SelectItem value="organization">Organization</SelectItem>
                <SelectItem value="group">Group</SelectItem>
                <SelectItem value="course">Course</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="role-parent">Parent Role (optional)</Label>
            <Select
              value={newRole.parentId ?? "none"}
              onValueChange={(value) =>
                setNewRole((prev) => ({
                  ...prev,
                  parentId: value === "none" ? undefined : value,
                }))
              }
            >
              <SelectTrigger id="role-parent">
                <SelectValue placeholder="Select parent role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No parent</SelectItem>
                {parentRoleOptions.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="role-priority">Priority</Label>
            <Input
              id="role-priority"
              type="number"
              min={1}
              value={newRole.priority}
              onChange={(e) =>
                setNewRole((prev) => ({
                  ...prev,
                  priority: Number(e.target.value) || 1,
                }))
              }
            />
            <p className="text-muted-foreground text-xs">
              Higher priority roles can override lower priority permissions.
            </p>
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <div className="space-y-1">
              <Label htmlFor="role-assignable">Assignable</Label>
              <p className="text-muted-foreground text-sm">
                Allow admins to assign this role to users.
              </p>
            </div>
            <Switch
              id="role-assignable"
              checked={newRole.isAssignable}
              onCheckedChange={(checked) =>
                setNewRole((prev) => ({ ...prev, isAssignable: checked }))
              }
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={isCreatingRole}
            onClick={handleCreateRole}
            className="gap-2"
          >
            {isCreatingRole && <Loader2 className="h-4 w-4 animate-spin" />}
            Create Role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
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
            <Shield className="text-muted-foreground h-8 w-8" />
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
    </div>
  );
}
