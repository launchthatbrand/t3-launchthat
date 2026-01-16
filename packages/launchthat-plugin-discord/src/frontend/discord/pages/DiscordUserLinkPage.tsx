"use client";

import React from "react";
import { useAction, useMutation, useQuery } from "convex/react";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

import type { DiscordPageProps } from "../types";

export function DiscordUserLinkPage({
  api,
  organizationId,
  className,
}: DiscordPageProps) {
  const link = useQuery(
    api.queries.getMyDiscordLink,
    organizationId ? { organizationId } : {},
  );
  const startUserLink = useAction(api.actions.startUserLink);
  const unlink = useMutation(api.mutations.unlinkMyDiscordLink);
  const [busy, setBusy] = React.useState(false);

  const handleLink = async () => {
    const returnTo = window.location.href;
    const result = await startUserLink(
      organizationId ? { organizationId, returnTo } : { returnTo },
    );
    if (result?.url) {
      window.location.href = result.url;
    }
  };

  const handleUnlink = async () => {
    setBusy(true);
    try {
      await unlink(organizationId ? { organizationId } : {});
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={className}>
      <div className="mb-6">
        <h2 className="text-foreground text-2xl font-semibold">Discord link</h2>
        <p className="text-muted-foreground text-sm">
          Link your Discord account for member actions and support automation.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Linked account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            {link?.discordUserId
              ? `Linked to Discord user ${link.discordUserId}`
              : "No Discord account linked yet."}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleLink}>Link Discord</Button>
            {link?.discordUserId ? (
              <Button variant="outline" onClick={handleUnlink} disabled={busy}>
                {busy ? "Unlinking..." : "Unlink"}
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
