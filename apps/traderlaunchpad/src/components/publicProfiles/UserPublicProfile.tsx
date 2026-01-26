"use client";

import {
  BuilderDndProvider,
  SortableItem,
  arrayMove,
} from "@acme/dnd";
import { Eye, EyeOff, Save } from "lucide-react";
import { SortableContext, verticalListSortingStrategy } from "@acme/dnd";

import { Button } from "@acme/ui/button";
import type { DragEndEvent } from "@acme/dnd";
import { PublicProfileHeader } from "./PublicProfileHeader";
import React from "react";
import { cn } from "~/lib/utils";

type UserProfileSectionKindV1 = "hero" | "links";

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
    { id: "links", kind: "links", enabled: true },
  ],
};

const normalizeConfig = (
  input: UserPublicProfileData["publicProfileConfig"],
): UserPublicProfileConfigV1 => {
  if (!input) return DEFAULT_CONFIG;
  const sectionsRaw = Array.isArray(input.sections) ? input.sections : DEFAULT_CONFIG.sections;
  const sections = sectionsRaw
    .filter((s) => s.kind === "hero" || s.kind === "links")
    .map((s) => ({
      id: s.id,
      kind: s.kind as UserProfileSectionKindV1,
      enabled: Boolean(s.enabled),
    }));
  return {
    version: "v1",
    links: Array.isArray(input.links) ? input.links : [],
    sections: sections.length ? sections : DEFAULT_CONFIG.sections,
  };
};

export function UserPublicProfile(props: {
  mode: "public" | "admin";
  canEdit: boolean;
  user: UserPublicProfileData;
  className?: string;
  tabs?: { label: string; href: string; isActive: boolean }[];
  onEditAvatarAction?: () => void;
  onEditNameAction?: () => void;
  onEditBioAction?: () => void;
  onChangeConfigAction?: (next: UserPublicProfileConfigV1) => void;
  // For admin mode: optional save/cancel controls.
  onSaveAction?: () => void;
  isSaving?: boolean;
}) {
  const config = normalizeConfig(props.user.publicProfileConfig);
  const isAdmin = props.mode === "admin";
  const canEditInline = isAdmin && props.canEdit && Boolean(props.onChangeConfigAction);
  const visibleSections = isAdmin ? config.sections : config.sections.filter((s) => s.enabled);

  const coverUrl = props.user.coverUrl ?? null;
  const avatarUrl = props.user.avatarUrl ?? null;
  const handle = `@${props.user.publicUsername}`;

  const handleToggleSection = (id: string) => {
    if (!canEditInline) return;
    props.onChangeConfigAction?.({
      ...config,
      sections: config.sections.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)),
    });
  };

  const handleMoveSection = (event: DragEndEvent) => {
    if (!canEditInline) return;
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
    props.onChangeConfigAction?.({ ...config, sections: move(config.sections, from, to) });
  };

  return (
    <div className={cn("flex flex-1 flex-col", props.className)}>
      {props.mode === "admin" ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-background/30 px-4 py-3 text-sm text-foreground/70 backdrop-blur-md">
          <div>
            <span className="font-medium text-foreground">Admin preview</span>
            <span className="ml-2 text-foreground/50">This is exactly what the public page renders.</span>
          </div>
          {props.onSaveAction ? (
            <Button
              type="button"
              className="h-9 rounded-full border-0 bg-orange-600 text-foreground hover:bg-orange-700"
              onClick={props.onSaveAction}
              disabled={!props.canEdit || Boolean(props.isSaving)}
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
                handleClassName="h-9 px-2 text-foreground/60 hover:text-foreground"
                renderHandle={(handleEl) => (
                  <div className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-full border border-white/10 bg-background/40 p-1 backdrop-blur-md">
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground/70 hover:bg-white/10 hover:text-foreground"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleToggleSection(section.id);
                      }}
                      aria-label={section.enabled ? "Hide section" : "Show section"}
                    >
                      {section.enabled ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                    {handleEl}
                  </div>
                )}
              >
                <div className={section.enabled ? "" : "opacity-55"}>
                  {renderSection({
                    section,
                    user: props.user,
                    config,
                    mode: props.mode,
                    canEditInline,
                    tabs: props.tabs,
                    onEditAvatarAction: props.onEditAvatarAction,
                    onEditNameAction: props.onEditNameAction,
                    onEditBioAction: props.onEditBioAction,
                    onChangeConfigAction: props.onChangeConfigAction,
                    coverUrl,
                    avatarUrl,
                    handle,
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
            user: props.user,
            config,
            mode: props.mode,
            canEditInline,
            tabs: props.tabs,
            onEditAvatarAction: props.onEditAvatarAction,
            onEditNameAction: props.onEditNameAction,
            onEditBioAction: props.onEditBioAction,
            onChangeConfigAction: props.onChangeConfigAction,
            coverUrl,
            avatarUrl,
            handle,
          }),
        )
      )}
    </div>
  );
}

