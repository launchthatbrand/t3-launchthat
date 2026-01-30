"use client";

import * as React from "react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Input } from "@acme/ui/input";

import type { AffiliatePayoutSettings } from "./types";
import { formatUsd } from "./utils";

export const AffiliatePayoutsCard = (props: AffiliatePayoutSettings) => {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b p-4">
        <CardTitle className="text-base">Payouts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        {props.payoutLoading ? (
          <div className="text-muted-foreground text-sm">Loading payout settings…</div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="text-sm font-medium">Payout account</div>
                <div className="text-muted-foreground text-xs">
                  Connect a bank account to receive affiliate payouts.
                </div>
              </div>
              <div className="flex items-center gap-2">
                {props.payoutAccountStatus ? (
                  <Badge variant={props.payoutAccountStatus === "enabled" ? "default" : "secondary"}>
                    {props.payoutAccountStatus}
                  </Badge>
                ) : (
                  <Badge variant="outline">not connected</Badge>
                )}
                <Button type="button" variant="outline" onClick={props.onConnectOrManage}>
                  {props.payoutAccountStatus ? "Manage" : "Connect payouts"}
                </Button>
                {props.payoutAccountStatus ? (
                  <Button type="button" variant="outline" onClick={props.onDisconnectTest}>
                    Disconnect (test)
                  </Button>
                ) : null}
                <Button type="button" variant="outline" onClick={props.onRefresh}>
                  Refresh
                </Button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border bg-card p-3">
                <div className="text-muted-foreground text-xs">Credit balance</div>
                <div className="mt-1 text-sm font-semibold">{formatUsd(props.creditBalanceCents)}</div>
              </div>
              <div className="rounded-lg border bg-card p-3">
                <div className="text-muted-foreground text-xs">Next subscription due (est.)</div>
                <div className="mt-1 text-sm font-semibold">
                  {formatUsd(props.upcomingSubscriptionDueCents)}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Distribution policy</div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={props.payoutPolicy === "payout_only" ? "default" : "outline"}
                  onClick={() => props.onSetPolicy("payout_only")}
                >
                  Payout only
                </Button>
                <Button
                  type="button"
                  variant={props.payoutPolicy === "apply_to_subscription_then_payout" ? "default" : "outline"}
                  onClick={() => props.onSetPolicy("apply_to_subscription_then_payout")}
                >
                  Apply to subscription, then payout remainder
                </Button>
              </div>
              <div className="text-muted-foreground text-xs">
                If your recruits cancel, you earn $0 and your subscription bills normally.
              </div>
            </div>

            <div className="grid gap-2">
              <div className="text-sm font-medium">Minimum payout</div>
              <div className="flex items-center gap-2">
                <Input
                  value={String(Math.round(props.minPayoutCents / 100))}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    const next = Number.isFinite(n) ? Math.max(0, Math.round(n * 100)) : 0;
                    props.onSetMinPayoutCents(next);
                  }}
                  className="w-36"
                />
                <div className="text-muted-foreground text-xs">USD</div>
              </div>
            </div>

            {props.payoutError ? <div className="text-sm text-destructive">{props.payoutError}</div> : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

