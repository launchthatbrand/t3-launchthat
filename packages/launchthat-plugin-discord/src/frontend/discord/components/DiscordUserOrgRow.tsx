"use client";

import React from "react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";

export interface DiscordUserOrgRowProps {
  orgName: string;
  orgSubtitle?: string;

  canConnect: boolean;
  isLinked: boolean;
  streamingEnabled?: boolean;

  inviteUrl?: string | null;

  onConnect: () => void;
  onDisconnect: () => void;
  onJoinDiscord?: () => void;

  isBusy?: boolean;
  className?: string;
}

export function DiscordUserOrgRow(props: DiscordUserOrgRowProps) {
  const inviteUrl =
    typeof props.inviteUrl === "string" && props.inviteUrl.trim()
      ? props.inviteUrl.trim()
      : null;

  return (
    <div
      className={
        props.className ??
        "flex flex-col gap-2 rounded-lg border border-border/60 bg-card/70 p-3 backdrop-blur"
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{props.orgName}</div>
          {props.orgSubtitle ? (
            <div className="mt-0.5 truncate text-xs text-muted-foreground">
              {props.orgSubtitle}
            </div>
          ) : null}
        </div>

        <Badge
          className={
            props.isLinked
              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30"
              : "bg-yellow-500/10 text-yellow-500 border border-yellow-500/30"
          }
        >
          {props.isLinked
            ? props.streamingEnabled
              ? "Connected"
              : "Linked (streaming off)"
            : "Not connected"}
        </Badge>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {!props.isLinked ? (
          <Button
            size="sm"
            disabled={!props.canConnect || props.isBusy}
            onClick={props.onConnect}
          >
            {props.canConnect ? "Connect" : "Unavailable"}
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            disabled={props.isBusy}
            onClick={props.onDisconnect}
          >
            Disconnect
          </Button>
        )}

        {inviteUrl ? (
          <Button
            size="sm"
            variant="outline"
            disabled={props.isBusy}
            onClick={() => {
              if (props.onJoinDiscord) return props.onJoinDiscord();
              window.open(inviteUrl, "_blank");
            }}
          >
            Join Discord
          </Button>
        ) : null}
      </div>
    </div>
  );
}

