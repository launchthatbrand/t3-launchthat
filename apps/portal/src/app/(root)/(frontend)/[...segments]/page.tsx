import {
  getCanonicalPostPath,
  getCanonicalPostSegments,
} from "~/lib/postTypes/routing";
import { notFound, redirect } from "next/navigation";

import type { Doc } from "@/convex/_generated/dataModel";
import Link from "next/link";
import type { Metadata } from "next";
import { api } from "@/convex/_generated/api";
import { fetchQuery } from "convex/nextjs";
import { getActiveTenantFromHeaders } from "@/lib/tenant-headers";

interface PageProps {
  params: { segments?: string[] };
}

export const metadata: Metadata = {
  title: "Post",
};

export default async function FrontendCatchAllPage({ params }: PageProps) {
  const segments = normalizeSegments(params.segments ?? []);
  const tenant = await getActiveTenantFromHeaders();
  const organizationId = tenant?._id;

  const archiveContext = await resolveArchiveContext(segments, organizationId);
  if (archiveContext) {
    const posts = await fetchQuery(api.core.posts.queries.getAllPosts, {
      ...(organizationId ? { organizationId } : {}),
      filters: {
        status: "published",
        postTypeSlug: archiveContext.postType.slug,
        limit: 50,
      },
    });
    return <PostArchive postType={archiveContext.postType} posts={posts} />;
  }

  const slug = deriveSlugFromSegments(segments);

  if (!slug) {
    notFound();
  }

  const post = await fetchQuery(api.core.posts.queries.getPostBySlug, {
    slug,
    ...(organizationId ? { organizationId } : {}),
  });

  if (!post) {
    notFound();
  }

  let postType: PostTypeDoc | null = null;
  if (post.postTypeSlug) {
    postType = await fetchQuery(api.core.postTypes.queries.getBySlug, {
      slug: post.postTypeSlug,
      ...(organizationId ? { organizationId } : {}),
    });
  }

  const canonicalSegments = getCanonicalPostSegments(post, postType);
  if (canonicalSegments.length > 0) {
    const canonicalPath = canonicalSegments.join("/");
    const requestedPath = segments.join("/");
    if (canonicalPath !== requestedPath) {
      redirect(`/${canonicalPath}`);
    }
  }

  return <PostDetail post={post} postType={postType} />;
}

function normalizeSegments(segments: string[]) {
  return segments
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);
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

interface PostDetailProps {
  post: Doc<"posts">;
  postType: PostTypeDoc | null;
}

function PostDetail({ post, postType }: PostDetailProps) {
  const contextLabel = resolveContextLabel(post, postType);

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
        {post.content ? (
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            This {contextLabel.toLowerCase()} does not have any content yet.
          </p>
        )}
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
      {details.map((item) => (
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

async function resolveArchiveContext(
  segments: string[],
  organizationId?: Doc<"organizations">["_id"],
) {
  if (segments.length === 0) {
    return null;
  }
  const path = segments.join("/");
  const postTypes = await fetchQuery(api.core.postTypes.queries.list, {
    includeBuiltIn: true,
    ...(organizationId ? { organizationId } : {}),
  });

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
          {posts.map((post) => {
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
