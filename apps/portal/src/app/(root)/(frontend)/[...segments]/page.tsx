import "~/lib/pageTemplates";
import "~/lib/plugins/installHooks";

/* eslint-disable @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unnecessary-type-assertion */
import type { Doc, Id } from "@/convex/_generated/dataModel";
import type { Data as PuckData } from "@measured/puck";
import type { FrontendFilterContext } from "launchthat-plugin-core/frontendFilters";
import type { ReactNode } from "react";
import { Fragment } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { adaptFetchQuery } from "@/lib/frontendRouting/fetchQueryAdapter";
import { resolveFrontendArchive } from "@/lib/frontendRouting/resolveFrontendArchive";
import { resolveFrontendPostForRequest } from "@/lib/frontendRouting/resolveFrontendPostForRequest";
import { resolveFrontendRouteOverride } from "@/lib/frontendRouting/resolveFrontendRouteOverride";
import { resolveFrontendTaxonomyArchive } from "@/lib/frontendRouting/resolveFrontendTaxonomyArchive";
import { getActiveTenantFromHeaders } from "@/lib/tenant-headers";
import { fetchQuery } from "convex/nextjs";

import type { PluginFrontendSingleSlotRegistration } from "~/lib/plugins/helpers";
import { EditorViewer } from "~/components/blocks/editor-x/viewer";
import { PostCommentsSection } from "~/components/comments/PostCommentsSection";
import { FrontendContentFilterHost } from "~/components/frontend/FrontendContentFilterHost";
import { TaxonomyBadges } from "~/components/taxonomies/TaxonomyBadges";
import { BackgroundRippleEffect } from "~/components/ui/background-ripple-effect";
import {
  isLexicalSerializedStateString,
  parseLexicalSerializedState,
} from "~/lib/editor/lexical";
import {
  loadAllowedPageTemplates,
  renderFrontendResolvedPost,
} from "~/lib/frontendRouting/renderFrontendSinglePost";
import {
  DEFAULT_PAGE_TEMPLATE_SLUG,
  getPageTemplate,
  PAGE_TEMPLATE_ACCESS_OPTION_KEY,
} from "~/lib/pageTemplates/registry";
import { findPostTypeBySlug } from "~/lib/plugins/frontend";
import {
  getFrontendProvidersForPostType,
  wrapWithFrontendProviders,
} from "~/lib/plugins/frontendProviders";
import {
  getFrontendSingleSlotsForSlug,
  getPluginFrontendFiltersForSlug,
  wrapWithPluginProviders,
} from "~/lib/plugins/helpers";
import {
  getCanonicalPostPath,
  getCanonicalPostSegments,
} from "~/lib/postTypes/routing";
import { getTenantOrganizationId } from "~/lib/tenant-fetcher";
import { cn } from "~/lib/utils";
import { PortalConvexProvider } from "~/providers/ConvexClientProvider";
import { PuckContentRenderer } from "../../../../components/puckeditor/PuckContentRenderer";

export { generateMetadata } from "./metadata";

interface FrontendFilterRegistration {
  filter: { location: string; id?: string };
}

const getFrontendSingleSlotsForSlugTyped =
  getFrontendSingleSlotsForSlug as unknown as (
    postTypeSlug: string,
  ) => PluginFrontendSingleSlotRegistration[];

const getPluginFrontendFiltersForSlugTyped =
  getPluginFrontendFiltersForSlug as unknown as (
    postTypeSlug: string,
  ) => FrontendFilterRegistration[];

type PluginMatch = ReturnType<typeof findPostTypeBySlug>;

