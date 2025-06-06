"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import { Check, UserCog, X } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

// Import EntityList components
import type {
  ColumnDefinition,
  EntityAction,
  FilterConfig,
} from "~/components/shared/EntityList/types";
import { EntityList } from "~/components/shared/EntityList/EntityList";

interface User {
  _id: Id<"users">;
  _creationTime: number;
  name?: string;
  email: string;
  role: "admin" | "user";
  isActive?: boolean;
  tokenIdentifier?: string;
}

export default function ClientUsersPage() {
  const router = useRouter();

  // Get all users using the listAllUsers endpoint
  const allUsersResult = useQuery(api.users.listAllUsers);
  const allUsers: User[] = allUsersResult ?? [];

  // Define column configurations for EntityList
  const columns: ColumnDefinition<User>[] = [
    {
      id: "user",
      header: "User",
      accessorKey: "name",
      sortable: true,
      cell: (user) => (
        <div className="flex flex-col">
          <span>{user.name ?? "Unnamed User"}</span>
          {user.email && (
            <span className="text-xs text-muted-foreground">{user.email}</span>
          )}
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "isActive",
      sortable: true,
      cell: (user) =>
        user.isActive !== false ? (
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
        ),
    },
    {
      id: "joined",
      header: "Joined",
      accessorKey: "_creationTime",
      sortable: true,
      cell: (user) => (
        <span className="text-muted-foreground">
          {user._creationTime
            ? formatDistanceToNow(new Date(user._creationTime), {
                addSuffix: true,
              })
            : "Unknown"}
        </span>
      ),
    },
    {
      id: "role",
      header: "Role",
      accessorKey: "role",
      sortable: true,
      cell: (user) => (
        <Badge variant={user.role === "admin" ? "default" : "secondary"}>
          {user.role}
        </Badge>
      ),
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
      id: "view",
      label: "View Details",
      onClick: (user) => router.push(`/admin/users/${user._id}`),
      variant: "outline",
    },
  ];

  return (
    <div className="container mx-auto py-6">
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
          </div>
        }
      />
    </div>
  );
}
