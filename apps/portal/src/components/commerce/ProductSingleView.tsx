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
import { ATTACHMENTS_META_KEY } from "~/lib/posts/metaKeys";
import { ProductPurchaseBox } from "./ProductPurchaseBox";

type PostMetaValue = string | number | boolean | null | undefined;

const buildPostMetaObject = (
  meta: { key: string; value?: PostMetaValue }[],
): Record<string, PostMetaValue> => {
  const obj: Record<string, PostMetaValue> = {};
  meta.forEach((entry) => {
    if (entry.key) {
      obj[String(entry.key)] = entry.value ?? null;
    }
  });
  return obj;
};

const safeParseStringArray = (value: unknown): string[] => {
  if (typeof value !== "string") return [];
  const raw = value.trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((v) => (typeof v === "string" ? v : ""))
      .map((v) => v.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
};

interface AttachmentMetaEntry {
  mediaItemId?: string;
  url?: string;
  mimeType?: string;
  title?: string;
  alt?: string;
}

const resolvePrimaryImageFromAttachmentsMeta = (
  attachmentsMetaValue: PostMetaValue,
): { url: string; alt?: string } | null => {
  const raw =
    typeof attachmentsMetaValue === "string" ? attachmentsMetaValue.trim() : "";
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;

    // Prefer the first "image-like" attachment (same heuristic as SEO preview).
    for (const item of parsed) {
      if (!item || typeof item !== "object") continue;
      const entry = item as AttachmentMetaEntry;

      const url = typeof entry.url === "string" ? entry.url.trim() : "";
      const mimeType = typeof entry.mimeType === "string" ? entry.mimeType : "";
      const mediaItemId =
        typeof entry.mediaItemId === "string" ? entry.mediaItemId : "";
      const alt = typeof entry.alt === "string" && entry.alt.trim() ? entry.alt : undefined;

      const looksLikeImageUrl =
        /\.(png|jpe?g|gif|webp|avif|svg)(\?|#|$)/i.test(url) ||
        url.includes("vimeocdn.com");

      if (mimeType.startsWith("image/") || looksLikeImageUrl) {
        if (/^https?:\/\//i.test(url)) return { url, alt };
        if (mediaItemId) return { url: `/api/media/${mediaItemId}`, alt };
        if (url) return { url, alt };
      }
    }

    // Fallback: try the first attachment URL (might be non-image; <img> will fail gracefully)
    const first = parsed[0];
    if (first && typeof first === "object") {
      const entry = first as AttachmentMetaEntry;
      const url = typeof entry.url === "string" ? entry.url.trim() : "";
      const mediaItemId =
        typeof entry.mediaItemId === "string" ? entry.mediaItemId : "";
      if (/^https?:\/\//i.test(url)) return { url };
      if (mediaItemId) return { url: `/api/media/${mediaItemId}` };
      if (url) return { url };
    }
  } catch {
    // ignore
  }

  return null;
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
      })) as { key: string; value?: PostMetaValue }[])
    : [];
  const postMetaObject = buildPostMetaObject(postMetaRows ?? []);
  const features = safeParseStringArray(postMetaObject["product.features"]);
  const primaryImage = resolvePrimaryImageFromAttachmentsMeta(
    postMetaObject[ATTACHMENTS_META_KEY],
  );

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
              {primaryImage?.url ? (
                <div className="bg-muted overflow-hidden rounded-xl border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={primaryImage.url}
                    alt={primaryImage.alt ?? post?.title ?? "Product image"}
                    className="h-auto w-full object-cover"
                    loading="eager"
                  />
                </div>
              ) : null}
              <p className="text-muted-foreground text-sm tracking-wide uppercase">
                Product
              </p>
              <h1 className="text-4xl font-bold">{post?.title ?? "Product"}</h1>
              {post?.excerpt ? (
                <p className="text-muted-foreground text-lg">{post.excerpt}</p>
              ) : null}
              {features.length > 0 ? (
                <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
                  {features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
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
