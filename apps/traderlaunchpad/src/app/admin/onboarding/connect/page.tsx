"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle2, Plug, Shield, Zap } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

import { useOnboardingStatus } from "~/lib/onboarding/getOnboardingStatus";

export default function OnboardingConnectPage() {
  const status = useOnboardingStatus();

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center justify-between gap-3 text-base">
            <span>Step 1: Connect your broker</span>
            {status.connectedOk ? (
              <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10">
                Connected
              </Badge>
            ) : (
              <Badge variant="outline">Not connected</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="bg-muted/20 rounded-lg border p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Zap className="h-4 w-4 text-blue-500" />
                Fast import
              </div>
              <div className="text-muted-foreground mt-2 text-sm">
                Pull orders, executions, and positions in seconds.
              </div>
            </div>
            <div className="bg-muted/20 rounded-lg border p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Shield className="h-4 w-4 text-emerald-500" />
                Secure by design
              </div>
              <div className="text-muted-foreground mt-2 text-sm">
                Tokens can be stored encrypted in production mode.
              </div>
            </div>
            <div className="bg-muted/20 rounded-lg border p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <CheckCircle2 className="h-4 w-4 text-purple-500" />
                Review-first UX
              </div>
              <div className="text-muted-foreground mt-2 text-sm">
                Immediately move into a habit loop: import → review → improve.
              </div>
            </div>
          </div>

          <div className="bg-card flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
            <div className="space-y-1">
              <div className="text-sm font-semibold">
                TradeLocker connection
              </div>
              <div className="text-muted-foreground text-sm">
                Connect your TradeLocker account from Settings.
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" asChild>
                <Link href="/admin/settings">
                  <Plug className="mr-2 h-4 w-4" />
                  Open Settings
                </Link>
              </Button>
              <Button
                className="bg-blue-600 text-white hover:bg-blue-700"
                asChild
                disabled={!status.connectedOk}
              >
                <Link href="/admin/onboarding/sync">Continue</Link>
              </Button>
            </div>
          </div>

          {!status.connectedOk ? (
            <div className="text-muted-foreground text-sm">
              Once you’ve connected, come back here and hit Continue.
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
