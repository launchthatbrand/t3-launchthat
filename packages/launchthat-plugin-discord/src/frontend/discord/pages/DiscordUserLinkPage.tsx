"use client";

import React from "react";
import { useAction, useMutation, useQuery } from "convex/react";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

import type { DiscordPageProps } from "../types";

const cx = (...classes: Array<string | undefined | false>) =>
  classes.filter(Boolean).join(" ");

export function DiscordUserLinkPage({
  api,
  organizationId,
  className,
  ui,
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
    <div className={cx(className, ui?.pageClassName)}>
      <div className={cx("mb-6", ui?.headerClassName)}>
        <h2
          className={cx(
            "text-foreground text-2xl font-semibold",
            ui?.titleClassName,
          )}
        >
          Discord link
        </h2>
        <p
          className={cx(
            "text-muted-foreground text-sm",
            ui?.descriptionClassName,
          )}
        >
          Link your Discord account for member actions and support automation.
        </p>
      </div>

      <Card className={ui?.cardClassName}>
        <CardHeader className={ui?.cardHeaderClassName}>
          <CardTitle className={ui?.cardTitleClassName}>
            Linked account
          </CardTitle>
        </CardHeader>
        <CardContent
          className={cx("space-y-4", ui?.cardContentClassName)}
        >
          <p className="text-muted-foreground text-sm">
            {link?.discordUserId
              ? `Linked to Discord user ${link.discordUserId}`
              : "No Discord account linked yet."}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleLink} className={ui?.buttonClassName}>
              Link Discord
            </Button>
            {link?.discordUserId ? (
              <Button
                variant="outline"
                onClick={handleUnlink}
                disabled={busy}
                className={ui?.outlineButtonClassName}
              >
                {busy ? "Unlinking..." : "Unlink"}
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
