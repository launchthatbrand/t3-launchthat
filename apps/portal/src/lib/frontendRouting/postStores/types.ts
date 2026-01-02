import type { Id } from "@/convex/_generated/dataModel";
import type { fetchQuery as convexFetchQuery } from "convex/nextjs";

export type FetchQuery = typeof convexFetchQuery;

export interface FrontendPostLike {
  _id: string;
  postTypeSlug?: string | null;
  slug?: string | null;
  status?: string | null;
  organizationId?: string | null;
  [key: string]: unknown;
}

export type PostIdentifier =
  | { kind: "slug"; slug: string }
  | { kind: "id"; id: string };

export interface FrontendPostStoreContext {
  segments: string[];
  searchParams?: Record<string, string | string[] | undefined>;
  organizationId: Id<"organizations"> | null;
  enabledPluginIds: string[];
  fetchQuery: FetchQuery;
  api: unknown;
  debug?: boolean;
}

export interface FrontendPostStore {
  id: string;
  /**
   * Optional plugin association. If set, store will only run when the plugin is enabled.
   */
  pluginId?: string;
  /**
   * Higher runs earlier for overrides; for primary stores this can be used to break ties.
   */
  priority?: number;
  /**
   * Explicit post types this store supports. When omitted, store is treated as a fallback.
   */
  postTypeSlugs?: string[];

  getBySlug?: (args: {
    ctx: FrontendPostStoreContext;
    postTypeSlug: string;
    slug: string;
  }) => Promise<FrontendPostLike | null>;

  getById?: (args: {
    ctx: FrontendPostStoreContext;
    postTypeSlug: string;
    id: string;
  }) => Promise<FrontendPostLike | null>;
}
