import {
  deletePostMetaValue,
  getPostMetaMap,
  parseCourseStructureMeta,
  serializeCourseStructureMeta,
  setPostMetaValue,
} from "./helpers";

import type { Id } from "../../_generated/dataModel";
import type { MutationCtx } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { mutation } from "../../_generated/server";
import { v } from "convex/values";

const ensureCourseAndLesson = async (
  ctx: MutationCtx,
  courseId: Id<"posts">,
  lessonId: Id<"posts">,
) => {
  const course = await ctx.db.get(courseId);
  if (!course || course.postTypeSlug !== "courses") {
    throw new Error("Course not found");
  }
  const lesson = await ctx.db.get(lessonId);
  if (!lesson || lesson.postTypeSlug !== "lessons") {
    throw new Error("Lesson not found");
  }

  const courseOrg = course.organizationId ?? undefined;
  const lessonOrg = lesson.organizationId ?? undefined;
  if (courseOrg !== lessonOrg) {
    throw new Error("Course and lesson must belong to the same organization");
  }

  return { course, lesson };
};

type PostMetaMap = Awaited<ReturnType<typeof getPostMetaMap>>;

const getMetaString = (map: PostMetaMap, key: string): string | null => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const rawValue = map.get(key);
  if (typeof rawValue === "string" && rawValue.length > 0) {
    return rawValue;
  }
  return null;
};

const vimeoVideoInput = v.object({
  videoId: v.string(),
  title: v.string(),
  description: v.optional(v.string()),
  embedUrl: v.optional(v.string()),
  thumbnailUrl: v.optional(v.string()),
});

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 48);

const buildSlug = (prefix: string, videoTitle: string, videoId: string) => {
  const base = slugify(videoTitle) || `${prefix}-video`;
  return `${base}-${videoId.slice(-6)}`.toLowerCase();
};

const attachLessonToCourseInternal = async (
  ctx: MutationCtx,
  courseId: Id<"posts">,
  lessonId: Id<"posts">,
) => {
  const { course } = await ensureCourseAndLesson(ctx, courseId, lessonId);

  const courseMeta = await getPostMetaMap(ctx, course._id);
  const structure = parseCourseStructureMeta(courseMeta.get("courseStructure"));
  if (!structure.includes(lessonId)) {
    structure.push(lessonId);
    await setPostMetaValue(
      ctx,
      course._id,
      "courseStructure",
      serializeCourseStructureMeta(structure),
    );
  }

  await setPostMetaValue(ctx, lessonId, "courseId", course._id);
  await setPostMetaValue(
    ctx,
    lessonId,
    "courseOrder",
    structure.indexOf(lessonId),
  );
  await setPostMetaValue(
    ctx,
    lessonId,
    "courseSlug",
    course.slug ?? course._id,
  );
};

export const addLessonToCourse = mutation({
  args: {
    courseId: v.id("posts"),
    lessonId: v.id("posts"),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    await attachLessonToCourseInternal(ctx, args.courseId, args.lessonId);
    return { success: true };
  },
});

export const removeLessonFromCourseStructure = mutation({
  args: {
    courseId: v.id("posts"),
    lessonId: v.id("posts"),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.courseId);
    if (!course || course.postTypeSlug !== "courses") {
      throw new Error("Course not found");
    }

    const courseMeta = await getPostMetaMap(ctx, course._id);
    const structure = parseCourseStructureMeta(
      courseMeta.get("courseStructure"),
    );
    const filtered = structure.filter((id) => id !== args.lessonId);
    await setPostMetaValue(
      ctx,
      course._id,
      "courseStructure",
      serializeCourseStructureMeta(filtered),
    );

    await deletePostMetaValue(ctx, args.lessonId, "courseId");
    await deletePostMetaValue(ctx, args.lessonId, "courseOrder");
    await deletePostMetaValue(ctx, args.lessonId, "courseSlug");
    return { success: true };
  },
});

export const reorderLessonsInCourse = mutation({
  args: {
    courseId: v.id("posts"),
    orderedLessonIds: v.array(v.id("posts")),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.courseId);
    if (!course || course.postTypeSlug !== "courses") {
      throw new Error("Course not found");
    }

    await setPostMetaValue(
      ctx,
      course._id,
      "courseStructure",
      serializeCourseStructureMeta(args.orderedLessonIds),
    );

    await Promise.all(
      args.orderedLessonIds.map((lessonId, index) =>
        setPostMetaValue(ctx, lessonId, "courseOrder", index),
      ),
    );

    return { success: true };
  },
});

