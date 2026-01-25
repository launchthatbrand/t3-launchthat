"use client";

import * as React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { useConvexAuth, useMutation, useQuery } from "convex/react";

import { api } from "@convex-config/_generated/api";
import { ShortlinksSettingsCard } from "launchthat-plugin-shortlinks/frontend/settings/ShortlinksSettingsCard";

type ShortlinkSettings = {
  domain: string;
  enabled: boolean;
  codeLength: number;
  alphabet?: string;
};

export const ShortlinksSettingsClient = () => {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const shouldQuery = isAuthenticated && !authLoading;

  const viewerSettings = useQuery(
    api.viewer.queries.getViewerSettings,
    shouldQuery ? {} : "skip",
  ) as { isAdmin: boolean } | undefined;

  const current = useQuery(
    api.shortlinks.queries.getPublicShortlinkSettings,
    shouldQuery ? {} : "skip",
  ) as { domain: string; enabled: boolean; codeLength: number } | undefined;

  const upsert = useMutation(api.shortlinks.mutations.upsertShortlinkSettings);

  const settings: ShortlinkSettings = React.useMemo(
    () => ({
      domain: current?.domain ?? "",
      enabled: Boolean(current?.enabled),
      codeLength: typeof current?.codeLength === "number" ? current.codeLength : 6,
    }),
    [current?.codeLength, current?.domain, current?.enabled],
  );

  if (!shouldQuery) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Shortlinks</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">Loading…</CardContent>
      </Card>
    );
  }

  if (!viewerSettings?.isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Shortlinks</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Admin access required.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <ShortlinksSettingsCard
        settings={settings}
        onSave={async (next: ShortlinkSettings) => {
          await upsert({
            domain: next.domain,
            enabled: next.enabled,
            codeLength: next.codeLength,
          });
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">DNS notes</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Point your short domain (e.g. <span className="font-medium text-foreground">tdrlp.com</span>) at
          the TraderLaunchpad Next deployment in Vercel, then links will resolve via{" "}
          <span className="font-medium text-foreground">/s/&lt;code&gt;</span>.
        </CardContent>
      </Card>
    </div>
  );
};

