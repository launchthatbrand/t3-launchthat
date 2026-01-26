"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "convex/react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@acme/ui/card";
import { Badge } from "@acme/ui/badge";

type CrmDashboardProps = {
  metricsQuery: unknown;
  contactsHref: string;
  joinCodesHref: string;
};

type Metrics = {
  contacts: { total: number; isTruncated: boolean };
  tags: { total: number; isTruncated: boolean };
  tagAssignments: { total: number; isTruncated: boolean };
};

const MetricCard = ({
  title,
  value,
  truncated,
}: {
  title: string;
  value: number;
  truncated: boolean;
}) => (
  <Card className="bg-card/70">
    <CardHeader className="space-y-1">
      <CardTitle className="text-base">{title}</CardTitle>
      <CardDescription>Platform-wide</CardDescription>
    </CardHeader>
    <CardContent className="text-3xl font-semibold text-foreground">
      {value.toLocaleString()}
      {truncated ? (
        <Badge variant="outline" className="ml-2 text-xs">
          capped
        </Badge>
      ) : null}
    </CardContent>
  </Card>
);

export const CrmDashboard = ({
  metricsQuery,
  contactsHref,
  joinCodesHref,
}: CrmDashboardProps) => {
  const metrics = useQuery(metricsQuery as any, { limit: 5000 }) as
    | Metrics
    | undefined;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>CRM Dashboard</CardTitle>
          <CardDescription>
            Overview of contacts and marketing segments.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Contacts"
          value={metrics?.contacts.total ?? 0}
          truncated={Boolean(metrics?.contacts.isTruncated)}
        />
        <MetricCard
          title="Marketing tags"
          value={metrics?.tags.total ?? 0}
          truncated={Boolean(metrics?.tags.isTruncated)}
        />
        <MetricCard
          title="Tag assignments"
          value={metrics?.tagAssignments.total ?? 0}
          truncated={Boolean(metrics?.tagAssignments.isTruncated)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link href={contactsHref} className="block">
          <Card className="transition-colors hover:border-foreground/30 hover:bg-muted/30">
            <CardHeader>
              <CardTitle className="text-base">Contacts</CardTitle>
              <CardDescription>View and manage CRM contacts.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Create, update, and segment your platform contacts.
            </CardContent>
          </Card>
        </Link>
        <Link href={joinCodesHref} className="block">
          <Card className="transition-colors hover:border-foreground/30 hover:bg-muted/30">
            <CardHeader>
              <CardTitle className="text-base">Join codes</CardTitle>
              <CardDescription>Invite-only onboarding waves.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Issue codes for alpha/beta onboarding cohorts.
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
};
