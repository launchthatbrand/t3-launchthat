"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { ExternalLink, Settings } from "lucide-react";

import { Button } from "@acme/ui/button";
import Link from "next/link";
import { Skeleton } from "@acme/ui/skeleton";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";

export default function SyncRulesPage() {
  // Fetch all integrations
  const integrations = useQuery(api.monday.queries.getIntegrations);

  // Fetch rule counts for each integration
  const ruleCounts = useQuery(api.monday.queries.getSyncRuleCounts);

  if (!integrations || !ruleCounts) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Monday.com Sync Rules</h1>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Monday.com Sync Rules</h1>
          <p className="text-muted-foreground">
            Configure and manage synchronization rules for your Monday.com
            integrations
          </p>
        </div>
        <Button asChild>
          <Link href="/monday">
            <Settings className="mr-2 h-4 w-4" />
            Manage Integrations
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {integrations.map((integration) => {
          const ruleCount = ruleCounts[integration._id] || 0;
          return (
            <Card key={integration._id}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                  <span>{integration.name}</span>
                  {integration.isConnected && (
                    <span className="inline-flex h-2 w-2 rounded-full bg-green-500"></span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Connected to:{" "}
                    {integration.mondayInstance || "Unknown instance"}
                  </p>
                  <p className="text-sm">
                    <strong>{ruleCount}</strong> synchronization rule
                    {ruleCount === 1 ? "" : "s"}
                  </p>
                  <div className="flex justify-end pt-4">
                    <Button asChild>
                      <Link href={`/monday/sync-rules/${integration._id}`}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Manage Rules
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {integrations.length === 0 && (
          <div className="col-span-3 rounded-lg border border-dashed p-8 text-center">
            <h3 className="text-lg font-medium">No integrations found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              You need to set up a Monday.com integration before you can create
              sync rules.
            </p>
            <Button className="mt-4" asChild>
              <Link href="/monday">Set Up Integration</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
