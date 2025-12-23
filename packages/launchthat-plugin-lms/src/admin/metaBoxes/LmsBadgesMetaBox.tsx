"use client";

import type { PluginMetaBoxRendererProps } from "launchthat-plugin-core";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@portal/convexspec";
import { useMutation, useQuery } from "convex/react";

import { Button } from "@acme/ui/button";
import { Checkbox } from "@acme/ui/checkbox";
import { Input } from "@acme/ui/input";
import { Skeleton } from "@acme/ui/skeleton";
import { toast } from "@acme/ui/toast";

const BADGE_META_KEY = "lmsBadgeIds";

const safeParseBadgeIds = (raw: unknown): string[] => {
  if (typeof raw !== "string" || raw.trim().length === 0) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const ids = parsed
      .map((v) => (typeof v === "string" ? v.trim() : ""))
      .filter((v) => v.length > 0);
    return Array.from(new Set(ids));
  } catch {
    return [];
  }
};

export const LmsBadgesMetaBox = ({ context }: PluginMetaBoxRendererProps) => {
  const postId = context.postId;
  const organizationId = context.organizationId;
  const contextPostOrganizationId =
    typeof (context.post as any)?.organizationId === "string"
      ? String((context.post as any).organizationId)
      : undefined;

  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [initialIds, setInitialIds] = useState<string[]>([]);
  const [hasHydrated, setHasHydrated] = useState(false);

  const updatePost = useMutation(
    (api.plugins.lms.posts.mutations as any).updatePost,
  );

  const post = useQuery(
    (api.plugins.lms.posts.queries as any).getPostById,
    postId
      ? {
          id: postId,
          organizationId: organizationId ?? undefined,
        }
      : "skip",
  ) as any | undefined;

  const effectiveOrganizationId =
    organizationId ??
    (typeof post?.organizationId === "string"
      ? String(post.organizationId)
      : undefined) ??
    contextPostOrganizationId;

  const postMeta = useQuery(
    (api.plugins.lms.posts.queries as any).getPostMeta,
    postId
      ? { postId, organizationId: effectiveOrganizationId ?? undefined }
      : "skip",
  ) as any[] | undefined;

  const badgesForOrg = useQuery(
    api.plugins.lms.posts.queries.getAllPosts,
    postId
      ? {
          organizationId: effectiveOrganizationId ?? undefined,
          filters: { postTypeSlug: "badges", limit: 200 },
        }
      : "skip",
  ) as any[] | undefined;

  // Debug/fallback: if org scoping is wrong/missing, also query without org to confirm.
  // Always call both hooks (no conditional hooks).
  const badgesAllOrgs = useQuery(
    api.plugins.lms.posts.queries.getAllPosts,
    postId
      ? {
          filters: { postTypeSlug: "badges", limit: 200 },
        }
      : "skip",
  ) as any[] | undefined;

  const badges = useMemo(() => {
    // Prefer org-scoped results when possible.
    if (Array.isArray(badgesForOrg) && badgesForOrg.length > 0)
      return badgesForOrg;
    if (!effectiveOrganizationId) return badgesAllOrgs;
    return badgesForOrg;
  }, [badgesAllOrgs, badgesForOrg, effectiveOrganizationId]);

  const badgeOptions = useMemo(() => {
    return (badges ?? [])
      .map((b) => ({
        id: String((b as any)?._id ?? ""),
        title: String((b as any)?.title ?? "Untitled badge"),
      }))
      .filter((b) => b.id.length > 0)
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [badges]);

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log("[LmsBadgesMetaBox] ctx", {
      postId,
      contextOrganizationId: organizationId ?? null,
      contextPostOrganizationId: contextPostOrganizationId ?? null,
      postOrganizationId:
        typeof post?.organizationId === "string" ? post.organizationId : null,
      effectiveOrganizationId: effectiveOrganizationId ?? null,
    });
  }, [
    contextPostOrganizationId,
    effectiveOrganizationId,
    organizationId,
    post?.organizationId,
    postId,
  ]);

  useEffect(() => {
    if (!postId) return;
    // eslint-disable-next-line no-console
    console.log("[LmsBadgesMetaBox] badges query", {
      effectiveOrganizationId: effectiveOrganizationId ?? null,
      badgesForOrgState:
        badgesForOrg === undefined ? "loading" : `len=${badgesForOrg.length}`,
      badgesAllOrgsState:
        badgesAllOrgs === undefined ? "loading" : `len=${badgesAllOrgs.length}`,
      chosenBadgeCount: badgeOptions.length,
    });
  }, [
    badgeOptions.length,
    badgesAllOrgs,
    badgesForOrg,
    effectiveOrganizationId,
    postId,
  ]);

  useEffect(() => {
    if (hasHydrated) return;
    if (postMeta === undefined) return;
    const map = new Map<string, unknown>();
    (postMeta ?? []).forEach((entry) => {
      if (entry?.key) map.set(String(entry.key), entry.value);
    });
    const ids = safeParseBadgeIds(map.get(BADGE_META_KEY));
    setSelectedIds(ids);
    setInitialIds(ids);
    setHasHydrated(true);
  }, [hasHydrated, postMeta]);

  const filteredOptions = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return badgeOptions;
    return badgeOptions.filter((b) => b.title.toLowerCase().includes(term));
  }, [badgeOptions, search]);

  const isLoading = postId
    ? postMeta === undefined ||
      badgesForOrg === undefined ||
      badgesAllOrgs === undefined
    : false;
  const isDirty =
    selectedIds.length !== initialIds.length ||
    selectedIds.some((id) => !initialIds.includes(id));

  const handleToggle = useCallback((badgeId: string) => {
    setSelectedIds((prev) =>
      prev.includes(badgeId)
        ? prev.filter((id) => id !== badgeId)
        : [...prev, badgeId],
    );
  }, []);

  const handleSave = useCallback(async () => {
    if (!postId) return;
    try {
      const nextValue = JSON.stringify(selectedIds);
      await updatePost({
        id: postId,
        meta: {
          [BADGE_META_KEY]: nextValue,
        },
      });
      setInitialIds(selectedIds);
      toast.success("Badges updated.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update badges.");
    }
  }, [postId, selectedIds, updatePost]);

  if (!postId) {
    return (
      <div className="text-muted-foreground text-sm">
        Save this entry first to assign badges.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/admin/edit?post_type=badges"
          className="text-primary text-sm underline underline-offset-4"
        >
          Manage badges
        </Link>
        <Button
          type="button"
          size="sm"
          onClick={handleSave}
          disabled={!isDirty}
        >
          Save
        </Button>
      </div>

      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search badges…"
      />

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
      ) : badgeOptions.length === 0 ? (
        <div className="text-muted-foreground text-sm">
          No badges found. Create one first.
        </div>
      ) : (
        <div className="max-h-64 space-y-1 overflow-y-auto rounded-md border p-2">
          {filteredOptions.map((badge) => {
            const checked = selectedIds.includes(badge.id);
            return (
              <label
                key={badge.id}
                className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => handleToggle(badge.id)}
                />
                <span className="truncate">{badge.title}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
};
