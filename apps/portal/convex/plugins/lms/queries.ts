import { v } from "convex/values";

import type { Id } from "../../_generated/dataModel";
import type {
  LmsBuilderLesson,
  LmsBuilderQuiz,
  LmsBuilderTopic,
  LmsCourseBuilderData,
  LmsCourseStructureItem,
} from "../../../src/plugins/lms/types";
import { query } from "../../_generated/server";
import { getPostMetaMap, parseCourseStructureMeta } from "./helpers";

const builderLessonValidator = v.object({
  _id: v.id("posts"),
  title: v.string(),
  content: v.optional(v.string()),
  excerpt: v.optional(v.string()),
  status: v.optional(v.string()),
  order: v.optional(v.number()),
  slug: v.optional(v.string()),
});

const builderTopicValidator = v.object({
  _id: v.id("posts"),
  title: v.string(),
  excerpt: v.optional(v.string()),
  content: v.optional(v.string()),
  lessonId: v.optional(v.id("posts")),
  order: v.optional(v.number()),
});

const builderQuizValidator = v.object({
  _id: v.id("posts"),
  title: v.string(),
  excerpt: v.optional(v.string()),
  content: v.optional(v.string()),
  lessonId: v.optional(v.id("posts")),
  order: v.optional(v.number()),
  isFinal: v.optional(v.boolean()),
});

const courseStructureValidator = v.array(
  v.object({
    lessonId: v.id("posts"),
  }),
);

export const getCourseStructureWithItems = query({
  args: {
    courseId: v.id("posts"),
    organizationId: v.optional(v.id("organizations")),
  },
  returns: v.object({
    course: v.object({
      _id: v.id("posts"),
      title: v.string(),
      status: v.optional(v.string()),
      courseStructure: courseStructureValidator,
    }),
    attachedLessons: v.array(builderLessonValidator),
    attachedTopics: v.array(builderTopicValidator),
    attachedQuizzes: v.array(builderQuizValidator),
  }),
  handler: async (ctx, args): Promise<LmsCourseBuilderData> => {
    const course = await ctx.db.get(args.courseId);
    if (!course || course.postTypeSlug !== "courses") {
      throw new Error("Course not found");
    }

    const organizationId = course.organizationId ?? undefined;
    if (
      args.organizationId &&
      organizationId !== (args.organizationId ?? undefined)
    ) {
      throw new Error("Course does not belong to this organization");
    }

    const courseMeta = await getPostMetaMap(ctx, course._id);
    const structureIds = parseCourseStructureMeta(
      courseMeta.get("courseStructure"),
    );

    const attachedLessons = await fetchLessonsForCourse(
      ctx,
      course._id,
      organizationId,
      structureIds,
    );

    const lessonIdSet = new Set(attachedLessons.map((lesson) => lesson._id));
    const attachedTopics = await fetchTopicsForLessons(
      ctx,
      lessonIdSet,
      organizationId,
    );
    const attachedQuizzes = await fetchQuizzesForLessons(
      ctx,
      lessonIdSet,
      organizationId,
    );

    const structure: LmsCourseStructureItem[] = structureIds.map(
      (lessonId) => ({ lessonId }),
    );

    return {
      course: {
        _id: course._id,
        title: course.title,
        status: course.status ?? undefined,
        courseStructure: structure,
      },
      attachedLessons,
      attachedTopics,
      attachedQuizzes,
    };
  },
});

export const getAvailableLessons = query({
  args: {
    courseId: v.id("posts"),
    organizationId: v.optional(v.id("organizations")),
  },
  returns: v.array(builderLessonValidator),
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.courseId);
    if (!course || course.postTypeSlug !== "courses") {
      throw new Error("Course not found");
    }
    const organizationId = course.organizationId ?? undefined;
    if (
      args.organizationId &&
      organizationId !== (args.organizationId ?? undefined)
    ) {
      throw new Error("Course does not belong to this organization");
    }

    const lessons = await fetchLessonsByType(ctx, "lessons", organizationId);
    const available: LmsBuilderLesson[] = [];
    for (const lesson of lessons) {
      const meta = await getPostMetaMap(ctx, lesson._id);
      const metaCourseId = meta.get("courseId");
      if (
        metaCourseId === null ||
        metaCourseId === undefined ||
        metaCourseId === ""
      ) {
        available.push(lesson);
      }
    }
    return available;
  },
});

export const getAvailableTopics = query({
  args: {
    organizationId: v.optional(v.id("organizations")),
  },
  returns: v.array(builderTopicValidator),
  handler: async (ctx, args) => {
    const topics = await fetchTopicsByType(
      ctx,
      new Set<Id<"posts">>(),
      args.organizationId ?? undefined,
    );
    return topics.filter((topic) => !topic.lessonId);
  },
});

export const getAvailableQuizzes = query({
  args: {
    organizationId: v.optional(v.id("organizations")),
  },
  returns: v.array(builderQuizValidator),
  handler: async (ctx, args) => {
    const quizzes = await fetchQuizzesByType(
      ctx,
      new Set<Id<"posts">>(),
      args.organizationId ?? undefined,
    );
    return quizzes.filter((quiz) => !quiz.lessonId);
  },
});