export const attachTopicToLesson = mutation({
  args: {
    lessonId: v.id("posts"),
    topicId: v.id("posts"),
    order: v.optional(v.number()),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const lesson = await ctx.db.get(args.lessonId);
    if (!lesson || lesson.postTypeSlug !== "lessons") {
      throw new Error("Lesson not found");
    }
    const topic = await ctx.db.get(args.topicId);
    if (!topic || topic.postTypeSlug !== "topics") {
      throw new Error("Topic not found");
    }
    if (
      (lesson.organizationId ?? undefined) !==
      (topic.organizationId ?? undefined)
    ) {
      throw new Error("Lesson and topic must belong to the same organization");
    }

    await setPostMetaValue(ctx, args.topicId, "lessonId", args.lessonId);
    await setPostMetaValue(
      ctx,
      args.topicId,
      "lessonSlug",
      lesson.slug ?? lesson._id,
    );
    const lessonMeta: PostMetaMap = await getPostMetaMap(ctx, args.lessonId);
    let courseSlugValue = getMetaString(lessonMeta, "courseSlug");
    if (!courseSlugValue) {
      const courseIdMeta = getMetaString(lessonMeta, "courseId");
      if (courseIdMeta) {
        const parentCourse = await ctx.db.get(courseIdMeta as Id<"posts">);
        if (parentCourse) {
          courseSlugValue = parentCourse.slug ?? parentCourse._id;
          await setPostMetaValue(
            ctx,
            args.lessonId,
            "courseSlug",
            courseSlugValue,
          );
        }
      }
    }
    if (courseSlugValue) {
      await setPostMetaValue(ctx, args.topicId, "courseSlug", courseSlugValue);
    }
    if (typeof args.order === "number") {
      await setPostMetaValue(ctx, args.topicId, "order", args.order);
    }
    return { success: true };
  },
});

export const removeTopicFromLesson = mutation({
  args: {
    topicId: v.id("posts"),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    await deletePostMetaValue(ctx, args.topicId, "lessonId");
    await deletePostMetaValue(ctx, args.topicId, "order");
    await deletePostMetaValue(ctx, args.topicId, "lessonSlug");
    await deletePostMetaValue(ctx, args.topicId, "courseSlug");
    return { success: true };
  },
});

export const reorderTopicsInLesson = mutation({
  args: {
    lessonId: v.id("posts"),
    orderedTopicIds: v.array(v.id("posts")),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const lesson = await ctx.db.get(args.lessonId);
    if (!lesson || lesson.postTypeSlug !== "lessons") {
      throw new Error("Lesson not found");
    }

    await Promise.all(
      args.orderedTopicIds.map((topicId, index) =>
        setPostMetaValue(ctx, topicId, "order", index),
      ),
    );
    return { success: true };
  },
});

export const attachQuizToLesson = mutation({
  args: {
    lessonId: v.id("posts"),
    quizId: v.id("posts"),
    order: v.optional(v.number()),
    isFinal: v.optional(v.boolean()),
    topicId: v.optional(v.id("posts")),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const lesson = await ctx.db.get(args.lessonId);
    if (!lesson || lesson.postTypeSlug !== "lessons") {
      throw new Error("Lesson not found");
    }
    const quiz = await ctx.db.get(args.quizId);
    if (!quiz || quiz.postTypeSlug !== "quizzes") {
      throw new Error("Quiz not found");
    }
    if (
      (lesson.organizationId ?? undefined) !==
      (quiz.organizationId ?? undefined)
    ) {
      throw new Error("Lesson and quiz must belong to the same organization");
    }

    await setPostMetaValue(ctx, args.quizId, "lessonId", args.lessonId);
    await setPostMetaValue(
      ctx,
      args.quizId,
      "lessonSlug",
      lesson.slug ?? lesson._id,
    );
    const lessonMeta: PostMetaMap = await getPostMetaMap(ctx, args.lessonId);
    let lessonCourseSlug = getMetaString(lessonMeta, "courseSlug");
    if (!lessonCourseSlug) {
      const lessonCourseIdMeta = getMetaString(lessonMeta, "courseId");
      if (lessonCourseIdMeta) {
        const parentCourse = await ctx.db.get(
          lessonCourseIdMeta as Id<"posts">,
        );
        if (parentCourse) {
          lessonCourseSlug = parentCourse.slug ?? parentCourse._id;
          await setPostMetaValue(
            ctx,
            args.lessonId,
            "courseSlug",
            lessonCourseSlug,
          );
        }
      }
    }
    if (lessonCourseSlug) {
      await setPostMetaValue(ctx, args.quizId, "courseSlug", lessonCourseSlug);
    }
    if (typeof args.order === "number") {
      await setPostMetaValue(ctx, args.quizId, "order", args.order);
    }
    if (typeof args.isFinal === "boolean") {
      await setPostMetaValue(ctx, args.quizId, "isFinal", args.isFinal);
    }
    if (args.topicId) {
      await setPostMetaValue(ctx, args.quizId, "topicId", args.topicId);
    }
    return { success: true };
  },
});

