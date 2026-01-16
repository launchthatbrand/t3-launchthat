"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Link2, Webhook } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import { Separator } from "@acme/ui/separator";

export default function AdminPortalWebhooksComparePage() {
  const portalWebhookUrl =
    "https://portal.launchthat.app/webhooks/traderlaunchpad/mock";
  const traderlaunchpadWebhookUrl =
    "https://app.traderlaunchpad.com/api/webhooks/portal/mock";

  return (
    <div className="animate-in fade-in mx-auto max-w-5xl space-y-8 duration-500">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="text-muted-foreground text-sm">
            Portal integration
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Webhooks vs OAuth
          </h1>
          <p className="text-muted-foreground mt-1">
            Compare the two UX options (mock) so we can decide what to build
            later.
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2 text-base">
              <Link2 className="h-4 w-4 text-blue-500" />
              OAuth / OIDC (recommended for platform)
            </CardTitle>
            <CardDescription>
              Best for secure, revocable, least-privilege access with audit
              trails.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6 text-sm">
            <div className="bg-muted/20 rounded-lg border p-4">
              <div className="font-semibold">User flow</div>
              <ol className="text-muted-foreground mt-2 list-decimal space-y-1 pl-5">
                <li>User clicks “Connect Portal”</li>
                <li>Consent screen with scopes</li>
                <li>Portal gets code → exchanges for token</li>
                <li>Portal pulls events and posts to Discord</li>
              </ol>
            </div>
            <div className="bg-muted/20 rounded-lg border p-4">
              <div className="font-semibold">Why it’s better</div>
              <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-5">
                <li>Scoped permissions + re-consent</li>
                <li>Easy revocation/disable per user/connection</li>
                <li>First-class audit events</li>
              </ul>
            </div>
            <Button variant="outline" asChild>
              <Link href="/oauth/authorize?client_id=portal_mock&redirect_uri=/admin/integrations/portal/callback&scope=trades:read%20tradeideas:read&state=mockstate">
                Open consent screen <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2 text-base">
              <Webhook className="h-4 w-4 text-purple-500" />
              Webhook URL paste (simpler, less secure)
            </CardTitle>
            <CardDescription>
              Faster MVP for “one-way push”, but weaker security model and less
              flexible permissions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6 text-sm">
            <div className="bg-muted/20 rounded-lg border p-4">
              <div className="font-semibold">
                Option A: Portal provides URL, TL pushes
              </div>
              <div className="text-muted-foreground mt-2 text-xs">
                User pastes Portal webhook URL in TraderLaunchpad settings.
              </div>
              <Input
                value={portalWebhookUrl}
                readOnly
                className="mt-2 font-mono text-xs"
              />
            </div>

            <div className="bg-muted/20 rounded-lg border p-4">
              <div className="font-semibold">
                Option B: TL provides URL, Portal pushes
              </div>
              <div className="text-muted-foreground mt-2 text-xs">
                User pastes TraderLaunchpad webhook URL in Portal settings.
              </div>
              <Input
                value={traderlaunchpadWebhookUrl}
                readOnly
                className="mt-2 font-mono text-xs"
              />
            </div>

            <Separator />

            <div className="rounded-lg border bg-red-500/5 p-4">
              <div className="font-semibold">
                Risks (what you’ll need anyway)
              </div>
              <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-5">
                <li>Webhook secrets rotation + verification</li>
                <li>Replay protection + rate limiting</li>
                <li>Harder per-scope permission model</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
