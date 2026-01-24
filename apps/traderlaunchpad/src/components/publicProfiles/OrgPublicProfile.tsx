"use client";

import {
  BuilderDndProvider,
  SortableContext,
  SortableItem,
  arrayMove,
  verticalListSortingStrategy,
} from "@acme/dnd";
import type { DragEndEvent, SortingStrategy } from "@acme/dnd";
import { Eye, EyeOff, Pencil, Plus, Save, Trash2 } from "lucide-react";

import { Button } from "@acme/ui/button";
import Link from "next/link";
import React from "react";
import { cn } from "~/lib/utils";

type OrgProfileSectionKindV1 = "hero" | "about" | "links" | "stats";

interface OrgHeroCta {
  id: string;
  label: string;
  url: string;
  variant?: "primary" | "outline";
}

export interface OrgPublicProfileConfigV1 {
  version: "v1";
  heroCtas?: OrgHeroCta[];
  logoCrop?: { x: number; y: number };
  links: { label: string; url: string }[];
  sections: { id: string; kind: OrgProfileSectionKindV1; enabled: boolean }[];
}

export interface OrgPublicProfileData {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl: string | null;
  publicProfileConfig?: unknown;
}

const DEFAULT_CONFIG: OrgPublicProfileConfigV1 = {
  version: "v1",
  heroCtas: [{ id: "join", label: "Join TraderLaunchpad", url: "/join", variant: "primary" }],
  logoCrop: { x: 50, y: 50 },
  links: [],
  sections: [
    { id: "hero", kind: "hero", enabled: true },
    { id: "about", kind: "about", enabled: true },
    { id: "links", kind: "links", enabled: true },
    { id: "stats", kind: "stats", enabled: true },
  ],
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const normalizeConfig = (input: unknown): OrgPublicProfileConfigV1 => {
  if (!isRecord(input)) return DEFAULT_CONFIG;
  if (input.version !== "v1") return DEFAULT_CONFIG;

  const heroCtasRaw = input.heroCtas;
  const heroCtas: OrgHeroCta[] | undefined = Array.isArray(heroCtasRaw)
    ? heroCtasRaw
      .map((c): OrgHeroCta | null => {
        if (!isRecord(c)) return null;
        const id = typeof c.id === "string" ? c.id : "";
        const label = typeof c.label === "string" ? c.label : "";
        const url = typeof c.url === "string" ? c.url : "";
        if (!id || !label || !url) return null;
        const variant =
          c.variant === "outline" || c.variant === "primary"
            ? (c.variant as OrgHeroCta["variant"])
            : undefined;
        return { id, label, url, variant };
      })
      .filter((x): x is OrgHeroCta => x !== null)
    : undefined;

  const linksRaw = input.links;
  const links: OrgPublicProfileConfigV1["links"] = Array.isArray(linksRaw)
    ? linksRaw
      .map((l): { label: string; url: string } | null => {
        if (!isRecord(l)) return null;
        const label = typeof l.label === "string" ? l.label : "";
        const url = typeof l.url === "string" ? l.url : "";
        if (!label || !url) return null;
        return { label, url };
      })
      .filter((x): x is { label: string; url: string } => x !== null)
    : [];

  const sectionsRaw = input.sections;
  const sections: OrgPublicProfileConfigV1["sections"] = Array.isArray(sectionsRaw)
    ? sectionsRaw
      .map((s): OrgPublicProfileConfigV1["sections"][number] | null => {
        if (!isRecord(s)) return null;
        const id = typeof s.id === "string" ? s.id : "";
        const kind = s.kind;
        if (kind !== "hero" && kind !== "about" && kind !== "links" && kind !== "stats") {
          return null;
        }
        if (!id) return null;
        return { id, kind, enabled: Boolean(s.enabled) };
      })
      .filter((x): x is OrgPublicProfileConfigV1["sections"][number] => x !== null)
    : DEFAULT_CONFIG.sections;

  const logoCropRaw = input.logoCrop;
  const logoCrop: OrgPublicProfileConfigV1["logoCrop"] =
    isRecord(logoCropRaw) &&
      typeof logoCropRaw.x === "number" &&
      typeof logoCropRaw.y === "number"
      ? {
        x: Math.max(0, Math.min(100, logoCropRaw.x)),
        y: Math.max(0, Math.min(100, logoCropRaw.y)),
      }
      : DEFAULT_CONFIG.logoCrop;

  return {
    version: "v1",
    heroCtas: heroCtas ?? DEFAULT_CONFIG.heroCtas,
    logoCrop,
    links,
    sections,
  };
};

export function OrgPublicProfile(props: {
  mode: "public" | "admin";
  canEdit: boolean;
  org: OrgPublicProfileData;
  className?: string;
  onChangeConfigAction?: (next: OrgPublicProfileConfigV1) => void;
  onSaveAction?: () => void;
  isSaving?: boolean;
  onEditLogoAction?: () => void;
}) {
  const config = normalizeConfig(props.org.publicProfileConfig);
  const isAdmin = props.mode === "admin";
  const canEditInline = isAdmin && props.canEdit && Boolean(props.onChangeConfigAction);

  const visibleSections = isAdmin ? config.sections : config.sections.filter((s) => s.enabled);

  const handleToggleSection = (id: string) => {
    if (!canEditInline) return;
    props.onChangeConfigAction?.({
      ...config,
      sections: config.sections.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)),
    });
  };

  const handleMoveSection = (event: DragEndEvent) => {
    if (!canEditInline) return;
    // Normalize event shape for consistent type/lint behavior.
    const e = event as unknown as {
      active: { id: string | number };
      over?: { id: string | number } | null;
    };

    const activeId = String(e.active.id);
    const overId = e.over ? String(e.over.id) : "";
    if (!activeId || !overId || activeId === overId) return;

    const from = config.sections.findIndex((s) => s.id === activeId);
    const to = config.sections.findIndex((s) => s.id === overId);
    if (from < 0 || to < 0) return;
    const move = arrayMove as unknown as <T,>(items: T[], from: number, to: number) => T[];
    props.onChangeConfigAction?.({
      ...config,
      sections: move(config.sections, from, to),
    });
  };

  const heroCtas = config.heroCtas ?? [];
  const canShowCtaEditor = canEditInline;

  const handleAddHeroCta = () => {
    if (!canEditInline) return;
    const id = `cta_${Date.now()}`;
    props.onChangeConfigAction?.({
      ...config,
      heroCtas: [...heroCtas, { id, label: "New button", url: "/", variant: "outline" }],
    });
  };

  const handleUpdateHeroCta = (id: string, patch: Partial<OrgHeroCta>) => {
    if (!canEditInline) return;
    props.onChangeConfigAction?.({
      ...config,
      heroCtas: heroCtas.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    });
  };

  const handleRemoveHeroCta = (id: string) => {
    if (!canEditInline) return;
    props.onChangeConfigAction?.({
      ...config,
      heroCtas: heroCtas.filter((c) => c.id !== id),
    });
  };

  return (
    <div className={cn("flex flex-1 flex-col", props.className)}>
      {props.mode === "admin" ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/70 backdrop-blur-md">
          <div>
            <span className="font-medium text-white">Admin preview</span>
            <span className="ml-2 text-white/50">This is exactly what the public page renders.</span>
            {!props.canEdit ? (
              <span className="ml-2 text-white/50">(You don’t have edit permissions.)</span>
            ) : null}
          </div>
          {props.canEdit && props.onSaveAction ? (
            <Button
              className="h-9 rounded-full border-0 bg-orange-600 text-white hover:bg-orange-700"
              onClick={props.onSaveAction}
              disabled={Boolean(props.isSaving)}
            >
              <Save className="mr-2 h-4 w-4" />
              {props.isSaving ? "Saving…" : "Save"}
            </Button>
          ) : null}
        </div>
      ) : null}

      {canEditInline ? (
        <BuilderDndProvider onDragEnd={handleMoveSection}>
          <SortableContext
            items={config.sections.map((s) => s.id)}
            strategy={verticalListSortingStrategy as SortingStrategy}
          >
            {visibleSections.map((section) => (
              <SortableItem
                key={section.id}
                id={section.id}
                hideHandle={false}
                className="border-0 bg-transparent shadow-none"
                handleClassName="h-9 px-2 text-white/60 hover:text-white"
                renderHandle={(handle) => (
                  <div className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-full border border-white/10 bg-black/40 p-1 backdrop-blur-md">
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleToggleSection(section.id);
                      }}
                      aria-label={section.enabled ? "Hide section" : "Show section"}
                    >
                      {section.enabled ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    {handle}
                  </div>
                )}
              >
                <div className={section.enabled ? "" : "opacity-55"}>
                  {renderSection({
                    section,
                    org: props.org,
                    config,
                    mode: props.mode,
                    canEditInline,
                    heroCtas,
                    canShowCtaEditor,
                    onAddHeroCta: handleAddHeroCta,
                    onUpdateHeroCta: handleUpdateHeroCta,
                    onRemoveHeroCta: handleRemoveHeroCta,
                    onChangeConfigAction: props.onChangeConfigAction,
                    onEditLogoAction: props.onEditLogoAction,
                  })}
                </div>
              </SortableItem>
            ))}
          </SortableContext>
        </BuilderDndProvider>
      ) : (
        visibleSections.map((section) =>
          renderSection({
            section,
            org: props.org,
            config,
            mode: props.mode,
            canEditInline,
            heroCtas,
            canShowCtaEditor,
            onAddHeroCta: handleAddHeroCta,
            onUpdateHeroCta: handleUpdateHeroCta,
            onRemoveHeroCta: handleRemoveHeroCta,
            onChangeConfigAction: props.onChangeConfigAction,
            onEditLogoAction: props.onEditLogoAction,
          }),
        )
      )}
    </div>
  );
}

