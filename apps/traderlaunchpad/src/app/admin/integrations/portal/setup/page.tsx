"use client";

import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ExternalLink,
  Info,
  PlugZap,
  Rocket,
  Settings2,
  Shield,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import Link from "next/link";
import React from "react";
import { Separator } from "@acme/ui/separator";

type Step = {
  id: string;
  title: string;
  description: string;
  status: "done" | "todo" | "blocked";
  href?: string;
};

export default function AdminPortalSetupPage() {
  // mock states (later derived from real connection+health checks)
  const hasAuthorized = false;
  const hasConnection = false;
  const hasRouting = false;
  const hasTested = false;

  const steps: Step[] = [
    {
      id: "authorize",
      title: "Authorize Portal",
      description: "User approves OAuth consent and returns with a code.",
      status: hasAuthorized ? "done" : "todo",
      href: "/admin/integrations/portal",
    },
    {
      id: "connection",
      title: "Connection created",
      description:
        "Portal exchanges code for tokens; TL creates a connection record.",
      status: hasConnection ? "done" : hasAuthorized ? "todo" : "blocked",
      href: "/admin/integrations/portal/callback",
    },
    {
      id: "routing",
      title: "Configure Discord routing",
      description: "Choose channels + what events get posted.",
      status: hasRouting ? "done" : hasConnection ? "todo" : "blocked",
      href: "/admin/integrations/portal/pc_mock_001/routing",
    },
    {
      id: "test",
      title: "Send a test event",
      description: "Verify delivery end-to-end with a single click.",
      status: hasTested ? "done" : hasRouting ? "todo" : "blocked",
      href: "/admin/integrations/portal/test",
    },
  ];

  const doneCount = steps.filter((s) => s.status === "done").length;

  return (
    <div className="space-y-8 duration-500">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="text-muted-foreground text-sm">
            Portal integration
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Setup</h1>
          <p className="text-muted-foreground mt-1">
            Guided checklist to get from “not connected” → “posting to Discord”.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">mock</Badge>
          <Badge className="bg-blue-600 text-white hover:bg-blue-600">
            {doneCount}/{steps.length} complete
          </Badge>
          <Button variant="outline" asChild>
            <Link href="/admin/integrations/portal">Back</Link>
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2 text-base">
            <Rocket className="h-4 w-4 text-blue-500" />
            Setup steps
          </CardTitle>
          <CardDescription>
            Each step is a future backend “success check” that prevents silent
            failures.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-6">
          {steps.map((s) => (
            <div
              key={s.id}
              className="bg-card flex flex-col justify-between gap-3 rounded-lg border p-4 md:flex-row md:items-center"
            >
              <div className="flex items-start gap-3">
                {s.status === "done" ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />
                ) : s.status === "blocked" ? (
                  <Shield className="mt-0.5 h-4 w-4 text-amber-500" />
                ) : (
                  <BadgeCheck className="mt-0.5 h-4 w-4 text-blue-500" />
                )}
                <div className="space-y-1">
                  <div className="text-sm font-semibold">{s.title}</div>
                  <div className="text-muted-foreground text-sm">
                    {s.description}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="secondary"
                  className={
                    s.status === "done"
                      ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10"
                      : s.status === "blocked"
                        ? "bg-amber-500/10 text-amber-500 hover:bg-amber-500/10"
                        : "bg-muted text-muted-foreground hover:bg-muted"
                  }
                >
                  {s.status}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  disabled={!s.href || s.status === "blocked"}
                >
                  <Link href={s.href ?? "#"}>
                    Open <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}

          <Separator />

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-2 text-sm">
              <Info className="mt-0.5 h-4 w-4 text-blue-500" />
              <div className="text-muted-foreground">
                Backend later: store these checks (authorized, connected,
                routing configured, last test pass) and show them on the
                dashboard.
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" asChild>
                <Link href="/admin/integrations/portal/scopes">
                  Manage scopes <Settings2 className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                className="border-0 bg-blue-600 text-white hover:bg-blue-700"
                asChild
              >
                <Link href="/admin/integrations/portal/test">
                  Send test <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="overflow-hidden">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2 text-base">
              <PlugZap className="h-4 w-4 text-blue-500" />
              Recommended defaults
            </CardTitle>
            <CardDescription>
              Low-noise routing that traders actually want.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pt-6 text-sm">
            <div className="text-muted-foreground">
              - Post <span className="font-semibold">Closed TradeIdeas</span> to
              mentors
            </div>
            <div className="text-muted-foreground">
              - Keep <span className="font-semibold">Open TradeIdeas</span> off
              by default
            </div>
            <div className="text-muted-foreground">
              - Add a <span className="font-semibold">daily summary</span> later
              if needed
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden lg:col-span-2">
          <CardHeader className="border-b">
            <CardTitle className="text-base">Next</CardTitle>
            <CardDescription>
              Go straight to the trader-facing sharing experience.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-6 md:flex-row md:items-center md:justify-between">
            <div className="text-muted-foreground text-sm">
              Preview exactly what gets posted to Discord (mock templates).
            </div>
            <Button
              className="border-0 bg-blue-600 text-white hover:bg-blue-700"
              asChild
            >
              <Link href="/admin/sharing">
                Open Sharing <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
