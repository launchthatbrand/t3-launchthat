"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@acme/ui/dropdown-menu";
import {
  Globe,
  Link,
  LinkIcon,
  MoreHorizontal,
  Plus,
  Settings,
} from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { EntityList } from "@/components/shared/EntityList/EntityList";
import { api } from "@/convex/_generated/api";
import { formatDistanceToNow } from "date-fns";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ConnectionsPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // Fetch all integrations (connections)
  const connections = useQuery(api.rules.integrations.getIntegrations) || [];
  const isLoading = connections === undefined;

  // Prepare data for EntityList
  const connectionItems = connections.map((connection) => {
    // Parse metadata if available
    let metadata = {};
    try {
      if (connection.metadata) {
        metadata = JSON.parse(connection.metadata);
      }
    } catch (error) {
      console.error("Failed to parse metadata", error);
    }

    // Get icon based on integration type
    const getIcon = () => {
      switch (connection.type) {
        case "monday":
          return <LinkIcon className="h-5 w-5 text-blue-500" />;
        case "wordpress":
          return <Globe className="h-5 w-5 text-indigo-500" />;
        default:
          return <Link className="h-5 w-5 text-gray-500" />;
      }
    };

    // Get status badge variant
    const getStatusVariant = () => {
      if (!connection.isEnabled) return "destructive";

      switch (connection.connectionStatus) {
        case "connected":
          return "default";
        case "pending":
          return "secondary";
        case "error":
          return "destructive";
        default:
          return "outline";
      }
    };

    // Format the connection item for the EntityList
    return {
      id: connection._id,
      name: connection.name,
      type: connection.type,
      status: connection.isEnabled
        ? connection.connectionStatus || "unknown"
        : "disabled",
      lastChecked: connection.lastConnectionCheck,
      icon: getIcon(),
      badge: {
        label: connection.isEnabled
          ? connection.connectionStatus || "unknown"
          : "disabled",
        variant: getStatusVariant(),
      },
      metadata,
    };
  });

  // Define column structure for the EntityList
  const columns = [
    {
      id: "name",
      header: "Name",
      accessorKey: "name",
      cell: (item) => (
        <div className="flex items-center gap-2">
          {item.icon}
          <div>
            <div className="font-medium">{item.name}</div>
            <div className="text-xs capitalize text-muted-foreground">
              {item.type}
            </div>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "status",
      cell: (item) => (
        <Badge variant={item.badge.variant}>{item.badge.label}</Badge>
      ),
      sortable: true,
    },
    {
      id: "lastChecked",
      header: "Last Checked",
      accessorKey: "lastChecked",
      cell: (item) => (
        <div className="text-sm">
          {item.lastChecked
            ? formatDistanceToNow(new Date(item.lastChecked), {
                addSuffix: true,
              })
            : "Never"}
        </div>
      ),
      sortable: true,
    },
    {
      id: "actions",
      header: "",
      cell: (item) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() =>
                router.push(`/admin/integrations/${item.type}?id=${item.id}`)
              }
            >
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                router.push(
                  `/admin/integrations/${item.type}/rules?id=${item.id}`,
                )
              }
            >
              Manage Rules
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  // Define filters for the EntityList
  const filters = [
    {
      id: "type",
      label: "Integration Type",
      type: "select",
      options: [
        { label: "All Types", value: "" },
        { label: "Monday.com", value: "monday" },
        { label: "WordPress", value: "wordpress" },
      ],
      field: "type",
    },
    {
      id: "status",
      label: "Status",
      type: "select",
      options: [
        { label: "All Statuses", value: "" },
        { label: "Connected", value: "connected" },
        { label: "Pending", value: "pending" },
        { label: "Error", value: "error" },
        { label: "Disabled", value: "disabled" },
      ],
      field: "status",
    },
  ];

  return (
    <div className="container py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold">Integration Connections</h1>
          <p className="text-muted-foreground">
            Manage all your connected integration instances
          </p>
        </div>
        <Button onClick={() => router.push("/admin/integrations")}>
          <Plus className="mr-2 h-4 w-4" />
          New Connection
        </Button>
      </div>

      <EntityList
        data={connectionItems}
        columns={columns}
        filters={filters}
        isLoading={isLoading}
        title="Integration Connections"
        onRowClick={(item) =>
          router.push(`/admin/integrations/${item.type}?id=${item.id}`)
        }
        emptyState={
          <div className="flex flex-col items-center justify-center py-8">
            <Settings className="mb-2 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-1 text-lg font-medium">No Connections Found</h3>
            <p className="text-center text-sm text-muted-foreground">
              You haven't set up any integration connections yet.
            </p>
            <Button
              className="mt-4"
              onClick={() => router.push("/admin/integrations")}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Connection
            </Button>
          </div>
        }
      />
    </div>
  );
}
