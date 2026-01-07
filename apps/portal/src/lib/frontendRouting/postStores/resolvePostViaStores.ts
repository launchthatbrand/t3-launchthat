import { applyFilters } from "@acme/admin-runtime/hooks";

import {
  FRONTEND_POST_STORES_FILTER,
  FRONTEND_POST_STORE_OVERRIDES_FILTER,
} from "~/lib/plugins/hookSlots";
import { pluginDefinitions } from "~/lib/plugins/definitions";

import type {
  FrontendPostLike,
  FrontendPostStore,
  FrontendPostStoreContext,
  PostIdentifier,
} from "./types";

const normalizeSlugKey = (value: string) =>
  value.replace(/^\/+|\/+$/g, "").trim().toLowerCase();

const getEnabledPluginIds = (args: {
  pluginOptions: { metaKey?: unknown; metaValue?: unknown }[] | undefined;
}): string[] => {
  const optionMap = new Map(
    (args.pluginOptions ?? [])
      .map((o) => [
        typeof o.metaKey === "string" ? o.metaKey : "",
        Boolean(o.metaValue),
      ])
      .filter(([k]) => Boolean(k)),
  );

  const enabledIds: string[] = [];
  for (const plugin of pluginDefinitions) {
    if (!plugin.activation) {
      enabledIds.push(plugin.id);
      continue;
    }

    const stored = optionMap.get(plugin.activation.optionKey);
    const isEnabled = stored ?? plugin.activation.defaultEnabled ?? false;
    if (isEnabled) enabledIds.push(plugin.id);
  }

  return enabledIds;
};

const isPluginEnabledForStore = (
  store: FrontendPostStore,
  ctx: FrontendPostStoreContext,
): boolean => {
  if (!store.pluginId) return true;
  return ctx.enabledPluginIds.includes(store.pluginId);
};

const pickPrimaryStore = (
  stores: FrontendPostStore[],
  postTypeSlug: string,
): FrontendPostStore | null => {
  const key = normalizeSlugKey(postTypeSlug);
  const candidates = stores.filter((s) =>
    Array.isArray(s.postTypeSlugs)
      ? s.postTypeSlugs.some((slug) => normalizeSlugKey(slug) === key)
      : false,
  );
  if (candidates.length === 0) return null;
  const sorted = [...candidates].sort(
    (a, b) => (b.priority ?? 0) - (a.priority ?? 0),
  );
  return sorted[0] ?? null;
};

const runStore = async (args: {
  store: FrontendPostStore;
  ctx: FrontendPostStoreContext;
  postTypeSlug: string;
  identifier: PostIdentifier;
}): Promise<FrontendPostLike | null> => {
  const { store, ctx, postTypeSlug, identifier } = args;

  if (!isPluginEnabledForStore(store, ctx)) return null;

  if (identifier.kind === "id" && store.getById) {
    return await store.getById({ ctx, postTypeSlug, id: identifier.id });
  }
  if (identifier.kind === "slug" && store.getBySlug) {
    return await store.getBySlug({ ctx, postTypeSlug, slug: identifier.slug });
  }

  // Fallback: if slug provided but store only supports id (or vice versa), do nothing.
  return null;
};

const hasValidId = (value: unknown): value is FrontendPostLike => {
  if (!value || typeof value !== "object") return false;
  const id = (value as { _id?: unknown })._id;
  return typeof id === "string" && id.length > 0;
};

export async function resolvePostViaStores(args: {
  segments: string[];
  searchParams?: Record<string, string | string[] | undefined>;
  organizationId: string | null;
  postTypeSlug: string;
  identifier: PostIdentifier;
  fetchQuery: FrontendPostStoreContext["fetchQuery"];
  api: unknown;
  debug?: boolean;
}): Promise<{ post: FrontendPostLike; resolvedByStoreId: string } | null> {
  const organizationId =
    typeof args.organizationId === "string" && args.organizationId
      ? (args.organizationId as any)
      : null;

  // Load plugin enablement from options (org-aware).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const apiAny = args.api as any;
  const pluginOptions =
    (await args.fetchQuery(apiAny.core.options.getByType, {
      type: "site",
      ...(organizationId ? { orgId: organizationId } : {}),
    })) ?? [];

  const enabledPluginIds = getEnabledPluginIds({
    pluginOptions: Array.isArray(pluginOptions) ? pluginOptions : [],
  });

  const ctx: FrontendPostStoreContext = {
    segments: args.segments,
    searchParams: args.searchParams,
    organizationId,
    enabledPluginIds,
    fetchQuery: args.fetchQuery,
    api: args.api,
    debug: args.debug,
  };

  // 1) Overrides: priority ordered (higher first).
  const overrideRaw = applyFilters(FRONTEND_POST_STORE_OVERRIDES_FILTER, [], ctx);
  const overrides = Array.isArray(overrideRaw)
    ? (overrideRaw as FrontendPostStore[])
    : [];
  const overridesSorted = [...overrides].sort(
    (a, b) => (b.priority ?? 0) - (a.priority ?? 0),
  );

  for (const store of overridesSorted) {
    const post = await runStore({
      store,
      ctx,
      postTypeSlug: args.postTypeSlug,
      identifier: args.identifier,
    });
    if (hasValidId(post)) {
      if (args.debug) {
        console.log("[routing][postStores] override hit", {
          storeId: store.id,
          postTypeSlug: args.postTypeSlug,
          identifier: args.identifier,
        });
      }
      return { post, resolvedByStoreId: store.id };
    }
  }

  // 2) Primary store: exclusive by postTypeSlug; if none exists, fall back to any store with no postTypeSlugs.
  const primaryRaw = applyFilters(FRONTEND_POST_STORES_FILTER, [], ctx);
  const primaryStores = Array.isArray(primaryRaw)
    ? (primaryRaw as FrontendPostStore[])
    : [];

  const selected =
    pickPrimaryStore(primaryStores, args.postTypeSlug) ??
    primaryStores.find((s) => !s.postTypeSlugs || s.postTypeSlugs.length === 0) ??
    null;

  if (!selected) return null;

  const post = await runStore({
    store: selected,
    ctx,
    postTypeSlug: args.postTypeSlug,
    identifier: args.identifier,
  });
  if (!hasValidId(post)) return null;

  if (args.debug) {
    console.log("[routing][postStores] primary hit", {
      storeId: selected.id,
      postTypeSlug: args.postTypeSlug,
      identifier: args.identifier,
    });
  }

  return { post, resolvedByStoreId: selected.id };
}


