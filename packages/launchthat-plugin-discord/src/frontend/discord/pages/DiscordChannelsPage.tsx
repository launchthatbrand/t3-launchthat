"use client";

import React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

import type { DiscordPageProps } from "../types";

const cx = (...classes: Array<string | undefined | false>) =>
  classes.filter(Boolean).join(" ");

export function DiscordChannelsPage({ className, ui }: DiscordPageProps) {
  return (
    <div className={cx(className, ui?.pageClassName)}>
      <div className={cx("mb-6", ui?.headerClassName)}>
        <h2
          className={cx(
            "text-foreground text-2xl font-semibold",
            ui?.titleClassName,
          )}
        >
          Channels
        </h2>
        <p
          className={cx(
            "text-muted-foreground text-sm",
            ui?.descriptionClassName,
          )}
        >
          Map events (trade feed, announcements, support, etc.) to specific
          Discord channels.
        </p>
      </div>

      <Card className={ui?.cardClassName}>
        <CardHeader className={ui?.cardHeaderClassName}>
          <CardTitle className={ui?.cardTitleClassName}>Coming soon</CardTitle>
        </CardHeader>
        <CardContent
          className={cx("text-muted-foreground text-sm", ui?.cardContentClassName)}
        >
          This page will consolidate channel routing (trade feed, announcements,
          support) into one place. For now, manage per-guild channel IDs in Guild
          Settings.
        </CardContent>
      </Card>
    </div>
  );
}

