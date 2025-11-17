import type { Doc } from "@/convex/_generated/dataModel";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { fetchQuery } from "convex/nextjs";

interface PageProps {
  params: { segments?: string[] };
}

export const metadata: Metadata = {
  title: "Post",
};

export default async function FrontendCatchAllPage({ params }: PageProps) {
  const segments = params.segments ?? [];
  const slug = deriveSlugFromSegments(segments);

  if (!slug) {
    notFound();
  }

  const post = await fetchQuery(api.core.posts.queries.getPostBySlug, {
    slug,
  });

  if (!post) {
    notFound();
  }

  let postType: PostTypeDoc | null = null;
  if (post.postTypeSlug) {
    postType = await fetchQuery(api.core.postTypes.queries.getBySlug, {
      slug: post.postTypeSlug,
    });
  }

  return <PostDetail post={post} postType={postType} />;
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
