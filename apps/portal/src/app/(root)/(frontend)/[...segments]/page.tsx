/* eslint-disable @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */
import type { Doc, Id } from "@/convex/_generated/dataModel";
import type { Data as PuckData } from "@measured/puck";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { getActiveTenantFromHeaders } from "@/lib/tenant-headers";
import { fetchQuery } from "convex/nextjs";

import { EditorViewer } from "~/components/blocks/editor-x/viewer";
import { parseLexicalSerializedState } from "~/lib/editor/lexical";
import { findPostTypeBySlug } from "~/lib/plugins/frontend";
import {
  getCanonicalPostPath,
  getCanonicalPostSegments,
} from "~/lib/postTypes/routing";
import { getTenantOrganizationId } from "~/lib/tenant-fetcher";
import { PuckContentRenderer } from "../../../../components/puckeditor/PuckContentRenderer";

type PluginMatch = ReturnType<typeof findPostTypeBySlug>;

interface PageProps {
  params: Promise<{ segments?: string[] }>;
}

export const metadata: Metadata = {
  title: "Post",
};

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
        <main className="min-h-screen bg-background">
          <PuckContentRenderer data={archiveTemplateData} />
        </main>
      );
    }
    const posts = await fetchQuery(api.core.posts.queries.getAllPosts, {
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

  let post = await fetchQuery(api.core.posts.queries.getPostBySlug, {
    slug,
    ...(organizationId ? { organizationId } : {}),
  });

  if (!post && isConvexId(slug)) {
    post = await fetchQuery(api.core.posts.queries.getPostById, {
      id: slug as Id<"posts">,
      ...(organizationId ? { organizationId } : {}),
    });
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

  const postMetaResult: Doc<"postsMeta">[] | null = await fetchQuery(
    api.core.posts.queries.getPostMeta,
    {
      postId: post._id,
      ...(organizationId ? { organizationId } : {}),
    },
  );
  const postMeta = postMetaResult ?? [];
  const postMetaMap = buildPostMetaMap(postMeta);
  console.log("[FrontendCatchAllPage] Post Meta:", postMeta);

  const puckMetaEntry = postMeta.find((meta) => meta.key === "puck_data");
  const puckData = parsePuckData(
    typeof puckMetaEntry?.value === "string" ? puckMetaEntry.value : null,
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

  if (customCanonicalPath) {
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
  } else {
    const canonicalSegments = getCanonicalPostSegments(post, postType);
    if (canonicalSegments.length > 0) {
      const canonicalPath = canonicalSegments.join("/");
      if (canonicalPath !== requestedPath) {
        redirect(`/${canonicalPath}`);
      }
    }
  }
  const pluginSingle = pluginMatch?.postType.frontend?.single;
  if (pluginMatch && pluginSingle?.render) {
    return pluginSingle.render({
      post,
      postType: pluginMatch.postType,
    });
  }

  return (
    <PostDetail
      post={post}
      postType={postType}
      fields={postFields}
      postMeta={postMeta}
      puckData={puckData}
    />
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

interface PostDetailProps {
  post: Doc<"posts">;
  postType: PostTypeDoc | null;
  fields: PostFieldDoc[];
  postMeta: PostMetaDoc[];
  puckData: PuckData | null;
}

function PostDetail({
  post,
  postType,
  fields,
  postMeta,
  puckData,
}: PostDetailProps) {
  const contextLabel = resolveContextLabel(post, postType);
  const customFieldEntries = buildCustomFieldEntries({
    fields,
    post,
    postMeta,
  });
  const hasPuckContent = Boolean(puckData?.content?.length);
  const lexicalContent = parseLexicalSerializedState(post.content ?? null);

  if (hasPuckContent && puckData) {
    return (
      <main className="min-h-screen bg-background">
        <PuckContentRenderer data={puckData} />
      </main>
    );
  }

  return (
    <main className="container mx-auto max-w-4xl space-y-6 py-10">
      <article className="space-y-6">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-wide text-muted-foreground">
            {contextLabel}
          </p>
          <h1 className="text-4xl font-bold">{post.title}</h1>
          {post.excerpt && (
            <p className="text-lg text-muted-foreground">{post.excerpt}</p>
          )}
          <PostMetaSummary post={post} postType={postType} />
        </header>
        {lexicalContent ? (
          <EditorViewer
            editorSerializedState={lexicalContent}
            className="prose max-w-none"
          />
        ) : post.content ? (
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            This {contextLabel.toLowerCase()} does not have any content yet.
          </p>
        )}
        {customFieldEntries.length > 0 ? (
          <section className="rounded-lg border bg-card p-6">
            <h2 className="text-xl font-semibold text-foreground">
              Custom Fields
            </h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              {customFieldEntries?.map((entry) => (
                <div key={entry.key} className="space-y-1">
                  <dt className="text-sm font-medium text-muted-foreground">
                    {entry.label}
                  </dt>
                  <dd className="text-base text-foreground">{entry.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}
      </article>
    </main>
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
    <dl className="flex flex-wrap gap-4 text-sm text-muted-foreground">
      {details?.map((item) => (
        <div key={item.label}>
          <dt className="sr-only">{item.label}</dt>
          <dd>
            <span className="font-medium text-foreground">{item.label}:</span>{" "}
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
        <p className="text-sm uppercase tracking-wide text-muted-foreground">
          {postType.name}
        </p>
        <h1 className="text-4xl font-bold">{postType.name} Archive</h1>
        <p className="text-muted-foreground">{description}</p>
      </header>

      {posts.length === 0 ? (
        <div className="rounded-lg border p-10 text-center text-muted-foreground">
          No {postType.name.toLowerCase()} have been published yet.
        </div>
      ) : (
        <section className="grid gap-6 md:grid-cols-2">
          {posts?.map((post) => {
            const url = getCanonicalPostPath(post, postType, true);
            return (
              <article
                key={post._id}
                className="rounded-lg border bg-card p-6 shadow-sm transition hover:shadow-md"
              >
                <Link href={url} className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      {postType.name}
                    </p>
                    <h2 className="text-2xl font-semibold text-foreground">
                      {post.title || "Untitled"}
                    </h2>
                  </div>
                  {post.excerpt ? (
                    <p className="text-sm text-muted-foreground">
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
