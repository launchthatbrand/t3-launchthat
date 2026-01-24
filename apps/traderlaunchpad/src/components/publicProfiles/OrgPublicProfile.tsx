"use client";

import React from "react";
import Link from "next/link";

import { Button } from "@acme/ui/button";
import { cn } from "~/lib/utils";

type OrgProfileSectionKindV1 = "hero" | "about" | "links" | "stats";

export interface OrgPublicProfileConfigV1 {
  version: "v1";
  links: { label: string; url: string }[];
  sections: { id: string; kind: OrgProfileSectionKindV1; enabled: boolean }[];
}

export interface OrgPublicProfileData {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl: string | null;
  publicProfileConfig?: OrgPublicProfileConfigV1;
}

const DEFAULT_CONFIG: OrgPublicProfileConfigV1 = {
  version: "v1",
  links: [],
  sections: [
    { id: "hero", kind: "hero", enabled: true },
    { id: "about", kind: "about", enabled: true },
    { id: "links", kind: "links", enabled: true },
    { id: "stats", kind: "stats", enabled: true },
  ],
};

const normalizeConfig = (input: OrgPublicProfileData["publicProfileConfig"]): OrgPublicProfileConfigV1 => {
  if (!input || input.version !== "v1") return DEFAULT_CONFIG;
  return {
    version: "v1",
    links: Array.isArray(input.links) ? input.links : [],
    sections: Array.isArray(input.sections) ? input.sections : DEFAULT_CONFIG.sections,
  };
};

export function OrgPublicProfile(props: {
  mode: "public" | "admin";
  canEdit: boolean;
  org: OrgPublicProfileData;
  className?: string;
}) {
  const config = normalizeConfig(props.org.publicProfileConfig);

  const enabledSections = config.sections.filter((s) => s.enabled);

  return (
    <div className={cn("flex flex-1 flex-col", props.className)}>
      {props.mode === "admin" ? (
        <div className="mb-4 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/70 backdrop-blur-md">
          <span className="font-medium text-white">Admin preview</span>
          <span className="ml-2 text-white/50">This is exactly what the public page renders.</span>
        </div>
      ) : null}

      {enabledSections.map((section) => {
        switch (section.kind) {
          case "hero": {
            const title = props.org.name;
            const description = props.org.description ?? null;
            const logoUrl = props.org.logoUrl ?? null;
            return (
              <div
                key={section.id}
                className="overflow-hidden rounded-3xl border border-white/10 bg-black/30 backdrop-blur-md"
              >
                <div className="relative">
                  <div className="h-36 bg-linear-to-r from-orange-500/25 via-orange-500/10 to-transparent" />
                  <div className="pointer-events-none absolute -left-24 -top-20 h-56 w-56 rounded-full bg-orange-500/20 blur-3xl" />
                  <div className="pointer-events-none absolute right-0 -top-24 h-64 w-64 rounded-full bg-fuchsia-500/10 blur-3xl" />
                </div>

                <div className="px-6 pb-6">
                  <div className="-mt-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/40 md:h-24 md:w-24">
                        {logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={logoUrl}
                            alt={title}
                            className="h-full w-full object-cover opacity-95"
                          />
                        ) : (
                          <div className="text-2xl font-semibold text-white/70">
                            {(title || "O").slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-orange-500/25 bg-orange-500/10 px-4 py-1.5 text-xs font-medium text-orange-200">
                          Organization
                        </div>
                        <h1 className="truncate text-2xl font-bold tracking-tight text-white md:text-4xl">
                          {title}
                        </h1>
                        <div className="mt-1 text-sm text-white/55">@{props.org.slug}</div>
                        {description ? (
                          <div className="mt-3 max-w-2xl text-sm leading-relaxed text-white/65">
                            {description}
                          </div>
                        ) : (
                          <div className="mt-3 max-w-2xl text-sm leading-relaxed text-white/45">
                            No description yet.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        className="h-10 rounded-full border-0 bg-orange-600 text-white hover:bg-orange-700"
                        asChild
                      >
                        <Link href="/join">Join TraderLaunchpad</Link>
                      </Button>
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
                  {props.org.description?.trim()
                    ? props.org.description
                    : "This org hasn’t added an about section yet."}
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
                  Coming soon: members, weekly PnL, top instruments, and recent trade ideas.
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

