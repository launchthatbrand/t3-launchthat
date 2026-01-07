"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@convex-config/_generated/api";
import type { Id } from "@convex-config/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Activity, PlusCircle, RefreshCw, Search } from "lucide-react";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@acme/ui";

function IntegrationsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabParam ?? "apps");

  // Fetch data from Convex
  const apps =
    useQuery(api.integrations.apps.queries.list, { showDisabled: false }) ?? [];
  const connections =
    useQuery(api.integrations.connections.queries.listWithInternalApps, {}) ??
    [];
  const scenarios = useQuery(api.integrations.scenarios.queries.list, {}) ?? [];

  // Mutations
  const testConnection = useMutation(
    api.integrations.connections.mutations.test,
  );
  const triggerSync = useMutation(api.plugins.vimeo.mutations.triggerSync);

  useEffect(() => {
    // Update URL when tab changes
    if (tabParam !== activeTab) {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", activeTab);
      router.replace(url.pathname + url.search);
    }
  }, [activeTab, router, tabParam]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handleTestConnection = async (connectionId: Id<"connections">) => {
    try {
      const result = await testConnection({ id: connectionId });
      console.log("Test result:", result);
    } catch (error) {
      console.error("Test error:", error);
    }
  };

  const handleCreateScenario = () => {
    router.push("/admin/integrations/scenarios/new");
  };

  const filteredApps = apps.filter(
    (app) =>
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredConnections = connections.filter(
    (conn) =>
      conn.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (conn.app?.name ?? "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredScenarios = scenarios.filter(
    (scen) =>
      scen.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (scen.description ?? "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Integrations</h1>
          <p className="text-muted-foreground">
            Connect with external services and automate data flows
          </p>
        </div>
        <Button onClick={handleCreateScenario}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Scenario
        </Button>
      </div>

      <div className="mb-6 flex items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search integrations..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" className="ml-2">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="mb-4">
          <TabsTrigger value="apps">Available Apps</TabsTrigger>
          <TabsTrigger value="connections">My Connections</TabsTrigger>
          <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
          <TabsTrigger value="logs">Automation Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="apps" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredApps.length > 0 ? (
              filteredApps.map((app) => (
                <Card key={app._id}>
                  <CardHeader className="flex flex-row items-center gap-4">
                    {app.iconUrl ? (
                      <img
                        src={app.iconUrl}
                        alt={app.name}
                        className="h-12 w-12 object-contain"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted">
                        <span className="text-xl font-bold">
                          {app.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <CardTitle>{app.name}</CardTitle>
                      <CardDescription>
                        {app.authType === "internal" || (app).isInternal
                          ? "Built-in App"
                          : app.authType === "none"
                            ? "No Authentication Required"
                            : app.authType === "oauth"
                              ? "OAuth Authentication"
                              : "API Key Authentication"}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {app.description}
                    </p>
                  </CardContent>
                  <CardFooter>
                    {app.authType === "internal" || (app).isInternal ? (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() =>
                          router.push(`/admin/integrations/scenarios/new`)
                        }
                      >
                        Create Scenario
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        className="w-full"
                        onClick={() =>
                          router.push(
                            `/admin/integrations/connect/${app.name.toLowerCase()}`,
                          )
                        }
                      >
                        Connect
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="col-span-3 py-10 text-center">
                <p className="text-muted-foreground">No apps available</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="connections" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredConnections.length > 0 ? (
              filteredConnections.map((connection) => (
                <Card key={connection._id}>
                  <CardHeader>
                    <CardTitle>{connection.name}</CardTitle>
                    <CardDescription>
                      {connection.app?.name ?? "Unknown App"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-2 flex items-center">
                      <div
                        className={`mr-2 h-2 w-2 rounded-full ${
                          connection.status === "active"
                            ? "bg-green-500"
                            : connection.status === "error"
                              ? "bg-red-500"
                              : "bg-yellow-500"
                        }`}
                      />
                      <span className="capitalize">{connection.status}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Last checked:{" "}
                      {connection.lastCheckedAt
                        ? new Date(connection.lastCheckedAt).toLocaleString()
                        : "Never"}
                    </p>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        router.push(
                          `/integrations/connections/${connection._id}`,
                        )
                      }
                    >
                      Manage
                    </Button>
                    {connection.app?.name?.toLowerCase() === "vimeo" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          triggerSync({ connectionId: connection._id })
                        }
                      >
                        Sync
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestConnection(connection._id)}
                      >
                        Test
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="col-span-3 py-10 text-center">
                <p className="text-muted-foreground">
                  No connections available
                </p>
                <Button
                  className="mt-4"
                  variant="outline"
                  onClick={() => setActiveTab("apps")}
                >
                  Add a Connection
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="scenarios" className="space-y-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium">Recent Scenarios</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/admin/integrations/scenarios")}
            >
              View All Scenarios
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredScenarios.length > 0 ? (
              filteredScenarios.map((scenario) => (
                <Card key={scenario._id}>
                  <CardHeader>
                    <CardTitle>{scenario.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-2 flex items-center">
                      <div
                        className={`mr-2 h-2 w-2 rounded-full ${
                          scenario.status === "active"
                            ? "bg-green-500"
                            : scenario.status === "error"
                              ? "bg-red-500"
                              : "bg-yellow-500"
                        }`}
                      />
                      <span className="capitalize">{scenario.status}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Last run:{" "}
                      {scenario.lastExecutedAt
                        ? new Date(scenario.lastExecutedAt).toLocaleString()
                        : "Never run"}
                    </p>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        router.push(
                          `/admin/integrations/scenarios/${scenario._id}`,
                        )
                      }
                    >
                      Edit
                    </Button>
                    <Button variant="outline" size="sm">
                      Run Now
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="col-span-3 py-10 text-center">
                <p className="text-muted-foreground">No scenarios available</p>
                <Button className="mt-4" onClick={handleCreateScenario}>
                  Create a Scenario
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <div className="rounded-lg border bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Automation Logs</h2>
            </div>
            <p className="mb-4 text-muted-foreground">
              View execution logs from all automation scenarios in the system.
            </p>
            <Button
              onClick={() => router.push("/admin/integrations/logs")}
              className="w-full"
            >
              View All Automation Logs
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function IntegrationsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <IntegrationsPageContent />
    </Suspense>
  );
}
