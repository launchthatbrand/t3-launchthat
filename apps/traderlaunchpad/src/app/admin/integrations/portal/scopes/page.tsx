"use client";

import {
  ArrowLeft,
  BadgeCheck,
  Lock,
  Plus,
  Shield,
  ShieldCheck,
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
import { Checkbox } from "@acme/ui/checkbox";
import { Label } from "@acme/ui/label";
import Link from "next/link";
import React from "react";
import { Separator } from "@acme/ui/separator";

type Scope = {
  id: string;
  title: string;
  description: string;
  risk: "low" | "high";
  enabled: boolean;
};

export default function AdminPortalScopesPage() {
  // mock current scopes
  const [scopes, setScopes] = React.useState<Scope[]>([
    {
      id: "trades:read",
      title: "Read trades",
      description: "Portal can read orders/executions to build TradeIdeas and analytics.",
      risk: "low",
      enabled: true,
    },
    {
      id: "tradeideas:read",
      title: "Read TradeIdeas",
      description: "Portal can read TradeIdeas and review states to route messages.",
      risk: "low",
      enabled: true,
    },
    {
      id: "discord:routing:write",
      title: "Write Discord routing",
      description: "Portal can change routing rules (channels/templates).",
      risk: "high",
      enabled: false,
    },
  ]);

  const toggle = (id: string, next: boolean) => {
    setScopes((prev) => prev.map((s) => (s.id === id ? { ...s, enabled: next } : s)));
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 duration-500">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="text-muted-foreground text-sm">Portal integration</div>
          <h1 className="text-3xl font-bold tracking-tight">Scopes</h1>
          <p className="text-muted-foreground mt-1">
            Manage what Portal can access (mock UI).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">mock</Badge>
          <Button variant="outline" asChild>
            <Link href="/admin/integrations/portal/setup">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4 text-blue-500" />
            Requested permissions
          </CardTitle>
          <CardDescription>
            Backend later: enforce these scopes server-side and log any changes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {scopes.map((s) => (
            <div
              key={s.id}
              className="bg-card flex flex-col justify-between gap-3 rounded-lg border p-4 md:flex-row md:items-center"
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  id={s.id}
                  checked={s.enabled}
                  onCheckedChange={(v) => toggle(s.id, Boolean(v))}
                />
                <div className="space-y-1">
                  <Label htmlFor={s.id} className="text-sm font-semibold">
                    {s.title}
                  </Label>
                  <div className="text-muted-foreground text-sm">{s.description}</div>
                  <div className="text-muted-foreground text-xs font-mono">{s.id}</div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  className={
                    s.risk === "high"
                      ? "bg-red-500/10 text-red-500 hover:bg-red-500/10"
                      : "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10"
                  }
                >
                  {s.risk}
                </Badge>
                {!s.enabled && s.risk === "high" ? (
                  <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/10">
                    <Lock className="mr-1 h-3.5 w-3.5" />
                    Requires approval
                  </Badge>
                ) : null}
              </div>
            </div>
          ))}

          <Separator />

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-2 text-sm">
              <ShieldCheck className="mt-0.5 h-4 w-4 text-purple-500" />
              <div className="text-muted-foreground">
                High-risk scopes should trigger re-consent and a strong audit trail.
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="gap-2" disabled>
                <Plus className="h-4 w-4" />
                Request additional scope (soon)
              </Button>
              <Button className="border-0 bg-blue-600 text-white hover:bg-blue-700">
                Save (mock)
              </Button>
              <Button variant="outline" asChild>
                <Link href="/admin/integrations/portal/test">
                  Run test <BadgeCheck className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