function renderSection(props: {
  section: { id: string; kind: OrgProfileSectionKindV1; enabled: boolean };
  org: OrgPublicProfileData;
  config: OrgPublicProfileConfigV1;
  mode: "public" | "admin";
  canEditInline: boolean;
  heroCtas: OrgHeroCta[];
  canShowCtaEditor: boolean;
  onAddHeroCta: () => void;
  onUpdateHeroCta: (id: string, patch: Partial<OrgHeroCta>) => void;
  onRemoveHeroCta: (id: string) => void;
  onChangeConfigAction?: (next: OrgPublicProfileConfigV1) => void;
  onEditLogoAction?: () => void;
}) {
  const { section } = props;
  switch (section.kind) {
    case "hero": {
      const title = props.org.name;
      const description = props.org.description ?? null;
      const logoUrl = props.org.logoUrl ?? null;
      const canEditLogo = props.mode === "admin" && Boolean(props.onEditLogoAction);
      const logoCrop = props.config.logoCrop ?? DEFAULT_CONFIG.logoCrop;
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
                <div className="group relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/40 md:h-24 md:w-24">
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logoUrl}
                      alt={title}
                      className="h-full w-full object-cover opacity-95"
                      style={
                        logoCrop
                          ? { objectPosition: `${logoCrop.x}% ${logoCrop.y}%` }
                          : undefined
                      }
                    />
                  ) : (
                    <div className="text-2xl font-semibold text-white/70">
                      {(title || "O").slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  {canEditLogo ? (
                    <button
                      type="button"
                      className="absolute inset-0 flex items-center justify-center bg-black/45 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        props.onEditLogoAction?.();
                      }}
                      aria-label="Edit organization logo"
                    >
                      <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-2 backdrop-blur-md">
                        <Pencil className="h-4 w-4" />
                        Edit
                      </span>
                    </button>
                  ) : null}
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

              <div className="flex flex-col items-start gap-2 md:items-end">
                <div className="flex flex-wrap items-center gap-2">
                  {(props.heroCtas.length > 0 ? props.heroCtas : []).map((cta) => {
                    const isPrimary = cta.variant !== "outline";
                    const buttonClassName = isPrimary
                      ? "h-10 rounded-full border-0 bg-orange-600 text-white hover:bg-orange-700"
                      : "h-10 rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10";
                    return (
                      <Button
                        key={cta.id}
                        className={buttonClassName}
                        variant={isPrimary ? "default" : "outline"}
                        asChild
                      >
                        <Link href={cta.url}>{cta.label}</Link>
                      </Button>
                    );
                  })}
                  {props.canShowCtaEditor ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10"
                      onClick={props.onAddHeroCta}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add button
                    </Button>
                  ) : null}
                </div>

                {props.canShowCtaEditor ? (
                  <div className="mt-2 w-full max-w-md space-y-2 rounded-2xl border border-white/10 bg-black/40 p-4 text-white/80 backdrop-blur-md">
                    <div className="text-xs font-semibold text-white">Header buttons</div>
                    <div className="space-y-2">
                      {(props.heroCtas.length > 0 ? props.heroCtas : []).map((cta) => (
                        <div
                          key={cta.id}
                          className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/3 p-3"
                        >
                          <div className="grid gap-2 sm:grid-cols-2">
                            <label className="text-xs text-white/60">
                              Label
                              <input
                                className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40"
                                value={cta.label}
                                onChange={(e) =>
                                  props.onUpdateHeroCta(cta.id, { label: e.target.value })
                                }
                              />
                            </label>
                            <label className="text-xs text-white/60">
                              URL
                              <input
                                className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40"
                                value={cta.url}
                                onChange={(e) =>
                                  props.onUpdateHeroCta(cta.id, { url: e.target.value })
                                }
                              />
                            </label>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              className="h-9 rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10"
                              onClick={() =>
                                props.onUpdateHeroCta(cta.id, {
                                  variant: cta.variant === "outline" ? "primary" : "outline",
                                })
                              }
                            >
                              Style: {cta.variant === "outline" ? "Outline" : "Primary"}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              className="h-9 rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10"
                              onClick={() => props.onRemoveHeroCta(cta.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
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
      if (!props.canEditInline && !props.config.links.length) return null;
      return (
        <div
          key={section.id}
          className="mt-8 rounded-3xl border border-white/10 bg-black/30 p-6 text-white/70 backdrop-blur-md"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm font-semibold text-white">Links</div>
            {props.canEditInline ? (
              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10"
                onClick={() => {
                  const next = {
                    ...props.config,
                    links: [...props.config.links, { label: "New link", url: "https://" }],
                  };
                  props.onChangeConfigAction?.(next);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add link
              </Button>
            ) : null}
          </div>
          <div className="mt-3 grid gap-2">
            {props.config.links.map((l, idx) => (
              <div
                key={`${l.label}:${l.url}:${idx}`}
                className="rounded-xl border border-white/10 bg-white/3 px-4 py-3 text-sm text-white/80"
              >
                {props.canEditInline ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="text-xs text-white/60">
                      Label
                      <input
                        className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40"
                        value={l.label}
                        onChange={(e) => {
                          const nextLinks = props.config.links.map((x, i) =>
                            i === idx ? { ...x, label: e.target.value } : x,
                          );
                          props.onChangeConfigAction?.({ ...props.config, links: nextLinks });
                        }}
                      />
                    </label>
                    <label className="text-xs text-white/60">
                      URL
                      <input
                        className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40"
                        value={l.url}
                        onChange={(e) => {
                          const nextLinks = props.config.links.map((x, i) =>
                            i === idx ? { ...x, url: e.target.value } : x,
                          );
                          props.onChangeConfigAction?.({ ...props.config, links: nextLinks });
                        }}
                      />
                    </label>
                  </div>
                ) : (
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block hover:opacity-90"
                  >
                    <div className="font-medium text-white">{l.label}</div>
                    <div className="mt-0.5 truncate text-xs text-white/50">{l.url}</div>
                  </a>
                )}

                {props.canEditInline ? (
                  <div className="mt-3 flex items-center justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10"
                      onClick={() => {
                        const nextLinks = props.config.links.filter((_, i) => i !== idx);
                        props.onChangeConfigAction?.({ ...props.config, links: nextLinks });
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                ) : null}
              </div>
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
}



