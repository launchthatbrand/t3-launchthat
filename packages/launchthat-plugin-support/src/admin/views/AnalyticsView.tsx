"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";

import type { GenericId as Id } from "convex/values";

interface AnalyticsViewProps {
  organizationId?: Id<"organizations">;
}

export function AnalyticsView({ organizationId }: AnalyticsViewProps) {
  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Support analytics</h1>
        <p className="text-muted-foreground text-sm">
          High-level metrics for support activity.
          {organizationId ? ` Org: ${String(organizationId)}` : ""}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usage overview</CardTitle>
          <CardDescription>Coming soon</CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          Detailed analytics will appear here once implemented.
        </CardContent>
      </Card>
    </div>
  );
}
