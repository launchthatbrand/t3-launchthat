"use client";

import React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

import type { DiscordPageProps } from "../types";

const cx = (...classes: Array<string | undefined | false>) =>
  classes.filter(Boolean).join(" ");

export function DiscordAuditPage({ className, ui }: DiscordPageProps) {
  return (
    <div className={cx(className, ui?.pageClassName)}>
      <div className={cx("mb-6", ui?.headerClassName)}>
        <h2
          className={cx(
            "text-2xl font-semibold text-foreground",
            ui?.titleClassName,
          )}
        >
          Audit log
        </h2>
        <p
          className={cx(
            "text-sm text-muted-foreground",
            ui?.descriptionClassName,
          )}
        >
          Review recent Discord API activity and delivery attempts.
        </p>
      </div>

      <Card className={ui?.cardClassName}>
        <CardHeader className={ui?.cardHeaderClassName}>
          <CardTitle className={ui?.cardTitleClassName}>
            Recent activity
          </CardTitle>
        </CardHeader>
        <CardContent
          className={cx(
            "space-y-3 text-sm text-muted-foreground",
            ui?.cardContentClassName,
          )}
        >
          <p>No audit entries yet. Activity will appear after the first sync.</p>
          <ul className="list-disc pl-5">
            <li>Trade idea messages posted</li>
            <li>Role sync operations</li>
            <li>Bot install events</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
