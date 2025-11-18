/**
 * Courses mutations
 *
 * Includes helpers for provisioning LMS course records that power the builder UI.
 */
import { v } from "convex/values";

import type { Id } from "../../_generated/dataModel";
import type { MutationCtx } from "../../_generated/server";
import { mutation } from "../../_generated/server";

async function upsertCourseMeta(
  ctx: MutationCtx,
  postId: Id<"posts">,
  courseId: Id<"courses">,
) {
  const timestamp = Date.now();
  const existingMeta = await ctx.db
    .query("postsMeta")
    .withIndex("by_post_and_key", (q) =>
      q.eq("postId", postId).eq("key", "courseId"),
    )
    .unique();

  if (existingMeta) {
    await ctx.db.patch(existingMeta._id, {
      value: courseId,
      updatedAt: timestamp,
    });
    return;
  }

  await ctx.db.insert("postsMeta", {
    postId,
    key: "courseId",
    value: courseId,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
}

export const ensureCourseForPost = mutation({
  args: {
    postId: v.id("posts"),
  },
  returns: v.object({
    courseId: v.id("courses"),
    created: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error(`Post ${args.postId} not found`);
    }

    const existingMeta = await ctx.db
      .query("postsMeta")
      .withIndex("by_post_and_key", (q) =>
        q.eq("postId", args.postId).eq("key", "courseId"),
      )
      .unique();

    if (existingMeta && typeof existingMeta.value === "string") {
      const candidateId = existingMeta.value as Id<"courses">;
      const existingCourse = await ctx.db.get(candidateId);
      if (existingCourse) {
        return { courseId: candidateId, created: false };
      }
    }

    const courseId = await ctx.db.insert("courses", {
      organizationId: post.organizationId,
      title: post.title,
      description: post.excerpt ?? undefined,
      isPublished: post.status === "published",
      courseStructure: [],
    });

    await upsertCourseMeta(ctx, args.postId, courseId);
    return { courseId, created: true };
  },
});
