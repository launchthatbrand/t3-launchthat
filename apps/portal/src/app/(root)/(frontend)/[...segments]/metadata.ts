/* eslint-disable @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
import type { Doc, Id } from "@/convex/_generated/dataModel";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { adaptFetchQuery } from "@/lib/frontendRouting/fetchQueryAdapter";
import { resolveFrontendPostForRequest } from "@/lib/frontendRouting/resolveFrontendPostForRequest";
import { getActiveTenantFromHeaders } from "@/lib/tenant-headers";
import { fetchQuery } from "convex/nextjs";

import { ATTACHMENTS_META_KEY } from "~/lib/posts/metaKeys";
import { findPostTypeBySlug } from "~/lib/plugins/frontend";
import { getCanonicalPostSegments } from "~/lib/postTypes/routing";
import { SEO_META_KEYS, SEO_OPTION_KEYS } from "~/lib/seo/constants";
import { getTenantOrganizationId } from "~/lib/tenant-fetcher";

interface PageProps {
  params: Promise<{ segments?: string[] }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function normalizeSegments(segments: string[]) {
  return segments
    ?.map((segment) => segment.trim())
    ?.filter((segment) => segment?.length > 0);
}

function deriveSlugFromSegments(segments: string[]): string | null {
  for (let i = segments.length - 1; i >= 0; i -= 1) {
    const segment = segments[i]?.trim();
    if (segment) {
      return segment;
    }
  }
  return null;
}

function getRequestOriginFromHeaders(headerList: Headers): string | null {
  const forwardedProto = headerList.get("x-forwarded-proto");
  const proto = forwardedProto?.split(",")[0]?.trim() ?? "https";
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  if (!host) return null;
  return `${proto}://${host}`;
}

function resolveCanonicalUrl(args: {
  origin: string;
  canonicalPath: string;
  seoCanonical?: string;
}): string {
  const seo = (args.seoCanonical ?? "").trim();
  if (seo) {
    if (/^https?:\/\//i.test(seo)) return seo;
    if (seo.startsWith("/")) return `${args.origin}${seo}`;
    return `${args.origin}/${seo}`;
  }
  const path = args.canonicalPath.startsWith("/")
    ? args.canonicalPath
    : `/${args.canonicalPath}`;
  return `${args.origin}${path}`;
}

function metaValueToString(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  return null;
}

function metaValueToBoolean(value: unknown): boolean | null {
  if (value === true) return true;
  if (value === false) return false;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes"].includes(normalized)) return true;
    if (["false", "0", "no", ""].includes(normalized)) return false;
  }
  return null;
}

function toAbsoluteUrl(origin: string, input: string): string {
  const value = input.trim();
  if (!value) return value;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/")) return `${origin}${value}`;
  return `${origin}/${value}`;
}

function stripTrailingSlash(url: string): string {
  if (url.length <= 1) return url;
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function deriveDescriptionFromContent(content: unknown): string {
  if (typeof content !== "string") return "";
  const raw = content.trim();
  if (!raw) return "";

  if (raw.startsWith("{") || raw.startsWith("[")) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      const parts: string[] = [];

      const walkLexicalNode = (node: unknown) => {
        if (!node || typeof node !== "object") return;
        const obj = node as Record<string, unknown>;
        const type = typeof obj.type === "string" ? obj.type : "";

        if (type === "text") {
          if (typeof obj.text === "string" && obj.text.trim()) {
            parts.push(obj.text.trim());
          }
          return;
        }

        if (type === "oembed") {
          if (typeof obj.title === "string" && obj.title.trim()) {
            parts.push(obj.title.trim());
          }
          return;
        }

        const children = obj.children;
        if (Array.isArray(children)) {
          for (const child of children) {
            walkLexicalNode(child);
          }
        }
      };

      if (
        parsed &&
        typeof parsed === "object" &&
        "root" in (parsed as Record<string, unknown>)
      ) {
        const root = (parsed as Record<string, unknown>).root;
        walkLexicalNode(root);
      } else if (Array.isArray(parsed)) {
        for (const item of parsed) walkLexicalNode(item);
      } else {
        walkLexicalNode(parsed);
      }

      return parts.join(" ").replace(/\\s+/g, " ").trim();
    } catch {
      return "";
    }
  }

  if (raw.includes("<")) {
    const stripped = raw
      .replace(/<[^>]*>/g, " ")
      .replace(/\\s+/g, " ")
      .trim();
    if (stripped.length > 200) return `${stripped.slice(0, 197)}...`;
    return stripped;
  }

  const normalized = raw.replace(/\\s+/g, " ").trim();
  if (normalized.length > 200) return `${normalized.slice(0, 197)}...`;
  return normalized;
}

function resolveTitleWithSiteSettings(args: {
  pageTitle: string;
  siteTitle?: string;
  titleFormat?: string;
  separator?: string;
}): string {
  const page = args.pageTitle.trim();
  const site = (args.siteTitle ?? "").trim();
  if (!site) return page;
  const sep = typeof args.separator === "string" ? args.separator : " | ";
  const format =
    typeof args.titleFormat === "string" ? args.titleFormat : "page_first";
  if (!page) return site;
  if (format === "site_first") {
    return `${site}${sep}${page}`;
  }
  if (format === "page_only") {
    return page;
  }
  return `${page}${sep}${site}`;
}

const isConvexId = (value: string): boolean => /^[a-z0-9]{32}$/.test(value);

const buildPostMetaMap = (
  meta: Array<{ key: string; value?: string | number | boolean | null }>,
): Map<string, string | number | boolean | null> => {
  const map = new Map<string, string | number | boolean | null>();
  meta.forEach((entry) => map.set(entry.key, entry.value ?? null));
  return map;
};

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const resolvedParams = await props.params;
  const segments = normalizeSegments(resolvedParams?.segments ?? []);
  const resolvedSearchParams = props.searchParams
    ? await props.searchParams
    : undefined;
  const slug = deriveSlugFromSegments(segments);

  const headerList: Headers = await headers();
  const origin = getRequestOriginFromHeaders(headerList) ?? "https://localhost";

  if (!slug) {
    return {
      metadataBase: new URL(origin),
      title: "Not Found",
      robots: { index: false, follow: false },
    };
  }

  const tenant = await getActiveTenantFromHeaders();
  const organizationId = getTenantOrganizationId(tenant);

  // Avoid TS deep instantiation issues in this file by avoiding a module-scope import of the huge generated `api` type.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
  const apiAny = (await import("@/convex/_generated/api")).api as any;

  const generalOption = await fetchQuery(apiAny.core.options.get, {
    metaKey: SEO_OPTION_KEYS.general,
    type: "site",
    ...(organizationId ? { orgId: organizationId } : {}),
  });
  const socialOption = await fetchQuery(apiAny.core.options.get, {
    metaKey: SEO_OPTION_KEYS.social,
    type: "site",
    ...(organizationId ? { orgId: organizationId } : {}),
  });

  const general =
    generalOption?.metaValue && typeof generalOption.metaValue === "object"
      ? (generalOption.metaValue as Record<string, unknown>)
      : null;
  const social =
    socialOption?.metaValue && typeof socialOption.metaValue === "object"
      ? (socialOption.metaValue as Record<string, unknown>)
      : null;

  const siteTitle =
    typeof general?.siteTitle === "string" ? general.siteTitle : undefined;
  const siteDescription =
    typeof general?.siteDescription === "string"
      ? general.siteDescription
      : undefined;
  const titleFormat =
    typeof general?.titleFormat === "string" ? general.titleFormat : undefined;
  const separator =
    typeof general?.separator === "string" ? general.separator : undefined;

  const enableSocialMeta =
    typeof social?.enableSocialMeta === "boolean" ? social.enableSocialMeta : true;
  const twitterUsername =
    typeof social?.twitterUsername === "string" ? social.twitterUsername : undefined;
  const twitterCardType =
    typeof social?.twitterCardType === "string"
      ? (social.twitterCardType as
          | "summary"
          | "summary_large_image"
          | "app"
          | "player")
      : "summary_large_image";

  // Special-case disclaimer signing links: `/disclaimer/:issueId?token=...`
  // These are handled by the Disclaimers plugin route handler, but this metadata
  // function traditionally attempts "post resolution" which will explode if the
  // segment is a Convex ID from a *different* table (e.g. disclaimerIssues).
  // We only treat `/disclaimer/:value` as a post if a real Disclaimers post exists
  // with slug `:value`. Otherwise, return safe, non-indexable metadata.
  const rootSegment = segments[0] ?? "";
  const secondSegment = segments[1] ?? "";
  // Special-case funnel routes: `/f/:funnelSlug/:stepSlug/...`
  // These are handled by the Commerce plugin route handler, not by post resolution.
  // If we fall through to `resolveFrontendPostForRequest`, we'll incorrectly return
  // "Not Found" metadata even though the page renders (and the browser tab shows it).
  if (rootSegment === "f") {
    const lastSegment = segments[segments.length - 1] ?? "";
    const pageTitle =
      lastSegment === "checkout"
        ? "Checkout"
        : lastSegment
          ? "Funnel"
          : "Checkout";
    return {
      metadataBase: new URL(origin),
      title: resolveTitleWithSiteSettings({
        pageTitle,
        siteTitle: siteTitle ?? tenant?.name ?? undefined,
        titleFormat,
        separator,
      }),
      robots: { index: false, follow: false },
    };
  }
  if (
    (rootSegment === "disclaimer" || rootSegment === "disclaimers") &&
    typeof secondSegment === "string" &&
    secondSegment.trim().length > 0
  ) {
    const candidate = secondSegment.trim();
    try {
      const org = organizationId ?? undefined;
      const maybeDisclaimerPost = await fetchQuery(
        apiAny.plugins.disclaimers.posts.queries.getPostBySlug,
        {
          slug: candidate,
          ...(org ? { organizationId: org } : {}),
        },
      );
      if (!maybeDisclaimerPost) {
        return {
          metadataBase: new URL(origin),
          title: resolveTitleWithSiteSettings({
            pageTitle: "Disclaimer",
            siteTitle,
            titleFormat,
            separator,
          }),
          robots: { index: false, follow: false },
        };
      }
    } catch {
      return {
        metadataBase: new URL(origin),
        title: resolveTitleWithSiteSettings({
          pageTitle: "Disclaimer",
          siteTitle,
          titleFormat,
          separator,
        }),
        robots: { index: false, follow: false },
      };
    }
  }

  const resolved = await resolveFrontendPostForRequest({
    segments,
    slug,
    organizationId: organizationId ?? null,
    searchParams: resolvedSearchParams,
    fetchQuery: adaptFetchQuery(fetchQuery),
    getPostTypeBySingleSlugKey: apiAny.core.postTypes.queries.getBySingleSlugKey,
    readEntity: apiAny.plugins.entity.queries.readEntity,
    listEntities: apiAny.plugins.entity.queries.listEntities,
    api: apiAny,
    getCorePostBySlug: apiAny.core.posts.queries.getPostBySlug,
    getCorePostById: apiAny.core.posts.queries.getPostById,
  });

  const post: Doc<"posts"> | null = resolved?.post ?? null;

  if (!post) {
    return {
      metadataBase: new URL(origin),
      title: "Not Found",
      robots: { index: false, follow: false },
    };
  }

  const postType =
    post.postTypeSlug
      ? (await fetchQuery(apiAny.core.postTypes.queries.getBySlug, {
          slug: post.postTypeSlug,
          ...(organizationId ? { organizationId } : {}),
        })) ?? null
      : null;

  const postMetaResult: unknown = await fetchQuery(apiAny.core.posts.postMeta.getPostMeta, {
    postId: post._id,
    ...(organizationId ? { organizationId } : {}),
    postTypeSlug: post.postTypeSlug ?? undefined,
  });

  const postMeta = (postMetaResult ?? []) as {
    key: string;
    value?: string | number | boolean | null;
  }[];
  const postMetaMap = buildPostMetaMap(postMeta);

  const seoTitle =
    metaValueToString(postMetaMap.get(SEO_META_KEYS.title))?.trim() ?? "";
  const seoDescription =
    metaValueToString(postMetaMap.get(SEO_META_KEYS.description))?.trim() ?? "";
  const seoCanonical =
    metaValueToString(postMetaMap.get(SEO_META_KEYS.canonical))?.trim() ?? "";
  const seoNoindex = metaValueToBoolean(postMetaMap.get(SEO_META_KEYS.noindex));
  const seoNofollow = metaValueToBoolean(postMetaMap.get(SEO_META_KEYS.nofollow));

  const pluginMatch = post.postTypeSlug ? findPostTypeBySlug(post.postTypeSlug) : null;
  const postTypeSingleSlug =
    typeof postType?.rewrite?.singleSlug === "string"
      ? postType.rewrite.singleSlug
      : "";
  const pluginSingleSlug =
    typeof pluginMatch?.postType.rewrite?.singleSlug === "string"
      ? pluginMatch.postType.rewrite.singleSlug
      : "";
  const trimSlashes = (value: string) => value.replace(/^\/+|\/+$/g, "");
  const canonicalSegments =
    trimSlashes(postTypeSingleSlug).length > 0
      ? getCanonicalPostSegments(post, postType)
      : trimSlashes(pluginSingleSlug).length > 0
        ? [trimSlashes(pluginSingleSlug), trimSlashes(post.slug ?? post._id)]
        : getCanonicalPostSegments(post, postType);
  const canonicalPath =
    canonicalSegments.length > 0 ? `/${canonicalSegments.join("/")}` : "/";
  const canonicalUrl = resolveCanonicalUrl({
    origin,
    canonicalPath,
    seoCanonical,
  });

  const isPublished = (post.status ?? "draft") === "published";
  const effectiveNoindex = seoNoindex ?? !isPublished;
  const effectiveNofollow = seoNofollow ?? !isPublished;

  const resolveNonEmpty = (...values: (string | undefined | null)[]) => {
    for (const value of values) {
      if (typeof value === "string" && value.trim().length > 0) {
        return value.trim();
      }
    }
    return "";
  };

  const postTitle =
    typeof (post as { title?: unknown }).title === "string"
      ? ((post as { title: string }).title ?? "")
      : "";

  const resolvedTitle = resolveTitleWithSiteSettings({
    pageTitle: resolveNonEmpty(postTitle, postType?.name, "Post"),
    siteTitle: siteTitle ?? tenant?.name ?? undefined,
    titleFormat,
    separator,
  });

  const title = resolveNonEmpty(seoTitle, resolvedTitle);

  const excerpt =
    typeof (post as { excerpt?: unknown }).excerpt === "string"
      ? ((post as { excerpt: string }).excerpt ?? "")
      : "";
  const content =
    typeof (post as { content?: unknown }).content === "string"
      ? ((post as { content: string }).content ?? "")
      : "";

  const description = resolveNonEmpty(
    seoDescription,
    deriveDescriptionFromContent(excerpt),
    siteDescription,
    deriveDescriptionFromContent(content),
  );

  const siteNameForOg = siteTitle ?? tenant?.name ?? "LaunchThat Portal";
  const labelForOg = typeof postType?.name === "string" ? postType.name : "";
  const ogCardUrl = new URL("/api/og/post", origin);
  ogCardUrl.searchParams.set("title", title);
  ogCardUrl.searchParams.set("site", siteNameForOg);
  if (labelForOg.trim()) ogCardUrl.searchParams.set("label", labelForOg.trim());

  const pickOgBackgroundUrl = async (): Promise<string | null> => {
    const rawAttachments = metaValueToString(postMetaMap.get(ATTACHMENTS_META_KEY));
    if (!rawAttachments) return null;

    interface AttachmentMetaEntry {
      mediaItemId?: string;
      url?: string;
      mimeType?: string;
      title?: string;
    }

    try {
      const parsed = JSON.parse(rawAttachments) as unknown;
      if (!Array.isArray(parsed)) return null;
      for (const item of parsed) {
        if (!item || typeof item !== "object") continue;
        const entry = item as AttachmentMetaEntry;

        const entryMimeType = typeof entry.mimeType === "string" ? entry.mimeType : "";
        const entryTitle = typeof entry.title === "string" ? entry.title : "";

        const mediaItemId =
          typeof entry.mediaItemId === "string" ? entry.mediaItemId : null;
        if (mediaItemId) {
          const url =
            typeof entry.url === "string" && entry.url.trim() ? entry.url.trim() : "";
          const isConvexStorageUrl =
            url.includes(".convex.cloud/api/storage/") || url.includes("/api/storage/");
          const isLikelyNonImageTitle =
            /\.(pdf|mp4|mov|webm|mp3|wav|m4a|zip|rar|7z|docx?|xlsx?|pptx?)$/i.test(
              entryTitle,
            );

          if (entryMimeType.startsWith("image/")) {
            return `${origin}/api/media/${mediaItemId}`;
          }
          if (isConvexStorageUrl && entryTitle && !isLikelyNonImageTitle) {
            return `${origin}/api/media/${mediaItemId}`;
          }

          const media = await fetchQuery(apiAny.core.media.queries.getMediaItem, {
            id: mediaItemId as unknown as Id<"mediaItems">,
          });
          const mimeType =
            media && typeof (media as { mimeType?: unknown }).mimeType === "string"
              ? ((media as { mimeType: string }).mimeType ?? "")
              : "";
          if (mimeType.startsWith("image/")) {
            return `${origin}/api/media/${mediaItemId}`;
          }
        }

        const url = typeof entry.url === "string" && entry.url.trim() ? entry.url.trim() : "";
        if (!url) continue;

        const looksLikeImageUrl =
          /\.(png|jpe?g|gif|webp|avif|svg)(\?|#|$)/i.test(url) ||
          url.includes("vimeocdn.com");
        if (looksLikeImageUrl) {
          return toAbsoluteUrl(origin, url);
        }
      }
    } catch {
      // ignore
    }
    return null;
  };

  const ogBackgroundUrl = await pickOgBackgroundUrl();
  if (ogBackgroundUrl) {
    ogCardUrl.searchParams.set("bg", ogBackgroundUrl);
  }

  const ogImages = [{ url: ogCardUrl.toString() }];

  return {
    metadataBase: new URL(origin),
    title,
    description,
    alternates: { canonical: stripTrailingSlash(canonicalUrl) },
    robots: {
      index: !effectiveNoindex,
      follow: !effectiveNofollow,
    },
    ...(enableSocialMeta
      ? {
          openGraph: {
            url: stripTrailingSlash(canonicalUrl),
            title,
            description,
            type: "website" as const,
            images: ogImages,
          },
          twitter: {
            card: twitterCardType,
            ...(twitterUsername ? { site: twitterUsername, creator: twitterUsername } : {}),
            title,
            description,
            images: ogImages?.map((img) => img.url),
          },
        }
      : {}),
  };
}


