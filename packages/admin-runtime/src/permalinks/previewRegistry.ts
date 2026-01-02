export interface PermalinkPreviewContext {
  /**
   * The post type slug for the entry being edited (e.g. "pages", "funnel_steps").
   */
  postTypeSlug: string;
  /**
   * The candidate slug value (may differ from persisted post.slug while editing).
   */
  slugValue: string;
  /**
   * Post meta map (already normalized to primitives in Portal admin).
   */
  postMetaMap: Record<string, unknown>;
}

export type PermalinkPreviewResolver = (
  ctx: PermalinkPreviewContext,
) => string | null | undefined;

const registry: Record<string, PermalinkPreviewResolver[]> = {};

const isPermalinkDebugEnabled = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem("portal.debugPermalinks") === "1";
  } catch {
    return false;
  }
};

export const registerPermalinkPreviewResolver = (
  postTypeSlug: string,
  resolver: PermalinkPreviewResolver,
) => {
  const key = postTypeSlug.toLowerCase();
  if (!registry[key]) {
    registry[key] = [];
  }
  registry[key].push(resolver);
  return () => {
    registry[key] = (registry[key] ?? []).filter(
      (candidate) => candidate !== resolver,
    );
  };
};

export const resolvePermalinkPreviewPath = (
  ctx: PermalinkPreviewContext,
): string | null => {
  const key = ctx.postTypeSlug.toLowerCase();
  const resolvers = registry[key] ?? [];
  const debug = isPermalinkDebugEnabled();
  if (debug) {
    // eslint-disable-next-line no-console
    console.info("[permalinks] resolve preview", {
      postTypeSlug: ctx.postTypeSlug,
      slugValue: ctx.slugValue,
      metaKeys: Object.keys(ctx.postMetaMap ?? {}),
      resolverCount: resolvers.length,
    });
  }
  for (const resolver of resolvers) {
    const result = resolver(ctx);
    if (debug) {
      // eslint-disable-next-line no-console
      console.info("[permalinks] resolver result", {
        postTypeSlug: ctx.postTypeSlug,
        slugValue: ctx.slugValue,
        resolverName: resolver.name || "(anonymous)",
        result,
      });
    }
    if (typeof result === "string" && result.trim().length > 0) {
      return result;
    }
  }
  if (debug) {
    // eslint-disable-next-line no-console
    console.info("[permalinks] no resolver returned a preview path", {
      postTypeSlug: ctx.postTypeSlug,
      slugValue: ctx.slugValue,
    });
  }
  return null;
};
