"use client";

import type { Doc, Id } from "@/convex/_generated/dataModel";
import { createContext, Suspense, useContext, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";

import { useTenant } from "~/context/TenantContext";
import { isBuiltInPostTypeSlug } from "~/lib/postTypes/builtIns";
import { getTenantOrganizationId } from "~/lib/tenant-fetcher";
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
const AdminPostProviderInner = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const searchParams = useSearchParams();
  const tenant = useTenant();
  const organizationId = getTenantOrganizationId(tenant);
  const postIdParam = searchParams.get("post_id") ?? undefined;
  const queryPostTypeParam = searchParams.get("post_type") ?? undefined;

  const isConvexId =
    postIdParam !== undefined && /^[a-z0-9]{16,}$/i.test(postIdParam);
  const isNewRecord = postIdParam === "new";

  const normalizedPostId = isConvexId
    ? (postIdParam as Id<"posts">)
    : undefined;

  const loweredQuerySlug = queryPostTypeParam?.toLowerCase();
  const post = useQuery(
    api.core.posts.queries.getPostById,
    normalizedPostId
      ? organizationId
        ? { id: normalizedPostId, organizationId }
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
