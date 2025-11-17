"use client";

import type { Id } from "@/convex/_generated/dataModel";
import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { ColumnDef } from "@tanstack/react-table";
import { useMutation, useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowLeft,
  Building2,
  Check,
  PencilIcon,
  Plus,
  Trash2Icon,
  UserCog,
  Users,
  X,
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
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { CopyText } from "@acme/ui/copy-text";

import type {
  EntityAction,
  FilterConfig,
} from "~/components/shared/EntityList/types";
import { UserForm } from "~/components/admin/UserForm";
import { EntityList } from "~/components/shared/EntityList/EntityList";

interface OrganizationMember {
  _id: Id<"userOrganizations">;
  _creationTime: number;
  organizationId: Id<"organizations">;
  userId: Id<"users">;
  role: "owner" | "admin" | "editor" | "viewer" | "student";
  joinedAt: number;
  invitedBy?: Id<"users">;
  isActive: boolean;
  user: {
    _id: Id<"users">;
    name?: string;
    email: string;
    image?: string;
    role?: "admin" | "user" | "customer";
    username?: string;
    isActive?: boolean;
  };
}

interface UserFormValues {
  name: string;
  email: string;
  role: string;
  username?: string;
  isActive: boolean;
}

export default function OrganizationUsersPage() {
  const params = useParams();
  const router = useRouter();
  const organizationId = params.organizationId as Id<"organizations">;

  // State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<Id<"users"> | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<Id<"users"> | null>(null);

  // Queries
  const organization = useQuery(api.core.organizations.queries.getById, {
    organizationId,
  });
  const members = useQuery(
    api.core.organizations.queries.getOrganizationMembers,
    {
      organizationId,
    },
  );
  const currentUser = useQuery(api.core.users.queries.getMe);

  // Mutations
  const removeUser = useMutation(api.core.organizations.mutations.removeUser);
  const addUser = useMutation(api.core.organizations.mutations.addUser);
  const createUser = useMutation(api.core.users.createOrGetUser);
  const updateUser = useMutation(api.core.users.updateUser);

  // Transform data for EntityList
  const membersData: OrganizationMember[] = (members ||
    []) as OrganizationMember[];

  // Handle user removal
  const handleRemoveUser = async () => {
    if (!userToDelete) return;

    try {
      await removeUser({
        organizationId,
        userId: userToDelete,
      });
      toast.success("User removed from organization");
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (error) {
      toast.error("Failed to remove user");
    }
  };

  // Handle custom form submission for adding users to organization
  const handleFormSubmit = async (data: UserFormValues) => {
    try {
      if (editingUserId) {
        // Update existing user
        await updateUser({
          userId: editingUserId,
          data: {
            name: data.name,
            email: data.email,
            role: data.role,
            isActive: data.isActive,
          },
        });
        toast.success("User updated successfully");
      } else {
        // Try to create the user first - the backend will handle if they already exist
        try {
          const newUserId = await createUser({
            name: data.name,
            email: data.email,
            role: data.role as any,
            isActive: data.isActive,
          });

          // Ensure newUserId is not null before adding to organization
          if (newUserId) {
            // Then add them to the organization
            await addUser({
              organizationId,
              userId: newUserId,
              role: "viewer", // Default role for new users
            });
            toast.success("User created and added to organization");
          }
        } catch (createError: any) {
          // If user creation fails because user exists, the error should be handled by the backend
          // or we could implement a getUserByEmail check here if needed
          console.error("Failed to create/add user:", createError);
          toast.error(
            createError.message || "Failed to add user to organization",
          );
        }
      }
    } catch (error: any) {
      console.error("Failed to save user:", error);
      toast.error(error.message || "Failed to save user");
    }
  };

  // Column definitions
  const columns: ColumnDef<OrganizationMember>[] = [
    {
      id: "user",
      header: "User",
      accessorKey: "user.name",
      cell: ({ row }) => {
        const member = row.original;
        const user = member.user;
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <UserCog className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="font-medium">{user.name ?? "Unnamed User"}</div>
              {user.username && (
                <div className="text-xs text-blue-600">@{user.username}</div>
              )}
              <div className="text-xs text-muted-foreground">{user.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      id: "email",
      header: "Email & ID",
      accessorKey: "user.email",
      cell: ({ row }) => {
        const member = row.original;
        const user = member.user;
        return (
          <div className="flex flex-col gap-1">
            <CopyText value={user.email} className="max-w-fit">
              <span className="font-mono text-sm">{user.email}</span>
            </CopyText>
            <CopyText value={user._id} className="max-w-fit">
              <span className="text-xs text-muted-foreground">{user._id}</span>
            </CopyText>
          </div>
        );
      },
    },
    {
      id: "orgRole",
      header: "Organization Role",
      accessorKey: "role",
      cell: ({ row }) => {
        const member = row.original;
        const roleConfig = {
          owner: { variant: "default" as const, label: "Owner" },
          admin: { variant: "destructive" as const, label: "Admin" },
          editor: { variant: "secondary" as const, label: "Editor" },
          viewer: { variant: "outline" as const, label: "Viewer" },
        };
        const config = roleConfig[member.role] || roleConfig.viewer;
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      id: "systemRole",
      header: "System Role",
      accessorKey: "user.role",
      cell: ({ row }) => {
        const member = row.original;
        const user = member.user;
        const roleConfig = {
          admin: { variant: "default" as const, label: "Admin" },
          user: { variant: "secondary" as const, label: "User" },
          customer: { variant: "outline" as const, label: "Customer" },
        };
        const config = roleConfig[user.role || "user"] || roleConfig.user;
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "user.isActive",
      cell: ({ row }) => {
        const member = row.original;
        const user = member.user;
        return user.isActive !== false ? (
          <Badge
            variant="outline"
            className="border-green-200 bg-green-50 text-green-700"
          >
            <Check className="mr-1 h-3 w-3" /> Active
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="border-amber-200 bg-amber-50 text-amber-700"
          >
            <X className="mr-1 h-3 w-3" /> Inactive
          </Badge>
        );
      },
    },
    {
      id: "joined",
      header: "Joined",
      accessorKey: "joinedAt",
      cell: ({ row }) => {
        const member = row.original;
        return (
          <span className="text-muted-foreground">
            {member.joinedAt
              ? formatDistanceToNow(new Date(member.joinedAt), {
                  addSuffix: true,
                })
              : "Unknown"}
          </span>
        );
      },
    },
  ];

  // Define filter configurations
  const filters: FilterConfig<OrganizationMember>[] = [
    {
      id: "name",
      label: "Name",
      type: "text",
      field: (item) => item.user.name || "",
    },
    {
      id: "email",
      label: "Email",
      type: "text",
      field: (item) => item.user.email,
    },
    {
      id: "orgRole",
      label: "Organization Role",
      type: "select",
      field: "role",
      options: [
        { label: "Owner", value: "owner" },
        { label: "Admin", value: "admin" },
        { label: "Editor", value: "editor" },
        { label: "Viewer", value: "viewer" },
        { label: "Student", value: "student" },
      ],
    },
    {
      id: "systemRole",
      label: "System Role",
      type: "select",
      field: (item) => item.user.role || "",
      options: [
        { label: "Admin", value: "admin" },
        { label: "User", value: "user" },
        { label: "Customer", value: "customer" },
      ],
    },
    {
      id: "isActive",
      label: "Status",
      type: "boolean",
      field: (item) => item.user.isActive !== false,
    },
  ];

  // Define entity actions
  const entityActions: EntityAction<OrganizationMember>[] = [
    {
      id: "edit",
      label: "Edit User",
      icon: <PencilIcon className="h-4 w-4" />,
      onClick: (member) => {
        setEditingUserId(member.user._id);
        setIsFormOpen(true);
      },
    },
    {
      id: "remove",
      label: "Remove from Organization",
      icon: <Trash2Icon className="h-4 w-4" />,
      onClick: (member) => {
        setUserToDelete(member.user._id);
        setIsDeleteDialogOpen(true);
      },
      variant: "destructive",
    },
  ];

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingUserId(null);
  };

  if (organization === undefined || members === undefined) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (organization === null) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Organization Not Found</h1>
          <p className="text-muted-foreground">
            The organization you are looking for could not be found.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push("/admin/settings/organizations")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Organizations
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/admin/settings/organizations")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Organizations
            </Button>
            <div className="text-sm text-muted-foreground">/</div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                router.push(`/admin/settings/organizations/${organizationId}`)
              }
            >
              <Building2 className="mr-2 h-4 w-4" />
              {organization.name}
            </Button>
          </div>
          <h1 className="text-3xl font-bold">Organization Users</h1>
          <p className="text-muted-foreground">
            Manage users and their roles within {organization.name}
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Organization Stats */}
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{membersData.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Members
            </CardTitle>
            <Check className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {membersData.filter((m) => m.user.isActive !== false).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <UserCog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                membersData.filter(
                  (m) => m.role === "admin" || m.role === "owner",
                ).length
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users List */}
      <EntityList<OrganizationMember>
        data={membersData}
        columns={columns}
        filters={filters}
        isLoading={members === undefined}
        title={`${organization.name} Members`}
        description={`Users who have access to ${organization.name}`}
        defaultViewMode="list"
        viewModes={["list"]}
        entityActions={entityActions}
        emptyState={
          <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed">
            <Users className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-medium">No Users Found</h3>
            <p className="text-muted-foreground">
              This organization has no members yet
            </p>
            <Button className="mt-4" onClick={() => setIsFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add First User
            </Button>
          </div>
        }
      />

      {/* User Form Dialog */}
      <UserForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        userId={editingUserId || undefined}
        onSubmit={handleFormSubmit}
        onSuccess={handleFormSuccess}
        mode="dialog"
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove User from Organization</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this user from the organization?
              They will lose access to all organization resources.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveUser}>
              Remove User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
