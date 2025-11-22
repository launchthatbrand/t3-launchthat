"use client";

import { useEffect, useRef } from "react";

import type { Data } from "@measured/puck";
import type { Id } from "@convex-config/_generated/dataModel";
import { Render } from "@measured/puck";
import { api } from "@convex-config/_generated/api";
import { convexDataSourcePlugin } from "@acme/puck-config/plugins/registerConvexDataSource";
import { puckConfig } from "./config/puck-config";
import { useConvex } from "convex/react";
import { useTenant } from "~/context/TenantContext";

interface PuckContentRendererProps {
  data: Data;
}

export function PuckContentRenderer({ data }: PuckContentRendererProps) {
  const convex = useConvex();
  const tenant = useTenant();
  const organizationId = tenant?._id;
  const dataSourceRef = useRef<Record<string, boolean>>({});
  const postTypesCacheRef = useRef<Record<string, Array<{ slug: string; name: string }>>>({});

  useEffect(() => {
    if (!convex) {
      return;
    }
    const cacheKey = organizationId ?? "global";
    if (dataSourceRef.current[cacheKey]) {
      return;
    }

    const fetchPostTypes = async ({ query }: { query?: string }) => {
      if (!postTypesCacheRef.current[cacheKey]) {
        try {
          const list =
            (await convex.query(api.core.postTypes.queries.list, {
              ...(organizationId ? { organizationId } : {}),
            })) ?? [];
          postTypesCacheRef.current[cacheKey] = list.map((postType) => ({
            slug: postType.slug,
            name: postType.name,
          }));
        } catch (error) {
          console.error("Convex data source failed to load post types", error);
          return [];
        }
      }

      const needle = query?.toLowerCase().trim();
      return postTypesCacheRef.current[cacheKey]
        .filter((type) => !needle || type.name.toLowerCase().includes(needle))
        .map((type) => ({
          value: type.slug,
          title: type.name,
        }));
    };

    const fetchPosts = async ({
      postTypeSlug,
      limit,
      organizationId: overrideOrgId,
    }: {
      postTypeSlug: string;
      limit: number;
      organizationId?: string;
    }) => {
      const scopedOrganizationIdInput = overrideOrgId ?? organizationId;
      const scopedOrganizationId = scopedOrganizationIdInput
        ? (scopedOrganizationIdInput as Id<"organizations">)
        : undefined;
      const posts =
        (await convex.query(api.core.posts.queries.getAllPosts, {
          ...(scopedOrganizationId ? { organizationId: scopedOrganizationId } : {}),
          filters: {
            status: "published",
            postTypeSlug,
            limit,
          },
        })) ?? [];

      return posts.map((post: any) => ({
        id: post._id,
        title: post.title ?? "Untitled",
        description: post.excerpt ?? "",
        link: post.slug ? `/${post.slug}` : undefined,
        imageUrl: post.featuredImageUrl ?? undefined,
        date: post.createdAt ?? undefined,
        _raw: post,
      }));
    };

    convexDataSourcePlugin({
      fetchPostTypes,
      fetchPosts,
      config: puckConfig,
    });
    dataSourceRef.current[cacheKey] = true;
  }, [convex, organizationId]);

  if (!data.content.length) {
    return null;
  }

  return (
    <div className="puck-content space-y-4">
      <Render config={puckConfig} data={data} />
    </div>
  );
}
