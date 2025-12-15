"use client";

import type { Doc, Id } from "@/convex/_generated/dataModel";
import {
  createContext,
  Suspense,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";

import { getTenantOrganizationId, useTenant } from "@acme/admin-runtime";

import { useGetPostById } from "~/lib/blog";
import { usePostTypeBySlug } from "../settings/post-types/_api/postTypes";

type AdminPostViewMode = "archive" | "single";

interface AdminPostContextValue {
  viewMode: AdminPostViewMode;
  postId?: Id<"posts"> | string;
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
  const postIdParam = searchParams.get("post_id") ?? undefined;
  const queryPostTypeParam = searchParams.get("post_type") ?? undefined;
  const tenant = useTenant();
  const _organizationId = getTenantOrganizationId(tenant);

  const isNewRecord = postIdParam === "new";

  const loweredQuerySlug = queryPostTypeParam?.toLowerCase().trim();
  const [slugHint, setSlugHint] = useState(
    loweredQuerySlug ?? DEFAULT_POST_TYPE_SLUG,
  );
  const postType = usePostTypeBySlug(slugHint);
  const resolvedSlug = slugHint;
  const normalizedSlug = resolvedSlug.toLowerCase();
  const normalizedPostId = useMemo<Id<"posts"> | string | undefined>(() => {
    if (!postIdParam || postIdParam === "new") {
      return undefined;
    }
    return postIdParam;
  }, [postIdParam]);
  const post = useGetPostById(normalizedPostId, normalizedSlug);
  const postLike = post;
  const slugFromPost =
    typeof postLike?.postTypeSlug === "string"
      ? postLike.postTypeSlug.toLowerCase()
      : undefined;

  useEffect(() => {
    if (
      typeof loweredQuerySlug === "string" &&
      loweredQuerySlug.length > 0 &&
      loweredQuerySlug !== slugHint
    ) {
      setSlugHint(loweredQuerySlug);
    }
  }, [loweredQuerySlug, slugHint]);

  useEffect(() => {
    if (
      typeof slugFromPost === "string" &&
      slugFromPost.length > 0 &&
      slugFromPost !== slugHint
    ) {
      setSlugHint(slugFromPost);
    }
  }, [slugFromPost, slugHint]);

  const value = useMemo<AdminPostContextValue>(() => {
    const viewMode: AdminPostViewMode =
      normalizedPostId || isNewRecord ? "single" : "archive";

    return {
      viewMode,
      postId: normalizedPostId,
      post: post ?? null,
      postTypeSlug: resolvedSlug,
      postType,
      isNewRecord,
      isLoading:
        (normalizedPostId ? post === undefined : false) ||
        postType === undefined,
    };
  }, [isNewRecord, normalizedPostId, postType, post, resolvedSlug]);

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
