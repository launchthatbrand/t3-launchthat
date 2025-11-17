"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ColumnDef } from "@tanstack/react-table";
import { useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import { Check, PencilIcon, Plus, UserCog, X } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { CopyText } from "@acme/ui/copy-text";

// Import EntityList components
import type {
  EntityAction,
  FilterConfig,
} from "~/components/shared/EntityList/types";
import { UserForm } from "~/components/admin/UserForm";
import { EntityList } from "~/components/shared/EntityList/EntityList";

interface User {
  _id: Id<"users">;
  _creationTime: number;
  name?: string;
  email: string;
  role: "admin" | "user" | "customer";
  username?: string;
  isActive?: boolean;
  tokenIdentifier?: string;
  addresses?: Array<{
    addressLine1: string;
    addressLine2?: string;
    city: string;
    country: string;
    fullName: string;
    phoneNumber?: string;
    postalCode: string;
    stateOrProvince: string;
  }>;
}

export default function ClientUsersPage() {
  const router = useRouter();

  // State for user form
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<Id<"users"> | null>(null);

  // First get current user to confirm admin status
  const me = useQuery(api.core.users.queries.getMe);

  console.log("me", me);

  const isMeAdmin = me?.role === "admin";

  // Fetch all users only if admin; otherwise skip
  const allUsersResult = useQuery(
    api.core.users.queries.listUsers,
    isMeAdmin ? {} : "skip",
  );

  const allUsers: User[] = allUsersResult ?? [];

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingUserId(null);
  };

  if (me && !isMeAdmin) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed">
        <X className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="text-lg font-medium">Access Denied</h3>
        <p className="text-muted-foreground">
          You must be an administrator to view this page.
        </p>
      </div>
    );
  }

  // Define column configurations for EntityList
  const columns: ColumnDef<User>[] = [
    {
      id: "user",
      header: "User",
      accessorKey: "name",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex flex-col">
            <span className="font-medium">{user.name ?? "Unnamed User"}</span>
            {user.username && (
              <span className="text-xs text-blue-600">@{user.username}</span>
            )}
            {user.email && (
              <span className="text-xs text-muted-foreground">
                {user.email}
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: "email",
      header: "Email",
      accessorKey: "email",
      cell: ({ row }) => {
        const user = row.original;
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
      id: "status",
      header: "Status",
      accessorKey: "isActive",
      cell: ({ row }) => {
        const user = row.original;
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
      accessorKey: "_creationTime",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <span className="text-muted-foreground">
            {user._creationTime
              ? formatDistanceToNow(new Date(user._creationTime), {
                  addSuffix: true,
                })
              : "Unknown"}
          </span>
        );
      },
    },
    {
      id: "role",
      header: "Role",
      accessorKey: "role",
      cell: ({ row }) => {
        const user = row.original;
        const roleConfig = {
          admin: { variant: "default" as const, label: "Admin" },
          user: { variant: "secondary" as const, label: "User" },
          customer: { variant: "outline" as const, label: "Customer" },
        };
        const config = roleConfig[user.role] || roleConfig.user;
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      id: "address",
      header: "Address",
      accessorKey: "addresses",
      cell: ({ row }) => {
        const user = row.original;
        if (!user.addresses || user.addresses.length === 0) {
          return <span className="text-muted-foreground">No address</span>;
        }
        const address = user.addresses[0];
        return (
          <div className="flex flex-col">
            <span className="text-sm">{address.fullName}</span>
            <span className="text-xs text-muted-foreground">
              {address.city}, {address.stateOrProvince} {address.postalCode}
            </span>
            {address.phoneNumber && (
              <span className="text-xs text-muted-foreground">
                {address.phoneNumber}
              </span>
            )}
          </div>
        );
      },
    },
  ];

  // Define filter configurations
  const filters: FilterConfig<User>[] = [
    {
      id: "name",
      label: "Name",
      type: "text",
      field: "name",
    },
    {
      id: "username",
      label: "Username",
      type: "text",
      field: "username",
    },
    {
      id: "email",
      label: "Email",
      type: "text",
      field: "email",
    },
    {
      id: "role",
      label: "Role",
      type: "select",
      field: "role",
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
      field: "isActive",
    },
  ];

  // Define entity actions
  const entityActions: EntityAction<User>[] = [
    {
      id: "edit",
      label: "Edit User",
      icon: <PencilIcon className="h-4 w-4" />,
      onClick: (user) => {
        setEditingUserId(user._id);
        setIsFormOpen(true);
      },
    },
    {
      id: "view",
      label: "View Details",
      onClick: (user) => router.push(`/admin/users/${user._id}`),
      variant: "outline",
    },
  ];

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage users and their roles</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      <EntityList<User>
        data={allUsers}
        columns={columns}
        filters={filters}
        isLoading={allUsersResult === undefined}
        title="User Management"
        description="Manage users and their roles"
        defaultViewMode="list"
        viewModes={["list"]}
        entityActions={entityActions}
        emptyState={
          <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed">
            <UserCog className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-medium">No Users Found</h3>
            <p className="text-muted-foreground">No users in the system yet</p>
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
        onSuccess={handleFormSuccess}
        mode="dialog"
      />
    </div>
  );
}
