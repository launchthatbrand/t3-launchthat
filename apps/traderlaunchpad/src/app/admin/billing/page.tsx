"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@acme/ui/card";
import { CheckCircle2, CreditCard, Lock, Sparkles } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import Link from "next/link";
import React from "react";
import { Separator } from "@acme/ui/separator";

type Plan = {
  id: "free" | "pro" | "mentor";
  name: string;
  price: string;
  highlight?: boolean;
  features: string[];
};

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    features: ["Manual sync", "Orders + TradeIdeas (basic)", "Limited history window"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$29/mo",
    highlight: true,
    features: [
      "Full analytics dashboards",
      "Review workflow + tags",
      "Scheduled sync + health monitoring",
      "Integrations (Portal OAuth)",
    ],
  },
  {
    id: "mentor",
    name: "Mentor",
    price: "$99/mo",
    features: ["Team workspaces", "Mentor review queue", "Discord routing + templates", "Priority support"],
  },
];

export default function AdminBillingPage() {
  // mock current entitlement
  const [currentPlan, setCurrentPlan] = React.useState<Plan["id"]>("free");

  return (
    <div className="space-y-8 duration-500">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
          <p className="text-muted-foreground mt-1">
            Plans, entitlements, and upgrade flow (mock).
          </p>
        </div>
        <Badge
          variant="secondary"
          className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/10"
        >
          Current: {currentPlan.toUpperCase()}
        </Badge>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="h-4 w-4 text-blue-500" />
            Integrations gating
          </CardTitle>
          <CardDescription>
            Integrations are a paid feature in the MVP so you can monetize + limit abuse.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-6 text-sm">
          <div className="rounded-lg border bg-muted/20 p-4">
            <div className="font-semibold">What’s gated?</div>
            <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-5">
              <li>Authorize Portal OAuth</li>
              <li>Configure Discord routing rules</li>
              <li>Scheduled sync health alerts</li>
            </ul>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/admin/integrations">Back to Integrations</Link>
            </Button>
            <Button
              className="border-0 bg-blue-600 text-white hover:bg-blue-700"
              onClick={() => setCurrentPlan("pro")}
            >
              Simulate upgrade to Pro
            </Button>
            <Button variant="outline" onClick={() => setCurrentPlan("free")}>
              Simulate downgrade to Free
            </Button>
          </div>
          <div className="text-muted-foreground text-xs">
            Backend later: Stripe checkout + webhook → entitlements table → UI gates.
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {PLANS.map((p) => {
          const isCurrent = p.id === currentPlan;
          return (
            <Card
              key={p.id}
              className={[
                "overflow-hidden",
                p.highlight ? "border-blue-500/40 shadow-sm" : "",
              ].join(" ")}
            >
              <CardHeader className="border-b">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-base">
                      {p.id === "pro" ? (
                        <Sparkles className="h-4 w-4 text-blue-500" />
                      ) : (
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                      )}
                      {p.name}
                    </CardTitle>
                    <div className="text-2xl font-bold">{p.price}</div>
                  </div>
                  {isCurrent ? (
                    <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10">
                      <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                      Current
                    </Badge>
                  ) : p.highlight ? (
                    <Badge className="bg-blue-600 text-white hover:bg-blue-600">
                      Recommended
                    </Badge>
                  ) : (
                    <Badge variant="outline">Plan</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <ul className="text-muted-foreground list-disc space-y-2 pl-5 text-sm">
                  {p.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>

                <Separator />

                <Button
                  className={p.id === "pro" ? "border-0 bg-blue-600 text-white hover:bg-blue-700" : ""}
                  variant={p.id === "pro" ? "default" : "outline"}
                  onClick={() => setCurrentPlan(p.id)}
                >
                  {p.id === currentPlan ? "Manage" : "Select"} (mock)
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

