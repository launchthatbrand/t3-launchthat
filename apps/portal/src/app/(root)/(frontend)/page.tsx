import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { fetchQuery } from "convex/nextjs";

import { getActiveTenantFromHeaders } from "@/lib/tenant-headers";
import { getTenantOrganizationId } from "~/lib/tenant-fetcher";
import { SITE_OPTION_KEYS } from "~/lib/site/options";
import { OrganizationHomepagePlaceholder } from "~/components/frontend/OrganizationHomepagePlaceholder";
import {
  loadAllowedPageTemplates,
  renderFrontendResolvedPost,
} from "~/lib/frontendRouting/renderFrontendSinglePost";
import { findPostTypeBySlug } from "~/lib/plugins/frontend";

export default async function OrganizationHomepage() {
  const tenant = await getActiveTenantFromHeaders();
  if (!tenant) {
    return null;
  }

  const organizationId = getTenantOrganizationId(tenant) ?? null;

  const frontPageOption = await fetchQuery(api.core.options.get, {
    metaKey: SITE_OPTION_KEYS.frontPage,
    type: "site",
    ...(organizationId ? { orgId: organizationId } : {}),
  } as const);

  const configuredPostId =
    frontPageOption?.metaValue &&
    typeof frontPageOption.metaValue === "object" &&
    typeof (frontPageOption.metaValue as { postId?: unknown }).postId ===
      "string"
      ? ((frontPageOption.metaValue as { postId: string }).postId ?? null)
      : null;

  if (!configuredPostId) {
    return <OrganizationHomepagePlaceholder tenant={tenant} />;
  }

  const post = await fetchQuery(api.core.posts.queries.getPostById, {
    id: configuredPostId,
    ...(organizationId ? { organizationId } : {}),
    postTypeSlug: "pages",
  } as const);

  if (!post || post.status !== "published") {
    return <OrganizationHomepagePlaceholder tenant={tenant} />;
  }

  const postType =
    post.postTypeSlug
      ? await fetchQuery(api.core.postTypes.queries.getBySlug, {
          slug: post.postTypeSlug,
          ...(organizationId ? { organizationId } : {}),
        })
      : null;
  const postFields =
    post.postTypeSlug
      ? ((await fetchQuery(api.core.postTypes.queries.fieldsBySlug, {
          slug: post.postTypeSlug,
          includeSystem: true,
          ...(organizationId ? { organizationId } : {}),
        })) ?? [])
      : [];

  const postMetaResult: unknown = await fetchQuery(
    api.core.posts.postMeta.getPostMeta,
    {
      postId: post._id,
      ...(organizationId ? { organizationId } : {}),
      postTypeSlug: post.postTypeSlug ?? undefined,
    },
  );
  const postMeta = (postMetaResult ?? []) as {
    key: string;
    value?: string | number | boolean | null;
  }[];
  const postMetaMap = new Map<string, string | number | boolean | null | undefined>();
  postMeta.forEach((entry) => {
    postMetaMap.set(entry.key, entry.value ?? null);
  });
  const postMetaObject = Object.fromEntries(postMetaMap.entries()) as Record<
    string,
    string | number | boolean | null | undefined
  >;

  const puckMetaEntry = postMeta.find((meta) => meta.key === "puck_data");
  const puckData =
    typeof puckMetaEntry?.value === "string"
      ? safeParsePuckData(puckMetaEntry.value)
      : null;

  const allowedPageTemplates = await loadAllowedPageTemplates(
    organizationId ? (organizationId as Id<"organizations">) : null,
  );

  const pluginMatch = post.postTypeSlug ? findPostTypeBySlug(post.postTypeSlug) : null;

  return await renderFrontendResolvedPost({
    post: post as any,
    postType: postType as any,
    postFields: postFields as any,
    postMeta: postMeta as any,
    postMetaObject: postMetaObject as any,
    postMetaMap: postMetaMap as any,
    puckData: puckData as any,
    pluginMatch: pluginMatch as any,
    organizationId: organizationId as Id<"organizations">,
    allowedPageTemplates,
    segments: [],
    enforceCanonicalRedirect: false,
  });
}

function safeParsePuckData(value: string) {
  try {
    const parsed = JSON.parse(value) as { content?: unknown };
    if (parsed && Array.isArray(parsed.content)) {
      return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}


