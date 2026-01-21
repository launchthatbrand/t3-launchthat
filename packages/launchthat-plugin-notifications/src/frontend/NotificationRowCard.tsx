"use client";

import * as React from "react";

import { cn } from "@acme/ui";

import type { NotificationRow } from "./types";

export function NotificationRowCard(props: {
  notification: NotificationRow;
  onClick?: () => void;
  className?: string;
}) {
  const { notification } = props;
  const title =
    typeof notification.title === "string" && notification.title.trim()
      ? notification.title.trim()
      : "Notification";
  const content =
    typeof notification.content === "string" && notification.content.trim()
      ? notification.content.trim()
      : null;
  const isRead = notification.read === true;
  const createdAtMs =
    typeof notification.createdAt === "number"
      ? notification.createdAt
      : undefined;

  return (
    <button
      type="button"
      onClick={props.onClick}
      className={cn(
        "w-full text-left flex items-start gap-3 rounded-lg border border-white/10 bg-black/20 p-3 transition hover:bg-black/30",
        !isRead && "border-orange-500/20 bg-orange-500/5",
        props.className,
      )}
    >
      <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-white/30">
        {!isRead ? <div className="h-2 w-2 rounded-full bg-orange-400" /> : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-white/90">
              {title}
            </div>
            {content ? (
              <div className="mt-1 line-clamp-2 text-xs text-white/60">
                {content}
              </div>
            ) : null}
          </div>
          {createdAtMs ? (
            <div className="shrink-0 text-[11px] text-white/45">
              {new Date(createdAtMs).toLocaleString()}
            </div>
          ) : null}
        </div>
      </div>
    </button>
  );
}

