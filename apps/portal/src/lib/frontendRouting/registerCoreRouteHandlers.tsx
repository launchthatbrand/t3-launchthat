import type { Doc, Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { addFilter } from "@acme/admin-runtime/hooks";
import type { fetchQuery as convexFetchQuery } from "convex/nextjs";
import { Fragment } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import type {
  FrontendRouteHandler,
  FrontendRouteHandlerContext,
} from "./resolveFrontendRoute";
import { resolveFrontendArchive } from "./resolveFrontendArchive";
import { resolveFrontendPostForRequest } from "./resolveFrontendPostForRequest";
import { resolveFrontendTaxonomyArchive } from "./resolveFrontendTaxonomyArchive";

import { FrontendContentFilterHost } from "~/components/frontend/FrontendContentFilterHost";
import { BackgroundRippleEffect } from "~/components/ui/background-ripple-effect";
import { EditorViewer } from "~/components/blocks/editor-x/viewer";
import { PostCommentsSection } from "~/components/comments/PostCommentsSection";
import { TaxonomyBadges } from "~/components/taxonomies/TaxonomyBadges";
import { PuckContentRenderer } from "~/components/puckeditor/PuckContentRenderer";
import {
  isLexicalSerializedStateString,
  parseLexicalSerializedState,
} from "~/lib/editor/lexical";
import { renderFrontendResolvedPost } from "./renderFrontendSinglePost";
import { findPostTypeBySlug } from "~/lib/plugins/frontend";
import { getCanonicalPostPath } from "~/lib/postTypes/routing";
import { FRONTEND_ROUTE_HANDLERS_FILTER } from "~/lib/plugins/hookSlots";
import { cn } from "~/lib/utils";

type FetchQuery = typeof convexFetchQuery;

type PostTypeDoc = Doc<"postTypes">;
type PostFieldDoc = Doc<"postTypeFields">;
type PostMetaDoc = Doc<"postsMeta">;
type PostMetaValue = string | number | boolean | null | undefined;

const normalizeSegments = (segments: string[]) =>
  segments.map((s) => s.trim()).filter((s) => s.length > 0);

const deriveSlugFromSegments = (segments: string[]): string | null => {
  for (let i = segments.length - 1; i >= 0; i -= 1) {
    const segment = segments[i]?.trim();
    if (segment) return segment;
  }
  return null;
};

async function resolveArchiveContext(args: {
  segments: string[];
  organizationId?: Doc<"organizations">["_id"];
  fetchQuery: FetchQuery;
}): Promise<{ postType: PostTypeDoc } | null> {
  if (args.segments.length === 0) return null;
  const path = args.segments.join("/");

  const match: PostTypeDoc | null = await args.fetchQuery(
    api.core.postTypes.queries.getByArchiveSlugKey,
    {
      archiveSlugKey: path,
      ...(args.organizationId ? { organizationId: args.organizationId } : {}),
    },
  );

  if (!match) return null;
  if (!match.rewrite?.hasArchive) return null;
  return { postType: match };
}

function parsePuckData(value: unknown) {
  if (!value || typeof value !== "string") return null;
  try {
    const parsed = JSON.parse(value) as { content?: unknown };
    if (Array.isArray(parsed.content)) return parsed as any;
  } catch {
    // ignore
  }
  return null;
}

async function loadTemplateContent(args: {
  templateType: "single" | "archive";
  postTypeSlug: string | null;
  organizationId: Doc<"organizations">["_id"] | undefined;
  fetchQuery: FetchQuery;
}) {
  const template = await args.fetchQuery(api.core.posts.queries.getTemplateForPostType, {
    templateCategory: args.templateType,
    postTypeSlug: args.postTypeSlug ?? undefined,
    ...(args.organizationId ? { organizationId: args.organizationId } : {}),
  });
  if (!template) return null;
  const source = (template as any).puckData ?? (template as any).content ?? null;
  return parsePuckData(source);
}

function buildPostMetaMap(meta: PostMetaDoc[]): Map<string, PostMetaValue> {
  const map = new Map<string, PostMetaValue>();
  meta.forEach((entry) => map.set(entry.key, entry.value ?? null));
  return map;
}

const hasRenderableLexicalContent = (
  state: ReturnType<typeof parseLexicalSerializedState>,
): state is Exclude<ReturnType<typeof parseLexicalSerializedState>, null> => {
  if (!state) return false;
  const root = (state as any).root;
  const children = root?.children;
  if (!Array.isArray(children) || children.length === 0) return false;
  return true;
};

function FilteredContent(props: {
  lexicalContent: ReturnType<typeof parseLexicalSerializedState>;
  rawContent: string | null;
  filterIds: string[];
  filterContext: any;
}) {
  let contentNode: any;
  if (hasRenderableLexicalContent(props.lexicalContent)) {
    contentNode = (
      <EditorViewer
        editorSerializedState={props.lexicalContent as any}
        className="prose max-w-none"
      />
    );
  } else if (props.rawContent) {
    contentNode = (
      <div
        className="prose max-w-none"
        dangerouslySetInnerHTML={{ __html: props.rawContent }}
      />
    );
  } else {
    contentNode = (
      <p className="text-muted-foreground flex min-h-32 items-center justify-center rounded-md border border-dashed border-gray-300 p-4 text-center text-sm">
        No content for this post
      </p>
    );
  }

  if (!props.filterIds.length) return contentNode;

  return (
    <FrontendContentFilterHost filterIds={props.filterIds} context={props.filterContext}>
      {contentNode}
    </FrontendContentFilterHost>
  );
}

function PostArchive(props: { postType: PostTypeDoc; posts: Doc<"posts">[] }) {
  const description =
    props.postType.description ??
    `Browse published ${props.postType.name.toLowerCase()} entries.`;
  return (
    <main className="container mx-auto max-w-5xl space-y-6 py-10">
      <header className="space-y-2 text-center">
        <p className="text-muted-foreground text-sm tracking-wide uppercase">
          {props.postType.name}
        </p>
        <h1 className="text-4xl font-bold">{props.postType.name} Archive</h1>
        <p className="text-muted-foreground">{description}</p>
      </header>
      {props.posts.length === 0 ? (
        <div className="text-muted-foreground rounded-lg border p-10 text-center">
          No {props.postType.name.toLowerCase()} have been published yet.
        </div>
      ) : (
        <section className="grid gap-6 md:grid-cols-2">
          {props.posts.map((post) => {
            const url = getCanonicalPostPath(post, props.postType, true);
            return (
              <article
                key={post._id}
                className="bg-card rounded-lg border p-6 shadow-sm transition hover:shadow-md"
              >
                <Link href={url} className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-sm font-medium">
                      {props.postType.name}
                    </p>
                    <h2 className="text-foreground text-2xl font-semibold">
                      {post.title || "Untitled"}
                    </h2>
                  </div>
                  {post.excerpt ? (
                    <p className="text-muted-foreground text-sm">{post.excerpt}</p>
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

function TaxonomyArchive(props: any) {
  return (
    <main className="container mx-auto max-w-5xl space-y-6 py-10">
      <header className="space-y-2 text-center">
        <p className="text-muted-foreground text-sm tracking-wide uppercase">
          {props.label}
        </p>
        <h1 className="text-4xl font-bold">
          {props.termName}{" "}
          <span className="text-muted-foreground">({props.termSlug})</span>
        </h1>
        <p className="text-muted-foreground">{props.description}</p>
      </header>
      {props.posts.length === 0 ? (
        <div className="text-muted-foreground rounded-lg border p-10 text-center">
          No {props.postType.name.toLowerCase()} have been published for this{" "}
          {props.label.toLowerCase()} yet.
        </div>
      ) : (
        <section className="grid gap-6 md:grid-cols-2">
          {props.posts.map((post: any) => {
            const url = getCanonicalPostPath(post, props.postType, true);
            return (
              <article
                key={post._id}
                className="bg-card rounded-lg border p-6 shadow-sm transition hover:shadow-md"
              >
                <Link href={url} className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-muted-foreground text-sm font-medium">
                      {props.postType.name}
                    </p>
                    <h2 className="text-foreground text-2xl font-semibold">
                      {post.title || "Untitled"}
                    </h2>
                  </div>
                  {post.excerpt ? (
                    <p className="text-muted-foreground text-sm">{post.excerpt}</p>
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

function TaxonomyArchiveGrouped(props: any) {
  const sortedSections = [...props.sections].sort((a, b) =>
    a.postType.name.localeCompare(b.postType.name),
  );
  return (
    <main className="relative">
      <BackgroundRippleEffect interactive={true} className="z-10 opacity-80" />
      <div className="relative container mx-auto max-w-6xl space-y-10 overflow-hidden py-10">
        <header className="space-y-3">
          <p className="text-muted-foreground text-sm tracking-wide uppercase">
            {props.label}
          </p>
          <h1 className="text-4xl font-bold">
            {props.termName}{" "}
            <span className="text-muted-foreground">({props.termSlug})</span>
          </h1>
          <p className="text-muted-foreground text-lg">{props.description}</p>
        </header>
        {sortedSections.length === 0 ? (
          <div className="text-muted-foreground rounded-lg border p-10 text-center">
            No posts have been published for this {props.label.toLowerCase()} yet.
          </div>
        ) : (
          <div className="space-y-12">
            {sortedSections.map((section: any) => (
              <section key={section.postType.slug} className="space-y-4">
                <div className="border-b pb-2">
                  <h2 className="text-2xl font-semibold">{section.postType.name}</h2>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  {section.posts.map((post: any) => {
                    const url = getCanonicalPostPath(post, section.postType, true);
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
                            <p className="text-muted-foreground text-sm">{post.excerpt}</p>
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

export function registerCoreRouteHandlers(): void {
  // NOTE: In dev/HMR, module state (hook registry) can be reset while `globalThis`
  // persists. Using a versioned guard ensures we can safely re-register once after
  // structural changes without getting stuck in a "registered but no hooks" state.
  const already = (globalThis as any).__portal_core_route_handlers_registered_v2;
  if (already) return;
  (globalThis as any).__portal_core_route_handlers_registered_v2 = true;

  addFilter(
    FRONTEND_ROUTE_HANDLERS_FILTER,
    (value: unknown, _ctx: unknown) => {
      const handlers = Array.isArray(value) ? (value as FrontendRouteHandler[]) : [];

      return [
        ...handlers,
        {
          id: "core:archive",
          priority: 10,
          resolve: async (ctx: FrontendRouteHandlerContext) => {
            const segments = normalizeSegments(ctx.segments);
            const archiveContext = await resolveArchiveContext({
              segments,
              organizationId: (ctx.organizationId ?? undefined) as any,
              fetchQuery: ctx.fetchQuery as any,
            });
            if (!archiveContext) return null;

            const archiveTemplateData = await loadTemplateContent({
              templateType: "archive",
              postTypeSlug: archiveContext.postType.slug,
              organizationId: (ctx.organizationId ?? undefined) as any,
              fetchQuery: ctx.fetchQuery as any,
            });
            if (archiveTemplateData) {
              return (
                <main className="bg-background min-h-screen">
                  <PuckContentRenderer data={archiveTemplateData as any} />
                </main>
              );
            }

            const resolvedCustomArchive = await resolveFrontendArchive({
              postType: archiveContext.postType,
              organizationId: (ctx.organizationId ?? null) as any,
              fetchQuery: ctx.fetchQuery as any,
              getAllPostsCore: (api as any).core.posts.queries.getAllPosts,
              getAllPostsLms: (api as any).plugins.lms.posts.queries.getAllPosts,
              listEntities: (api as any).plugins.entity.queries.listEntities,
            });

            const posts = resolvedCustomArchive.posts ?? [];
            const pluginMatch = findPostTypeBySlug(archiveContext.postType.slug);
            const pluginArchive = pluginMatch?.postType.frontend?.archive;
            if (pluginMatch && pluginArchive?.render) {
              return pluginArchive.render({ posts, postType: pluginMatch.postType });
            }

            return <PostArchive postType={archiveContext.postType} posts={posts} />;
          },
        },
        {
          id: "core:taxonomy",
          priority: 10,
          resolve: async (ctx: FrontendRouteHandlerContext) => {
            const segments = normalizeSegments(ctx.segments);
            const resolved = await resolveFrontendTaxonomyArchive({
              segments,
              searchParams: ctx.searchParams,
              organizationId: (ctx.organizationId ?? null) as any,
              fetchQuery: ctx.fetchQuery as any,
              getOption: (api as any).core.options.get,
              getTermBySlug: (api as any).core.taxonomies.queries.getTermBySlug,
              getTaxonomyBySlug: (api as any).core.taxonomies.queries.getTaxonomyBySlug,
              listObjectsByTerm: (api as any).core.taxonomies.queries.listObjectsByTerm,
              listAssignmentsByTerm: (api as any).core.taxonomies.queries.listAssignmentsByTerm,
              getPostTypeBySlug: (api as any).core.postTypes.queries.getBySlug,
              getAllPostsCore: (api as any).core.posts.queries.getAllPosts,
              getAllPostsLms: (api as any).plugins.lms.posts.queries.getAllPosts,
              listEntities: (api as any).plugins.entity.queries.listEntities,
            });

            if (resolved === "not_found") return null;
            if (!resolved) return null;

            if (resolved.kind === "single") {
              return (
                <TaxonomyArchive
                  label={resolved.label}
                  termName={resolved.termName}
                  termSlug={resolved.termSlug}
                  description={resolved.description}
                  postType={resolved.postType}
                  posts={resolved.posts}
                />
              );
            }

            return (
              <TaxonomyArchiveGrouped
                label={resolved.label}
                termName={resolved.termName}
                termSlug={resolved.termSlug}
                description={resolved.description}
                sections={resolved.sections}
              />
            );
          },
        },
        {
          id: "core:single",
          priority: 10,
          resolve: async (ctx: FrontendRouteHandlerContext) => {
            const segments = normalizeSegments(ctx.segments);
            const slug = deriveSlugFromSegments(segments);
            if (!slug) return null;

            const resolved = await resolveFrontendPostForRequest({
              segments,
              slug,
              organizationId: (ctx.organizationId ?? null) as any,
              searchParams: ctx.searchParams,
              fetchQuery: (await import("./fetchQueryAdapter")).adaptFetchQuery(
                ctx.fetchQuery as any,
              ) as any,
              getPostTypeBySingleSlugKey: (api as any).core.postTypes.queries.getBySingleSlugKey,
              readEntity: (api as any).plugins.entity.queries.readEntity,
              listEntities: (api as any).plugins.entity.queries.listEntities,
              api: api as any,
              getCorePostBySlug: (api as any).core.posts.queries.getPostBySlug,
              getCorePostById: (api as any).core.posts.queries.getPostById,
            });
            if (!resolved?.post) return null;

            const post = resolved.post;

            let postType: PostTypeDoc | null = null;
            let postFields: Doc<"postTypeFields">[] = [];
            if (post.postTypeSlug) {
              postType =
                (await (ctx.fetchQuery as any)((api as any).core.postTypes.queries.getBySlug, {
                  slug: post.postTypeSlug,
                  ...(ctx.organizationId ? { organizationId: ctx.organizationId } : {}),
                })) ?? null;
              postFields =
                ((await (ctx.fetchQuery as any)((api as any).core.postTypes.queries.fieldsBySlug, {
                  slug: post.postTypeSlug,
                  includeSystem: true,
                  ...(ctx.organizationId ? { organizationId: ctx.organizationId } : {}),
                })) as Doc<"postTypeFields">[]) ?? [];
            }

            const postMetaResult: unknown = await (ctx.fetchQuery as any)(
              (api as any).core.posts.postMeta.getPostMeta,
              {
                postId: post._id,
                ...(ctx.organizationId ? { organizationId: ctx.organizationId } : {}),
                postTypeSlug: post.postTypeSlug ?? undefined,
              },
            );
            const postMeta = (postMetaResult ?? []) as {
              key: string;
              value?: string | number | boolean | null;
            }[];
            const postMetaMap = buildPostMetaMap(postMeta as any);
            const postMetaObject = Object.fromEntries(postMetaMap.entries()) as Record<
              string,
              PostMetaValue
            >;

            const puckMetaEntry = postMeta.find((m) => m.key === "puck_data");
            const puckData = parsePuckData(
              typeof puckMetaEntry?.value === "string" ? puckMetaEntry.value : null,
            );

            // If a single-template exists, prefer it.
            const singleTemplateData = await loadTemplateContent({
              templateType: "single",
              postTypeSlug: post.postTypeSlug ?? null,
              organizationId: (ctx.organizationId ?? undefined) as any,
              fetchQuery: ctx.fetchQuery as any,
            });
            if (singleTemplateData) {
              return (
                <main className="bg-background min-h-screen">
                  <PuckContentRenderer data={singleTemplateData as any} />
                </main>
              );
            }

            const pluginMatch = post.postTypeSlug ? findPostTypeBySlug(post.postTypeSlug) : null;

            return await renderFrontendResolvedPost({
              post,
              postType,
              postFields,
              postMeta: postMeta as any,
              postMetaObject,
              postMetaMap,
              puckData,
              pluginMatch,
              organizationId: (ctx.organizationId ?? null) as any,
              allowedPageTemplates: undefined,
              segments,
              enforceCanonicalRedirect: true,
            } as any);
          },
        },
      ];
    },
    10,
    2,
  );
}

// Register on module import for server/runtime safety.
registerCoreRouteHandlers();


