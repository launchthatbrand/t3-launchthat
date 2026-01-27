"use client";

import { ArrowUpRight, MessageCircle, Shield, Webhook } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@acme/ui/card";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import Link from "next/link";
import React from "react";

const INTEGRATIONS = [
  {
    key: "discord",
    title: "Discord",
    description:
      "Share trade ideas and route trading events into Discord.",
    status: "available" as const,
    href: "/admin/integrations/discord",
    icon: MessageCircle,
  },
  {
    key: "webhooks",
    title: "Webhooks",
    description:
      "Send events to your own endpoints. Good for custom analytics pipelines.",
    status: "coming_soon" as const,
    href: "#",
    icon: Webhook,
  },
  {
    key: "api",
    title: "API Keys",
    description:
      "Generate scoped keys for automation. Rotate/revoke anytime.",
    status: "coming_soon" as const,
    href: "#",
    icon: Shield,
  },
];

export default function AdminIntegrationsHubPage() {
  return (
    <div className="space-y-8 duration-500">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
          <p className="text-muted-foreground mt-1">
            Connect TraderLaunchpad to third-party destinations (data out).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {INTEGRATIONS.map((it) => (
          <Card key={it.key} className="group overflow-hidden">
            <CardHeader className="border-b">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <it.icon className="h-4 w-4 text-blue-500" />
                    {it.title}
                  </CardTitle>
                  <CardDescription>{it.description}</CardDescription>
                </div>
                {it.status === "coming_soon" ? (
                  <Badge variant="outline">Coming soon</Badge>
                ) : (
                  <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10">
                    Available
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="text-muted-foreground text-sm">
                Configure routing, templates, and permissions for outbound events.
              </div>
              <div className="flex flex-wrap gap-2">
                {it.status === "coming_soon" ? (
                  <Button variant="outline" size="sm" disabled>
                    Open
                  </Button>
                ) : (
                  <Button
                    className="bg-blue-600 text-white hover:bg-blue-700"
                    size="sm"
                    asChild
                  >
                    <Link href={it.href}>
                      Open <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

