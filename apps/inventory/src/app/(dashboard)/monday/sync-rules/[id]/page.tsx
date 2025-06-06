"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";

import { ArrowLeft } from "lucide-react";
import { Button } from "@acme/ui/button";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";
import { Skeleton } from "@acme/ui/skeleton";
import { SyncLogs } from "@/components/monday/SyncLogs";
import { SyncRulesManager } from "@/components/monday/SyncRulesManager";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";

export default function SyncRuleDetailPage() {
  const params = useParams();
  const integrationId = params.id as string;

  // Fetch integration details
  const integration = useQuery(api.monday.queries.getIntegration, {
    id: integrationId as Id<"mondayIntegration">,
  });

  if (!integration) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/monday">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Integrations
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">
            {integration.name} Rules and Logs
          </h1>
        </div>
      </div>

      <Tabs defaultValue="rules" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rules">Sync Rules</TabsTrigger>
          <TabsTrigger value="logs">Sync Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          <SyncRulesManager
            integrationId={integrationId as Id<"mondayIntegration">}
          />
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <SyncLogs integrationId={integrationId as Id<"mondayIntegration">} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
