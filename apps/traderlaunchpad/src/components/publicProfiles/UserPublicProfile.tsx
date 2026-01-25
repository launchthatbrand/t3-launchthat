"use client";

import { Button } from "@acme/ui/button";
import Link from "next/link";
import React from "react";
import { cn } from "~/lib/utils";

type UserProfileSectionKindV1 = "hero" | "about" | "links" | "stats";

export interface UserPublicProfileConfigV1 {
  version: "v1";
  links: { label: string; url: string }[];
  sections: { id: string; kind: UserProfileSectionKindV1; enabled: boolean }[];
}

export interface UserPublicProfileData {
  _id: string;
  publicUsername: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  publicProfileConfig?: UserPublicProfileConfigV1;
}

const DEFAULT_CONFIG: UserPublicProfileConfigV1 = {
  version: "v1",
  links: [],
  sections: [
    { id: "hero", kind: "hero", enabled: true },
    // Deprecated for public UI (kept for backward compatibility with stored configs).
    { id: "about", kind: "about", enabled: false },
    { id: "links", kind: "links", enabled: true },
    // Deprecated for public UI (kept for backward compatibility with stored configs).
    { id: "stats", kind: "stats", enabled: false },
  ],
};

const normalizeConfig = (
  input: UserPublicProfileData["publicProfileConfig"],
): UserPublicProfileConfigV1 => {
  if (!input) return DEFAULT_CONFIG;
  return {
    version: "v1",
    links: Array.isArray(input.links) ? input.links : [],
    sections: Array.isArray(input.sections) ? input.sections : DEFAULT_CONFIG.sections,
  };
};

