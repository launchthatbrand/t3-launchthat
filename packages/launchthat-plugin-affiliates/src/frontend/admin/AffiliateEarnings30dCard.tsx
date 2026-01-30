"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

import { formatUsd } from "./utils";

export const AffiliateEarnings30dCard = (props: {
  directEarningsCents: number;
  sponsorOverrideEarningsCents: number;
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Earnings (30d)</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-3">
          <div className="text-muted-foreground text-xs">Direct commissions</div>
          <div className="mt-1 text-sm font-semibold">{formatUsd(props.directEarningsCents)}</div>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <div className="text-muted-foreground text-xs">Sponsor overrides</div>
          <div className="mt-1 text-sm font-semibold">{formatUsd(props.sponsorOverrideEarningsCents)}</div>
        </div>
      </CardContent>
    </Card>
  );
};