export const removeQuizFromLesson = mutation({
  args: {
    quizId: v.id("posts"),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    await deletePostMetaValue(ctx, args.quizId, "lessonId");
    await deletePostMetaValue(ctx, args.quizId, "order");
    await deletePostMetaValue(ctx, args.quizId, "isFinal");
    await deletePostMetaValue(ctx, args.quizId, "lessonSlug");
    await deletePostMetaValue(ctx, args.quizId, "courseSlug");
    return { success: true };
  },
});

export const createLessonFromVimeo = mutation({
  args: {
    courseId: v.id("posts"),
    organizationId: v.optional(v.id("organizations")),
    video: vimeoVideoInput,
  },
  returns: v.object({
    lessonId: v.id("posts"),
  }),
  handler: async (ctx, args) => {
    const lessonId = await ctx.runMutation(
      internal.core.posts.mutations.createPost,
      {
        title: args.video.title,
        slug: buildSlug("lesson", args.video.title, args.video.videoId),
        status: "draft",
        postTypeSlug: "lessons",
        organizationId: args.organizationId,
        meta: {
          vimeoVideoId: args.video.videoId,
          vimeoEmbedUrl: args.video.embedUrl ?? "",
          vimeoThumbnailUrl: args.video.thumbnailUrl ?? "",
          source: "vimeo",
        },
      },
    );
    await attachLessonToCourseInternal(ctx, args.courseId, lessonId);
    return { lessonId };
  },
});

export const createTopicFromVimeo = mutation({
  args: {
    lessonId: v.id("posts"),
    organizationId: v.optional(v.id("organizations")),
    video: vimeoVideoInput,
  },
  returns: v.object({
    topicId: v.id("posts"),
  }),
  handler: async (ctx, args) => {
    const topicId = await ctx.runMutation(
      internal.core.posts.mutations.createPost,
      {
        title: args.video.title,
        slug: buildSlug("topic", args.video.title, args.video.videoId),
        status: "draft",
        postTypeSlug: "topics",
        organizationId: args.organizationId,
        meta: {
          vimeoVideoId: args.video.videoId,
          vimeoEmbedUrl: args.video.embedUrl ?? "",
          vimeoThumbnailUrl: args.video.thumbnailUrl ?? "",
          source: "vimeo",
        },
      },
    );
    await ctx.runMutation(internal.plugins.lms.mutations.attachTopicToLesson, {
      lessonId: args.lessonId,
      topicId,
      order: 0,
    });
    return { topicId };
  },
});

export const createQuizFromVimeo = mutation({
  args: {
    targetLessonId: v.optional(v.id("posts")),
    targetTopicId: v.optional(v.id("posts")),
    organizationId: v.optional(v.id("organizations")),
    video: vimeoVideoInput,
  },
  returns: v.object({
    quizId: v.id("posts"),
  }),
  handler: async (ctx, args) => {
    if (!args.targetLessonId) {
      throw new Error("targetLessonId is required when creating quizzes");
    }
    const quizId = await ctx.runMutation(
      internal.core.posts.mutations.createPost,
      {
        title: args.video.title,
        slug: buildSlug("quiz", args.video.title, args.video.videoId),
        status: "draft",
        postTypeSlug: "quizzes",
        organizationId: args.organizationId,
        meta: {
          vimeoVideoId: args.video.videoId,
          vimeoEmbedUrl: args.video.embedUrl ?? "",
          vimeoThumbnailUrl: args.video.thumbnailUrl ?? "",
          source: "vimeo",
        },
      },
    );
    await ctx.runMutation(internal.plugins.lms.mutations.attachQuizToLesson, {
      lessonId: args.targetLessonId,
      quizId,
      order: 0,
      isFinal: false,
      topicId: args.targetTopicId,
    });
    return { quizId };
  },
});