async function fetchLessonsByType(
  ctx: QueryCtx,
  postTypeSlug: string,
  organizationId: Id<"organizations"> | undefined,
): Promise<LmsBuilderLesson[]> {
  let queryBuilder = ctx.db
    .query("posts")
    .withIndex("by_postTypeSlug", (q) => q.eq("postTypeSlug", postTypeSlug));

  if (organizationId) {
    queryBuilder = queryBuilder.filter((q) =>
      q.eq(q.field("organizationId"), organizationId),
    );
  } else {
    queryBuilder = queryBuilder.filter((q) =>
      q.eq(q.field("organizationId"), undefined),
    );
  }

  const posts = await queryBuilder.collect();
  const lessons: LmsBuilderLesson[] = [];
  for (const post of posts) {
    lessons.push({
      _id: post._id,
      title: post.title,
      content: post.content ?? undefined,
      excerpt: post.excerpt ?? undefined,
      status: post.status ?? undefined,
      slug: post.slug ?? undefined,
      order: undefined,
    });
  }
  return lessons;
}

async function fetchLessonsForCourse(
  ctx: QueryCtx,
  courseId: Id<"posts">,
  organizationId: Id<"organizations"> | undefined,
  structureIds: Id<"posts">[],
): Promise<LmsBuilderLesson[]> {
  const lessons = await fetchLessonsByType(ctx, "lessons", organizationId);
  const attached: LmsBuilderLesson[] = [];
  for (const lesson of lessons) {
    const meta = await getPostMetaMap(ctx, lesson._id);
    const metaCourseId = meta.get("courseId");
    if (metaCourseId === courseId) {
      attached.push({
        ...lesson,
        order:
          typeof meta.get("courseOrder") === "number"
            ? (meta.get("courseOrder") as number)
            : undefined,
      });
    }
  }

  attached.sort((a, b) => {
    const aIndex = structureIds.indexOf(a._id);
    const bIndex = structureIds.indexOf(b._id);
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    }
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return (a.order ?? 0) - (b.order ?? 0);
  });

  return attached;
}

async function fetchTopicsForLessons(
  ctx: QueryCtx,
  lessonIds: Set<Id<"posts">>,
  organizationId: Id<"organizations"> | undefined,
): Promise<LmsBuilderTopic[]> {
  if (lessonIds.size === 0) {
    return [];
  }
  return fetchTopicsByType(ctx, lessonIds, organizationId);
}

async function fetchTopicsByType(
  ctx: QueryCtx,
  lessonIds: Set<Id<"posts">>,
  organizationId: Id<"organizations"> | undefined,
): Promise<LmsBuilderTopic[]> {
  let queryBuilder = ctx.db
    .query("posts")
    .withIndex("by_postTypeSlug", (q) => q.eq("postTypeSlug", "topics"));

  if (organizationId) {
    queryBuilder = queryBuilder.filter((q) =>
      q.eq(q.field("organizationId"), organizationId),
    );
  } else {
    queryBuilder = queryBuilder.filter((q) =>
      q.eq(q.field("organizationId"), undefined),
    );
  }

  const topics = await queryBuilder.collect();
  const attached: LmsBuilderTopic[] = [];
  for (const topic of topics) {
    const meta = await getPostMetaMap(ctx, topic._id);
    const lessonId = meta.get("lessonId");
    if (
      lessonId &&
      typeof lessonId === "string" &&
      (lessonIds.size === 0 || lessonIds.has(lessonId as Id<"posts">))
    ) {
      attached.push({
        _id: topic._id,
        title: topic.title,
        excerpt: topic.excerpt ?? undefined,
        content: topic.content ?? undefined,
        lessonId: lessonId as Id<"posts">,
        order:
          typeof meta.get("order") === "number"
            ? (meta.get("order") as number)
            : undefined,
      });
    } else if (lessonIds.size === 0 && !lessonId) {
      attached.push({
        _id: topic._id,
        title: topic.title,
        excerpt: topic.excerpt ?? undefined,
        content: topic.content ?? undefined,
        lessonId: undefined,
        order: undefined,
      });
    }
  }
  return attached;
}

async function fetchQuizzesForLessons(
  ctx: QueryCtx,
  lessonIds: Set<Id<"posts">>,
  organizationId: Id<"organizations"> | undefined,
): Promise<LmsBuilderQuiz[]> {
  if (lessonIds.size === 0) {
    return [];
  }
  return fetchQuizzesByType(ctx, lessonIds, organizationId);
}

async function fetchQuizzesByType(
  ctx: QueryCtx,
  lessonIds: Set<Id<"posts">>,
  organizationId: Id<"organizations"> | undefined,
): Promise<LmsBuilderQuiz[]> {
  let queryBuilder = ctx.db
    .query("posts")
    .withIndex("by_postTypeSlug", (q) => q.eq("postTypeSlug", "quizzes"));

  if (organizationId) {
    queryBuilder = queryBuilder.filter((q) =>
      q.eq(q.field("organizationId"), organizationId),
    );
  } else {
    queryBuilder = queryBuilder.filter((q) =>
      q.eq(q.field("organizationId"), undefined),
    );
  }

  const quizzes = await queryBuilder.collect();
  const attached: LmsBuilderQuiz[] = [];
  for (const quiz of quizzes) {
    const meta = await getPostMetaMap(ctx, quiz._id);
    const lessonId = meta.get("lessonId");
    const lessonMatches =
      lessonIds.size === 0 ||
      (lessonId && lessonIds.has(lessonId as Id<"posts">));

    if (lessonMatches) {
      attached.push({
        _id: quiz._id,
        title: quiz.title,
        excerpt: quiz.excerpt ?? undefined,
        content: quiz.content ?? undefined,
        lessonId:
          typeof lessonId === "string" ? (lessonId as Id<"posts">) : undefined,
        order:
          typeof meta.get("order") === "number"
            ? (meta.get("order") as number)
            : undefined,
        isFinal:
          typeof meta.get("isFinal") === "boolean"
            ? (meta.get("isFinal") as boolean)
            : undefined,
      });
    }
  }
  return attached;
}








