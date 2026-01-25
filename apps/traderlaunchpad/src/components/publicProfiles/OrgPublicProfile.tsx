"use client";

import {
  BuilderDndProvider,
  SortableItem,
  arrayMove,
} from "@acme/dnd";
import { Eye, EyeOff, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { SortableContext, verticalListSortingStrategy } from "@acme/dnd"

import { Button } from "@acme/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";
import type { DragEndEvent } from "@acme/dnd";
import Link from "next/link";
import React from "react";
import { cn } from "~/lib/utils";
import { PublicProfileHeader } from "./PublicProfileHeader";

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
  excerpt?: string;
  bio?: string;
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
  excerpt: "",
  bio: "",
  links: [],
  sections: [
    { id: "hero", kind: "hero", enabled: true },
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

  const excerpt =
    typeof input.excerpt === "string" ? input.excerpt : DEFAULT_CONFIG.excerpt;
  const bio = typeof input.bio === "string" ? input.bio : DEFAULT_CONFIG.bio;

  return {
    version: "v1",
    heroCtas: heroCtas ?? DEFAULT_CONFIG.heroCtas,
    logoCrop,
    excerpt,
    bio,
    links,
    // Remove deprecated "about" section entirely.
    sections: sections.filter((s) => s.kind !== "about"),
  };
};

function OrgHeroSection(props: {
  section: { id: string; kind: OrgProfileSectionKindV1; enabled: boolean };
  org: OrgPublicProfileData;
  config: OrgPublicProfileConfigV1;
  mode: "public" | "admin";
  canEditInline: boolean;
  heroCtas: OrgHeroCta[];
  canShowCtaEditor: boolean;
  tabs?: { label: string; href: string; isActive: boolean }[];
  onEditOrgNameAction?: () => void;
  onAddHeroCta: () => void;
  onUpdateHeroCta: (id: string, patch: Partial<OrgHeroCta>) => void;
  onRemoveHeroCta: (id: string) => void;
  onChangeConfigAction?: (next: OrgPublicProfileConfigV1) => void;
  onEditLogoAction?: () => void;
}) {
  const title = props.org.name;
  const logoUrl = props.org.logoUrl ?? null;
  const tabs = Array.isArray(props.tabs) ? props.tabs : [];
  const logoCrop = props.config.logoCrop ?? DEFAULT_CONFIG.logoCrop;

  const rawExcerpt =
    typeof props.config.excerpt === "string" ? props.config.excerpt : "";
  const excerptFromConfig = rawExcerpt.trim();
  const excerpt = excerptFromConfig || props.org.description?.trim() || "No description yet.";

  const rawBio = typeof props.config.bio === "string" ? props.config.bio : "";
  const fullBio = rawBio.trim();

  const canEditBio = props.mode === "admin" && props.canEditInline;
  const [editOpen, setEditOpen] = React.useState(false);
  const [viewBioOpen, setViewBioOpen] = React.useState(false);

  const [draftExcerpt, setDraftExcerpt] = React.useState(excerptFromConfig);
  const [draftBio, setDraftBio] = React.useState(rawBio);

  React.useEffect(() => {
    // Keep dialog drafts in sync with config unless the dialog is open.
    if (editOpen) return;
    setDraftExcerpt(excerptFromConfig);
    setDraftBio(rawBio);
  }, [excerptFromConfig, rawBio, editOpen]);

  const handleSaveBioDraft = () => {
    if (!props.onChangeConfigAction) return;
    props.onChangeConfigAction({
      ...props.config,
      excerpt: draftExcerpt,
      bio: draftBio,
    });
    setEditOpen(false);
  };

  return (
    <div>
      <PublicProfileHeader
        coverUrl={null}
        avatarUrl={logoUrl}
        avatarAlt={title}
        avatarFallback={(title || "O").slice(0, 1)}
        avatarStyle={
          logoCrop
            ? ({ objectPosition: `${logoCrop.x}% ${logoCrop.y}%` } as React.CSSProperties)
            : undefined
        }
        avatarInteractive={
          props.mode === "admin" && props.onEditLogoAction
            ? {
                onClick: props.onEditLogoAction,
                ariaLabel: "Edit organization avatar",
                showPencil: true,
              }
            : undefined
        }
        badgeLabel="Organization"
        title={title}
        titleInteractive={
          props.mode === "admin" && props.onEditOrgNameAction
            ? { onClick: props.onEditOrgNameAction, ariaLabel: "Edit organization name" }
            : undefined
        }
        handle={`@${props.org.slug}`}
        bio={excerpt}
        bioInteractive={
          canEditBio
            ? {
                onClick: () => setEditOpen(true),
                ariaLabel: "Edit organization bio",
                showPencil: true,
              }
            : undefined
        }
        bioExtra={
          fullBio ? (
            <button
              type="button"
              className="text-xs font-medium text-white/70 underline decoration-white/20 underline-offset-4 hover:text-white"
              onClick={() => setViewBioOpen(true)}
            >
              View full bio
            </button>
          ) : null
        }
        tabs={tabs}
        actions={
          <>
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
          </>
        }
      />

      {props.mode === "admin" && props.onEditLogoAction ? (
        <div className="mt-3 flex justify-end">
          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10"
            onClick={(e) => {
              e.preventDefault();
              props.onEditLogoAction?.();
            }}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit logo
          </Button>
        </div>
      ) : null}

      {props.canShowCtaEditor ? (
        <div className="mt-3 w-full max-w-md space-y-2 rounded-2xl border border-white/10 bg-black/40 p-4 text-white/80 backdrop-blur-md">
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
                      onChange={(e) => props.onUpdateHeroCta(cta.id, { label: e.target.value })}
                    />
                  </label>
                  <label className="text-xs text-white/60">
                    URL
                    <input
                      className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40"
                      value={cta.url}
                      onChange={(e) => props.onUpdateHeroCta(cta.id, { url: e.target.value })}
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

      {canEditBio ? (
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="border-white/10 bg-black/90 text-white">
            <DialogHeader>
              <DialogTitle>Edit organization bio</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <label className="block text-sm text-white/70">
                Excerpt{" "}
                <span className="text-xs text-white/40">(1–2 sentences shown in header)</span>
                <textarea
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40"
                  rows={3}
                  value={draftExcerpt}
                  onChange={(e) => setDraftExcerpt(e.target.value)}
                  placeholder="Short summary shown on your org profile header…"
                />
              </label>

              <label className="block text-sm text-white/70">
                Bio{" "}
                <span className="text-xs text-white/40">
                  (longer bio shown via “View full bio”)
                </span>
                <textarea
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40"
                  rows={8}
                  value={draftBio}
                  onChange={(e) => setDraftBio(e.target.value)}
                  placeholder="Full bio…"
                />
              </label>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="button"
                className="h-10 rounded-full border-0 bg-orange-600 text-white hover:bg-orange-700"
                onClick={handleSaveBioDraft}
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}

      {fullBio ? (
        <Dialog open={viewBioOpen} onOpenChange={setViewBioOpen}>
          <DialogContent className="border-white/10 bg-black/90 text-white">
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
            </DialogHeader>
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-white/70">
              {fullBio}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button
                  type="button"
                  className="h-10 rounded-full border-0 bg-orange-600 text-white hover:bg-orange-700"
                >
                  Close
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}

export function OrgPublicProfile(props: {
  mode: "public" | "admin";
  canEdit: boolean;
  org: OrgPublicProfileData;
  className?: string;
  tabs?: { label: string; href: string; isActive: boolean }[];
  onEditOrgNameAction?: () => void;
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
    const move = arrayMove as unknown as <T, >(items: T[], from: number, to: number) => T[];
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
            strategy={verticalListSortingStrategy}
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
                    tabs: props.tabs,
                  onEditOrgNameAction: props.onEditOrgNameAction,
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
            tabs: props.tabs,
            onEditOrgNameAction: props.onEditOrgNameAction,
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
  tabs?: { label: string; href: string; isActive: boolean }[];
  onEditOrgNameAction?: () => void;
  onAddHeroCta: () => void;
  onUpdateHeroCta: (id: string, patch: Partial<OrgHeroCta>) => void;
  onRemoveHeroCta: (id: string) => void;
  onChangeConfigAction?: (next: OrgPublicProfileConfigV1) => void;
  onEditLogoAction?: () => void;
}) {
  const { section } = props;
  switch (section.kind) {
    case "hero": {
      return <OrgHeroSection key={section.id} {...props} />;
    }

    case "about": {
      // Removed: org bio is managed via the header excerpt + full bio dialog.
      return null;
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



