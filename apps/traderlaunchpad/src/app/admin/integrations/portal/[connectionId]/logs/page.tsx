"use client";

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  MessageSquare,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@acme/ui/card";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import Link from "next/link";
import React from "react";
import { cn } from "@acme/ui";
import { useParams } from "next/navigation";

type LogRow = {
  id: string;
  ts: string;
  level: "info" | "warn" | "error";
  message: string;
  meta?: string;
};

const LOGS: LogRow[] = [
  {
    id: "l1",
    ts: "2m ago",
    level: "info",
    message: "Portal pulled new TradeIdea events",
    meta: "count=3",
  },
  {
    id: "l2",
    ts: "2m ago",
    level: "info",
    message: "Posted message to Discord",
    meta: "channel=#mentors",
  },
  {
    id: "l3",
    ts: "1h ago",
    level: "warn",
    message: "Rate limited by Discord, retry scheduled",
    meta: "retryIn=10s",
  },
  {
    id: "l4",
    ts: "Yesterday",
    level: "error",
    message: "Webhook delivery failed",
    meta: "status=500",
  },
];

const levelIcon = (level: LogRow["level"]) => {
  if (level === "error") return AlertCircle;
  if (level === "warn") return Clock;
  return CheckCircle2;
};

const levelClass = (level: LogRow["level"]) => {
  if (level === "error") return "text-red-500";
  if (level === "warn") return "text-amber-500";
  return "text-emerald-500";
};

export default function PortalLogsMockPage() {
  const params = useParams<{ connectionId?: string | string[] }>();
  const raw = params?.connectionId;
  const connectionId = Array.isArray(raw) ? raw[0] ?? "" : raw ?? "";

  return (
    <div className="mx-auto max-w-5xl space-y-8 duration-500">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="space-y-1">
          <div className="text-muted-foreground text-sm">Portal logs</div>
          <h1 className="text-3xl font-bold tracking-tight">Connection activity</h1>
          <div className="text-muted-foreground text-sm">
            Connection: <span className="font-mono">{connectionId || "—"}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/integrations/portal/${encodeURIComponent(connectionId)}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export (mock)
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-4 w-4 text-blue-500" />
            Timeline
          </CardTitle>
          <CardDescription>
            This view helps build trust: you can see every integration action and failure.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-6">
          {LOGS.map((row) => {
            const Icon = levelIcon(row.level);
            return (
              <div
                key={row.id}
                className="bg-card flex items-start justify-between gap-4 rounded-lg border p-4"
              >
                <div className="flex items-start gap-3">
                  <div className={cn("mt-0.5", levelClass(row.level))}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-semibold">{row.message}</div>
                    <div className="text-muted-foreground text-xs">
                      {row.ts}
                      {row.meta ? ` • ${row.meta}` : ""}
                    </div>
                  </div>
                </div>
                <Badge variant="outline">{row.level}</Badge>
              </div>
            );
          })}

          <div className="text-muted-foreground pt-2 text-xs">
            Backend later: real audit log store, correlation IDs, retry traces, webhook payloads.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

