import type { Doc } from "@/convex/_generated/dataModel";

type PostDoc = Doc<"posts">;
type PostTypeDoc = Doc<"postTypes"> | null | undefined;

const trimSlashes = (value: string) => value.replace(/^\/+|\/+$/g, "");

export const getCanonicalPostSegments = (
  post: PostDoc,
  postType?: PostTypeDoc,
): string[] => {
  const slug = post.slug ? trimSlashes(post.slug) : post._id;
  const segments: string[] = [];

  const singleSlug = trimSlashes(postType?.rewrite?.singleSlug ?? "");
  if (singleSlug.length > 0) {
    segments.push(singleSlug);
  }

  segments.push(slug);
  return segments;
};

export const getCanonicalPostPath = (
  post: PostDoc,
  postType?: PostTypeDoc,
  trailingSlash = true,
) => {
  const segments = getCanonicalPostSegments(post, postType);
  if (segments.length === 0) {
    return "/";
  }
  const basePath = `/${segments.join("/")}`;
  if (!trailingSlash) {
    return basePath.replace(/\/+$/, "") || "/";
  }
  return basePath.endsWith("/") ? basePath : `${basePath}/`;
};
