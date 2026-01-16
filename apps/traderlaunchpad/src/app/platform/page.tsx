"use client";

import React from "react";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  CreditCard,
  Gauge,
  RefreshCw,
  Users,
} from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Progress } from "@acme/ui/progress";

type StatCard = {
  title: string;
  value: string;
  hint: string;
  icon: React.ElementType;
  accent: "blue" | "emerald" | "amber" | "purple";
};

const STATS: StatCard[] = [
  {
    title: "Total users",
    value: "1,284",
    hint: "+43 this week",
    icon: Users,
    accent: "blue",
  },
  {
    title: "Active today",
    value: "214",
    hint: "16.7% DAU",
    icon: Activity,
    accent: "emerald",
  },
  {
    title: "Trials",
    value: "87",
    hint: "23 expiring in 7d",
    icon: Gauge,
    accent: "amber",
  },
  {
    title: "Pro subscribers",
    value: "62",
    hint: "$3.1k MRR (mock)",
    icon: CreditCard,
    accent: "purple",
  },
];

const accentClass: Record<StatCard["accent"], string> = {
  blue: "border-l-blue-500",
  emerald: "border-l-emerald-500",
  amber: "border-l-amber-500",
  purple: "border-l-purple-500",
};

export default function PlatformDashboardPage() {
  return (
    <div className="animate-in fade-in space-y-8 duration-500">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Platform Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Internal metrics and operational health (mock data).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button className="gap-2 border-0 bg-blue-600 text-white hover:bg-blue-700">
            <ArrowUpRight className="h-4 w-4" />
            Invite admin
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {STATS.map((s) => (
          <Card
            key={s.title}
            className={`relative overflow-hidden border-l-4 ${accentClass[s.accent]}`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                {s.title}
              </CardTitle>
              <div className="text-muted-foreground">
                <s.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{s.value}</div>
              <p className="text-muted-foreground mt-1 text-xs">{s.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-500" />
              Growth & Engagement
            </CardTitle>
            <CardDescription>
              High-level trends: signups, activation, and retention.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-border group relative flex h-80 w-full items-center justify-center overflow-hidden rounded-lg border border-dashed bg-linear-to-b from-blue-500/5 to-transparent">
              <div className="text-muted-foreground/30 absolute inset-0 flex items-center justify-center font-medium">
                [ Platform analytics chart placeholder ]
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base">Operational health</CardTitle>
            <CardDescription>Critical systems at a glance.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/20 flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-1">
                <div className="text-sm font-semibold">Convex sync runs</div>
                <div className="text-muted-foreground text-xs">
                  Last 15m: 98% success
                </div>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10">
                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                Healthy
              </Badge>
            </div>

            <div className="bg-muted/20 flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-1">
                <div className="text-sm font-semibold">Auth / Clerk</div>
                <div className="text-muted-foreground text-xs">
                  Token validation OK
                </div>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10">
                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                OK
              </Badge>
            </div>

            <div className="bg-muted/20 flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-1">
                <div className="text-sm font-semibold">Billing</div>
                <div className="text-muted-foreground text-xs">
                  3 failed payments (mock)
                </div>
              </div>
              <Badge
                variant="secondary"
                className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/10"
              >
                <AlertCircle className="mr-1 h-3.5 w-3.5" />
                Attention
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Activation funnel</span>
                <span className="font-semibold">62%</span>
              </div>
              <Progress value={62} className="h-2" />
              <div className="text-muted-foreground text-xs">
                Connect → Sync → First review completion rate (mock).
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/platform/users">View users</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/platform/settings">Settings</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
