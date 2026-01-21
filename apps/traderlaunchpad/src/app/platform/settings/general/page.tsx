"use client";

import React from "react";
import {
  Bell,
  CheckCircle2,
  CreditCard,
  Database,
  KeyRound,
  Shield,
  Webhook,
} from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Separator } from "@acme/ui/separator";
import { Switch } from "@acme/ui/switch";

export default function PlatformSettingsGeneralPage() {
  const [maintenanceMode, setMaintenanceMode] = React.useState(false);
  const [enableNewOnboarding, setEnableNewOnboarding] = React.useState(true);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline">Reset</Button>
        <Button className="border-0 bg-blue-600 text-white hover:bg-blue-700">Save</Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-purple-500" />
              Security & Access
            </CardTitle>
            <CardDescription>Control admin access and operational guardrails.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Platform admin allowlist</Label>
                <Input
                  placeholder="user_abc,user_def"
                  defaultValue="user_38JO79Cyd9yXnEVvh2bWIHbvTcx"
                />
                <div className="text-muted-foreground text-xs">
                  For v1, you can allowlist Clerk user IDs.
                </div>
              </div>
              <div className="space-y-2">
                <Label>Audit log retention</Label>
                <Input placeholder="90 days" defaultValue="90 days" />
                <div className="text-muted-foreground text-xs">
                  Longer retention recommended for paid platforms.
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/20 p-4">
              <div className="space-y-1">
                <div className="text-sm font-semibold">Maintenance mode</div>
                <div className="text-muted-foreground text-sm">
                  Show a maintenance banner and disable new signups.
                </div>
              </div>
              <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">System status</CardTitle>
            <CardDescription>Quick checks (mock).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border bg-muted/20 p-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Database className="h-4 w-4 text-blue-500" />
                Convex DB
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10">
                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                OK
              </Badge>
            </div>

            <div className="flex items-center justify-between rounded-lg border bg-muted/20 p-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <KeyRound className="h-4 w-4 text-amber-500" />
                Token storage
              </div>
              <Badge
                variant="secondary"
                className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/10"
              >
                enc (recommended)
              </Badge>
            </div>

            <div className="flex items-center justify-between rounded-lg border bg-muted/20 p-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Webhook className="h-4 w-4 text-purple-500" />
                Webhooks
              </div>
              <Badge variant="outline">not configured</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4 text-blue-500" />
            Feature flags
          </CardTitle>
          <CardDescription>Roll out features gradually to reduce risk.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center justify-between gap-4 rounded-lg border bg-card p-4">
            <div className="space-y-1">
              <div className="text-sm font-semibold">New onboarding funnel</div>
              <div className="text-muted-foreground text-sm">
                Show the optional connect → sync → review flow.
              </div>
            </div>
            <Switch checked={enableNewOnboarding} onCheckedChange={setEnableNewOnboarding} />
          </div>

          <div className="flex items-center justify-between gap-4 rounded-lg border bg-card p-4">
            <div className="space-y-1">
              <div className="text-sm font-semibold">Pro analytics (gated)</div>
              <div className="text-muted-foreground text-sm">
                Enable deeper analytics screens for paying users.
              </div>
            </div>
            <Switch checked={false} onCheckedChange={() => {}} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-4 w-4 text-emerald-500" />
            Billing (mock)
          </CardTitle>
          <CardDescription>Stripe settings and entitlements.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Stripe webhook secret</Label>
              <Input type="password" placeholder="whsec_..." defaultValue="whsec_mock" />
            </div>
            <div className="space-y-2">
              <Label>Default plan</Label>
              <Input placeholder="pro_monthly" defaultValue="pro_monthly" />
            </div>
          </div>

          <div className="text-muted-foreground text-xs">
            We’ll wire real billing + entitlements after RBAC is in place.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

