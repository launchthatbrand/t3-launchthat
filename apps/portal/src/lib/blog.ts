import type { Doc, Id } from "@/convex/_generated/dataModel";
import { useCallback, useMemo } from "react";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";

import { useTenant } from "~/context/TenantContext";
import {
  COMMERCE_CHARGEBACK_POST_TYPE,
  COMMERCE_ORDER_POST_TYPE,
  decodeChargebackPostId,
  decodeOrderPostId,
  isCommerceChargebackSlug,
  isCommerceOrderSlug,
  mapChargebackToPost,
  mapOrderToPost,
} from "~/lib/postTypes/customAdapters";
import { getTenantOrganizationId } from "./tenant-fetcher";

// Posts Types - extend with more post metadata
export interface PostFilter {
  status?: "published" | "draft" | "archived";
  category?: string;
  authorId?: Id<"users">;
  limit?: number;
  postTypeSlug?: string;
}

export interface CreatePostArgs {
  title: string;
  content?: string;
  excerpt?: string;
  slug: string;
  status: "published" | "draft" | "archived";
  category?: string;
  tags?: string[];
  featuredImage?: string;
  postTypeSlug?: string;
  meta?: Record<string, string | number | boolean | null>;
}

export interface UpdatePostArgs {
  id: Id<"posts">;
  title?: string;
  content?: string;
  excerpt?: string;
  slug?: string;
  status?: "published" | "draft" | "archived";
  category?: string;
  tags?: string[];
  featuredImage?: string;
  postTypeSlug?: string;
  meta?: Record<string, string | number | boolean | null>;
}

export interface SearchPostArgs {
  searchTerm: string;
  limit?: number;
}

const EMPTY_QUERY_ARGS = {} as const;

/**
 * Custom hooks for posts
 */

// Query hooks
export function useGetAllPosts(filters?: PostFilter) {
  const tenant = useTenant();
  const args = useMemo(() => {
    const params: {
      organizationId?: Id<"organizations">;
      filters?: PostFilter;
    } = {};
    const organizationId = getTenantOrganizationId(tenant);
    if (organizationId) {
      params.organizationId = organizationId;
    }
    if (filters) {
      params.filters = filters;
    }
    return params;
  }, [tenant, filters]);
  const targetSlug = filters?.postTypeSlug?.toLowerCase();
  const isChargebackType = targetSlug === COMMERCE_CHARGEBACK_POST_TYPE;
  const isOrderType = targetSlug === COMMERCE_ORDER_POST_TYPE;
  const chargebacksResult = useQuery(
    api.ecommerce.chargebacks.queries.getChargebacks,
    isChargebackType ? EMPTY_QUERY_ARGS : "skip",
  );
  const ordersResult = useQuery(
    api.ecommerce.orders.queries.listOrders,
    isOrderType ? EMPTY_QUERY_ARGS : "skip",
  );
  const postsResult = useQuery(
    api.core.posts.queries.getAllPosts,
    isChargebackType || isOrderType ? "skip" : args,
  );
  const posts = useMemo(() => {
    if (isChargebackType) {
      return (chargebacksResult ?? []).map((record: Doc<"chargebacks">) =>
        mapChargebackToPost(record),
      );
    }
    if (isOrderType) {
      return (ordersResult ?? []).map((record: Doc<"orders">) =>
        mapOrderToPost(record),
      );
    }
    return postsResult ?? [];
  }, [
    chargebacksResult,
    isChargebackType,
    isOrderType,
    ordersResult,
    postsResult,
  ]);
  return {
    posts,
    isLoading: isChargebackType
      ? chargebacksResult === undefined
      : isOrderType
        ? ordersResult === undefined
        : postsResult === undefined,
  };
}

export function useGetPostById(
  id: Id<"posts"> | undefined,
): Doc<"posts"> | null | undefined {
  const tenant = useTenant();
  const organizationId = getTenantOrganizationId(tenant);
  const chargebackId = id ? decodeChargebackPostId(id) : null;
  const orderId = id ? decodeOrderPostId(id) : null;
  const chargebackResult: Doc<"chargebacks"> | null | undefined = useQuery(
    api.ecommerce.chargebacks.queries.getChargeback,
    chargebackId ? ({ chargebackId } as const) : "skip",
  );
  const orderResult: Doc<"orders"> | null | undefined = useQuery(
    api.ecommerce.orders.queries.getOrder,
    orderId ? ({ orderId } as const) : "skip",
  );
  const postArgs = useMemo(() => {
    if (!id || chargebackId || orderId) {
      return "skip" as const;
    }
    return organizationId ? { id, organizationId } : { id };
  }, [chargebackId, id, orderId, organizationId]);
  const postResult = useQuery(api.core.posts.queries.getPostById, postArgs);
  if (chargebackId) {
    if (chargebackResult === undefined) {
      return undefined;
    }
    if (chargebackResult === null) {
      return null;
    }
    return mapChargebackToPost(chargebackResult);
  }
  if (orderId) {
    if (orderResult === undefined) {
      return undefined;
    }
    if (orderResult === null) {
      return null;
    }
    return mapOrderToPost(orderResult);
  }
  return postResult;
}

