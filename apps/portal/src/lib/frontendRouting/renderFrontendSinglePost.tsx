import type { Doc, Id } from "@/convex/_generated/dataModel";
import type { Data as PuckData } from "@measured/puck";
import type { FrontendFilterContext } from "launchthat-plugin-core/frontendFilters";
import type { ReactNode } from "react";
import { Fragment } from "react";
import { redirect } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { fetchQuery } from "convex/nextjs";

import { BackgroundRippleEffect } from "~/components/ui/background-ripple-effect";
import {
  DEFAULT_PAGE_TEMPLATE_SLUG,
  getPageTemplate,
  PAGE_TEMPLATE_ACCESS_OPTION_KEY,
} from "~/lib/pageTemplates/registry";
import type { findPostTypeBySlug } from "~/lib/plugins/frontend";
import { getFrontendProvidersForPostType } from "~/lib/plugins/frontendProviders";
import {
  getFrontendSingleSlotsForSlug,
  getPluginFrontendFiltersForSlug,
  wrapWithPluginProviders,
} from "~/lib/plugins/helpers";
import {
  getCanonicalPostSegments,
  getCanonicalPostPath,
} from "~/lib/postTypes/routing";
import { cn } from "~/lib/utils";
import { PortalConvexProvider } from "~/providers/ConvexClientProvider";
import { wrapWithFrontendProviders } from "~/lib/plugins/frontendProviders";
import { FrontendContentFilterHost } from "~/components/frontend/FrontendContentFilterHost";
import { TaxonomyBadges } from "~/components/taxonomies/TaxonomyBadges";
import { PostCommentsSection } from "~/components/comments/PostCommentsSection";
import { EditorViewer } from "~/components/blocks/editor-x/viewer";
import type {
  parseLexicalSerializedState as parseLexicalSerializedStateInternal} from "~/lib/editor/lexical";
import {
  isLexicalSerializedStateString,
  parseLexicalSerializedState
} from "~/lib/editor/lexical";
import { PuckContentRenderer } from "~/components/puckeditor/PuckContentRenderer";

import type { PluginFrontendSingleSlotRegistration } from "~/lib/plugins/helpers";

type PostTypeDoc = Doc<"postTypes">;
type PostFieldDoc = Doc<"postTypeFields">;
type PostMetaDoc = Doc<"postsMeta">;
type PostMetaValue = string | number | boolean | null | undefined;

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

export interface FrontendResolvedPostInput {
  post: Doc<"posts">;
  postType: PostTypeDoc | null;
  postFields: PostFieldDoc[];
  postMeta: PostMetaDoc[];
  postMetaObject: Record<string, PostMetaValue>;
  postMetaMap: Map<string, PostMetaValue>;
  puckData: PuckData | null;
  pluginMatch: PluginMatch;
  organizationId?: Id<"organizations"> | null;
  allowedPageTemplates: string[] | undefined;
  segments: string[];
  enforceCanonicalRedirect: boolean;
}

