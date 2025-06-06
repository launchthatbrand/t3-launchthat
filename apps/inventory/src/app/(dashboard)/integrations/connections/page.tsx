"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ConnectionDetails from "@/components/integrations/connections/ConnectionDetails";
import ConnectionsList from "@/components/integrations/connections/ConnectionsList";
import ConnectionUsageStats from "@/components/integrations/connections/ConnectionUsageStats";
import NewConnectionModal from "@/components/integrations/connections/NewConnectionModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Filter, Plus, Search, X } from "lucide-react";

/**
 * Connections Management Page
 *
 * Provides a complete interface for managing integrations with third-party services:
 * - View all connections with status indicators
 * - Add new connections with OAuth flow support
 * - Monitor connection status and usage
 * - Update and delete existing connections
 * - Filter and search for specific connections
 */
export default function ConnectionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("all");
  const [selectedConnectionId, setSelectedConnectionId] = useState<
    string | null
  >(null);
  const [isAddingConnection, setIsAddingConnection] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredConnections, setFilteredConnections] = useState<any[]>([]);

  // Check if there's a connection ID in the URL
  useEffect(() => {
    const connectionId = searchParams.get("id");
    if (connectionId) {
      setSelectedConnectionId(connectionId);
    }
  }, [searchParams]);

  // Fetch connections with optional status filter
  const connections = useQuery(
    api.integrations.connections.management.listConnections,
    {
      status: activeTab !== "all" ? activeTab : undefined,
    },
  );

  // Fetch apps for the new connection modal
  const apps = useQuery(api.integrations.apps.listApps);

  // Filter connections based on search query
  useEffect(() => {
    if (!connections) return;

    if (!searchQuery.trim()) {
      setFilteredConnections(connections);
      return;
    }

    const filtered = connections.filter((connection) => {
      // Search in connection name and app name
      const nameMatch = connection.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const appNameMatch = connection.app?.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      return nameMatch || appNameMatch;
    });

    setFilteredConnections(filtered);
  }, [connections, searchQuery]);

  // Handle connection selection
  const handleSelectConnection = (connectionId: string) => {
    setSelectedConnectionId(connectionId);
    // Update URL with connection ID for sharing/bookmarking
    router.push(`/integrations/connections?id=${connectionId}`);
  };

  // Clear search query
  const handleClearSearch = () => {
    setSearchQuery("");
  };

  return (
    <div className="container space-y-6 py-6">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <h1 className="text-3xl font-bold">Connection Management</h1>
        <Button
          onClick={() => setIsAddingConnection(true)}
          className="flex items-center gap-1"
        >
          <Plus className="h-4 w-4" />
          Add Connection
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-1">
          {/* Search and filter controls */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Filter Connections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search connections..."
                  className="pl-8 pr-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="error">Error</TabsTrigger>
                  <TabsTrigger value="configured">Setup</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardContent>
          </Card>

          {/* Connections list */}
          <Card>
            <CardContent className="p-0 pt-2">
              {connections ? (
                <ConnectionsList
                  connections={
                    filteredConnections.length > 0
                      ? filteredConnections
                      : connections
                  }
                  selectedConnectionId={selectedConnectionId}
                  onSelect={handleSelectConnection}
                />
              ) : (
                <div className="flex h-64 items-center justify-center">
                  <LoadingSpinner />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Connection Usage Statistics */}
          <ConnectionUsageStats />
        </div>

        <div className="md:col-span-2">
          {selectedConnectionId ? (
            <ConnectionDetails
              connectionId={selectedConnectionId}
              onClose={() => {
                setSelectedConnectionId(null);
                router.push("/integrations/connections");
              }}
            />
          ) : (
            <div className="flex h-80 flex-col items-center justify-center rounded-lg border bg-background p-6 shadow">
              <h2 className="mb-2 text-xl font-semibold">
                No Connection Selected
              </h2>
              <p className="max-w-md text-center text-muted-foreground">
                Select a connection from the list to view details, check status,
                or manage settings. Alternatively, add a new connection to get
                started.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setIsAddingConnection(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add New Connection
              </Button>
            </div>
          )}
        </div>
      </div>

      {isAddingConnection && apps && (
        <NewConnectionModal
          apps={apps}
          isOpen={isAddingConnection}
          onClose={() => setIsAddingConnection(false)}
        />
      )}
    </div>
  );
}
