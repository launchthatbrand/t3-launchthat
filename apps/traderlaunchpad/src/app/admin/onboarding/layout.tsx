"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckCircle2, Circle, ChevronRight } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Progress } from "@acme/ui/progress";
import { cn } from "@acme/ui";

import { useOnboardingStatus } from "~/lib/onboarding/getOnboardingStatus";

const STEPS: Array<{
  key: "connect" | "sync" | "review";
  title: string;
  href: string;
}> = [
  { key: "connect", title: "Connect broker", href: "/admin/onboarding/connect" },
  { key: "sync", title: "Sync trades", href: "/admin/onboarding/sync" },
  { key: "review", title: "First review", href: "/admin/onboarding/first-review" },
];

const getActiveKey = (pathname: string): "connect" | "sync" | "review" => {
  if (pathname.includes("/admin/onboarding/sync")) return "sync";
  if (pathname.includes("/admin/onboarding/first-review")) return "review";
  return "connect";
};

export default function OnboardingLayout(props: { children: React.ReactNode }) {
  const pathname = usePathname();
  const activeKey = getActiveKey(pathname);
  const status = useOnboardingStatus();

  const progressPct = Math.round(
    (status.completedSteps / status.totalSteps) * 100,
  );

  return (
    <div className="animate-in fade-in mx-auto w-full max-w-5xl space-y-6 duration-500">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div className="space-y-1">
          <div className="text-muted-foreground text-sm">Getting started</div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Setup TraderLaunchpad</h1>
            {status.isComplete ? (
              <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10">
                Setup complete
              </Badge>
            ) : (
              <Badge variant="outline">
                {status.completedSteps}/{status.totalSteps} completed
              </Badge>
            )}
          </div>
          <div className="text-muted-foreground max-w-2xl text-sm">
            Connect your broker, import trades, then review your first TradeIdea to
            unlock the habit loop.
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/dashboard">Skip for now</Link>
          </Button>
          {status.nextStepHref ? (
            <Button className="bg-blue-600 text-white hover:bg-blue-700" asChild>
              <Link href={status.nextStepHref}>
                Continue <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button className="bg-blue-600 text-white hover:bg-blue-700" asChild>
              <Link href="/admin/dashboard">
                Go to dashboard <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center justify-between gap-3 text-base">
            <span>Progress</span>
            <span className="text-muted-foreground text-sm">{progressPct}%</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <Progress value={progressPct} className="h-2" />

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {STEPS.map((s) => {
              const done =
                (s.key === "connect" && status.connectedOk) ||
                (s.key === "sync" && status.tradesOk) ||
                (s.key === "review" && status.reviewOk);
              const isActive = activeKey === s.key;
              const Icon = done ? CheckCircle2 : Circle;

              return (
                <Link
                  key={s.key}
                  href={s.href}
                  className={cn(
                    "bg-muted/20 hover:bg-muted/30 flex items-start gap-3 rounded-lg border p-4 transition-colors",
                    isActive ? "border-blue-500/40" : "border-border",
                  )}
                >
                  <div
                    className={cn(
                      "mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border",
                      done
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                        : "border-border bg-background text-muted-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-semibold">{s.title}</div>
                    <div className="text-muted-foreground text-xs">
                      {done ? "Completed" : isActive ? "In progress" : "Not started"}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {props.children}
    </div>
  );
}

