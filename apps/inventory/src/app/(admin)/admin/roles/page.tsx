"use client";

import React, { useState } from "react";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Info, Shield } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@acme/ui/alert";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";

// Import EntityList components
import type {
  ColumnDefinition,
  EntityAction,
  FilterConfig,
} from "~/components/shared/EntityList/types";
import { EntityList } from "~/components/shared/EntityList/EntityList";

// Define the Role interface
interface Role {
  _id: string;
  name: string;
  description: string;
  scope: string;
  priority: number;
  isSystem: boolean;
}

export default function RolesPage() {
  const seedRolesAndPermissions = useMutation(
    api.seedPermissions.seedInitialRolesAndPermissions,
  );
  const [seedStatus, setSeedStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Get all roles
  const rolesData = useQuery(api.roles.getRoles) || [];
  const roles = rolesData as Role[];

  // Define column configurations for EntityList
  const columns: ColumnDefinition<Role>[] = [
    {
      id: "name",
      header: "Name",
      accessorKey: "name",
      sortable: true,
      cell: (role) => <span className="font-medium">{role.name}</span>,
    },
    {
      id: "description",
      header: "Description",
      accessorKey: "description",
      sortable: true,
    },
    {
      id: "scope",
      header: "Scope",
      accessorKey: "scope",
      sortable: true,
    },
    {
      id: "priority",
      header: "Priority",
      accessorKey: "priority",
      sortable: true,
    },
    {
      id: "isSystem",
      header: "System",
      accessorKey: "isSystem",
      sortable: true,
      cell: (role) =>
        role.isSystem ? (
          <Badge variant="secondary">
            <Shield className="mr-1 h-3 w-3" /> System
          </Badge>
        ) : (
          <Badge variant="outline">Custom</Badge>
        ),
    },
  ];

  // Define filter configurations
  const filters: FilterConfig<Role>[] = [
    {
      id: "name",
      label: "Name",
      type: "text",
      field: "name",
    },
    {
      id: "scope",
      label: "Scope",
      type: "text",
      field: "scope",
    },
    {
      id: "isSystem",
      label: "System Role",
      type: "boolean",
      field: "isSystem",
    },
  ];

  const handleSeed = async () => {
    setSeedStatus("loading");
    try {
      const result = await seedRolesAndPermissions();
      if (result.success) {
        setSeedStatus("success");
        setStatusMessage("Roles and permissions seeded successfully!");
      } else {
        setSeedStatus("success");
        setStatusMessage(result.message);
      }
    } catch (error) {
      console.error("Error seeding roles and permissions:", error);
      setSeedStatus("error");
      setStatusMessage(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  };

  // If no roles, show the initialization card
  if (roles.length === 0) {
    return (
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Role Management</h1>
          <p className="text-muted-foreground">
            Manage roles and their permissions
          </p>
        </div>

        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertTitle>Setup Required</AlertTitle>
          <AlertDescription>
            You need to seed the initial roles and permissions data before using
            this feature.
          </AlertDescription>
        </Alert>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Initialize Role System</CardTitle>
            <CardDescription>
              Seed the database with initial roles and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p>
                This will create the necessary roles and permissions in the
                database. This is a one-time operation that should be done after
                setting up the application.
              </p>

              {seedStatus === "success" && (
                <Alert className="border-green-200 bg-green-50 text-green-700">
                  <Info className="h-4 w-4" />
                  <AlertTitle>Success</AlertTitle>
                  <AlertDescription>{statusMessage}</AlertDescription>
                </Alert>
              )}

              {seedStatus === "error" && (
                <Alert variant="destructive">
                  <Info className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{statusMessage}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleSeed}
                disabled={seedStatus === "loading"}
                className="mt-4"
              >
                {seedStatus === "loading"
                  ? "Seeding..."
                  : "Initialize Roles & Permissions"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Roles</CardTitle>
            <CardDescription>View and manage system roles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed">
              <Shield className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-medium">No Roles Available</h3>
              <p className="text-muted-foreground">
                Initialize the role system first using the button above
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If roles exist, show the EntityList
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Role Management</h1>
        <p className="text-muted-foreground">
          Manage roles and their permissions
        </p>
      </div>

      {seedStatus === "success" && (
        <Alert className="mb-6 border-green-200 bg-green-50 text-green-700">
          <Info className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{statusMessage}</AlertDescription>
        </Alert>
      )}

      <EntityList<Role>
        data={roles}
        columns={columns}
        filters={filters}
        isLoading={rolesData === undefined}
        title="Roles"
        description="View and manage system roles"
        defaultViewMode="list"
        viewModes={["list"]}
        entityActions={[]}
        emptyState={
          <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed">
            <Shield className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-medium">No Roles Available</h3>
            <p className="text-muted-foreground">
              Initialize the role system first
            </p>
          </div>
        }
      />
    </div>
  );
}
