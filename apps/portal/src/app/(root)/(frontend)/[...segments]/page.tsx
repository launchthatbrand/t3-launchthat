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
import { BackgroundRippleEffect } from "~/components/ui/background-ripple-effect";
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
  getPluginFrontendFiltersForSlug,
  getPluginFrontendSingleSlotsForSlug,
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

interface PageProps {
  params: Promise<{ segments?: string[] }>;
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

  // Basic HTML strip (works for editor HTML).
  if (raw.includes("<")) {
    return raw
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  // Best-effort JSON text extraction (covers Lexical state).
  if (raw.startsWith("{") || raw.startsWith("[")) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      const parts: string[] = [];
      const walk = (node: unknown) => {
        if (!node) return;
        if (typeof node === "string") return;
        if (Array.isArray(node)) {
          node.forEach(walk);
          return;
        }
        if (typeof node === "object") {
          const obj = node as Record<string, unknown>;
          if (typeof obj.text === "string") {
            parts.push(obj.text);
          }
          Object.values(obj).forEach(walk);
        }
      };
      walk(parsed);
      return parts.join(" ").replace(/\s+/g, " ").trim();
    } catch {
      return "";
    }
  }

  return raw.replace(/\s+/g, " ").trim();
}

interface AttachmentMetaEntry {
  mediaItemId?: string;
  url?: string;
  title?: string;
  alt?: string;
  mimeType?: string;
}

function isLikelyImageFilename(value: string): boolean {
  return /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(value);
}

function isLikelyNonImageFilename(value: string): boolean {
  return /\.(pdf|mp4|mov|webm|mp3|wav|m4a|zip|rar|7z|docx?|xlsx?|pptx?)$/i.test(
    value,
  );
}

function isLikelyImageAttachment(entry: AttachmentMetaEntry): boolean {
  const mime = typeof entry.mimeType === "string" ? entry.mimeType : "";
  if (mime.startsWith("image/")) return true;
  const url = typeof entry.url === "string" ? entry.url : "";
  if (isLikelyImageFilename(url)) return true;
  const title = typeof entry.title === "string" ? entry.title : "";
  if (isLikelyImageFilename(title)) return true;

  // Convex storage URLs often have no extension. If this looks like a storage URL
  // and the title doesn't look like a known non-image file, treat it as image.
  const isConvexStorageUrl =
    url.includes(".convex.cloud/api/storage/") || url.includes("/api/storage/");
  if (isConvexStorageUrl && title && !isLikelyNonImageFilename(title)) {
    return true;
  }

  return false;
}

function extractFirstImageAttachmentUrl(args: {
  origin: string;
  postMetaMap: Map<string, PostMetaValue>;
}): { url: string; alt?: string } | null {
  const raw = metaValueToString(args.postMetaMap.get(ATTACHMENTS_META_KEY));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    for (const item of parsed) {
      if (!item || typeof item !== "object") continue;
      const entry = item as AttachmentMetaEntry;
      if (typeof entry.url !== "string" || !entry.url.trim()) continue;
      if (!isLikelyImageAttachment(entry)) continue;
      return {
        url: toAbsoluteUrl(args.origin, entry.url),
        alt:
          typeof entry.alt === "string" && entry.alt.trim()
            ? entry.alt
            : undefined,
      };
    }
  } catch {
    return null;
  }
  return null;
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
    excerpt,
    siteDescription,
    deriveDescriptionFromContent(content),
  );

  const firstAttachmentImage = extractFirstImageAttachmentUrl({
    origin,
    postMetaMap,
  });

  const featuredImageUrl =
    typeof (post as { featuredImageUrl?: unknown }).featuredImageUrl ===
    "string"
      ? ((post as { featuredImageUrl: string }).featuredImageUrl ?? "")
      : "";

  const ogImageUrl =
    firstAttachmentImage?.url ??
    (featuredImageUrl.trim().length > 0
      ? toAbsoluteUrl(origin, featuredImageUrl)
      : null);
  const ogImages = ogImageUrl
    ? [
        {
          url: ogImageUrl,
          ...(firstAttachmentImage?.alt
            ? { alt: firstAttachmentImage.alt }
            : {}),
        },
      ]
    : undefined;

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

  const frontendSlotRegistrations =
    post.postTypeSlug && pluginMatch
      ? getPluginFrontendSingleSlotsForSlug(post.postTypeSlug)
      : [];
  const disabledSlotIds = resolveDisabledFrontendSlotIds(postType);
  const filteredSlotRegistrations = disabledSlotIds.length
    ? frontendSlotRegistrations.filter(
        (registration) => !disabledSlotIds.includes(registration.slot.id),
      )
    : frontendSlotRegistrations;
  const pluginSlotNodes = buildFrontendSlotNodes({
    registrations: filteredSlotRegistrations,
    post,
    postType,
    organizationId,
    postMeta: postMetaObject,
  });
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
