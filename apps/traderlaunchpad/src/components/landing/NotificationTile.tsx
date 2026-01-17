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
  onOpenAppAction,
  onOpenInfoAction,
  heightClassName = "h-[92px]",
}: {
  notification: PhoneNotification;
  onOpenAppAction?: (
    e: React.MouseEvent<HTMLElement>,
    n: PhoneNotification,
  ) => void;
  onOpenInfoAction?: (
    e: React.MouseEvent<HTMLButtonElement>,
    n: PhoneNotification,
  ) => void;
  heightClassName?: string;
}) => {
  const n = notification;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={(e) => onOpenAppAction?.(e, n)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenAppAction?.(e as unknown as React.MouseEvent<HTMLElement>, n);
        }
      }}
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
        <div className="flex shrink-0 items-center gap-2">
          <div className="text-[11px] text-white/55">{n.time}</div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenInfoAction?.(e, n);
            }}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-black/30 text-white/70 transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-orange-400/50 focus-visible:outline-hidden"
            aria-label={`More info: ${n.title}`}
            title="More info"
          >
            i
          </button>
        </div>
      </div>

      <div className="mt-2">
        <div className="truncate text-[13px] font-semibold text-white">
          {n.title}
        </div>
        <div className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-white/70">
          {n.body}
        </div>
      </div>
    </div>
  );
};
