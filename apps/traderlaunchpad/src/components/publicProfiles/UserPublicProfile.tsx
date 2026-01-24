"use client";

import React from "react";

import { Button } from "@acme/ui/button";
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
    { id: "about", kind: "about", enabled: true },
    { id: "links", kind: "links", enabled: true },
    { id: "stats", kind: "stats", enabled: true },
  ],
};

const normalizeConfig = (input: UserPublicProfileData["publicProfileConfig"]): UserPublicProfileConfigV1 => {
  if (!input || input.version !== "v1") return DEFAULT_CONFIG;
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
  // For admin mode: optional save/cancel controls are wired later.
  onSave?: () => void;
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
          {props.onSave ? (
            <Button
              type="button"
              className="h-9 rounded-full border-0 bg-orange-600 text-white hover:bg-orange-700"
              onClick={props.onSave}
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
            return (
              <div
                key={section.id}
                className="overflow-hidden rounded-3xl border border-white/10 bg-black/30 backdrop-blur-md"
              >
                <div className="relative">
                  <div className="h-44 bg-linear-to-r from-orange-500/25 via-orange-500/10 to-transparent" />
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
                </div>

                <div className="px-6 pb-6">
                  <div className="-mt-12 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div className="flex items-start gap-4">
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

                      <div className="min-w-0">
                        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-orange-500/25 bg-orange-500/10 px-4 py-1.5 text-xs font-medium text-orange-200">
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

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between lg:flex-col lg:items-end">
                      <div className="flex flex-wrap items-center justify-start gap-3 lg:justify-end">
                        {[
                          { label: "Followers", value: "—" },
                          { label: "Following", value: "—" },
                          { label: "Likes", value: "—" },
                        ].map((s) => (
                          <div
                            key={s.label}
                            className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-right backdrop-blur-md"
                          >
                            <div className="text-lg font-semibold tabular-nums text-white">
                              {s.value}
                            </div>
                            <div className="text-xs text-white/55">{s.label}</div>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-wrap items-center justify-start gap-2 lg:justify-end">
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
                </div>
              </div>
            );
          }

          case "about": {
            return (
              <div
                key={section.id}
                className="mt-8 rounded-3xl border border-white/10 bg-black/30 p-6 text-white/70 backdrop-blur-md"
              >
                <div className="text-sm font-semibold text-white">About</div>
                <div className="mt-2 text-sm">
                  {props.user.bio?.trim() ? props.user.bio : "This user hasn’t added a bio yet."}
                </div>
              </div>
            );
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
            return (
              <div
                key={section.id}
                className="mt-8 rounded-3xl border border-white/10 bg-black/30 p-6 text-white/70 backdrop-blur-md"
              >
                <div className="text-sm font-semibold text-white">Stats</div>
                <div className="mt-2 text-sm text-white/60">
                  Coming soon: consistency, win rate, average hold time, and public trade ideas.
                </div>
              </div>
            );
          }

          default:
            return null;
        }
      })}
    </div>
  );
}