export async function renderFrontendResolvedPost(
  input: FrontendResolvedPostInput,
): Promise<ReactNode> {
  const {
    post,
    postType,
    postFields,
    postMeta,
    postMetaObject,
    postMetaMap,
    puckData,
    pluginMatch,
    organizationId,
    allowedPageTemplates,
    segments,
    enforceCanonicalRedirect,
  } = input;

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

  if (enforceCanonicalRedirect && !shouldSkipCanonicalRedirect && customCanonicalPath) {
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
  } else if (enforceCanonicalRedirect && !shouldSkipCanonicalRedirect) {
    const postTypeSingleSlug = trimSlashes(postType?.rewrite?.singleSlug ?? "");
    const pluginSingleSlug = trimSlashes(
      pluginMatch?.postType.rewrite?.singleSlug ?? "",
    );
    const canonicalSegments =
      postTypeSingleSlug.length > 0
        ? getCanonicalPostSegments(post, postType)
        : pluginSingleSlug.length > 0
          ? [pluginSingleSlug, trimSlashes(post.slug ?? post._id)]
          : getCanonicalPostSegments(post, postType);
    if (canonicalSegments.length > 0) {
      const canonicalPath = canonicalSegments.join("/");
      if (canonicalPath !== requestedPath) {
        redirect(`/${canonicalPath}`);
      }
    }
  }

  const providerCtx = {
    routeKind: "frontend" as const,
    pluginId: pluginMatch?.plugin.id,
    organizationId: organizationId ?? null,
    postTypeSlug: post.postTypeSlug ?? null,
    post,
    postMeta: postMetaObject,
  };

  const wrapWithFrontendProviderSpecsIfNeeded = (
    node: ReactNode,
    providerIds?: string[],
  ) => {
    if (!providerIds || providerIds.length === 0) {
      return node;
    }
    return (
      <PortalConvexProvider>
        {wrapWithFrontendProviders(node, providerIds, providerCtx)}
      </PortalConvexProvider>
    );
  };

  const configuredPostTypeTemplateSlug =
    postType &&
    typeof (postType as { pageTemplateSlug?: unknown }).pageTemplateSlug === "string"
      ? ((postType as { pageTemplateSlug: string }).pageTemplateSlug ?? undefined)
      : undefined;

  const perPostTemplateSlug =
    (postMetaMap.get("page_template") as string | undefined) ?? undefined;

  let effectivePageTemplateSlug =
    perPostTemplateSlug ??
    configuredPostTypeTemplateSlug ??
    DEFAULT_PAGE_TEMPLATE_SLUG;

  const allowedSet =
    allowedPageTemplates && allowedPageTemplates.length > 0
      ? new Set<string>([...allowedPageTemplates, DEFAULT_PAGE_TEMPLATE_SLUG])
      : null;

  if (allowedSet && !allowedSet.has(effectivePageTemplateSlug)) {
    effectivePageTemplateSlug = DEFAULT_PAGE_TEMPLATE_SLUG;
  }

  const resolvedPageTemplate = getPageTemplate(
    effectivePageTemplateSlug,
    organizationId ?? undefined,
  );

  if (
    resolvedPageTemplate &&
    resolvedPageTemplate.slug !== DEFAULT_PAGE_TEMPLATE_SLUG &&
    resolvedPageTemplate.render
  ) {
    const rendered = resolvedPageTemplate.render({
      post,
      postType,
      meta: postMetaObject,
      organizationId,
    });

    if (rendered !== null) {
      const providerIds = getFrontendProvidersForPostType(post.postTypeSlug);
      return wrapWithFrontendProviderSpecsIfNeeded(rendered, providerIds);
    }
  }

  const pluginSingle = pluginMatch?.postType.frontend?.single;
  if (pluginMatch && pluginSingle?.render) {
    const rendered = pluginSingle.render({
      post,
      postType: pluginMatch.postType,
    });
    return wrapWithFrontendProviderSpecsIfNeeded(
      rendered,
      pluginMatch.postType.frontend?.providers,
    );
  }

  const frontendSlotRegistrations: PluginFrontendSingleSlotRegistration[] =
    post.postTypeSlug
      ? getFrontendSingleSlotsForSlugTyped(post.postTypeSlug)
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
    organizationId: organizationId ?? null,
    postMeta: postMetaObject,
  });

  const frontendFilterRegistrations: FrontendFilterRegistration[] =
    post.postTypeSlug && pluginMatch
      ? getPluginFrontendFiltersForSlugTyped(post.postTypeSlug)
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

  const permalinkSettings = await loadPermalinkSettings(organizationId ?? undefined);
  const categoryBase =
    normalizeBaseSegment(permalinkSettings.categoryBase) ?? "categories";
  const tagBase = normalizeBaseSegment(permalinkSettings.tagBase) ?? "tags";

  const providerIds = getFrontendProvidersForPostType(post.postTypeSlug);
  return wrapWithFrontendProviderSpecsIfNeeded(
    <PostDetail
      post={post}
      postType={postType}
      fields={postFields}
      postMeta={postMeta}
      puckData={puckData}
      pluginSlots={pluginSlotNodes}
      contentFilterIds={contentFilterIds}
      postMetaObject={postMetaObject}
      categoryBase={categoryBase}
      tagBase={tagBase}
      layout={resolvedPageTemplate?.layout}
    />,
    providerIds,
  );
}

