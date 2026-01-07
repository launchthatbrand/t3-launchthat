import { addFilter, hasFilter } from "@acme/admin-runtime/hooks";

import type { FrontendPostStore } from "./types";
import {
  FRONTEND_POST_STORE_OVERRIDES_FILTER,
  FRONTEND_POST_STORES_FILTER,
} from "~/lib/plugins/hookSlots";

const normalizeSlug = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const normalizePostLike = (value: unknown, fallbackPostTypeSlug: string) => {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const id = raw._id ?? raw.id;
  if (typeof id !== "string") return null;
  const postTypeSlug =
    typeof raw.postTypeSlug === "string" && raw.postTypeSlug.trim().length > 0
      ? raw.postTypeSlug
      : fallbackPostTypeSlug;
  return { ...raw, _id: id, postTypeSlug };
};

export function registerCorePostStores(): void {
  // Dev/HMR safety:
  // Avoid guarding on `hasFilter()` (plugins may have registered these hooks already),
  // and instead register our core stores whenever this module is evaluated.

  // Overrides hook is currently empty by default (but exists for caching/migrations/preview).
  addFilter(
    FRONTEND_POST_STORE_OVERRIDES_FILTER,
    (value: unknown) => (Array.isArray(value) ? value : []),
    10,
    1,
  );

  // Primary stores: register the default entity store as the fallback (no postTypeSlugs),
  // and a core store for generic core-post fallback.
  addFilter(
    FRONTEND_POST_STORES_FILTER,
    (value: unknown, ctx: unknown) => {
      const stores = Array.isArray(value) ? (value as FrontendPostStore[]) : [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const handlerCtx = ctx as any;
       
      const apiAny = handlerCtx?.api;

      const entityStore: FrontendPostStore = {
        id: "portal:entity-default",
        priority: -10,
        // fallback store
        postTypeSlugs: [],
        getBySlug: async ({ ctx: storeCtx, postTypeSlug, slug }) => {
          const org = storeCtx.organizationId
            ? String(storeCtx.organizationId)
            : undefined;
          const list =
            (await storeCtx.fetchQuery(
              apiAny.plugins.entity.queries.listEntities,
              {
                postTypeSlug,
                organizationId: org,
                filters: { slug, status: "published", limit: 1 },
              },
            )) ?? null;
          const entity = Array.isArray(list) ? list[0] : null;
          return normalizePostLike(entity, postTypeSlug);
        },
        getById: async ({ ctx: storeCtx, postTypeSlug, id }) => {
          const org = storeCtx.organizationId
            ? String(storeCtx.organizationId)
            : undefined;
          const entity = await storeCtx.fetchQuery(
            apiAny.plugins.entity.queries.readEntity,
            {
              postTypeSlug,
              id,
              organizationId: org,
            },
          );
          return normalizePostLike(entity, postTypeSlug);
        },
      };

      const coreStore: FrontendPostStore = {
        id: "portal:core-posts",
        priority: -20,
        postTypeSlugs: ["posts", "pages"],
        getBySlug: async ({ ctx: storeCtx, postTypeSlug, slug }) => {
          const org = storeCtx.organizationId
            ? storeCtx.organizationId
            : undefined;
          const post =
            (await storeCtx.fetchQuery(
              apiAny.core.posts.queries.getPostBySlug,
              {
                slug,
                ...(org ? { organizationId: org } : {}),
              },
            )) ?? null;
          return normalizePostLike(post, postTypeSlug);
        },
        getById: async ({ ctx: storeCtx, postTypeSlug, id }) => {
          const org = storeCtx.organizationId
            ? storeCtx.organizationId
            : undefined;
          const post =
            (await storeCtx.fetchQuery(apiAny.core.posts.queries.getPostById, {
              id,
              ...(org ? { organizationId: org } : {}),
            })) ?? null;
          return normalizePostLike(post, postTypeSlug);
        },
      };

      // Ensure we only append our defaults once.
      const hasEntityDefault = stores.some((s) => s.id === entityStore.id);
      const hasCoreStore = stores.some((s) => s.id === coreStore.id);

      return [
        ...stores,
        ...(hasCoreStore ? [] : [coreStore]),
        ...(hasEntityDefault ? [] : [entityStore]),
      ];
    },
    10,
    2,
  );
}

// Register on module import (server runtime safety).
registerCorePostStores();
