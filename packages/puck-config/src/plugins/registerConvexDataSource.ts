import type { Plugin } from "@measured/puck";
import type { UserConfig } from "../types";
import { dataSourceRegistry } from "./dataSourceRegistry";

type FetchPostTypes = (params: { query?: string }) => Promise<
  Array<{
    value: string;
    title: string;
  }>
>;

type FetchPosts = (params: {
  postTypeSlug: string;
  limit: number;
  organizationId?: string;
}) => Promise<
  Array<{
    id: string;
    title: string;
    description?: string | null;
    imageUrl?: string | null;
    link?: string | null;
    date?: number | null;
    _raw?: unknown;
  }>
>;

export type ConvexDataSourceOptions = {
  fetchPostTypes: FetchPostTypes;
  fetchPosts: FetchPosts;
  label?: string;
};

export function registerConvexDataSource({
  fetchPostTypes,
  fetchPosts,
  label = "Convex (Portal)",
}: ConvexDataSourceOptions) {
  if (dataSourceRegistry.get("convex")) {
    console.log("[convexDataSource] provider already registered");
    return;
  }

  dataSourceRegistry.register("convex", {
    label,
    getFields: () => ({
      convex_settings: {
        type: "object",
        label: "Convex Settings",
        objectFields: {
          postTypeSlug: {
            type: "external",
            label: "Post Type",
            placeholder: "Select a post type",
            fetchList: fetchPostTypes,
          },
          limit: {
            type: "number",
            label: "Limit",
            min: 1,
            max: 100,
            defaultValue: 12,
          },
        },
      },
    }),
    fetchData: async (props) => {
      const settings = (props as any).convex_settings ?? {};
      const selectedPostType = settings.postTypeSlug;
      const postTypeSlug =
        typeof selectedPostType === "string"
          ? selectedPostType
          : selectedPostType?.value ?? props.postType ?? props.cardType;
      const limit = Number(settings.limit ?? 12);

      console.log("[convexDataSource] fetchData called", {
        props,
        settings,
        postTypeSlug,
        limit,
      });

      if (!postTypeSlug) {
        console.warn("[convexDataSource] missing postTypeSlug");
        return [];
      }

      const rows = await fetchPosts({ postTypeSlug, limit });
      console.log("[convexDataSource] fetchPosts result", {
        count: rows.length,
        first: rows[0],
      });
      return rows;
    },
  });
}

export type ConvexDataSourcePluginOptions = ConvexDataSourceOptions & {
  config?: UserConfig;
  targetComponents?: string[];
};

export function convexDataSourcePlugin(options: ConvexDataSourcePluginOptions): Plugin {
  registerConvexDataSource(options);
  if (options.config) {
    applyConvexDefaults(options.config, options.targetComponents);
  }

  return {
    overrides: {},
  };
}

export function applyConvexDefaults(config: UserConfig, targetComponents?: string[]) {
  const targets = targetComponents ?? ["LoopGrid"];

  for (const componentName of targets) {
    const component = (config.components as Record<string, any> | undefined)?.[componentName];
    if (component) {
      component.defaultProps = {
        ...component.defaultProps,
        dataSource: "convex",
      };
    }
  }
}

