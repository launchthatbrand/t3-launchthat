import type { Id } from "@/convex/_generated/dataModel";
import React from "react";
import { api } from "@/convex/_generated/api";
import { fetchQuery } from "convex/nextjs";

import { EditorViewer } from "~/components/blocks/editor-x/viewer";
import { PostCommentsSection } from "~/components/comments/PostCommentsSection";
import { TaxonomyBadges } from "~/components/taxonomies/TaxonomyBadges";
import {
  isLexicalSerializedStateString,
  parseLexicalSerializedState,
} from "~/lib/editor/lexical";
import { ProductPurchaseBox } from "./ProductPurchaseBox";

type PostMetaValue = string | number | boolean | null | undefined;

const buildPostMetaObject = (
  meta: Array<{ key: string; value?: PostMetaValue }>,
): Record<string, PostMetaValue> => {
  const obj: Record<string, PostMetaValue> = {};
  meta.forEach((entry) => {
    if (entry?.key) {
      obj[String(entry.key)] = entry.value ?? null;
    }
  });
  return obj;
};

export async function ProductSingleView({
  post,
  organizationId,
}: {
  post: any;
  organizationId?: string;
}) {
  const postId = typeof post?._id === "string" ? post._id : null;
  const postTypeSlug =
    typeof post?.postTypeSlug === "string" ? post.postTypeSlug : "products";

  const postMetaRows = postId
    ? ((await fetchQuery(api.plugins.commerce.getPostMeta as any, {
        postId,
        ...(organizationId ? { organizationId } : {}),
      })) as Array<{ key: string; value?: PostMetaValue }>)
    : [];
  const postMetaObject = buildPostMetaObject(postMetaRows ?? []);

  const lexicalContent = parseLexicalSerializedState(post?.content ?? null);
  const rawContent = isLexicalSerializedStateString(post?.content)
    ? null
    : (post?.content ?? null);

  return (
    <main className="relative">
      <div className="relative container mx-auto max-w-6xl space-y-6 overflow-hidden py-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <article className="space-y-6">
            <header className="space-y-3">
              <p className="text-muted-foreground text-sm tracking-wide uppercase">
                Product
              </p>
              <h1 className="text-4xl font-bold">{post?.title ?? "Product"}</h1>
              {post?.excerpt ? (
                <p className="text-muted-foreground text-lg">{post.excerpt}</p>
              ) : null}
              {organizationId ? (
                <TaxonomyBadges
                  organizationId={organizationId}
                  objectId={postId as string}
                  postTypeSlug={postTypeSlug}
                  categoryBase="categories"
                  tagBase="tags"
                />
              ) : null}
            </header>

            <section className="space-y-3">
              {lexicalContent ? (
                <EditorViewer initialState={lexicalContent} />
              ) : rawContent ? (
                <div className="prose prose-neutral dark:prose-invert max-w-none">
                  {String(rawContent)}
                </div>
              ) : (
                <div className="text-muted-foreground text-sm">
                  No description yet.
                </div>
              )}
            </section>

            {/* Comments (keep parity with core single renderer) */}
            {/* {postId ? (
              <PostCommentsSection
                postId={postId as unknown as Id<"posts">}
                organizationId={(organizationId as any) ?? null}
              />
            ) : null} */}
          </article>

          <aside className="space-y-4">
            <ProductPurchaseBox
              postId={postId ?? ""}
              organizationId={organizationId}
              postMeta={postMetaObject}
            />
          </aside>
        </div>
      </div>
    </main>
  );
}
