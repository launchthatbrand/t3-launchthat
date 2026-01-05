/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-call,
  @typescript-eslint/no-unsafe-member-access,
  @typescript-eslint/no-unsafe-return,
  @typescript-eslint/no-unnecessary-condition,
  @typescript-eslint/no-unnecessary-type-assertion
*/

import type { Doc } from "@/convex/_generated/dataModel";
import type { fetchQuery as convexFetchQuery } from "convex/nextjs";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { addFilter, applyFilters } from "@acme/admin-runtime/hooks";

import type {
  FrontendRouteHandler,
  FrontendRouteHandlerContext,
} from "./resolveFrontendRoute";
import { AccessDeniedPage } from "~/components/access/AccessDeniedPage";
import { PuckContentRenderer } from "~/components/puckeditor/PuckContentRenderer";
import { BackgroundRippleEffect } from "~/components/ui/background-ripple-effect";
import { env } from "~/env";
import { parseContentAccessMetaValue } from "~/lib/access/contentAccessMeta";
import { evaluateContentAccess } from "~/lib/access/contentAccessRegistry";
import { findPostTypeBySlug } from "~/lib/plugins/frontend";
import {
  FRONTEND_ACCESS_DENIED_ACTIONS_FILTER,
  FRONTEND_ROUTE_HANDLERS_FILTER,
} from "~/lib/plugins/hookSlots";
import { ATTACHMENTS_META_KEY } from "~/lib/posts/metaKeys";
import { getCanonicalPostPath } from "~/lib/postTypes/routing";
import { renderFrontendResolvedPost } from "./renderFrontendSinglePost";
import { resolveFrontendArchive } from "./resolveFrontendArchive";
import { resolveFrontendPostForRequest } from "./resolveFrontendPostForRequest";
import { resolveFrontendTaxonomyArchive } from "./resolveFrontendTaxonomyArchive";

type FetchQuery = typeof convexFetchQuery;

type PostTypeDoc = Doc<"postTypes">;
type PostMetaDoc = Doc<"postsMeta">;
type PostMetaValue = string | number | boolean | null | undefined;

type LmsCourseAccessMode = "open" | "free" | "buy_now" | "recurring" | "closed";

interface LmsCourseAccessContext {
  courseId: string;
  courseSlug: string;
  accessMode: LmsCourseAccessMode;
  cascadeToSteps: boolean;
  buyNowUrl?: string | null;
  appliesToCurrentResource: boolean;
}

if (env.NODE_ENV !== "production") {
  const g = globalThis as unknown as {
    __portal_core_route_handlers_loaded_logged?: boolean;
  };
  if (!g.__portal_core_route_handlers_loaded_logged) {
    g.__portal_core_route_handlers_loaded_logged = true;
    console.log("[frontendRouting] core route handlers module loaded");
  }
}

const normalizeSegments = (segments: string[]) =>
  segments.map((s) => s.trim()).filter((s) => s.length > 0);

const resolveFirstImageFromAttachmentsMeta = (
  attachmentsMetaValue: PostMetaValue,
): string | null => {
  const raw =
    typeof attachmentsMetaValue === "string" ? attachmentsMetaValue.trim() : "";
  if (!raw) return null;

  interface AttachmentMetaEntry {
    mediaItemId?: string;
    url?: string;
    mimeType?: string;
    title?: string;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
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
          // Prefer a direct URL when present (often already a signed Convex storage URL),
          // so the browser can render without relying on the `/api/media/:id` indirection.
          if (/^https?:\/\//i.test(url)) return url;
          return `/api/media/${mediaItemId}`;
        }
        if (isConvexStorageUrl && entryTitle && !isLikelyNonImageTitle) {
          if (/^https?:\/\//i.test(url)) return url;
          return `/api/media/${mediaItemId}`;
        }
      }

      const url =
        typeof entry.url === "string" && entry.url.trim()
          ? entry.url.trim()
          : "";
      if (!url) continue;

      const looksLikeImageUrl =
        /\.(png|jpe?g|gif|webp|avif|svg)(\?|#|$)/i.test(url) ||
        url.includes("vimeocdn.com");
      if (looksLikeImageUrl) {
        return url;
      }
    }
  } catch {
    // ignore
  }
  return null;
};

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
  api: unknown;
}): Promise<{ postType: PostTypeDoc } | null> {
  if (args.segments.length === 0) return null;
  const path = args.segments.join("/");

  const match: PostTypeDoc | null = await args.fetchQuery(
    (args.api as any).core.postTypes.queries.getByArchiveSlugKey,
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
  api: unknown;
}) {
  const template = await args.fetchQuery(
    (args.api as any).core.posts.queries.getTemplateForPostType,
    {
      templateCategory: args.templateType,
      postTypeSlug: args.postTypeSlug ?? undefined,
      ...(args.organizationId ? { organizationId: args.organizationId } : {}),
    },
  );
  if (!template) return null;
  const source =
    (template as any).puckData ?? (template as any).content ?? null;
  return parsePuckData(source);
}

