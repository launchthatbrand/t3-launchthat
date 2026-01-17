"use client";

import React from "react";

export interface NotificationDetails {
  title: string;
  summary: string;
  howCalculated?: string;
}

export interface PhoneNotification {
  id: string;
  app: string;
  time: string;
  title: string;
  body: string;
  accent?: boolean;
  details: NotificationDetails;
}

export const NotificationTile = ({
  notification,
  onClickAction,
  heightClassName = "h-[92px]",
}: {
  notification: PhoneNotification;
  onClickAction?: (
    e: React.MouseEvent<HTMLButtonElement>,
    n: PhoneNotification,
  ) => void;
  heightClassName?: string;
}) => {
  const n = notification;
  return (
    <button
      type="button"
      onClick={(e) => onClickAction?.(e, n)}
      className={[
        heightClassName,
        "w-full rounded-2xl border bg-white/10 px-3.5 py-3 text-left shadow-[0_12px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl",
        "transition-colors hover:bg-white/12 focus-visible:ring-2 focus-visible:ring-orange-400/50 focus-visible:outline-hidden",
        n.accent ? "border-orange-500/20" : "border-white/10",
      ].join(" ")}
      aria-label={`${n.app}: ${n.title}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div
            className={[
              "h-8 w-8 shrink-0 rounded-[10px] ring-1 ring-white/10",
              n.accent
                ? "bg-linear-to-br from-orange-500/70 to-orange-300/30 shadow-[0_0_18px_rgba(249,115,22,0.35)]"
                : "bg-white/10",
            ].join(" ")}
          />
          <div className="truncate text-[11px] font-medium text-white/80">
            {n.app}
          </div>
        </div>
        <div className="shrink-0 text-[11px] text-white/55">{n.time}</div>
      </div>

      <div className="mt-2">
        <div className="truncate text-[13px] font-semibold text-white">
          {n.title}
        </div>
        <div className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-white/70">
          {n.body}
        </div>
      </div>
    </button>
  );
};
