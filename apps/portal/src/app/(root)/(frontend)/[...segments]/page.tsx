import "~/lib/pageTemplates";

/* eslint-disable @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
import type { Doc, Id } from "@/convex/_generated/dataModel";
import type { Data as PuckData } from "@measured/puck";
import type { FrontendFilterContext } from "launchthat-plugin-core/frontendFilters";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Fragment } from "react";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { getActiveTenantFromHeaders } from "@/lib/tenant-headers";
import { fetchQuery } from "convex/nextjs";
import { LmsCourseProvider } from "launchthat-plugin-lms";

import type { PluginFrontendSingleSlotRegistration } from "~/lib/plugins/helpers";
import { EditorViewer } from "~/components/blocks/editor-x/viewer";
import { PostCommentsSection } from "~/components/comments/PostCommentsSection";
import { FrontendContentFilterHost } from "~/components/frontend/FrontendContentFilterHost";
import { TaxonomyBadges } from "~/components/taxonomies/TaxonomyBadges";
import { BackgroundRippleEffect } from "~/components/ui/background-ripple-effect";
import { env } from "~/env";
import {
  isLexicalSerializedStateString,
  parseLexicalSerializedState,
} from "~/lib/editor/lexical";
import {
  DEFAULT_PAGE_TEMPLATE_SLUG,
  getPageTemplate,
  PAGE_TEMPLATE_ACCESS_OPTION_KEY,
} from "~/lib/pageTemplates/registry";
import { findPostTypeBySlug } from "~/lib/plugins/frontend";
import { wrapWithFrontendProviders } from "~/lib/plugins/frontendProviders";
import {
  getFrontendSingleSlotsForSlug,
  getPluginFrontendFiltersForSlug,
  wrapWithPluginProviders,
} from "~/lib/plugins/helpers";
import { ATTACHMENTS_META_KEY } from "~/lib/posts/metaKeys";
import {
  getCanonicalPostPath,
  getCanonicalPostSegments,
} from "~/lib/postTypes/routing";
import { SEO_META_KEYS, SEO_OPTION_KEYS } from "~/lib/seo/constants";
import { getTenantOrganizationId } from "~/lib/tenant-fetcher";
import { cn } from "~/lib/utils";
import { PortalConvexProvider } from "~/providers/ConvexClientProvider";
import { PuckContentRenderer } from "../../../../components/puckeditor/PuckContentRenderer";

type PluginMatch = ReturnType<typeof findPostTypeBySlug>;

const PERMALINK_OPTION_KEY = "permalink_settings";

interface PageProps {
  params: Promise<{ segments?: string[] }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
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

  // Lexical JSON -> plain text (avoid dumping JSON into meta tags).
  // IMPORTANT: Lexical oEmbed nodes often contain HTML strings with "<iframe...>"
  // so we must parse JSON BEFORE any HTML heuristics.
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

        // oEmbed nodes (e.g. Vimeo) often contain a title but no text nodes.
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

      // Lexical editor state typically looks like: { root: { children: [...] } }
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

      return parts.join(" ").replace(/\s+/g, " ").trim();
    } catch {
      // If it looks like JSON but isn't valid, do NOT return raw (avoid JSON-like blobs in meta).
      return "";
    }
  }

  // Basic HTML strip (works for editor HTML).
  if (raw.includes("<")) {
    const stripped = raw
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (stripped.length > 200) return `${stripped.slice(0, 197)}...`;
    return stripped;
  }

  const normalized = raw.replace(/\s+/g, " ").trim();
  // Keep meta descriptions reasonably sized.
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

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const resolvedParams = await props.params;
  const segments = normalizeSegments(resolvedParams?.segments ?? []);
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

  const generalOption = await fetchQuery(api.core.options.get, {
    metaKey: SEO_OPTION_KEYS.general,
    type: "site",
    ...(organizationId ? { orgId: organizationId } : {}),
  } as const);
  const socialOption = await fetchQuery(api.core.options.get, {
    metaKey: SEO_OPTION_KEYS.social,
    type: "site",
    ...(organizationId ? { orgId: organizationId } : {}),
  } as const);

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
    typeof social?.enableSocialMeta === "boolean"
      ? social.enableSocialMeta
      : true;
  const twitterUsername =
    typeof social?.twitterUsername === "string"
      ? social.twitterUsername
      : undefined;
  const twitterCardType =
    typeof social?.twitterCardType === "string"
      ? (social.twitterCardType as
          | "summary"
          | "summary_large_image"
          | "app"
          | "player")
      : "summary_large_image";

  const inferredLmsType = inferLmsPostTypeSlugFromSegments(segments);
  let isLmsComponentPost = false;

  let post = inferredLmsType
    ? await fetchQuery(api.plugins.lms.posts.queries.getPostBySlug, {
        slug,
        organizationId: organizationId ?? undefined,
      })
    : null;
  isLmsComponentPost = Boolean(post);

  if (!post && inferredLmsType && isConvexId(slug)) {
    post = await fetchQuery(api.plugins.lms.posts.queries.getPostById, {
      id: slug,
      organizationId: organizationId ?? undefined,
    });
    isLmsComponentPost = Boolean(post);
  }

  if (!post) {
    post = await fetchQuery(api.core.posts.queries.getPostBySlug, {
      slug,
      ...(organizationId ? { organizationId } : {}),
    });
  }

  if (!post && isConvexId(slug)) {
    post = await fetchQuery(api.core.posts.queries.getPostById, {
      id: slug as Id<"posts">,
      ...(organizationId ? { organizationId } : {}),
    });
  }

  if (!post) {
    post = await fetchQuery(api.plugins.lms.posts.queries.getPostBySlug, {
      slug,
      organizationId: organizationId ?? undefined,
    });
    isLmsComponentPost = Boolean(post);
  }

  if (!post && isConvexId(slug)) {
    post = await fetchQuery(api.plugins.lms.posts.queries.getPostById, {
      id: slug,
      organizationId: organizationId ?? undefined,
    });
    isLmsComponentPost = Boolean(post);
  }

  const isDownloadRoute = ["download", "downloads"].includes(
    segments[0]?.toLowerCase() ?? "",
  );
  if (!post && isDownloadRoute && organizationId) {
    const result = await fetchQuery(
      api.core.downloads.queries.getDownloadBySlug,
      {
        organizationId,
        slug,
      },
    );
    if (result) {
      const download = result.download;
      post = {
        _id: `custom:downloads:${download._id}`,
        _creationTime: download._creationTime,
        organizationId: download.organizationId,
        postTypeSlug: "downloads",
        slug: download.slug,
        title: download.title,
        excerpt: download.description ?? undefined,
        content: download.content ?? "",
        status: download.status,
        createdAt: download.createdAt,
        updatedAt: download.updatedAt ?? download._creationTime,
      } as unknown as Doc<"posts">;
    }
  }

  if (!post && isDownloadRoute && organizationId && isConvexId(slug)) {
    const result = await fetchQuery(
      api.core.downloads.queries.getDownloadById,
      {
        organizationId,
        downloadId: slug as unknown as Id<"downloads">,
      },
    );
    if (result) {
      const download = result.download;
      post = {
        _id: `custom:downloads:${download._id}`,
        _creationTime: download._creationTime,
        organizationId: download.organizationId,
        postTypeSlug: "downloads",
        slug: download.slug,
        title: download.title,
        excerpt: download.description ?? undefined,
        content: download.content ?? "",
        status: download.status,
        createdAt: download.createdAt,
        updatedAt: download.updatedAt ?? download._creationTime,
      } as unknown as Doc<"posts">;
    }
  }

  if (!post) {
    return {
      metadataBase: new URL(origin),
      title: "Not Found",
      robots: { index: false, follow: false },
    };
  }

  let postType: PostTypeDoc | null = null;
  if (post.postTypeSlug) {
    postType =
      (await fetchQuery(api.core.postTypes.queries.getBySlug, {
        slug: post.postTypeSlug,
        ...(organizationId ? { organizationId } : {}),
      })) ?? null;
  }

  const postMetaResult: unknown = isLmsComponentPost
    ? await fetchQuery(api.plugins.lms.posts.queries.getPostMeta, {
        postId: post._id as unknown as string,
        organizationId: organizationId ?? undefined,
      })
    : await fetchQuery(api.core.posts.postMeta.getPostMeta, {
        postId: post._id,
        ...(organizationId ? { organizationId } : {}),
        postTypeSlug: post.postTypeSlug ?? undefined,
      });

  const postMeta = (postMetaResult ?? []) as {
    key: string;
    value?: string | number | boolean | null;
  }[];
  const postMetaMap = buildPostMetaMap(postMeta as unknown as PostMetaDoc[]);

  const seoTitle =
    metaValueToString(postMetaMap.get(SEO_META_KEYS.title))?.trim() ?? "";
  const seoDescription =
    metaValueToString(postMetaMap.get(SEO_META_KEYS.description))?.trim() ?? "";
  const seoCanonical =
    metaValueToString(postMetaMap.get(SEO_META_KEYS.canonical))?.trim() ?? "";
  const seoNoindex = metaValueToBoolean(postMetaMap.get(SEO_META_KEYS.noindex));
  const seoNofollow = metaValueToBoolean(
    postMetaMap.get(SEO_META_KEYS.nofollow),
  );

  const canonicalPath = getCanonicalPostPath(post, postType, false) || "/";
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
    const rawAttachments = metaValueToString(
      postMetaMap.get(ATTACHMENTS_META_KEY),
    );
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

        const entryMimeType =
          typeof entry.mimeType === "string" ? entry.mimeType : "";
        const entryTitle = typeof entry.title === "string" ? entry.title : "";

        const mediaItemId =
          typeof entry.mediaItemId === "string" ? entry.mediaItemId : null;
        if (mediaItemId) {
          // Prefer using the stable media proxy URL (it returns a fresh signed URL).
          // Only include if we have strong signal it is an image.
          const url =
            typeof entry.url === "string" && entry.url.trim()
              ? entry.url.trim()
              : "";
          const isConvexStorageUrl =
            url.includes(".convex.cloud/api/storage/") ||
            url.includes("/api/storage/");
          const isLikelyNonImageTitle =
            /\.(pdf|mp4|mov|webm|mp3|wav|m4a|zip|rar|7z|docx?|xlsx?|pptx?)$/i.test(
              entryTitle,
            );

          if (entryMimeType.startsWith("image/")) {
            return `${origin}/api/media/${mediaItemId}`;
          }

          // Attachment entries sometimes omit mimeType; Convex URLs often omit file extensions.
          // If the URL looks like Convex storage and the title doesn't suggest a non-image, treat as image.
          if (isConvexStorageUrl && entryTitle && !isLikelyNonImageTitle) {
            return `${origin}/api/media/${mediaItemId}`;
          }

          // Last resort: ask Convex for mimeType if we have to.
          const media = await fetchQuery(api.core.media.queries.getMediaItem, {
            id: mediaItemId as unknown as Id<"mediaItems">,
          });
          const mimeType =
            media &&
            typeof (media as { mimeType?: unknown }).mimeType === "string"
              ? ((media as { mimeType: string }).mimeType ?? "")
              : "";
          if (mimeType.startsWith("image/")) {
            return `${origin}/api/media/${mediaItemId}`;
          }
        }

        const url =
          typeof entry.url === "string" && entry.url.trim()
            ? entry.url.trim()
            : "";
        if (!url) continue;

        // Best-effort URL check for external image thumbnails (e.g. Vimeo).
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

  // Option A: Always use branded OG image.
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
            ...(twitterUsername
              ? { site: twitterUsername, creator: twitterUsername }
              : {}),
            title,
            description,
            images: ogImages?.map((img) => img.url),
          },
        }
      : {}),
  };
}

const LMS_POST_TYPE_SLUGS = new Set([
  "courses",
  "lessons",
  "topics",
  "quizzes",
  "certificates",
]);

export default async function FrontendCatchAllPage(props: PageProps) {
  const resolvedParams = await props.params;
  const segments = normalizeSegments(resolvedParams?.segments ?? []);
  const resolvedSearchParams = props.searchParams
    ? await props.searchParams
    : undefined;
  const requestedPostTypeSlug =
    parsePostTypeSlugFromSearchParams(resolvedSearchParams);
  const tenant = await getActiveTenantFromHeaders();
  const organizationId = getTenantOrganizationId(tenant);

  const archiveContext = await resolveArchiveContext(segments, organizationId);
  if (archiveContext) {
    const archiveTemplateData = await loadTemplateContent(
      "archive",
      archiveContext.postType.slug,
      organizationId,
    );
    if (archiveTemplateData) {
      return (
        <main className="bg-background min-h-screen">
          <PuckContentRenderer data={archiveTemplateData} />
        </main>
      );
    }
    const archiveSlug = archiveContext.postType.slug?.toLowerCase() ?? "";
    const isLmsComponentArchive =
      LMS_POST_TYPE_SLUGS.has(archiveSlug) ||
      (archiveContext.postType.storageKind === "component" &&
        (archiveContext.postType.storageTables ?? []).some((table) =>
          table.includes("launchthat_lms:posts"),
        ));
    const posts = isLmsComponentArchive
      ? await fetchQuery(api.plugins.lms.posts.queries.getAllPosts, {
          organizationId: organizationId ?? undefined,
          filters: {
            status: "published",
            postTypeSlug: archiveContext.postType.slug,
            limit: 50,
          },
        })
      : await fetchQuery(api.core.posts.queries.getAllPosts, {
          ...(organizationId ? { organizationId } : {}),
          filters: {
            status: "published",
            postTypeSlug: archiveContext.postType.slug,
            limit: 50,
          },
        });
    const pluginMatch = findPostTypeBySlug(archiveContext.postType.slug);
    const pluginArchive = pluginMatch?.postType.frontend?.archive;
    if (pluginMatch && pluginArchive?.render) {
      return pluginArchive.render({
        posts,
        postType: pluginMatch.postType,
      });
    }
    return <PostArchive postType={archiveContext.postType} posts={posts} />;
  }

  const taxonomyArchiveContext = await resolveTaxonomyArchiveContext(
    segments,
    organizationId,
    requestedPostTypeSlug,
  );
  if (taxonomyArchiveContext === "not_found") {
    notFound();
  }
  if (taxonomyArchiveContext) {
    if (!organizationId) {
      notFound();
    }
    const taxonomySlug = taxonomyArchiveContext.taxonomySlug;
    const term = await fetchQuery(api.core.taxonomies.queries.getTermBySlug, {
      taxonomySlug,
      organizationId,
      termSlug: taxonomyArchiveContext.termSlug,
    });
    if (!term) {
      notFound();
    }
    const isLmsType = (slug: string) =>
      [
        "courses",
        "lessons",
        "topics",
        "quizzes",
        "certificates",
        "badges",
      ].includes(slug.toLowerCase());

    // If ?post_type=... is provided, render only that post type (existing behavior).
    if (taxonomyArchiveContext.postTypeSlug) {
      const postTypeSlug = taxonomyArchiveContext.postTypeSlug;
      const postType =
        (await fetchQuery(api.core.postTypes.queries.getBySlug, {
          slug: postTypeSlug,
          ...(organizationId ? { organizationId } : {}),
        })) ?? null;

      const effectivePostType =
        postType ??
        ({
          name: postTypeSlug,
          slug: postTypeSlug,
          description: null,
        } as unknown as PostTypeDoc);

      const objectIds = await fetchQuery(
        api.core.taxonomies.queries.listObjectsByTerm,
        {
          organizationId,
          termId: term._id,
          postTypeSlug,
        },
      );
      const objectIdSet = new Set(objectIds);

      const unfiltered = isLmsType(postTypeSlug)
        ? await fetchQuery(api.plugins.lms.posts.queries.getAllPosts, {
            organizationId: organizationId ?? undefined,
            filters: {
              status: "published",
              postTypeSlug,
              limit: 200,
            },
          })
        : await fetchQuery(api.core.posts.queries.getAllPosts, {
            ...(organizationId ? { organizationId } : {}),
            filters: {
              status: "published",
              postTypeSlug,
              limit: 200,
            },
          });

      const posts = (unfiltered ?? []).filter((post: any) =>
        objectIdSet.has(post?._id as unknown as string),
      );

      return (
        <TaxonomyArchive
          label={taxonomyArchiveContext.taxonomyLabel}
          termName={taxonomyArchiveContext.termName}
          termSlug={taxonomyArchiveContext.termSlug}
          description={taxonomyArchiveContext.description}
          postType={effectivePostType}
          posts={posts}
        />
      );
    }

    // No ?post_type=... => render all assigned posts grouped by post type.
    const assignments = await fetchQuery(
      api.core.taxonomies.queries.listAssignmentsByTerm,
      { organizationId, termId: term._id },
    );
    const byPostType = new Map<string, Set<string>>();
    for (const row of assignments) {
      const slug = row.postTypeSlug.toLowerCase();
      const set = byPostType.get(slug) ?? new Set<string>();
      set.add(row.objectId);
      byPostType.set(slug, set);
    }

    const sections: Array<{ postType: PostTypeDoc; posts: Doc<"posts">[] }> =
      [];
    for (const [postTypeSlug, objectIdSet] of byPostType.entries()) {
      const postType =
        (await fetchQuery(api.core.postTypes.queries.getBySlug, {
          slug: postTypeSlug,
          ...(organizationId ? { organizationId } : {}),
        })) ?? null;

      const effectivePostType =
        postType ??
        ({
          name: postTypeSlug,
          slug: postTypeSlug,
          description: null,
        } as unknown as PostTypeDoc);

      const unfiltered = isLmsType(postTypeSlug)
        ? await fetchQuery(api.plugins.lms.posts.queries.getAllPosts, {
            organizationId: organizationId ?? undefined,
            filters: {
              status: "published",
              postTypeSlug,
              limit: 200,
            },
          })
        : await fetchQuery(api.core.posts.queries.getAllPosts, {
            ...(organizationId ? { organizationId } : {}),
            filters: {
              status: "published",
              postTypeSlug,
              limit: 200,
            },
          });

      const posts = (unfiltered ?? []).filter((post: any) =>
        objectIdSet.has(post?._id as unknown as string),
      );
      if (posts.length > 0) {
        sections.push({ postType: effectivePostType, posts });
      }
    }

    return (
      <TaxonomyArchiveGrouped
        label={taxonomyArchiveContext.taxonomyLabel}
        termName={taxonomyArchiveContext.termName}
        termSlug={taxonomyArchiveContext.termSlug}
        description={taxonomyArchiveContext.description}
        sections={sections}
      />
    );
  }

  const slug = deriveSlugFromSegments(segments);

  if (!slug) {
    notFound();
  }

  const inferredLmsType = inferLmsPostTypeSlugFromSegments(segments);
  let isLmsComponentPost = false;

  // If the URL shape clearly indicates an LMS route (e.g. /course/.../lesson/...),
  // prefer resolving from the LMS component to avoid stale core `posts` collisions.
  let post = inferredLmsType
    ? await fetchQuery(api.plugins.lms.posts.queries.getPostBySlug, {
        slug,
        organizationId: organizationId ?? undefined,
      })
    : null;
  isLmsComponentPost = Boolean(post);

  if (!post && inferredLmsType && isConvexId(slug)) {
    post = await fetchQuery(api.plugins.lms.posts.queries.getPostById, {
      id: slug,
      organizationId: organizationId ?? undefined,
    });
    isLmsComponentPost = Boolean(post);
  }

  if (!post) {
    post = await fetchQuery(api.core.posts.queries.getPostBySlug, {
      slug,
      ...(organizationId ? { organizationId } : {}),
    });
  }

  if (!post && isConvexId(slug)) {
    post = await fetchQuery(api.core.posts.queries.getPostById, {
      id: slug as Id<"posts">,
      ...(organizationId ? { organizationId } : {}),
    });
  }

  // Fallback: if it wasn't an obvious LMS route, still try LMS component after core.
  if (!post) {
    post = await fetchQuery(api.plugins.lms.posts.queries.getPostBySlug, {
      slug,
      organizationId: organizationId ?? undefined,
    });
    isLmsComponentPost = Boolean(post);
  }

  if (!post && isConvexId(slug)) {
    post = await fetchQuery(api.plugins.lms.posts.queries.getPostById, {
      id: slug,
      organizationId: organizationId ?? undefined,
    });
    isLmsComponentPost = Boolean(post);
  }

  const isDownloadRoute = ["download", "downloads"].includes(
    segments[0]?.toLowerCase() ?? "",
  );
  if (!post && isDownloadRoute && organizationId) {
    const result = await fetchQuery(
      api.core.downloads.queries.getDownloadBySlug,
      {
        organizationId,
        slug,
      },
    );
    if (result) {
      const download = result.download;
      post = {
        _id: `custom:downloads:${download._id}`,
        _creationTime: download._creationTime,
        organizationId: download.organizationId,
        postTypeSlug: "downloads",
        slug: download.slug,
        title: download.title,
        excerpt: download.description ?? undefined,
        content: download.content ?? "",
        status: download.status,
        createdAt: download.createdAt,
        updatedAt: download.updatedAt ?? download._creationTime,
      } as unknown as Doc<"posts">;
    }
  }

  if (!post && isDownloadRoute && organizationId && isConvexId(slug)) {
    const result = await fetchQuery(
      api.core.downloads.queries.getDownloadById,
      {
        organizationId,
        downloadId: slug as unknown as Id<"downloads">,
      },
    );
    if (result) {
      const download = result.download;
      post = {
        _id: `custom:downloads:${download._id}`,
        _creationTime: download._creationTime,
        organizationId: download.organizationId,
        postTypeSlug: "downloads",
        slug: download.slug,
        title: download.title,
        excerpt: download.description ?? undefined,
        content: download.content ?? "",
        status: download.status,
        createdAt: download.createdAt,
        updatedAt: download.updatedAt ?? download._creationTime,
      } as unknown as Doc<"posts">;
    }
  }

  console.log("[FrontendCatchAllPage] Post:", post);

  if (!post) {
    notFound();
  }

  let postType: PostTypeDoc | null = null;
  let postFields: Doc<"postTypeFields">[] = [];
  if (post.postTypeSlug) {
    postType =
      (await fetchQuery(api.core.postTypes.queries.getBySlug, {
        slug: post.postTypeSlug,
        ...(organizationId ? { organizationId } : {}),
      })) ?? null;
    const fieldResult: Doc<"postTypeFields">[] | null = await fetchQuery(
      api.core.postTypes.queries.fieldsBySlug,
      {
        slug: post.postTypeSlug,
        includeSystem: true,
        ...(organizationId ? { organizationId } : {}),
      },
    );
    postFields = fieldResult ?? [];
  }

  const postMetaResult: unknown = isLmsComponentPost
    ? await fetchQuery(api.plugins.lms.posts.queries.getPostMeta, {
        postId: post._id as unknown as string,
        organizationId: organizationId ?? undefined,
      })
    : await fetchQuery(api.core.posts.postMeta.getPostMeta, {
        postId: post._id,
        ...(organizationId ? { organizationId } : {}),
        postTypeSlug: post.postTypeSlug ?? undefined,
      });
  const postMeta = (postMetaResult ?? []) as {
    key: string;
    value?: string | number | boolean | null;
  }[];
  const postMetaMap = buildPostMetaMap(postMeta as unknown as PostMetaDoc[]);
  const postMetaObject = Object.fromEntries(postMetaMap.entries()) as Record<
    string,
    PostMetaValue
  >;
  console.log("[FrontendCatchAllPage] Post Meta:", postMeta);

  const puckMetaEntry = postMeta.find((meta) => meta.key === "puck_data");
  const puckData = parsePuckData(
    typeof puckMetaEntry?.value === "string" ? puckMetaEntry.value : null,
  );

  const pageTemplateAccessOption =
    post.postTypeSlug === "pages"
      ? await fetchQuery(api.core.options.get, {
          orgId: organizationId ?? undefined,
          type: "site",
          metaKey: PAGE_TEMPLATE_ACCESS_OPTION_KEY,
        })
      : null;
  const allowedPageTemplates = extractAllowedPageTemplates(
    pageTemplateAccessOption?.metaValue,
  );

  const pluginMatch: PluginMatch = post.postTypeSlug
    ? findPostTypeBySlug(post.postTypeSlug)
    : null;
  const permalinkConfig = pluginMatch?.postType.rewrite?.permalink;
  const pathContext: PermalinkTemplateContext = {
    post,
    postType,
    meta: postMetaMap,
  };
  const customCanonicalPath =
    permalinkConfig?.canonical &&
    buildPathFromTemplate(permalinkConfig.canonical, pathContext);
  const customAliasPaths =
    permalinkConfig?.aliases
      ?.map((template) => buildPathFromTemplate(template, pathContext))
      .filter(
        (value): value is string =>
          typeof value === "string" && value.length > 0,
      ) ?? [];
  const requestedPath = segments.join("/");

  const shouldSkipCanonicalRedirect =
    post.postTypeSlug === "certificates" &&
    segments[0]?.toLowerCase() === "course" &&
    segments.map((s) => s.toLowerCase()).includes("certificate");

  if (!shouldSkipCanonicalRedirect && customCanonicalPath) {
    const normalizedCanonical = normalizePath(customCanonicalPath);
    const normalizedRequested = normalizePath(requestedPath);
    const normalizedAliases = customAliasPaths.map((alias) =>
      normalizePath(alias),
    );
    const matchesCanonical = normalizedRequested === normalizedCanonical;
    const matchesAlias = normalizedAliases.includes(normalizedRequested);
    if (!matchesCanonical && !matchesAlias) {
      redirect(`/${normalizedCanonical}`);
    }
  } else if (!shouldSkipCanonicalRedirect) {
    const canonicalSegments = getCanonicalPostSegments(post, postType);
    if (canonicalSegments.length > 0) {
      const canonicalPath = canonicalSegments.join("/");
      if (canonicalPath !== requestedPath) {
        redirect(`/${canonicalPath}`);
      }
    }
  }
  const shouldWrapWithLmsProvider =
    typeof post.postTypeSlug === "string" &&
    LMS_POST_TYPE_SLUGS.has(post.postTypeSlug);

  const wrapWithLmsProviderIfNeeded = (node: ReactNode) => {
    if (!node || !shouldWrapWithLmsProvider) {
      return node;
    }
    return (
      <PortalConvexProvider>
        <LmsCourseProvider
          post={post}
          postTypeSlug={post.postTypeSlug}
          postMeta={postMetaObject}
          organizationId={organizationId}
        >
          {node}
        </LmsCourseProvider>
      </PortalConvexProvider>
    );
  };

  const pageTemplateSlug =
    (postMetaMap.get("page_template") as string | undefined) ??
    DEFAULT_PAGE_TEMPLATE_SLUG;
  if (post.postTypeSlug === "pages") {
    const allowedSet =
      allowedPageTemplates && allowedPageTemplates.length > 0
        ? new Set<string>([
            ...allowedPageTemplates,
            DEFAULT_PAGE_TEMPLATE_SLUG,
            pageTemplateSlug,
          ])
        : null;
    const effectiveSlug =
      allowedSet && !allowedSet.has(pageTemplateSlug)
        ? DEFAULT_PAGE_TEMPLATE_SLUG
        : pageTemplateSlug;
    const pageTemplate = getPageTemplate(effectiveSlug, organizationId);
    if (
      pageTemplate &&
      pageTemplate.slug !== DEFAULT_PAGE_TEMPLATE_SLUG &&
      pageTemplate.render
    ) {
      return wrapWithLmsProviderIfNeeded(
        pageTemplate.render({
          post,
          postType,
          meta: postMetaObject,
          organizationId,
        }),
      );
    }
  }

  const pluginSingle = pluginMatch?.postType.frontend?.single;
  if (pluginMatch && pluginSingle?.render) {
    let rendered = pluginSingle.render({
      post,
      postType: pluginMatch.postType,
    });
    rendered = wrapWithLmsProviderIfNeeded(rendered);
    return wrapWithFrontendProviders(
      rendered,
      pluginMatch.postType.frontend?.providers,
    );
  }

  const frontendSlotRegistrations = post.postTypeSlug
    ? getFrontendSingleSlotsForSlug(post.postTypeSlug)
    : [];
  if (env.NODE_ENV !== "production") {
    console.log("[FrontendCatchAllPage] frontendSlotRegistrations", {
      postTypeSlug: post.postTypeSlug,
      count: frontendSlotRegistrations.length,
      locations: frontendSlotRegistrations.map((r) => r.slot.location),
      ids: frontendSlotRegistrations.map((r) => r.slot.id),
    });
  }
  const disabledSlotIds = resolveDisabledFrontendSlotIds(postType);
  const filteredSlotRegistrations = disabledSlotIds.length
    ? frontendSlotRegistrations.filter(
        (registration) => !disabledSlotIds.includes(registration.slot.id),
      )
    : frontendSlotRegistrations;
  if (env.NODE_ENV !== "production") {
    console.log("[FrontendCatchAllPage] filteredSlotRegistrations", {
      postTypeSlug: post.postTypeSlug,
      disabledSlotIds,
      count: filteredSlotRegistrations.length,
      locations: filteredSlotRegistrations.map((r) => r.slot.location),
      ids: filteredSlotRegistrations.map((r) => r.slot.id),
    });
  }
  const pluginSlotNodes = buildFrontendSlotNodes({
    registrations: filteredSlotRegistrations,
    post,
    postType,
    organizationId,
    postMeta: postMetaObject,
  });
  if (env.NODE_ENV !== "production") {
    console.log("[FrontendCatchAllPage] pluginSlotNodes counts", {
      beforeContent: pluginSlotNodes.beforeContent.length,
      afterContent: pluginSlotNodes.afterContent.length,
      header: pluginSlotNodes.header.length,
      sidebarTop: pluginSlotNodes.sidebarTop.length,
      sidebarBottom: pluginSlotNodes.sidebarBottom.length,
    });
  }
  const frontendFilterRegistrations =
    post.postTypeSlug && pluginMatch
      ? getPluginFrontendFiltersForSlug(post.postTypeSlug)
      : [];
  const contentFilterIds = frontendFilterRegistrations.reduce<string[]>(
    (acc, registration) => {
      if (
        registration.filter.location === "content" &&
        typeof registration.filter.id === "string"
      ) {
        acc.push(registration.filter.id);
      }
      return acc;
    },
    [],
  );

  const permalinkSettings = await loadPermalinkSettings(organizationId);
  const categoryBase =
    normalizeBaseSegment(permalinkSettings.categoryBase) ?? "categories";
  const tagBase = normalizeBaseSegment(permalinkSettings.tagBase) ?? "tags";

  return wrapWithLmsProviderIfNeeded(
    <PostDetail
      post={post}
      postType={postType}
      fields={postFields}
      postMeta={postMeta as unknown as Doc<"postsMeta">[]}
      puckData={puckData}
      pluginSlots={pluginSlotNodes}
      contentFilterIds={contentFilterIds}
      postMetaObject={postMetaObject}
      categoryBase={categoryBase}
      tagBase={tagBase}
    />,
  );
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

function inferLmsPostTypeSlugFromSegments(
  segments: string[],
): "courses" | "lessons" | "topics" | "quizzes" | "certificates" | null {
  // LMS permalink shapes (examples):
  // - /course/:courseSlug
  // - /course/:courseSlug/lesson/:lessonSlug
  // - /course/:courseSlug/lesson/:lessonSlug/topic/:topicSlug
  // - /course/:courseSlug/lesson/:lessonSlug/topic/:topicSlug/quiz/:quizSlug
  // - /course/:courseSlug/certificate/:certificateSlug
  // - /course/:courseSlug/lesson/:lessonSlug/certificate/:certificateSlug
  // - /course/:courseSlug/lesson/:lessonSlug/topic/:topicSlug/certificate/:certificateSlug
  // Only infer LMS types when route is under `/course/...`
  if (segments[0]?.toLowerCase() !== "course") {
    return null;
  }

  const lowered = segments.map((segment) => segment.toLowerCase());
  if (lowered.includes("certificate")) {
    return "certificates";
  }
  if (lowered.includes("quiz")) {
    return "quizzes";
  }
  if (lowered.includes("topic")) {
    return "topics";
  }
  if (lowered.includes("lesson")) {
    return "lessons";
  }
  return "courses";
}

function isConvexId(value: string): boolean {
  return /^[a-z0-9]{32}$/.test(value);
}

type PostTypeDoc = Doc<"postTypes">;
type PostFieldDoc = Doc<"postTypeFields">;
type PostMetaDoc = Doc<"postsMeta">;
type PostMetaValue = string | number | boolean | null | undefined;

interface PermalinkTemplateContext {
  post: Doc<"posts">;
  postType: PostTypeDoc | null;
  meta: Map<string, PostMetaValue>;
}

function buildPostMetaMap(meta: PostMetaDoc[]): Map<string, PostMetaValue> {
  const map = new Map<string, PostMetaValue>();
  meta.forEach((entry) => {
    map.set(entry.key, entry.value ?? null);
  });
  return map;
}

function buildPathFromTemplate(
  template: string,
  ctx: PermalinkTemplateContext,
): string | null {
  if (!template) {
    return null;
  }
  const segments = template
    .split("/")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);
  if (segments.length === 0) {
    return null;
  }
  const resolvedSegments: string[] = [];
  for (const segment of segments) {
    if (segment.startsWith("{") && segment.endsWith("}")) {
      const token = segment.slice(1, -1).trim();
      const value = resolveTemplateToken(token, ctx);
      if (!value) {
        return null;
      }
      resolvedSegments.push(value);
    } else {
      resolvedSegments.push(segment);
    }
  }
  return resolvedSegments.join("/");
}

function resolveTemplateToken(
  token: string,
  ctx: PermalinkTemplateContext,
): string | null {
  if (!token) {
    return null;
  }
  switch (token) {
    case "slug":
      return ctx.post.slug ?? ctx.post._id;
    case "id":
      return ctx.post._id;
    case "postType":
      return ctx.post.postTypeSlug ?? ctx.postType?.slug ?? null;
    default:
      if (token.startsWith("meta.")) {
        const key = token.slice(5);
        const metaValue = ctx.meta.get(key);
        if (metaValue === null || metaValue === undefined || metaValue === "") {
          return null;
        }
        return String(metaValue);
      }
      return null;
  }
}

function normalizePath(path: string): string {
  return path
    .split("/")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0)
    .join("/");
}

interface FrontendSlotBuckets {
  beforeContent: ReactNode[];
  afterContent: ReactNode[];
  sidebarTop: ReactNode[];
  sidebarBottom: ReactNode[];
  header: ReactNode[];
}

const EMPTY_SLOT_BUCKETS: FrontendSlotBuckets = {
  beforeContent: [],
  afterContent: [],
  sidebarTop: [],
  sidebarBottom: [],
  header: [],
};

function buildFrontendSlotNodes({
  registrations,
  post,
  postType: _postType,
  organizationId,
  postMeta,
}: {
  registrations: PluginFrontendSingleSlotRegistration[];
  post: Doc<"posts">;
  postType: PostTypeDoc | null;
  organizationId?: Id<"organizations"> | null;
  postMeta?: Record<string, PostMetaValue>;
}): FrontendSlotBuckets {
  if (!registrations.length) {
    return EMPTY_SLOT_BUCKETS;
  }

  const buckets: FrontendSlotBuckets = {
    beforeContent: [],
    afterContent: [],
    sidebarTop: [],
    sidebarBottom: [],
    header: [],
  };

  registrations.forEach((registration) => {
    const element = registration.slot.render({
      pluginId: registration.pluginId,
      pluginName: registration.pluginName,
      postTypeSlug: post.postTypeSlug ?? "",
      post,
      postType: null,
      organizationId: organizationId ?? undefined,
      postMeta,
    });
    if (!element) {
      return;
    }
    const wrapped = wrapWithPluginProviders(element, registration.pluginId);
    const keyedWrapped = (
      <Fragment key={`${registration.pluginId}-${registration.slot.id}`}>
        {wrapped}
      </Fragment>
    );
    switch (registration.slot.location) {
      case "beforeContent":
        buckets.beforeContent.push(keyedWrapped);
        break;
      case "afterContent":
        buckets.afterContent.push(keyedWrapped);
        break;
      case "sidebarTop":
        buckets.sidebarTop.push(keyedWrapped);
        break;
      case "sidebarBottom":
        buckets.sidebarBottom.push(keyedWrapped);
        break;
      case "header":
        buckets.header.push(keyedWrapped);
        break;
      default:
        break;
    }
  });

  return buckets;
}

interface PostDetailProps {
  post: Doc<"posts">;
  postType: PostTypeDoc | null;
  fields: PostFieldDoc[];
  postMeta: PostMetaDoc[];
  puckData: PuckData | null;
  pluginSlots: FrontendSlotBuckets;
  contentFilterIds: string[];
  postMetaObject: Record<string, PostMetaValue>;
  categoryBase: string;
  tagBase: string;
}

function PostDetail({
  post,
  postType,
  fields,
  postMeta,
  puckData,
  pluginSlots,
  contentFilterIds,
  postMetaObject,
  categoryBase,
  tagBase,
}: PostDetailProps) {
  const contextLabel = resolveContextLabel(post, postType);
  const customFieldEntries = buildCustomFieldEntries({
    fields,
    post,
    postMeta,
  });
  const supportsComments = resolveSupportFlag(postType?.supports, "comments");
  const frontendVisibility = readFrontendVisibility(postType);
  const showCustomFields = resolveFrontendVisibilityFlag(
    frontendVisibility,
    "showCustomFields",
    true,
  );
  const showComments = resolveFrontendVisibilityFlag(
    frontendVisibility,
    "showComments",
    true,
  );
  const hasPuckContent = Boolean(puckData?.content?.length);
  const lexicalContent = parseLexicalSerializedState(post.content ?? null);
  const rawContent = isLexicalSerializedStateString(post.content)
    ? null
    : (post.content ?? null);

  if (hasPuckContent && puckData) {
    return (
      <main className="bg-background min-h-screen">
        <PuckContentRenderer data={puckData} />
      </main>
    );
  }

  const hasSidebar =
    pluginSlots.sidebarTop.length > 0 || pluginSlots.sidebarBottom.length > 0;

  return (
    <main className="relative">
      <BackgroundRippleEffect interactive={true} className="z-10 opacity-80" />
      <div className="relative container mx-auto max-w-6xl space-y-6 overflow-hidden py-10">
        {pluginSlots.beforeContent.length > 0 && (
          <div className="z-20 space-y-4">{pluginSlots.beforeContent}</div>
        )}
        <div
          className={cn(
            "relative z-20 gap-8",
            hasSidebar
              ? "grid lg:grid-cols-[minmax(0,1fr)_320px]"
              : "space-y-6",
          )}
        >
          <article className="space-y-6">
            <header className="space-y-3">
              <p className="text-muted-foreground text-sm tracking-wide uppercase">
                {contextLabel}
              </p>
              <h1 className="text-4xl font-bold">{post.title}</h1>
              {post.excerpt && (
                <p className="text-muted-foreground text-lg">{post.excerpt}</p>
              )}
              <PostMetaSummary post={post} postType={postType} />
              {post.organizationId ? (
                <TaxonomyBadges
                  organizationId={post.organizationId as unknown as string}
                  objectId={post._id as unknown as string}
                  postTypeSlug={post.postTypeSlug ?? undefined}
                  categoryBase={categoryBase}
                  tagBase={tagBase}
                />
              ) : null}
              {pluginSlots.header.length > 0 && (
                <div className="space-y-3">{pluginSlots.header}</div>
              )}
            </header>
            <FilteredContent
              lexicalContent={lexicalContent}
              rawContent={rawContent}
              filterIds={contentFilterIds}
              filterContext={{
                postTypeSlug: post.postTypeSlug ?? "",
                postId: post._id,
                postMeta: postMetaObject,
              }}
            />
            {pluginSlots.afterContent.length > 0 && (
              <div className="space-y-4">{pluginSlots.afterContent}</div>
            )}

            {showCustomFields && customFieldEntries.length > 0 ? (
              <section className="bg-card rounded-lg border p-6">
                <h2 className="text-foreground text-xl font-semibold">
                  Custom Fields
                </h2>
                <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                  {customFieldEntries?.map((entry) => (
                    <div key={entry.key} className="space-y-1">
                      <dt className="text-muted-foreground text-sm font-medium">
                        {entry.label}
                      </dt>
                      <dd className="text-foreground text-base">
                        {entry.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            ) : null}

            {supportsComments && showComments ? (
              <PostCommentsSection
                postId={post._id}
                organizationId={post.organizationId ?? null}
              />
            ) : null}
          </article>
          {hasSidebar && (
            <aside className="space-y-4">
              {pluginSlots.sidebarTop.length > 0 && (
                <div className="space-y-4">{pluginSlots.sidebarTop}</div>
              )}
              {pluginSlots.sidebarBottom.length > 0 && (
                <div className="space-y-4">{pluginSlots.sidebarBottom}</div>
              )}
            </aside>
          )}
        </div>
      </div>
    </main>
  );
}

type LexicalSerializedState = ReturnType<typeof parseLexicalSerializedState>;

const hasRenderableLexicalContent = (
  state: LexicalSerializedState,
): state is Exclude<LexicalSerializedState, null> => {
  if (!state) return false;
  const root = (state as { root?: unknown }).root;
  if (!root || typeof root !== "object") return false;
  const children = (root as { children?: unknown }).children;
  if (!Array.isArray(children) || children.length === 0) return false;

  // Treat the common "empty editor" payload as no content:
  // root -> single paragraph -> no text children
  const hasAnyRenderableNode = (node: unknown): boolean => {
    if (!node || typeof node !== "object") return false;
    const type = (node as { type?: unknown }).type;
    // If there's any non-paragraph node (oembed, image, hr, etc) we treat it as content.
    if (typeof type === "string" && type !== "paragraph") {
      return true;
    }
    const maybeText = (node as { text?: unknown }).text;
    if (typeof maybeText === "string" && maybeText.trim().length > 0) {
      return true;
    }
    const nested = (node as { children?: unknown }).children;
    if (Array.isArray(nested)) {
      return nested.some(hasAnyRenderableNode);
    }
    return false;
  };

  return children.some(hasAnyRenderableNode);
};

interface FilteredContentProps {
  lexicalContent: LexicalSerializedState;
  rawContent: string | null;
  filterIds: string[];
  filterContext: FrontendFilterContext;
}

function FilteredContent({
  lexicalContent,
  rawContent,
  filterIds,
  filterContext,
}: FilteredContentProps) {
  let contentNode: ReactNode;

  if (hasRenderableLexicalContent(lexicalContent)) {
    contentNode = (
      <EditorViewer
        editorSerializedState={lexicalContent}
        className="prose max-w-none"
      />
    );
  } else if (rawContent) {
    contentNode = (
      <div
        className="prose max-w-none"
        dangerouslySetInnerHTML={{ __html: rawContent }}
      />
    );
  } else {
    contentNode = (
      <p className="text-muted-foreground flex min-h-32 items-center justify-center rounded-md border border-dashed border-gray-300 p-4 text-center text-sm">
        No content for this post
      </p>
    );
  }

  if (!filterIds.length) {
    return contentNode;
  }

  return (
    <FrontendContentFilterHost filterIds={filterIds} context={filterContext}>
      {contentNode}
    </FrontendContentFilterHost>
  );
}

function resolveContextLabel(post: Doc<"posts">, postType: PostTypeDoc | null) {
  if (postType?.name) {
    return postType.name;
  }
  if (post.postTypeSlug) {
    switch (post.postTypeSlug) {
      case "page":
        return "Page";
      case "post":
        return "Post";
      default:
        return post.postTypeSlug.replace(/-/g, " ");
    }
  }
  return "Post";
}

function resolveSupportFlag(
  supports: Doc<"postTypes">["supports"] | undefined,
  key: string,
) {
  if (!supports) {
    return false;
  }
  const record = supports as Record<string, unknown>;
  return record[key] === true;
}

function extractAllowedPageTemplates(metaValue: unknown): string[] | undefined {
  if (!metaValue || typeof metaValue !== "object") {
    return undefined;
  }
  if (!("allowed" in metaValue)) {
    return undefined;
  }
  const allowed = (metaValue as { allowed?: unknown }).allowed;
  if (!Array.isArray(allowed)) {
    return undefined;
  }
  const strings = allowed.filter(
    (value): value is string => typeof value === "string",
  );
  return strings.length > 0 ? strings : undefined;
}

function resolveFrontendVisibilityFlag(
  visibility: ReturnType<typeof readFrontendVisibility>,
  key: "showCustomFields" | "showComments",
  fallback: boolean,
) {
  if (!visibility) {
    return fallback;
  }
  const record = visibility as Record<string, unknown>;
  if (record[key] === true) {
    return true;
  }
  if (record[key] === false) {
    return false;
  }
  return fallback;
}

function resolveDisabledFrontendSlotIds(
  postType: Doc<"postTypes"> | null,
): string[] {
  const visibility = readFrontendVisibility(postType);
  const raw = visibility?.disabledSingleSlotIds;
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.filter((value): value is string => typeof value === "string") as
    | string[]
    | [];
}

function readFrontendVisibility(postType: Doc<"postTypes"> | null): {
  showCustomFields?: boolean;
  showComments?: boolean;
  disabledSingleSlotIds?: unknown;
} | null {
  const raw = (postType as unknown as { frontendVisibility?: unknown })
    ?.frontendVisibility;
  if (!raw || typeof raw !== "object") {
    return null;
  }
  return raw as {
    showCustomFields?: boolean;
    showComments?: boolean;
    disabledSingleSlotIds?: unknown;
  };
}

function PostMetaSummary({
  post,
  postType,
}: {
  post: Doc<"posts">;
  postType: PostTypeDoc | null;
}) {
  const details: { label: string; value: string }[] = [];

  if (postType?.name) {
    details.push({ label: "Post Type", value: postType.name });
  } else if (post.postTypeSlug) {
    details.push({
      label: "Post Type",
      value: post.postTypeSlug.replace(/-/g, " "),
    });
  }

  if (post.status) {
    details.push({
      label: "Status",
      value: post.status.charAt(0).toUpperCase() + post.status.slice(1),
    });
  }

  if (post.slug) {
    details.push({ label: "Slug", value: post.slug });
  }

  if (!details.length) {
    return null;
  }

  return (
    <dl className="text-muted-foreground flex flex-wrap gap-4 text-sm">
      {details?.map((item) => (
        <div key={item.label}>
          <dt className="sr-only">{item.label}</dt>
          <dd>
            <span className="text-foreground font-medium">{item.label}:</span>{" "}
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function deriveSystemFieldValue(
  field: PostFieldDoc,
  post: Doc<"posts">,
): string | number | boolean | null {
  switch (field.key) {
    case "_id":
      return post._id;
    case "_creationTime":
      return typeof post._creationTime === "number" ? post._creationTime : null;
    case "createdAt":
      return typeof post.createdAt === "number"
        ? post.createdAt
        : typeof post._creationTime === "number"
          ? post._creationTime
          : null;
    case "updatedAt":
      return typeof post.updatedAt === "number"
        ? post.updatedAt
        : typeof post._creationTime === "number"
          ? post._creationTime
          : null;
    case "slug":
      return typeof post.slug === "string" ? post.slug : "";
    case "status":
      return typeof post.status === "string" ? post.status : "";
    default:
      return null;
  }
}

function formatFieldValue(
  field: PostFieldDoc,
  value: string | number | boolean | null,
): string {
  if (value === null || value === undefined || value === "") {
    return "Not set";
  }

  switch (field.type) {
    case "boolean":
      return value ? "Yes" : "No";
    case "date":
    case "datetime": {
      const date = Number(value);
      if (!Number.isNaN(date)) {
        return new Date(date).toLocaleString();
      }
      return String(value);
    }
    case "json":
      return typeof value === "string" ? value : JSON.stringify(value, null, 2);
    default:
      return String(value);
  }
}

function buildCustomFieldEntries({
  fields,
  post,
  postMeta,
}: {
  fields: PostFieldDoc[];
  post: Doc<"posts">;
  postMeta: PostMetaDoc[];
}) {
  if (!fields.length) {
    return [];
  }

  const metaMap = new Map<string, string | number | boolean | null>();
  postMeta.forEach((record) => {
    metaMap.set(record.key, record.value ?? null);
  });

  const sorted = [...fields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return sorted?.map((field) => {
    const defaultValue = coerceFieldDefault(field);
    const metaValue = metaMap.has(field.key)
      ? metaMap.get(field.key)
      : defaultValue;
    const rawValue = field.isSystem
      ? deriveSystemFieldValue(field, post)
      : (metaValue ?? null);
    return {
      key: field._id,
      label: field.name,
      value: formatFieldValue(field, rawValue),
    };
  });
}

function coerceFieldDefault(
  field: PostFieldDoc,
): string | number | boolean | null | undefined {
  const { defaultValue } = field;
  if (
    typeof defaultValue === "string" ||
    typeof defaultValue === "number" ||
    typeof defaultValue === "boolean"
  ) {
    return defaultValue;
  }
  if (defaultValue === null) {
    return null;
  }
  return undefined;
}

async function resolveArchiveContext(
  segments: string[],
  organizationId?: Doc<"organizations">["_id"],
) {
  if (segments.length === 0) {
    return null;
  }
  const path = segments.join("/");
  const postTypes: PostTypeDoc[] = await fetchQuery(
    api.core.postTypes.queries.list,
    {
      includeBuiltIn: true,
      ...(organizationId ? { organizationId } : {}),
    },
  );

  const match = postTypes.find((type) => {
    if (!type.rewrite?.hasArchive) {
      return false;
    }
    const archiveSlug = trimSlashes(type.rewrite.archiveSlug ?? "");
    if (!archiveSlug) {
      return false;
    }
    return archiveSlug === path;
  });

  if (!match) {
    return null;
  }

  return { postType: match };
}

const trimSlashes = (value: string) => value.replace(/^\/+|\/+$/g, "");

interface PermalinkSettings {
  categoryBase?: string;
  tagBase?: string;
}

interface TaxonomyArchiveContext {
  kind: "category" | "tag" | "custom";
  taxonomySlug: string;
  taxonomyLabel: string;
  postTypeSlug?: string;
  termSlug: string;
  termName: string;
  description?: string | null;
}

type TaxonomyArchiveResolution = TaxonomyArchiveContext | "not_found" | null;

function normalizeBaseSegment(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimSlashes(trimmed).toLowerCase();
}

async function loadPermalinkSettings(
  organizationId?: Doc<"organizations">["_id"],
): Promise<PermalinkSettings> {
  // Prefer tenant-specific settings, but fall back to the portal-root settings
  // (the current admin UI saves without orgId today).
  const orgOption = await fetchQuery(api.core.options.get, {
    metaKey: PERMALINK_OPTION_KEY,
    type: "site",
    orgId: organizationId ?? undefined,
  });
  const fallbackOption =
    orgOption ??
    (await fetchQuery(api.core.options.get, {
      metaKey: PERMALINK_OPTION_KEY,
      type: "site",
    }));

  const metaValue = fallbackOption?.metaValue as unknown;
  if (!metaValue || typeof metaValue !== "object") {
    return {};
  }
  const record = metaValue as Record<string, unknown>;
  return {
    categoryBase:
      typeof record.categoryBase === "string" ? record.categoryBase : undefined,
    tagBase: typeof record.tagBase === "string" ? record.tagBase : undefined,
  };
}

async function resolveTaxonomyArchiveContext(
  segments: string[],
  organizationId?: Doc<"organizations">["_id"],
  requestedPostTypeSlug?: string,
): Promise<TaxonomyArchiveResolution> {
  if (segments.length < 2) return null;

  const settings = await loadPermalinkSettings(organizationId);
  const configuredCategoryBase = normalizeBaseSegment(settings.categoryBase);
  const configuredTagBase = normalizeBaseSegment(settings.tagBase);

  // Defaults align with the admin UI placeholders.
  const categoryBases = new Set(
    [configuredCategoryBase ?? "categories", "category"].filter(Boolean),
  );
  const tagBases = new Set(
    [configuredTagBase ?? "tags", "tag"].filter(Boolean),
  );

  const base = segments[0]?.toLowerCase() ?? "";
  const termSlug = (segments[segments.length - 1] ?? "").toLowerCase();
  if (!termSlug) return null;

  if (categoryBases.has(base)) {
    if (!organizationId) {
      return "not_found";
    }
    const term = await fetchQuery(api.core.taxonomies.queries.getTermBySlug, {
      taxonomySlug: "category",
      organizationId,
      termSlug,
    });
    if (!term) {
      // Base segment matched a taxonomy archive route, but the term doesn't exist.
      // Treat this as a hard 404 rather than falling back to post slug resolution.
      return "not_found";
    }
    return {
      kind: "category",
      taxonomySlug: "category",
      taxonomyLabel: "Category",
      postTypeSlug: requestedPostTypeSlug ?? undefined,
      termSlug: term.slug,
      termName: term.name,
      description: term.description ?? null,
    };
  }

  if (tagBases.has(base)) {
    if (!organizationId) {
      return "not_found";
    }
    const tag = await fetchQuery(api.core.taxonomies.queries.getTermBySlug, {
      taxonomySlug: "post_tag",
      organizationId,
      termSlug,
    });
    if (!tag) {
      // Base segment matched a taxonomy archive route, but the term doesn't exist.
      // Treat this as a hard 404 rather than falling back to post slug resolution.
      return "not_found";
    }
    return {
      kind: "tag",
      taxonomySlug: "post_tag",
      taxonomyLabel: "Tag",
      postTypeSlug: requestedPostTypeSlug ?? undefined,
      termSlug: tag.slug,
      termName: tag.name,
      description: tag.description ?? null,
    };
  }

  // Custom taxonomy archives: /{taxonomySlug}/{termSlug}
  if (organizationId) {
    const taxonomy = await fetchQuery(
      api.core.taxonomies.queries.getTaxonomyBySlug,
      {
        slug: base,
        organizationId,
      },
    );
    if (taxonomy) {
      const term = await fetchQuery(api.core.taxonomies.queries.getTermBySlug, {
        taxonomySlug: base,
        organizationId,
        termSlug,
      });
      if (!term) {
        return "not_found";
      }
      return {
        kind: "custom",
        taxonomySlug: base,
        taxonomyLabel: taxonomy.name,
        postTypeSlug: requestedPostTypeSlug ?? undefined,
        termSlug: term.slug,
        termName: term.name,
        description: term.description ?? null,
      };
    }
  }

  return null;
}

function parsePostTypeSlugFromSearchParams(
  searchParams?: Record<string, string | string[] | undefined>,
): string | undefined {
  if (!searchParams) return undefined;
  const raw = searchParams.post_type;
  const value = Array.isArray(raw) ? raw[0] : raw;
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (!trimmed) return undefined;
  // Basic safety: keep it slug-like.
  const normalized = trimmed.toLowerCase();
  if (!/^[a-z0-9_-]+$/.test(normalized)) return undefined;
  return normalized;
}

async function loadTemplateContent(
  templateType: "single" | "archive",
  postTypeSlug: string | null,
  organizationId: Doc<"organizations">["_id"] | undefined,
) {
  try {
    const template = await fetchQuery(
      api.core.posts.queries.getTemplateForPostType,
      {
        templateCategory: templateType,
        postTypeSlug: postTypeSlug ?? undefined,
        ...(organizationId ? { organizationId } : {}),
      },
    );
    if (!template) {
      return null;
    }

    const source = template.puckData ?? template.content ?? null;
    const content = parsePuckData(source);
    if (content) {
      return content;
    }
  } catch (error) {
    console.error("Failed to load template content", error);
    return null;
  }
}

function parsePuckData(value: unknown): PuckData | null {
  if (!value || typeof value !== "string") {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as PuckData;
    if (Array.isArray(parsed.content)) {
      return parsed;
    }
  } catch (error) {
    console.error("Failed to parse puck data", error);
  }
  return null;
}

function PostArchive({
  postType,
  posts,
}: {
  postType: PostTypeDoc;
  posts: Doc<"posts">[];
}) {
  const description =
    postType.description ??
    `Browse published ${postType.name.toLowerCase()} entries.`;

  return (
    <main className="container mx-auto max-w-5xl space-y-6 py-10">
      <header className="space-y-2 text-center">
        <p className="text-muted-foreground text-sm tracking-wide uppercase">
          {postType.name}
        </p>
        <h1 className="text-4xl font-bold">{postType.name} Archive</h1>
        <p className="text-muted-foreground">{description}</p>
      </header>

      {posts.length === 0 ? (
        <div className="text-muted-foreground rounded-lg border p-10 text-center">
          No {postType.name.toLowerCase()} have been published yet.
        </div>
      ) : (
        <section className="grid gap-6 md:grid-cols-2">
          {posts?.map((post) => {
            const url = getCanonicalPostPath(post, postType, true);
            return (
              <article
                key={post._id}
                className="bg-card rounded-lg border p-6 shadow-sm transition hover:shadow-md"
              >
                <Link href={url} className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-sm font-medium">
                      {postType.name}
                    </p>
                    <h2 className="text-foreground text-2xl font-semibold">
                      {post.title || "Untitled"}
                    </h2>
                  </div>
                  {post.excerpt ? (
                    <p className="text-muted-foreground text-sm">
                      {post.excerpt}
                    </p>
                  ) : null}
                </Link>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}

function TaxonomyArchive({
  label,
  termName,
  termSlug,
  description,
  postType,
  posts,
}: {
  label: string;
  termName: string;
  termSlug: string;
  description?: string | null;
  postType: PostTypeDoc;
  posts: Doc<"posts">[];
}) {
  const fallbackDescription =
    description ??
    `Browse published ${postType.name.toLowerCase()} filed under ${label.toLowerCase()} “${termName}”.`;

  return (
    <main className="container mx-auto max-w-5xl space-y-6 py-10">
      <header className="space-y-2 text-center">
        <p className="text-muted-foreground text-sm tracking-wide uppercase">
          {label}
        </p>
        <h1 className="text-4xl font-bold">
          {termName} <span className="text-muted-foreground">({termSlug})</span>
        </h1>
        <p className="text-muted-foreground">{fallbackDescription}</p>
      </header>

      {posts.length === 0 ? (
        <div className="text-muted-foreground rounded-lg border p-10 text-center">
          No {postType.name.toLowerCase()} have been published for this{" "}
          {label.toLowerCase()} yet.
        </div>
      ) : (
        <section className="grid gap-6 md:grid-cols-2">
          {posts.map((post) => {
            const url = getCanonicalPostPath(post, postType, true);
            return (
              <article
                key={post._id}
                className="bg-card rounded-lg border p-6 shadow-sm transition hover:shadow-md"
              >
                <Link href={url} className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-sm font-medium">
                      {postType.name}
                    </p>
                    <h2 className="text-foreground text-2xl font-semibold">
                      {post.title || "Untitled"}
                    </h2>
                  </div>
                  {post.excerpt ? (
                    <p className="text-muted-foreground text-sm">
                      {post.excerpt}
                    </p>
                  ) : null}
                </Link>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}

function TaxonomyArchiveGrouped({
  label,
  termName,
  termSlug,
  description,
  sections,
}: {
  label: string;
  termName: string;
  termSlug: string;
  description?: string | null;
  sections: Array<{ postType: PostTypeDoc; posts: Doc<"posts">[] }>;
}) {
  const fallbackDescription =
    description ??
    `Browse published entries filed under ${label.toLowerCase()} “${termName}”.`;

  const sortedSections = [...sections].sort((a, b) =>
    a.postType.name.localeCompare(b.postType.name),
  );

  return (
    <main className="relative">
      <BackgroundRippleEffect interactive={true} className="z-10 opacity-80" />
      <div className="relative container mx-auto max-w-6xl space-y-10 overflow-hidden py-10">
        <header className="space-y-3">
          <p className="text-muted-foreground text-sm tracking-wide uppercase">
            {label}
          </p>
          <h1 className="text-4xl font-bold">
            {termName}{" "}
            <span className="text-muted-foreground">({termSlug})</span>
          </h1>
          <p className="text-muted-foreground text-lg">{fallbackDescription}</p>
        </header>

        {sortedSections.length === 0 ? (
          <div className="text-muted-foreground rounded-lg border p-10 text-center">
            No posts have been published for this {label.toLowerCase()} yet.
          </div>
        ) : (
          <div className="space-y-12">
            {sortedSections.map((section) => (
              <section key={section.postType.slug} className="space-y-4">
                <div className="border-b pb-2">
                  <h2 className="text-2xl font-semibold">
                    {section.postType.name}
                  </h2>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  {section.posts.map((post) => {
                    const url = getCanonicalPostPath(
                      post,
                      section.postType,
                      true,
                    );
                    return (
                      <article
                        key={post._id}
                        className="bg-card rounded-lg border p-6 shadow-sm transition hover:shadow-md"
                      >
                        <Link href={url} className="space-y-3">
                          <div className="space-y-1">
                            <p className="text-muted-foreground text-sm font-medium">
                              {section.postType.name}
                            </p>
                            <h3 className="text-foreground text-xl font-semibold">
                              {post.title || "Untitled"}
                            </h3>
                          </div>
                          {post.excerpt ? (
                            <p className="text-muted-foreground text-sm">
                              {post.excerpt}
                            </p>
                          ) : null}
                        </Link>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
