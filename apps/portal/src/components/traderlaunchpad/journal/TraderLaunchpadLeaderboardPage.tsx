"use client";

/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-member-access,
  @typescript-eslint/no-unnecessary-type-assertion,
  @typescript-eslint/no-require-imports
*/

import React from "react";
import { useQuery } from "convex/react";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { useTenant } from "~/context/TenantContext";
import { getTenantOrganizationId } from "~/lib/tenant-fetcher";

const tlApi = require("@/convex/_generated/api") as any;
const tlQueries = tlApi.api.plugins.traderlaunchpad.queries as any;

export function TraderLaunchpadLeaderboardPage() {
  const tenant = useTenant();
  const organizationId = getTenantOrganizationId(tenant);

  const rows = useQuery(
    tlQueries.getPublicLeaderboard,
    organizationId ? { organizationId, limit: 20 } : "skip",
  ) as
    | {
        userId: string;
        username: string | null;
        image: string | null;
        openPositions: number;
        openTradeIdeas: number;
      }[]
    | undefined;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Top traders</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {rows === undefined ? (
            <div className="text-muted-foreground text-sm">Loading…</div>
          ) : rows.length === 0 ? (
            <div className="text-muted-foreground text-sm">
              No public journals yet.
            </div>
          ) : (
            <div className="divide-y rounded-md border">
              {rows.map((r) => (
                <div
                  key={r.userId}
                  className="flex items-center justify-between px-3 py-2 text-sm"
                >
                  <div className="font-medium">
                    {r.username ? `@${r.username}` : `user-${r.userId.slice(0, 6)}`}
                  </div>
                  <div className="text-muted-foreground flex items-center gap-4">
                    <div>Open positions: {r.openPositions}</div>
                    <div>Open ideas: {r.openTradeIdeas}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


