import type { Id } from "../lib/convexId";

export function coercePostId(value: unknown): Id<"posts"> | undefined {
  return typeof value === "string" && value.length > 0
    ? (value as Id<"posts">)
    : undefined;
}

export function coerceString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function deriveCourseId(
  postTypeSlug: string,
  post: Record<string, unknown>,
  meta: Record<string, unknown>,
): Id<"posts"> | undefined {
  if (postTypeSlug === "courses") {
    return coercePostId(post._id);
  }
  return coercePostId(meta.courseId);
}

export function deriveCourseSlug(
  postTypeSlug: string,
  post: Record<string, unknown>,
  meta: Record<string, unknown>,
): string | undefined {
  if (postTypeSlug === "courses") {
    const slugValue = post.slug;
    if (typeof slugValue === "string" && slugValue.length > 0) {
      return slugValue;
    }
    return coerceString(post._id);
  }
  return coerceString(meta.courseSlug);
}

export function deriveLessonId(
  postTypeSlug: string,
  post: Record<string, unknown>,
  meta: Record<string, unknown>,
): Id<"posts"> | undefined {
  if (postTypeSlug === "lessons") {
    return coercePostId(post._id);
  }
  return coercePostId(meta.lessonId ?? meta.lesson_id);
}