function buildPostMetaMap(meta: PostMetaDoc[]): Map<string, PostMetaValue> {
  const map = new Map<string, PostMetaValue>();
  meta.forEach((entry) => map.set(entry.key, entry.value ?? null));
  return map;
}

const getMetaString = (meta: Record<string, PostMetaValue>, key: string) => {
  const value = meta[key];
  if (typeof value === "string" && value.trim().length > 0) return value.trim();
  return null;
};

const getMetaBoolean = (
  meta: Record<string, PostMetaValue>,
  key: string,
): boolean | null => {
  const value = meta[key];
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    if (v === "true" || v === "1" || v === "yes") return true;
    if (v === "false" || v === "0" || v === "no") return false;
  }
  return null;
};

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
            /* eslint-disable @typescript-eslint/no-unsafe-argument */
            const url = getCanonicalPostPath(post, props.postType, true);
            /* eslint-enable @typescript-eslint/no-unsafe-argument */
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
                      {post.title ?? "Untitled"}
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
            No posts have been published for this {props.label.toLowerCase()}{" "}
            yet.
          </div>
        ) : (
          <div className="space-y-12">
            {sortedSections.map((section: any) => (
              <section key={section.postType.slug} className="space-y-4">
                <div className="border-b pb-2">
                  <h2 className="text-2xl font-semibold">
                    {section.postType.name}
                  </h2>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  {section.posts.map((post: any) => {
                    /* eslint-disable @typescript-eslint/no-unsafe-argument */
                    const url = getCanonicalPostPath(
                      post,
                      section.postType,
                      true,
                    );
                    /* eslint-enable @typescript-eslint/no-unsafe-argument */
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
                              {post.title ?? "Untitled"}
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

export function registerCoreRouteHandlers(): void {
  // Dev/HMR safety:
  // Next's module graph can be reloaded while hook registries reset. Avoid guarding on
  // `hasFilter()` (plugins may have registered this hook already), and instead just
  // register our filter whenever this module is evaluated.

  addFilter(
    FRONTEND_ROUTE_HANDLERS_FILTER,
    (value: unknown, _ctx: unknown) => {
      const handlers = Array.isArray(value)
        ? (value as FrontendRouteHandler[])
        : [];

      const next: FrontendRouteHandler[] = [...handlers];
      const hasId = (id: string) => next.some((h) => h?.id === id);
      const pushIfMissing = (h: FrontendRouteHandler) => {
        if (!hasId(h.id)) next.push(h);
      };

      pushIfMissing({
        id: "core:archive",
        priority: 10,
        resolve: async (ctx: FrontendRouteHandlerContext) => {
          const segments = normalizeSegments(ctx.segments);
          const archiveContext = await resolveArchiveContext({
            segments,
            organizationId: (ctx.organizationId ?? undefined) as any,
            fetchQuery: ctx.fetchQuery as any,
            api: ctx.api,
          });
          if (!archiveContext) return null;

          const archiveTemplateData = await loadTemplateContent({
            templateType: "archive",
            postTypeSlug: archiveContext.postType.slug,
            organizationId: (ctx.organizationId ?? undefined) as any,
            fetchQuery: ctx.fetchQuery as any,
            api: ctx.api,
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
            getAllPostsCore: (ctx.api as any).core.posts.queries.getAllPosts,
            getAllPostsLms: (ctx.api as any).plugins.lms.posts.queries
              .getAllPosts,
            listEntities: (ctx.api as any).plugins.entity.queries.listEntities,
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

          return (
            <PostArchive postType={archiveContext.postType} posts={posts} />
          );
        },
      });

      pushIfMissing({
        id: "core:taxonomy",
        priority: 10,
        resolve: async (ctx: FrontendRouteHandlerContext) => {
          const segments = normalizeSegments(ctx.segments);
          const resolved = await resolveFrontendTaxonomyArchive({
            segments,
            searchParams: ctx.searchParams,
            organizationId: (ctx.organizationId ?? null) as any,
            fetchQuery: ctx.fetchQuery as any,
            getOption: (ctx.api as any).core.options.get,
            getTermBySlug: (ctx.api as any).core.taxonomies.queries
              .getTermBySlug,
            getTaxonomyBySlug: (ctx.api as any).core.taxonomies.queries
              .getTaxonomyBySlug,
            listObjectsByTerm: (ctx.api as any).core.taxonomies.queries
              .listObjectsByTerm,
            listAssignmentsByTerm: (ctx.api as any).core.taxonomies.queries
              .listAssignmentsByTerm,
            getPostTypeBySlug: (ctx.api as any).core.postTypes.queries
              .getBySlug,
            getAllPostsCore: (ctx.api as any).core.posts.queries.getAllPosts,
            getAllPostsLms: (ctx.api as any).plugins.lms.posts.queries
              .getAllPosts,
            listEntities: (ctx.api as any).plugins.entity.queries.listEntities,
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
      });

      pushIfMissing({
        id: "core:single",
        priority: 10,
        resolve: async (ctx: FrontendRouteHandlerContext) => {
          const segments = normalizeSegments(ctx.segments);
          const slug = deriveSlugFromSegments(segments);
          if (!slug) return null;

          const debugRouting = (() => {
            const raw = ctx.searchParams?.debugRouting;
            const value = Array.isArray(raw) ? raw[0] : raw;
            return value === "1" || value === "true";
          })();

          const resolved = await resolveFrontendPostForRequest({
            segments,
            slug,
            organizationId: (ctx.organizationId ?? null) as any,
            searchParams: ctx.searchParams,
            fetchQuery: (await import("./fetchQueryAdapter")).adaptFetchQuery(
              // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
              ctx.fetchQuery as any,
            ) as any,
            getPostTypeBySingleSlugKey: (ctx.api as any).core.postTypes.queries
              .getBySingleSlugKey,
            readEntity: (ctx.api as any).plugins.entity.queries.readEntity,
            listEntities: (ctx.api as any).plugins.entity.queries.listEntities,
            api: ctx.api as any,
            getCorePostBySlug: (ctx.api as any).core.posts.queries
              .getPostBySlug,
            getCorePostById: (ctx.api as any).core.posts.queries.getPostById,
          });
          if (!resolved?.post) return null;

          const post = resolved.post;

          let postType: PostTypeDoc | null = null;
          let postFields: Doc<"postTypeFields">[] = [];
          if (post.postTypeSlug) {
            postType =
              (await (ctx.fetchQuery as any)(
                (ctx.api as any).core.postTypes.queries.getBySlug,
                {
                  slug: post.postTypeSlug,
                  ...(ctx.organizationId
                    ? { organizationId: ctx.organizationId }
                    : {}),
                },
              )) ?? null;
            postFields =
              ((await (ctx.fetchQuery as any)(
                (ctx.api as any).core.postTypes.queries.fieldsBySlug,
                {
                  slug: post.postTypeSlug,
                  includeSystem: true,
                  ...(ctx.organizationId
                    ? { organizationId: ctx.organizationId }
                    : {}),
                },
              )) as Doc<"postTypeFields">[]) ?? [];
          }

          const postMetaResult: unknown = await (ctx.fetchQuery as any)(
            (ctx.api as any).core.posts.postMeta.getPostMeta,
            {
              postId: post._id,
              ...(ctx.organizationId
                ? { organizationId: ctx.organizationId }
                : {}),
              postTypeSlug: post.postTypeSlug ?? undefined,
            },
          );
          const postMeta = (postMetaResult ?? []) as {
            key: string;
            value?: string | number | boolean | null;
          }[];
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          const postMetaMap = buildPostMetaMap(postMeta as any);
          const postMetaObject = Object.fromEntries(
            postMetaMap.entries(),
          ) as Record<string, PostMetaValue>;

          // ---- Frontend access control (post-type routes) ----
          // Evaluate access before rendering the resolved post.
          // Note: For bot UAs (e.g. facebookexternalhit), middleware bypasses Clerk.
          // In that mode `auth()` can throw; treat it as logged-out so we still render public HTML.
          let clerkUserId: string | null = null;
          try {
            const authState = await auth();
            clerkUserId = authState?.userId ?? null;
          } catch {
            clerkUserId = null;
          }
          const viewer = clerkUserId
            ? await (ctx.fetchQuery as any)(
                (ctx.api as any).core.users.queries.getUserByClerkId,
                {
                  clerkId: clerkUserId,
                },
              )
            : null;

          const organizationId = (ctx.organizationId ?? null) as any;
          const siteOptions = (await (ctx.fetchQuery as any)(
            (ctx.api as any).core.options.getByType,
            {
              type: "site",
              ...(organizationId ? { orgId: organizationId } : {}),
            },
          )) as Doc<"options">[];
          const convexUserId = viewer?._id ?? null;
          const isAuthenticated = Boolean(convexUserId);

          // LMS global settings (stored under core options).
          const lmsSettingsValue = (siteOptions ?? []).find(
            (o) => o.metaKey === "plugin.lms.settings",
          )?.metaValue;
          const lmsAdminBypassCourseAccess =
            typeof (lmsSettingsValue as any)?.adminBypassCourseAccess ===
            "boolean"
              ? Boolean((lmsSettingsValue as any)?.adminBypassCourseAccess)
              : false;

          // Content access rules: stored as a single JSON blob in postmeta.
          const contentRules = parseContentAccessMetaValue(
            (postMetaObject as any)?.content_access,
          );
          if (debugRouting) {
            console.log("[frontendRouting] content access: loaded rules", {
              postId: String(post._id),
              hasRules: Boolean(contentRules),
              contentRules,
            });
          }

          // Resolve user marketing tags (slugs + ids) for tag-based rules.
          // Marketing tags are CRM-scoped.
          const userMarketingTags =
            convexUserId && ctx.enabledPluginIds.includes("crm")
              ? await (ctx.fetchQuery as any)(
                  (ctx.api as any).plugins.crm.marketingTags.queries
                    .getUserMarketingTags,
                  {
                    userId: String(convexUserId),
                    ...(ctx.organizationId
                      ? { organizationId: String(ctx.organizationId) }
                      : {}),
                  },
                )
              : [];
          const tagKeys: string[] = Array.isArray(userMarketingTags)
            ? userMarketingTags.flatMap((assignment: any) => {
                const tag = assignment?.marketingTag;
                const keys: string[] = [];
                const slug = tag?.slug as unknown;
                const id = tag?._id as unknown;
                if (typeof slug === "string") keys.push(slug);
                if (typeof id === "string") keys.push(id);
                return keys;
              })
            : [];
          if (debugRouting) {
            console.log("[frontendRouting] content access: tagKeys", {
              tagKeys,
            });
          }

          // Role/permission prefetch for core provider (avoid async inside providers).
          const roleNames = convexUserId
            ? ((await (ctx.fetchQuery as any)(
                (ctx.api as any).core.roles.queries.getRoleNamesForUser,
                { userId: convexUserId },
              )) as string[])
            : [];

          const requiredPermissionKeys: string[] = contentRules
            ? contentRules.requiredPermissionKeys
            : [];
          const permissionGrants: Record<string, boolean> = {};
          if (convexUserId && requiredPermissionKeys.length > 0) {
            await Promise.all(
              requiredPermissionKeys.map(async (permissionKey) => {
                const allowed = await (ctx.fetchQuery as any)(
                  (ctx.api as any).core.permissions.queries.checkUserPermission,
                  {
                    userId: convexUserId,
                    permissionKey,
                  },
                );
                permissionGrants[permissionKey] = Boolean(allowed);
              }),
            );
          }

          // ---- LMS course access cascade (course → steps) ----
          let lmsCourseAccess: LmsCourseAccessContext | null = null;
          if (ctx.enabledPluginIds.includes("lms")) {
            const postTypeSlug =
              typeof post.postTypeSlug === "string" ? post.postTypeSlug : null;
            const isCourse = postTypeSlug === "courses";
            const isStep =
              postTypeSlug === "lessons" ||
              postTypeSlug === "topics" ||
              postTypeSlug === "quizzes";

            let courseId: string | null = null;
            if (isCourse) {
              courseId = String(post._id);
            } else if (postTypeSlug === "lessons") {
              courseId = getMetaString(postMetaObject, "courseId");
            } else if (postTypeSlug === "topics") {
              const lessonId = getMetaString(postMetaObject, "lessonId");
              if (lessonId) {
                const lessonMetaResult: unknown = await (ctx.fetchQuery as any)(
                  (ctx.api as any).plugins.lms.posts.queries.getPostMeta,
                  {
                    postId: lessonId,
                    organizationId: ctx.organizationId
                      ? String(ctx.organizationId)
                      : undefined,
                  },
                );
                const lessonMeta = (lessonMetaResult ?? []) as {
                  key: string;
                  value?: PostMetaValue;
                }[];
                const lessonMap = new Map<string, PostMetaValue>();
                lessonMeta.forEach((entry) =>
                  lessonMap.set(entry.key, entry.value ?? null),
                );
                const lessonMetaObject = Object.fromEntries(
                  lessonMap.entries(),
                ) as Record<string, PostMetaValue>;
                courseId = getMetaString(lessonMetaObject, "courseId");
              }
            } else if (postTypeSlug === "quizzes") {
              courseId = getMetaString(postMetaObject, "courseId");
            }

            if (courseId && (isCourse || isStep)) {
              const orgArg = ctx.organizationId
                ? { organizationId: String(ctx.organizationId) }
                : {};

              const coursePostResult: unknown = await (ctx.fetchQuery as any)(
                (ctx.api as any).plugins.lms.posts.queries.getPostById,
                { id: courseId, ...orgArg },
              );
              const coursePost = (coursePostResult ?? null) as {
                slug?: unknown;
              } | null;
              const courseSlug =
                typeof coursePost?.slug === "string" &&
                coursePost.slug.trim().length > 0
                  ? coursePost.slug.trim()
                  : courseId;

              const courseMetaResult: unknown = await (ctx.fetchQuery as any)(
                (ctx.api as any).plugins.lms.posts.queries.getPostMeta,
                {
                  postId: courseId,
                  ...orgArg,
                },
              );
              const courseMeta = (courseMetaResult ?? []) as {
                key: string;
                value?: PostMetaValue;
              }[];
              const courseMap = new Map<string, PostMetaValue>();
              courseMeta.forEach((entry) =>
                courseMap.set(entry.key, entry.value ?? null),
              );
              const courseMetaObject = Object.fromEntries(
                courseMap.entries(),
              ) as Record<string, PostMetaValue>;

              const accessModeRaw =
                getMetaString(courseMetaObject, "lms_course_access_mode") ??
                "open";
              const accessMode = (
                accessModeRaw === "open" ||
                accessModeRaw === "free" ||
                accessModeRaw === "buy_now" ||
                accessModeRaw === "recurring" ||
                accessModeRaw === "closed"
                  ? accessModeRaw
                  : "open"
              ) as LmsCourseAccessMode;

              const cascadeToSteps =
                getMetaBoolean(courseMetaObject, "lms_course_access_cascade") ??
                true;
              const appliesToCurrentResource = isCourse
                ? true
                : Boolean(isStep && cascadeToSteps);
              const buyNowUrl = getMetaString(
                courseMetaObject,
                "lms_course_buy_now_url",
              );

              lmsCourseAccess = {
                courseId,
                courseSlug,
                accessMode,
                cascadeToSteps,
                buyNowUrl,
                appliesToCurrentResource,
              };
            }
          }

          const decision = evaluateContentAccess({
            subject: {
              organizationId: organizationId ? String(organizationId) : null,
              enabledPluginIds: ctx.enabledPluginIds,
              userId: convexUserId ? String(convexUserId) : null,
              contactId: null,
              isAuthenticated,
            },
            resource: {
              contentType: "post",
              contentId: String(post._id),
            },
            data: {
              contentRules,
              lmsCourseAccess,
              lmsAdminBypassCourseAccess,
              tagKeys,
              roleNames,
              permissionGrants,
              userRole: viewer?.role ?? null,
              post,
              postType,
              postMeta: postMetaObject,
            },
          });
          if (debugRouting) {
            console.log("[frontendRouting] content access: decision", decision);
          }

          if (decision.kind === "redirect") {
            const to = String(decision.to ?? "").trim();
            const safe =
              to.startsWith("/") ||
              to.startsWith("https://") ||
              to.startsWith("http://")
                ? to
                : "/";
            redirect(safe);
          }

          if (decision.kind === "deny") {
            const currentPath = `/${segments.join("/")}`;
            const signInHref = `/auth/sign-in?redirect_url=${encodeURIComponent(
              currentPath,
            )}`;

            const rawActions = applyFilters(
              FRONTEND_ACCESS_DENIED_ACTIONS_FILTER as string,
              [],
              {
                decision,
                signInHref,
                post,
                postType,
                postMeta: postMetaObject,
                lmsCourseAccess,
                enabledPluginIds: ctx.enabledPluginIds,
              },
            );
            const actions = Array.isArray(rawActions)
              ? rawActions
                  .filter((a) => a && typeof a === "object")
                  .map((a: any) => ({
                    id: String(a.id ?? ""),
                    label: String(a.label ?? ""),
                    href: String(a.href ?? ""),
                    variant:
                      a.variant === "default" || a.variant === "outline"
                        ? a.variant
                        : undefined,
                    external: a.external === true,
                    reload: a.reload === true,
                  }))
                  .filter((a) => a.id && a.label && a.href)
              : [];

            return (
              <AccessDeniedPage
                reason={decision.reason}
                contentTitle={
                  typeof post.title === "string" ? post.title : undefined
                }
                featuredImageUrl={
                  post.featuredImageUrl ??
                  resolveFirstImageFromAttachmentsMeta(
                    postMetaObject[ATTACHMENTS_META_KEY],
                  )
                }
                signInHref={signInHref}
                actions={actions}
              />
            );
          }

          const puckMetaEntry = postMeta.find((m) => m.key === "puck_data");
          const puckData = parsePuckData(
            typeof puckMetaEntry?.value === "string"
              ? puckMetaEntry.value
              : null,
          );

          // If a single-template exists, prefer it.
          const singleTemplateData = await loadTemplateContent({
            templateType: "single",
            postTypeSlug: post.postTypeSlug ?? null,
            organizationId: (ctx.organizationId ?? undefined) as any,
            fetchQuery: ctx.fetchQuery as any,
            api: ctx.api,
          });
          if (singleTemplateData) {
            return (
              <main className="bg-background min-h-screen">
                <PuckContentRenderer data={singleTemplateData as any} />
              </main>
            );
          }

          const pluginMatch = post.postTypeSlug
            ? findPostTypeBySlug(post.postTypeSlug)
            : null;

          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
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
      });

      return next;
    },
    10,
    2,
  );
}

// Register on module import for server/runtime safety.
registerCoreRouteHandlers();