interface PageProps {
  params: Promise<{ segments?: string[] }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function FrontendCatchAllPage(props: PageProps) {
  const resolvedParams = await props.params;
  const segments = normalizeSegments(resolvedParams?.segments ?? []);
  const resolvedSearchParams = props.searchParams
    ? await props.searchParams
    : undefined;
  const tenant = await getActiveTenantFromHeaders();
  const organizationId = getTenantOrganizationId(tenant);
  const apiAny = api as any;
  const fetchQueryAny = fetchQuery as any;

  const pluginOptions =
    ((await fetchQueryAny(apiAny.core.options.getByType, {
      type: "site",
      ...(organizationId ? { orgId: organizationId } : {}),
    })) as Doc<"options">[]) ?? [];

  const routeOverride = await resolveFrontendRouteOverride({
    segments,
    searchParams: resolvedSearchParams,
    organizationId: (organizationId ? (organizationId as any) : null) as any,
    pluginOptions,
    fetchQuery,
    api,
  });
  if (routeOverride) {
    return routeOverride;
  }

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
    const resolvedCustomArchive = await resolveFrontendArchive({
      postType: archiveContext.postType,
      organizationId: organizationId ?? null,
      fetchQuery,
      getAllPostsCore: api.core.posts.queries.getAllPosts,
      getAllPostsLms: api.plugins.lms.posts.queries.getAllPosts,
      listEntities: api.plugins.entity.queries.listEntities,
    });

    const posts = resolvedCustomArchive.posts ?? [];
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

  const resolvedTaxonomyArchive = await resolveFrontendTaxonomyArchive({
    segments,
    searchParams: resolvedSearchParams,
    organizationId: organizationId ?? null,
    fetchQuery,
    getOption: api.core.options.get,
    getTermBySlug: api.core.taxonomies.queries.getTermBySlug,
    getTaxonomyBySlug: api.core.taxonomies.queries.getTaxonomyBySlug,
    listObjectsByTerm: api.core.taxonomies.queries.listObjectsByTerm,
    listAssignmentsByTerm: api.core.taxonomies.queries.listAssignmentsByTerm,
    getPostTypeBySlug: api.core.postTypes.queries.getBySlug,
    getAllPostsCore: api.core.posts.queries.getAllPosts,
    getAllPostsLms: api.plugins.lms.posts.queries.getAllPosts,
    listEntities: api.plugins.entity.queries.listEntities,
  });
  if (resolvedTaxonomyArchive === "not_found") {
    notFound();
  }
  if (resolvedTaxonomyArchive) {
    if (resolvedTaxonomyArchive.kind === "single") {
      return (
        <TaxonomyArchive
          label={resolvedTaxonomyArchive.label}
          termName={resolvedTaxonomyArchive.termName}
          termSlug={resolvedTaxonomyArchive.termSlug}
          description={resolvedTaxonomyArchive.description}
          postType={resolvedTaxonomyArchive.postType}
          posts={resolvedTaxonomyArchive.posts}
        />
      );
    }
    return (
      <TaxonomyArchiveGrouped
        label={resolvedTaxonomyArchive.label}
        termName={resolvedTaxonomyArchive.termName}
        termSlug={resolvedTaxonomyArchive.termSlug}
        description={resolvedTaxonomyArchive.description}
        sections={resolvedTaxonomyArchive.sections}
      />
    );
  }

  const slug = deriveSlugFromSegments(segments);

  if (!slug) {
    notFound();
  }

  const resolved = await resolveFrontendPostForRequest({
    segments,
    slug,
    organizationId: organizationId ?? null,
    fetchQuery: adaptFetchQuery(fetchQuery),
    getPostTypeBySingleSlugKey: api.core.postTypes.queries.getBySingleSlugKey,
    readEntity: api.plugins.entity.queries.readEntity,
    listEntities: api.plugins.entity.queries.listEntities,
    getCorePostBySlug: api.core.posts.queries.getPostBySlug,
    getCorePostById: api.core.posts.queries.getPostById,
  });

  const post = resolved?.post ?? null;
  if (!post) notFound();

  let postType: PostTypeDoc | null = null;
  let postFields: Doc<"postTypeFields">[] = [];
  if (post.postTypeSlug) {
    postType =
      (await fetchQueryAny(apiAny.core.postTypes.queries.getBySlug, {
        slug: post.postTypeSlug,
        ...(organizationId ? { organizationId } : {}),
      })) ?? null;
    const fieldResult: Doc<"postTypeFields">[] | null = await fetchQuery(
      apiAny.core.postTypes.queries.fieldsBySlug,
      {
        slug: post.postTypeSlug,
        includeSystem: true,
        ...(organizationId ? { organizationId } : {}),
      },
    );
    postFields = fieldResult ?? [];
  }

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
  const postMetaMap = buildPostMetaMap(postMeta as unknown as PostMetaDoc[]);
  const postMetaObject = Object.fromEntries(postMetaMap.entries()) as Record<
    string,
    PostMetaValue
  >;

  const puckMetaEntry = postMeta.find((meta) => meta.key === "puck_data");
  const puckData = parsePuckData(
    typeof puckMetaEntry?.value === "string" ? puckMetaEntry.value : null,
  );

  const allowedPageTemplates =
    post.postTypeSlug === "pages"
      ? await loadAllowedPageTemplates(organizationId)
      : undefined;

  const pluginMatch: PluginMatch = post.postTypeSlug
    ? findPostTypeBySlug(post.postTypeSlug)
    : null;
  return await renderFrontendResolvedPost({
    post,
    postType,
    postFields,
    postMeta: postMeta as unknown as Doc<"postsMeta">[],
    postMetaObject,
    postMetaMap,
    puckData,
    pluginMatch,
    organizationId: organizationId ?? null,
    allowedPageTemplates,
    segments,
    enforceCanonicalRedirect: true,
  });
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
    const wrapped = wrapWithPluginProviders(element, registration.pluginId, {
      routeKind: "frontend",
      organizationId: organizationId ?? null,
      postTypeSlug: post.postTypeSlug ?? "",
      post,
      postMeta,
    });
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
  layout?: {
    showHeader?: boolean;
    showSidebar?: boolean;
    container?: "default" | "wide" | "full";
  };
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
  layout,
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

  const showHeader = layout?.showHeader ?? true;
  const showSidebar = layout?.showSidebar ?? true;

  const hasSidebar =
    showSidebar &&
    (pluginSlots.sidebarTop.length > 0 || pluginSlots.sidebarBottom.length > 0);

  const containerClassName =
    layout?.container === "full"
      ? "w-full"
      : layout?.container === "wide"
        ? "relative mx-auto w-full max-w-7xl space-y-6 overflow-hidden py-10"
        : "relative container mx-auto max-w-6xl space-y-6 overflow-hidden py-10";

  return (
    <main className="relative">
      {layout?.container !== "full" && (
        <BackgroundRippleEffect
          interactive={true}
          className="z-10 opacity-80"
        />
      )}
      <div className={containerClassName}>
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
            {showHeader && (
              <header className="space-y-3">
                <p className="text-muted-foreground text-sm tracking-wide uppercase">
                  {contextLabel}
                </p>
                <h1 className="text-4xl font-bold">{post.title}</h1>
                {post.excerpt && (
                  <p className="text-muted-foreground text-lg">
                    {post.excerpt}
                  </p>
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
            )}
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
): Promise<{ postType: PostTypeDoc } | null> {
  if (segments.length === 0) {
    return null;
  }
  const path = segments.join("/");

  const match: PostTypeDoc | null = await fetchQuery(
    api.core.postTypes.queries.getByArchiveSlugKey,
    {
      archiveSlugKey: path,
      ...(organizationId ? { organizationId } : {}),
    },
  );

  if (!match) return null;
  if (!match.rewrite?.hasArchive) return null;
  return { postType: match };
}

const trimSlashes = (value: string) => value.replace(/^\/+|\/+$/g, "");

const PERMALINK_OPTION_KEY = "permalink_settings";

function normalizeBaseSegment(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimSlashes(trimmed).toLowerCase();
}

async function loadPermalinkSettings(
  organizationId?: Doc<"organizations">["_id"],
): Promise<{ categoryBase?: string; tagBase?: string }> {
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
  sections: { postType: PostTypeDoc; posts: Doc<"posts">[] }[];
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
