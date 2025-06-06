"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "@acme/ui/button";
import Link from "next/link";
import { Skeleton } from "@acme/ui/skeleton";
import { SyncLogs } from "@/components/monday/SyncLogs";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";

export default function SyncLogsPage() {
  const integration = useQuery(api.monday.queries.getDefaultIntegration);

  if (integration === undefined) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Sync Logs</h1>
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (integration === null) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Sync Logs</h1>
          <Button variant="outline" asChild>
            <Link href="/monday">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Integration
            </Link>
          </Button>
        </div>

        <div className="rounded-lg border border-dashed p-8 text-center">
          <h2 className="mb-2 text-xl font-semibold">
            Monday.com Integration Not Configured
          </h2>
          <p className="mb-4 text-muted-foreground">
            You need to set up the Monday.com integration before you can view
            sync logs.
          </p>
          <Button asChild>
            <Link href="/monday">Configure Integration</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sync Logs</h1>
          <p className="text-muted-foreground">
            View and debug synchronization activity between your system and
            Monday.com
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/monday">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Integration
          </Link>
        </Button>
      </div>

      <SyncLogs integrationId={integration._id} />
    </div>
  );
}
