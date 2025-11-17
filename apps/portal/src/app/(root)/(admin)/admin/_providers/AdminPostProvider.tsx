/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */
"use client";

import type { Doc, Id } from "@/convex/_generated/dataModel";
import { createContext, Suspense, useContext, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";

import { useTenant } from "~/context/TenantContext";
import { usePostTypeBySlug } from "../settings/post-types/_api/postTypes";

type AdminPostViewMode = "archive" | "single";

interface AdminPostContextValue {
  viewMode: AdminPostViewMode;
  postId?: Id<"posts">;
  post?: Doc<"posts"> | null;
  postTypeSlug?: string;
  postType?: Doc<"postTypes"> | null;
  isLoading: boolean;
  isNewRecord: boolean;
}

const AdminPostContext = createContext<AdminPostContextValue | undefined>(
  undefined,
);

const DEFAULT_POST_TYPE_SLUG = "course";
const POSTS_TABLE_SLUGS = new Set([
  "post",
  "posts",
  "page",
  "pages",
  "attachment",
  "attachments",
  "revision",
  "revisions",
  "nav_menu_item",
  "nav-menu-item",
]);

const AdminPostProviderInner = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const searchParams = useSearchParams();
  const tenant = useTenant();
  const postIdParam = searchParams.get("post_id") ?? undefined;
  const queryPostTypeParam = searchParams.get("post_type") ?? undefined;

  const isConvexId =
    postIdParam !== undefined && /^[a-z0-9]{16,}$/i.test(postIdParam);
  const isNewRecord = postIdParam === "new";

  const normalizedPostId = isConvexId
    ? (postIdParam as Id<"posts">)
    : undefined;

  const loweredQuerySlug = queryPostTypeParam?.toLowerCase();
  const supportsPostsTable =
    loweredQuerySlug === undefined || POSTS_TABLE_SLUGS.has(loweredQuerySlug);

  const post = useQuery(
    api.core.posts.queries.getPostById,
    normalizedPostId && supportsPostsTable
      ? tenant?._id
        ? { id: normalizedPostId, organizationId: tenant._id }
        : { id: normalizedPostId }
      : "skip",
  );

  const slugFromPost = post?.postTypeSlug;
  const rawSlug = (
    slugFromPost ??
    loweredQuerySlug ??
    DEFAULT_POST_TYPE_SLUG
  ).trim();
  const resolvedSlug = rawSlug.toLowerCase();

  const postType = usePostTypeBySlug(resolvedSlug);

  const value = useMemo<AdminPostContextValue>(() => {
    const viewMode: AdminPostViewMode =
      normalizedPostId || isNewRecord ? "single" : "archive";

    return {
      viewMode,
      postId: normalizedPostId,
      post,
      postTypeSlug: resolvedSlug,
      postType,
      isNewRecord,
      isLoading:
        (normalizedPostId ? post === undefined : false) ||
        postType === undefined,
    };
  }, [normalizedPostId, post, postType, resolvedSlug, isNewRecord]);

  return (
    <AdminPostContext.Provider value={value}>
      {children}
    </AdminPostContext.Provider>
  );
};

export const AdminPostProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <Suspense fallback={null}>
      <AdminPostProviderInner>{children}</AdminPostProviderInner>
    </Suspense>
  );
};

export const useAdminPostContext = () => {
  const context = useContext(AdminPostContext);
  if (!context) {
    throw new Error(
      "useAdminPostContext must be used within an AdminPostProvider",
    );
  }
  return context;
};