export async function loadAllowedPageTemplates(
  organizationId?: Id<"organizations"> | null,
): Promise<string[] | undefined> {
  const option = await fetchQuery(api.core.options.get, {
    metaKey: PAGE_TEMPLATE_ACCESS_OPTION_KEY,
    type: "site",
    ...(organizationId ? { orgId: organizationId } : {}),
  } as const);
  return extractAllowedPageTemplates(option?.metaValue);
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

function normalizePath(path: string): string {
  return path
    .split("/")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0)
    .join("/");
}

function trimSlashes(value: string): string {
  return value.replace(/^\/+/, "").replace(/\/+$/, "");
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

function resolveDisabledFrontendSlotIds(postType: Doc<"postTypes"> | null): string[] {
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
    .frontendVisibility;
  if (!raw || typeof raw !== "object") {
    return null;
  }
  return raw as {
    showCustomFields?: boolean;
    showComments?: boolean;
    disabledSingleSlotIds?: unknown;
  };
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

  return sorted.map((field) => {
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

type LexicalSerializedState = ReturnType<typeof parseLexicalSerializedStateInternal>;

const hasRenderableLexicalContent = (
  state: LexicalSerializedState,
): state is Exclude<LexicalSerializedState, null> => {
  if (!state) return false;
  const root = (state as { root?: unknown }).root;
  if (!root || typeof root !== "object") return false;
  const children = (root as { children?: unknown }).children;
  if (!Array.isArray(children) || children.length === 0) return false;

  const hasAnyRenderableNode = (node: unknown): boolean => {
    if (!node || typeof node !== "object") return false;
    const type = (node as { type?: unknown }).type;
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
      {details.map((item) => (
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
  const hasPuckContent = Boolean(puckData?.content.length);
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
        <BackgroundRippleEffect interactive={true} className="z-10 opacity-80" />
      )}
      <div className={containerClassName}>
        {pluginSlots.beforeContent.length > 0 && (
          <div className="z-20 space-y-4">{pluginSlots.beforeContent}</div>
        )}
        <div
          className={cn(
            "relative z-20 gap-8",
            hasSidebar ? "grid lg:grid-cols-[minmax(0,1fr)_320px]" : "space-y-6",
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
                  {customFieldEntries.map((entry) => (
                    <div key={entry.key} className="space-y-1">
                      <dt className="text-muted-foreground text-sm font-medium">
                        {entry.label}
                      </dt>
                      <dd className="text-foreground text-base">{entry.value}</dd>
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

function normalizeBaseSegment(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().replace(/^\/+/, "").replace(/\/+$/, "");
  return trimmed.length > 0 ? trimmed : null;
}

async function loadPermalinkSettings(organizationId?: Id<"organizations">) {
  const option = await fetchQuery(api.core.options.get, {
    metaKey: "permalinks",
    type: "site",
    ...(organizationId ? { orgId: organizationId } : {}),
  } as const);

  const value =
    option?.metaValue && typeof option.metaValue === "object"
      ? (option.metaValue as Record<string, unknown>)
      : {};

  return {
    categoryBase: value.categoryBase,
    tagBase: value.tagBase,
  };
}

interface PermalinkTemplateContext {
  post: Doc<"posts">;
  postType: PostTypeDoc | null;
  meta: Map<string, PostMetaValue>;
}

function buildPathFromTemplate(
  template: string,
  ctx: PermalinkTemplateContext,
): string | null {
  if (!template) {
    return null;
  }
  const tokens = template.split("/").filter(Boolean);
  const segments = tokens
    .map((token) => token.trim())
    .filter(Boolean)
    .map((token) => {
      if (!token.startsWith("{") || !token.endsWith("}")) {
        return token;
      }
      const key = token.slice(1, -1).trim();
      switch (key) {
        case "slug":
          return ctx.post.slug ?? null;
        case "id":
          return ctx.post._id;
        default: {
          // Support templates that namespace meta keys (e.g. `{meta.courseSlug}`).
          const normalizedMetaKey = key.startsWith("meta.") ? key.slice(5) : key;
          const metaValue = ctx.meta.get(normalizedMetaKey);
          if (metaValue === null || metaValue === undefined || metaValue === "") {
            return null;
          }
          return String(metaValue);
        }
      }
    })
    .filter((segment): segment is string => typeof segment === "string" && segment.length > 0);
  return segments.length > 0 ? segments.join("/") : null;
}