function renderSection(props: {
  section: { id: string; kind: UserProfileSectionKindV1; enabled: boolean };
  user: UserPublicProfileData;
  config: UserPublicProfileConfigV1;
  mode: "public" | "admin";
  canEditInline: boolean;
  tabs?: { label: string; href: string; isActive: boolean }[];
  onEditAvatarAction?: () => void;
  onEditNameAction?: () => void;
  onEditBioAction?: () => void;
  onChangeConfigAction?: (next: UserPublicProfileConfigV1) => void;
  coverUrl: string | null;
  avatarUrl: string | null;
  handle: string;
}) {
  switch (props.section.kind) {
    case "hero": {
      return (
        <PublicProfileHeader
          key={props.section.id}
          coverUrl={props.coverUrl}
          avatarUrl={props.avatarUrl}
          avatarAlt={props.user.displayName}
          avatarFallback={(props.user.displayName || "U").slice(0, 1)}
          avatarInteractive={
            props.mode === "admin" && props.onEditAvatarAction
              ? { onClick: props.onEditAvatarAction, ariaLabel: "Edit profile avatar", showPencil: true }
              : undefined
          }
          badgeLabel="Public profile"
          title={props.user.displayName}
          titleInteractive={
            props.mode === "admin" && props.onEditNameAction
              ? { onClick: props.onEditNameAction, ariaLabel: "Edit profile name" }
              : undefined
          }
          handle={props.handle}
          bio={
            props.user.bio?.trim()
              ? props.user.bio
              : "Connect your broker, journal trades, and share your edge with the fleet."
          }
          bioInteractive={
            props.mode === "admin" && props.onEditBioAction
              ? { onClick: props.onEditBioAction, ariaLabel: "Edit profile bio", showPencil: true }
              : undefined
          }
          tabs={props.tabs}
          actions={
            <>
              <Button
                variant="outline"
                className="h-10 rounded-full border-white/10 bg-white/5 text-foreground hover:bg-white/10"
                disabled={props.mode === "admin"}
              >
                Follow
              </Button>
              <Button
                className="h-10 rounded-full border-0 bg-orange-600 text-foreground hover:bg-orange-700"
                disabled={props.mode === "admin"}
              >
                Get in touch
              </Button>
            </>
          }
        />
      );
    }

    case "links": {
      if (!props.canEditInline && !props.config.links.length) return null;
      return (
        <div
          key={props.section.id}
          className="mt-8 rounded-3xl border border-white/10 bg-background/30 p-6 text-foreground/70 backdrop-blur-md"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm font-semibold text-foreground">Links</div>
            {props.canEditInline ? (
              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-full border-white/10 bg-white/5 text-foreground hover:bg-white/10"
                onClick={() => {
                  props.onChangeConfigAction?.({
                    ...props.config,
                    links: [...props.config.links, { label: "New link", url: "https://" }],
                  });
                }}
              >
                Add link
              </Button>
            ) : null}
          </div>
          <div className="mt-3 grid gap-2">
            {props.config.links.map((l, idx) => (
              <div
                key={`${l.label}:${l.url}:${idx}`}
                className="rounded-xl border border-white/10 bg-white/3 px-4 py-3 text-sm text-foreground/80"
              >
                {props.canEditInline ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="text-xs text-foreground/60">
                      Label
                      <input
                        className="mt-1 w-full rounded-lg border border-white/10 bg-background/40 px-3 py-2 text-sm text-foreground placeholder:text-foreground/40"
                        value={l.label}
                        onChange={(e) => {
                          const nextLinks = props.config.links.map((x, i) =>
                            i === idx ? { ...x, label: e.target.value } : x,
                          );
                          props.onChangeConfigAction?.({ ...props.config, links: nextLinks });
                        }}
                      />
                    </label>
                    <label className="text-xs text-foreground/60">
                      URL
                      <input
                        className="mt-1 w-full rounded-lg border border-white/10 bg-background/40 px-3 py-2 text-sm text-foreground placeholder:text-foreground/40"
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
                  <a href={l.url} target="_blank" rel="noreferrer" className="block hover:opacity-90">
                    <div className="font-medium text-foreground">{l.label}</div>
                    <div className="mt-0.5 truncate text-xs text-foreground/50">{l.url}</div>
                  </a>
                )}

                {props.canEditInline ? (
                  <div className="mt-3 flex items-center justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 rounded-full border-white/10 bg-white/5 text-foreground hover:bg-white/10"
                      onClick={() => {
                        const nextLinks = props.config.links.filter((_, i) => i !== idx);
                        props.onChangeConfigAction?.({ ...props.config, links: nextLinks });
                      }}
                    >
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

    default:
      return null;
  }
}

