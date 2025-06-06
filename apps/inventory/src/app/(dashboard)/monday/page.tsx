"use client";

import { CalendarX2, ListTodo, Settings2, SyncIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";

import { Badge } from "@acme/ui/badge";
import { BoardMappings } from "@/components/monday/BoardMappings";
import { Button } from "@acme/ui/button";
import { IntegrationForm } from "@/components/monday/IntegrationForm";
import { IntegrationSetup } from "@/components/monday/IntegrationSetup";
import Link from "next/link";
import { Skeleton } from "@acme/ui/skeleton";
import { SyncRulesManager } from "@/components/monday/SyncRulesManager";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { useState } from "react";

export default function MondayIntegrationPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const integration = useQuery(api.monday.queries.getDefaultIntegration);

  if (integration === undefined) {
    return (
      <div className="container space-y-6 py-10">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const isConfigured = integration !== null && integration.apiKey;

  return (
    <div className="container space-y-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Monday.com Integration</h1>
          <p className="text-muted-foreground">
            Connect your inventory system with Monday.com boards
          </p>
        </div>
        {integration && (
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/monday/sync-rules">
                <SyncIcon className="mr-2 h-4 w-4" />
                Sync Rules
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/monday/sync-logs">
                <ListTodo className="mr-2 h-4 w-4" />
                Sync Logs
              </Link>
            </Button>
          </div>
        )}
      </div>

      {!isConfigured ? (
        <div className="mt-6">
          <IntegrationSetup />
        </div>
      ) : (
        <>
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>Integration Status</CardTitle>
              <CardDescription>
                Current status of your Monday.com connection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Connection Status</div>
                    <div className="text-sm text-muted-foreground">
                      {integration.connectionStatus === "connected"
                        ? "Connected to Monday.com"
                        : integration.connectionStatus === "error"
                          ? "Connection error"
                          : "Pending connection"}
                    </div>
                  </div>
                  <Badge
                    variant={
                      integration.connectionStatus === "connected"
                        ? "success"
                        : integration.connectionStatus === "error"
                          ? "destructive"
                          : "default"
                    }
                  >
                    {integration.connectionStatus || "Not Connected"}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="font-medium">Workspace</div>
                    <div className="text-sm text-muted-foreground">
                      {integration.workspaceName}
                    </div>
                  </div>

                  <div>
                    <div className="font-medium">Sync Enabled</div>
                    <div className="text-sm text-muted-foreground">
                      {integration.isEnabled ? "Yes" : "No"}
                    </div>
                  </div>

                  <div>
                    <div className="font-medium">Last Sync</div>
                    <div className="text-sm text-muted-foreground">
                      {integration.lastSyncTimestamp
                        ? new Date(
                            integration.lastSyncTimestamp,
                          ).toLocaleString()
                        : "Never"}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="mappings">Board Mappings</TabsTrigger>
              <TabsTrigger value="rules">Sync Rules</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Integration Overview</CardTitle>
                  <CardDescription>
                    Quick overview of your Monday.com integration
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <IntegrationForm integration={integration} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="mappings" className="mt-6 space-y-4">
              <BoardMappings integrationId={integration._id} />
            </TabsContent>

            <TabsContent value="rules" className="mt-6 space-y-4">
              <SyncRulesManager integrationId={integration._id} />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
