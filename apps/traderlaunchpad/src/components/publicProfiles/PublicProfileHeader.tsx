"use client";

import { Button } from "@acme/ui/button";
import Link from "next/link";
import { Pencil } from "lucide-react";
import React from "react";
import { cn } from "~/lib/utils";

export interface PublicProfileTab {
  label: string;
  href: string;
  isActive: boolean;
}

export interface PublicProfileStat {
  label: string;
  value: React.ReactNode;
}

export function PublicProfileHeader(props: {
  coverUrl?: string | null;
  avatarUrl?: string | null;
  avatarAlt: string;
  avatarFallback: string;
  avatarStyle?: React.CSSProperties;
  avatarInteractive?: { onClick: () => void; ariaLabel: string; showPencil?: boolean };
  badgeLabel: string;
  title: string;
  handle: string;
  titleInteractive?: { onClick: () => void; ariaLabel: string; showPencil?: boolean };
  bio: string;
  bioInteractive?: { onClick: () => void; ariaLabel: string; showPencil?: boolean };
  bioExtra?: React.ReactNode;
  tabs?: PublicProfileTab[];
  stats?: PublicProfileStat[];
  topRightExtra?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const tabs = Array.isArray(props.tabs) ? props.tabs : [];
  const stats = Array.isArray(props.stats)
    ? props.stats
    : [
      { label: "Followers", value: "—" },
      { label: "Following", value: "—" },
      { label: "Likes", value: "—" },
    ];

  return (
    <div className="overflow-hidden rounded-3xl border border-border/20 bg-white/80 backdrop-blur-md dark:bg-black/30">
      <div className="relative">
        <div className="h-32 bg-linear-to-r from-orange-500/25 via-orange-500/10 to-transparent md:h-44" />
        {props.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={props.coverUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-45"
          />
        ) : null}
        <div className="pointer-events-none absolute -left-24 -top-20 h-56 w-56 rounded-full bg-orange-500/20 blur-3xl" />
        <div className="pointer-events-none absolute right-0 -top-24 h-64 w-64 rounded-full bg-fuchsia-500/10 blur-3xl" />

        <div className="absolute right-3 top-3 lg:right-4 lg:top-4">
          <div className="flex items-start gap-2 lg:gap-3">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-border/20 bg-white/80 px-2.5 py-2 text-right backdrop-blur-md dark:bg-black/40 lg:px-4 lg:py-3"
              >
                <div className="text-sm font-semibold tabular-nums text-foreground lg:text-lg">
                  {s.value}
                </div>
                <div className="text-[10px] text-muted-foreground lg:text-xs">{s.label}</div>
              </div>
            ))}
          </div>

          {props.topRightExtra ? (
            <div className="mt-2 flex justify-end">{props.topRightExtra}</div>
          ) : null}
        </div>
      </div>

      <div className="px-6 pb-6">
        <div className="-mt-12 flex flex-col gap-6">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
              <div className="flex items-end justify-between gap-2">
                <div className="relative">
                  {props.avatarInteractive ? (
                    <button
                      type="button"
                      className="group flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border border-border/20 bg-white/90 shadow-[0_18px_60px_rgba(0,0,0,0.18)] transition-colors hover:bg-white md:h-28 md:w-28 dark:border-border/10 dark:bg-black/50 dark:hover:bg-black/55 dark:shadow-[0_18px_60px_rgba(0,0,0,0.35)]"
                      onClick={props.avatarInteractive.onClick}
                      aria-label={props.avatarInteractive.ariaLabel}
                    >
                      {props.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={props.avatarUrl}
                          alt={props.avatarAlt}
                          className="h-full w-full object-cover opacity-95"
                          style={props.avatarStyle}
                        />
                      ) : (
                        <div className="text-3xl font-semibold text-foreground/70">
                          {(props.avatarFallback || "U").slice(0, 1).toUpperCase()}
                        </div>
                      )}

                      {props.avatarInteractive.showPencil ? (
                        <span className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/20 bg-white/85 text-foreground/80 opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100 dark:border-border/10 dark:bg-black/55">
                          <Pencil className="h-4 w-4" />
                        </span>
                      ) : null}
                    </button>
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border border-border/20 bg-white/90 shadow-[0_18px_60px_rgba(0,0,0,0.18)] md:h-28 md:w-28 dark:border-border/10 dark:bg-black/50 dark:shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
                      {props.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={props.avatarUrl}
                          alt={props.avatarAlt}
                          className="h-full w-full object-cover opacity-95"
                          style={props.avatarStyle}
                        />
                      ) : (
                        <div className="text-3xl font-semibold text-foreground/70">
                          {(props.avatarFallback || "U").slice(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-orange-500/25 bg-orange-500/10 px-4 py-1.5 text-xs font-medium text-orange-700 dark:text-orange-200 md:hidden">
                  {props.badgeLabel}
                </div>
              </div>

              <div className="min-w-0">
                <div className="mb-2 hidden items-center gap-2 rounded-full border border-orange-500/25 bg-orange-500/10 px-4 py-1.5 text-xs font-medium text-orange-700 dark:text-orange-200 md:inline-flex">
                  {props.badgeLabel}
                </div>
                <div className="flex items-center gap-2">
                  <h1 className="truncate text-2xl font-bold tracking-tight text-foreground md:text-4xl">
                    {props.title}
                  </h1>
                  {props.titleInteractive ? (
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/20 bg-white/80 text-foreground/70 backdrop-blur-md transition-colors hover:bg-white hover:text-foreground dark:border-border/10 dark:bg-black/40 dark:hover:bg-white/5"
                      onClick={props.titleInteractive.onClick}
                      aria-label={props.titleInteractive.ariaLabel}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
                <div className="mt-1 text-sm text-foreground/55">{props.handle}</div>
                {props.bioInteractive ? (
                  <div className="mt-3 flex max-w-2xl items-start gap-2">
                    <button
                      type="button"
                      className="flex-1 text-left text-sm leading-relaxed text-foreground/70 transition-colors hover:text-foreground"
                      onClick={props.bioInteractive.onClick}
                      aria-label={props.bioInteractive.ariaLabel}
                    >
                      {props.bio}
                    </button>
                    {props.bioInteractive.showPencil ? (
                      <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/20 bg-white/80 text-foreground/70 backdrop-blur-md dark:border-border/10 dark:bg-black/40">
                        <Pencil className="h-4 w-4" />
                      </span>
                    ) : null}
                  </div>
                ) : (
                  <div className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground/70">
                    {props.bio}
                  </div>
                )}
                {props.bioExtra ? <div className="mt-2 max-w-2xl">{props.bioExtra}</div> : null}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Mobile order: actions first, then tabs. Desktop: tabs left, actions right. */}
              <div className="order-2 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:order-1">
                {tabs.map((t) => (
                  <Link
                    key={t.href}
                    href={t.href}
                    className={cn(
                      "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                      t.isActive
                        ? "bg-orange-600 text-white"
                        : "bg-white/70 text-foreground/80 hover:bg-white hover:text-foreground dark:bg-white/5 dark:text-foreground/70 dark:hover:bg-white/10",
                    )}
                  >
                    {t.label}
                  </Link>
                ))}
              </div>

              <div className="order-1 flex flex-wrap items-center gap-2 sm:order-2 sm:justify-end">
                {props.actions ?? (
                  <>
                    <Button
                      variant="outline"
                      className="h-10 rounded-full border-border/20 bg-white/70 text-foreground hover:bg-white dark:border-border/10 dark:bg-white/5 dark:hover:bg-white/10"
                    >
                      Follow
                    </Button>
                    <Button className="h-10 rounded-full border-0 bg-orange-600 text-white hover:bg-orange-700">
                      Get in touch
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Stats are shown only in the cover overlay (top-right). */}
        </div>
      </div>
    </div>
  );
}