export function useGetPostBySlug(slug: string | undefined) {
  const tenant = useTenant();
  const organizationId = getTenantOrganizationId(tenant);
  return useQuery(
    api.core.posts.queries.getPostBySlug,
    slug ? (organizationId ? { slug, organizationId } : { slug }) : "skip",
  );
}

export function useSearchPosts(args: SearchPostArgs) {
  const tenant = useTenant();
  const params = useMemo(() => {
    const organizationId = getTenantOrganizationId(tenant);
    if (organizationId) {
      return { ...args, organizationId };
    }
    return args;
  }, [args, tenant]);

  return useQuery(api.core.posts.queries.searchPosts, params);
}

export function useGetPostTags() {
  const tenant = useTenant();
  const organizationId = getTenantOrganizationId(tenant);
  const args = organizationId ? { organizationId } : {};
  const result = useQuery(api.core.posts.queries.getPostTags, args);
  return {
    tags: result ?? [],
    isLoading: result === undefined,
  };
}

export function useGetPostCategories() {
  const tenant = useTenant();
  const organizationId = getTenantOrganizationId(tenant);
  const args = organizationId ? { organizationId } : {};
  const result = useQuery(api.core.posts.queries.getPostCategories, args);
  return result;
}

// Mutation hooks
export function useCreatePost() {
  const tenant = useTenant();
  const mutate = useMutation(api.core.posts.mutations.createPost);
  return useCallback<
    (input: CreatePostArgs) => Promise<Id<"posts"> | undefined>
  >(
    (input) => {
      if (isCommerceChargebackSlug(input.postTypeSlug)) {
        throw new Error("Chargebacks must be created via Store → Chargebacks.");
      }
      if (isCommerceOrderSlug(input.postTypeSlug)) {
        throw new Error("Orders must be created via Store → Orders.");
      }
      return mutate({
        ...input,
        organizationId: getTenantOrganizationId(tenant) ?? undefined,
      });
    },
    [mutate, tenant],
  );
}

export function useUpdatePost() {
  const updatePost = useMutation(api.core.posts.mutations.updatePost);
  const updateChargebackDetails = useMutation(
    api.ecommerce.chargebacks.mutations.updateChargebackDetails,
  );
  return useCallback(
    async (input: UpdatePostArgs) => {
      const chargebackId =
        decodeChargebackPostId(input.id) ??
        (input.meta?.chargebackId as Id<"chargebacks"> | undefined) ??
        null;
      const orderId =
        decodeOrderPostId(input.id) ??
        (input.meta?.orderId as Id<"orders"> | undefined) ??
        null;
      if (
        chargebackId ||
        isCommerceChargebackSlug(input.postTypeSlug ?? undefined)
      ) {
        if (!chargebackId) {
          throw new Error("Invalid chargeback identifier.");
        }
        await updateChargebackDetails({
          chargebackId,
          reasonDescription: input.excerpt ?? undefined,
          internalNotes: input.content ?? undefined,
        });
        return;
      }
      if (orderId || isCommerceOrderSlug(input.postTypeSlug ?? undefined)) {
        throw new Error("Orders must be updated via Store → Orders.");
      }
      await updatePost(input);
    },
    [updateChargebackDetails, updatePost],
  );
}

export function useDeletePost() {
  const deletePost = useMutation(api.core.posts.mutations.deletePost);
  const deleteChargeback = useMutation(
    api.ecommerce.chargebacks.mutations.deleteChargeback,
  );
  const deleteOrder = useMutation(api.ecommerce.orders.mutations.deleteOrder);
  return useCallback(
    async ({ id }: { id: Id<"posts"> }) => {
      const chargebackId = decodeChargebackPostId(id);
      if (chargebackId) {
        await deleteChargeback({ id: chargebackId });
        return;
      }
      const orderId = decodeOrderPostId(id);
      if (orderId) {
        await deleteOrder({ orderId });
        return;
      }
      await deletePost({ id });
    },
    [deleteChargeback, deleteOrder, deletePost],
  );
}

export function useUpdatePostStatus() {
  return useMutation(api.core.posts.mutations.updatePostStatus);
}

export function useBulkUpdatePostStatus() {
  return useMutation(api.core.posts.mutations.bulkUpdatePostStatus);
}

/**
 * Format a date for display
 */
export function formatPostDate(date: number | undefined): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Convert tags string to array
 */
export function parseTags(tagsString: string): string[] {
  return tagsString
    .split(",")
    .map((tag: string) => tag.trim())
    .filter((tag): tag is string => tag.length > 0);
}

/**
 * Generate a slug from a title
 */
export function generateSlugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