export function UserPublicProfile(props: {
  mode: "public" | "admin";
  canEdit: boolean;
  user: UserPublicProfileData;
  className?: string;
  tabs?: { label: string; href: string; isActive: boolean }[];
  // For admin mode: optional save/cancel controls are wired later.
  onSaveAction?: () => void;
}) {
  const config = normalizeConfig(props.user.publicProfileConfig);
  const enabledSections = config.sections.filter((s) => s.enabled);

  const coverUrl = props.user.coverUrl ?? null;
  const avatarUrl = props.user.avatarUrl ?? null;
  const handle = `@${props.user.publicUsername}`;

  return (
    <div className={cn("flex flex-1 flex-col", props.className)}>
      {props.mode === "admin" ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/70 backdrop-blur-md">
          <div>
            <span className="font-medium text-white">Admin preview</span>
            <span className="ml-2 text-white/50">This is exactly what the public page renders.</span>
          </div>
          {props.onSaveAction ? (
            <Button
              type="button"
              className="h-9 rounded-full border-0 bg-orange-600 text-white hover:bg-orange-700"
              onClick={props.onSaveAction}
              disabled={!props.canEdit}
            >
              Save
            </Button>
          ) : null}
        </div>
      ) : null}

      {enabledSections.map((section) => {
        switch (section.kind) {
          case "hero": {
            const tabs = Array.isArray(props.tabs) ? props.tabs : [];
            const stats = [
              { label: "Followers", value: "—" },
              { label: "Following", value: "—" },
              { label: "Likes", value: "—" },
            ];
            return (
              <div
                key={section.id}
                className="overflow-hidden rounded-3xl border border-white/10 bg-black/30 backdrop-blur-md"
              >
                <div className="relative">
                  <div className="h-32 md:h-44 bg-linear-to-r from-orange-500/25 via-orange-500/10 to-transparent" />
                  {coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={coverUrl}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover opacity-45"
                    />
                  ) : null}
                  <div className="pointer-events-none absolute -left-24 -top-20 h-56 w-56 rounded-full bg-orange-500/20 blur-3xl" />
                  <div className="pointer-events-none absolute right-0 -top-24 h-64 w-64 rounded-full bg-fuchsia-500/10 blur-3xl" />

                  {/* Desktop overlay: stats + actions on the cover */}
                  <div className="absolute right-3 top-3 flex items-start gap-2 lg:right-4 lg:top-4 lg:gap-3">
                    {stats.map((s) => (
                      <div
                        key={s.label}
                        className="rounded-2xl border border-white/10 bg-black/40 px-2.5 py-2 text-right backdrop-blur-md lg:px-4 lg:py-3"
                      >
                        <div className="text-sm font-semibold tabular-nums text-white lg:text-lg">
                          {s.value}
                        </div>
                        <div className="text-[10px] text-white/55 lg:text-xs">{s.label}</div>
                      </div>
                    ))}
                  </div>


                </div>

                <div className="px-6 pb-6">
                  <div className="-mt-12 flex flex-col gap-6">
                    <div className="flex flex-col gap-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
                        <div className="flex gap-2 items-end justify-between">
                          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-black/50 shadow-[0_18px_60px_rgba(0,0,0,0.35)] md:h-28 md:w-28">
                            {avatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={avatarUrl}
                                alt={props.user.displayName}
                                className="h-full w-full object-cover opacity-95"
                              />
                            ) : (
                              <div className="text-3xl font-semibold text-white/70">
                                {(props.user.displayName || "U").slice(0, 1).toUpperCase()}
                              </div>
                            )}

                          </div>
                          <div className="mb-2 inline-flex md:hidden items-center gap-2 rounded-full border border-orange-500/25 bg-orange-500/10 px-4 py-1.5 text-xs font-medium text-orange-200">
                            Public profile
                          </div>
                        </div>

                        <div className="min-w-0">
                          <div className="mb-2 hidden md:inline-flex items-center gap-2 rounded-full border border-orange-500/25 bg-orange-500/10 px-4 py-1.5 text-xs font-medium text-orange-200">
                            Public profile
                          </div>
                          <h1 className="truncate text-2xl font-bold tracking-tight text-white md:text-4xl">
                            {props.user.displayName}
                          </h1>
                          <div className="mt-1 text-sm text-white/55">{handle}</div>
                          <div className="mt-3 max-w-2xl text-sm leading-relaxed text-white/65">
                            {props.user.bio?.trim()
                              ? props.user.bio
                              : "Connect your broker, journal trades, and share your edge with the fleet."}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        {/* Mobile order: CTA buttons first, then tabs. Desktop: tabs left, CTAs right. */}
                        <div className="order-2 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:order-1">
                          {tabs.map((t) => (
                            <Link
                              key={t.href}
                              href={t.href}
                              className={cn(
                                "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                                t.isActive
                                  ? "bg-orange-600 text-white"
                                  : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white",
                              )}
                            >
                              {t.label}
                            </Link>
                          ))}
                        </div>

                        <div className="order-1 flex flex-wrap items-center gap-2 sm:order-2 sm:justify-end">
                          <Button
                            variant="outline"
                            className="h-10 rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10"
                            disabled={props.mode === "admin"}
                          >
                            Follow
                          </Button>
                          <Button
                            className="h-10 rounded-full border-0 bg-orange-600 text-white hover:bg-orange-700"
                            disabled={props.mode === "admin"}
                          >
                            Get in touch
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Stats are shown only in the cover overlay (top-right). */}
                  </div>
                </div>
              </div>
            );
          }

          case "about": {
            // Removed from public profile UI; bio lives in hero section only.
            return null;
          }

          case "links": {
            if (!config.links.length) return null;
            return (
              <div
                key={section.id}
                className="mt-8 rounded-3xl border border-white/10 bg-black/30 p-6 text-white/70 backdrop-blur-md"
              >
                <div className="text-sm font-semibold text-white">Links</div>
                <div className="mt-3 grid gap-2">
                  {config.links.map((l) => (
                    <a
                      key={`${l.label}:${l.url}`}
                      href={l.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl border border-white/10 bg-white/3 px-4 py-3 text-sm text-white/80 hover:bg-white/6"
                    >
                      <div className="font-medium text-white">{l.label}</div>
                      <div className="mt-0.5 truncate text-xs text-white/50">{l.url}</div>
                    </a>
                  ))}
                </div>
              </div>
            );
          }

          case "stats": {
            // Removed from public profile UI; any stats should be shown in the hero header.
            return null;
          }

          default:
            return null;
        }
      })}
    </div>
  );
}

