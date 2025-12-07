/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { v } from "convex/values";

import type { Id } from "../../_generated/dataModel";
import type { QueryCtx } from "../../_generated/server";
import type {
  LmsBuilderLesson,
  LmsBuilderQuiz,
  LmsBuilderTopic,
  LmsCourseBuilderData,
  LmsCourseStructureItem,
  QuizQuestion,
} from "../../../../../packages/launchthat-plugin-lms/src/types";
import { query } from "../../_generated/server";
import { getAuthenticatedUserDocIdByToken } from "../../core/lib/permissions";
import {
  fetchQuizQuestionsForQuiz,
  getPostMetaMap,
  parseCourseStructureMeta,
} from "./helpers";

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
  slug: v.optional(v.string()),
  lessonId: v.optional(v.id("posts")),
  order: v.optional(v.number()),
});

const builderQuizValidator = v.object({
  _id: v.id("posts"),
  title: v.string(),
  excerpt: v.optional(v.string()),
  content: v.optional(v.string()),
  slug: v.optional(v.string()),
  lessonId: v.optional(v.id("posts")),
  topicId: v.optional(v.id("posts")),
  order: v.optional(v.number()),
  isFinal: v.optional(v.boolean()),
});

const quizQuestionOptionValidator: any = v.object({
  id: v.string(),
  label: v.string(),
});

const quizQuestionValidator: any = v.object({
  _id: v.id("posts"),
  title: v.string(),
  prompt: v.string(),
  quizId: v.id("posts"),
  questionType: v.union(
    v.literal("singleChoice"),
    v.literal("multipleChoice"),
    v.literal("shortText"),
    v.literal("longText"),
  ),
  options: v.array(quizQuestionOptionValidator),
  correctOptionIds: v.array(v.string()),
  answerText: v.optional(v.union(v.string(), v.null())),
  order: v.number(),
});

const quizAttemptSummaryValidator = v.object({
  _id: v.id("quizAttempts"),
  scorePercent: v.number(),
  totalQuestions: v.number(),
  gradedQuestions: v.number(),
  correctCount: v.number(),
  completedAt: v.number(),
  durationMs: v.optional(v.number()),
});

const courseStructureValidator = v.array(
  v.object({
    lessonId: v.id("posts"),
  }),
);

const courseSummaryValidator = v.object({
  _id: v.id("posts"),
  title: v.string(),
  slug: v.optional(v.string()),
  status: v.optional(v.string()),
});

export const listCourses = query({
  args: {
    organizationId: v.optional(v.id("organizations")),
  },
  returns: v.array(courseSummaryValidator),
  handler: async (ctx, args) => {
    let queryBuilder = ctx.db
      .query("posts")
      .withIndex("by_postTypeSlug", (q) => q.eq("postTypeSlug", "courses"));

    if (args.organizationId) {
      queryBuilder = queryBuilder.filter((q) =>
        q.eq(q.field("organizationId"), args.organizationId),
      );
    } else {
      queryBuilder = queryBuilder.filter((q) =>
        q.eq(q.field("organizationId"), undefined),
      );
    }

    const courses = await queryBuilder.collect();
    return courses.map((course) => ({
      _id: course._id,
      title: course.title ?? "Untitled course",
      slug: course.slug ?? undefined,
      status: course.status ?? undefined,
    }));
  },
});

export const getCourseStructureWithItems = query({
  args: {
    courseId: v.optional(v.id("posts")),
    courseSlug: v.optional(v.string()),
    organizationId: v.optional(v.id("organizations")),
  },
  returns: v.object({
    course: v.object({
      _id: v.id("posts"),
      slug: v.optional(v.string()),
      title: v.string(),
      status: v.optional(v.string()),
      courseStructure: courseStructureValidator,
    }),
    attachedLessons: v.array(builderLessonValidator),
    attachedTopics: v.array(builderTopicValidator),
    attachedQuizzes: v.array(builderQuizValidator),
  }),
  handler: async (ctx, args): Promise<LmsCourseBuilderData> => {
    if (!args.courseId && !args.courseSlug) {
      throw new Error("courseId or courseSlug is required");
    }

    const course = await resolveCourse(ctx, args);
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

    const lessonIdSet: Set<Id<"posts">> = new Set(
      attachedLessons.map((lesson) => lesson._id),
    );
    const attachedTopics = await fetchTopicsForLessons(
      ctx,
      lessonIdSet,
      organizationId,
    );
    const attachedQuizzes = await fetchQuizzesForLessons(
      ctx,
      lessonIdSet,
      organizationId,
      course._id,
    );

    const structure: LmsCourseStructureItem[] = structureIds.map(
      (lessonId) => ({ lessonId }),
    );

    return {
      course: {
        _id: course._id,
        slug: course.slug ?? undefined,
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

export const getCourseProgressForViewer = query({
  args: {
    courseId: v.id("posts"),
    organizationId: v.optional(v.id("organizations")),
  },
  returns: v.union(
    v.object({
      courseId: v.id("posts"),
      userId: v.id("users"),
      completedLessonIds: v.array(v.id("posts")),
      completedTopicIds: v.array(v.id("posts")),
      startedAt: v.optional(v.number()),
      completedAt: v.optional(v.number()),
      updatedAt: v.optional(v.number()),
      lastAccessedAt: v.optional(v.number()),
      lastAccessedId: v.optional(v.id("posts")),
      lastAccessedType: v.optional(
        v.union(v.literal("lesson"), v.literal("topic")),
      ),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    const userId = await getAuthenticatedUserDocIdByToken(ctx);
    const progress = await ctx.db
      .query("courseProgress")
      .withIndex("by_user_course", (q) =>
        q.eq("userId", userId).eq("courseId", args.courseId),
      )
      .unique();
    if (!progress) {
      return {
        courseId: args.courseId,
        userId,
        completedLessonIds: [],
        completedTopicIds: [],
        startedAt: undefined,
        completedAt: undefined,
        updatedAt: undefined,
        lastAccessedAt: undefined,
        lastAccessedId: undefined,
        lastAccessedType: undefined,
      };
    }
    if (
      args.organizationId &&
      progress.organizationId &&
      progress.organizationId !== args.organizationId
    ) {
      return null;
    }
    return {
      courseId: progress.courseId,
      userId: progress.userId,
      completedLessonIds: progress.completedLessonIds,
      completedTopicIds: progress.completedTopicIds,
      startedAt: progress.startedAt,
      completedAt: progress.completedAt,
      updatedAt: progress.updatedAt,
      lastAccessedAt: progress.lastAccessedAt,
      lastAccessedId: progress.lastAccessedId,
      lastAccessedType: progress.lastAccessedType,
    };
  },
});

const resolveCourse = async (
  ctx: QueryCtx,
  args: { courseId?: Id<"posts">; courseSlug?: string },
) => {
  if (args.courseId) {
    const course = await ctx.db.get(args.courseId);
    if (course && course.postTypeSlug === "courses") {
      return course;
    }
  }

  if (args.courseSlug) {
    const course = await ctx.db
      .query("posts")
      .withIndex("by_slug", (q) => q.eq("slug", args.courseSlug as string))
      .first();
    if (course && course.postTypeSlug === "courses") {
      return course;
    }
  }

  throw new Error("Course not found");
};

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
      undefined,
    );
    return quizzes.filter((quiz) => !quiz.lessonId);
  },
});

export const getQuizBuilderState = query({
  args: {
    quizId: v.id("posts"),
    organizationId: v.optional(v.id("organizations")),
  },
  returns: v.object({
    quiz: v.object({
      _id: v.id("posts"),
      title: v.string(),
      slug: v.optional(v.string()),
      status: v.optional(v.string()),
    }),
    questions: v.array(quizQuestionValidator),
  }),
  handler: async (ctx, args) => {
    const quiz = await ctx.db.get(args.quizId);
    if (!quiz || quiz.postTypeSlug !== "quizzes") {
      throw new Error("Quiz not found");
    }
    const quizOrganizationId = quiz.organizationId ?? undefined;
    if (
      args.organizationId &&
      quizOrganizationId !== (args.organizationId ?? undefined)
    ) {
      throw new Error("Quiz does not belong to this organization");
    }

    const questions: QuizQuestion[] = await fetchQuizQuestionsForQuiz(
      ctx,
      args.quizId,
      quizOrganizationId,
    );

    return {
      quiz: {
        _id: quiz._id,
        title: quiz.title ?? "Untitled quiz",
        slug: quiz.slug ?? undefined,
        status: quiz.status ?? undefined,
      },
      questions,
    };
  },
});

export const getQuizAttemptsForViewer = query({
  args: {
    quizId: v.id("posts"),
  },
  returns: v.array(quizAttemptSummaryValidator),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const userId = await getAuthenticatedUserDocIdByToken(ctx);
    const attempts = await ctx.db
      .query("quizAttempts")
      .withIndex("by_quiz_user", (q) =>
        q.eq("quizId", args.quizId).eq("userId", userId),
      )
      .order("desc")
      .take(10);

    return attempts.map((attempt) => ({
      _id: attempt._id,
      scorePercent: attempt.scorePercent,
      totalQuestions: attempt.totalQuestions,
      gradedQuestions: attempt.gradedQuestions,
      correctCount: attempt.correctCount,
      completedAt: attempt.completedAt,
      durationMs: attempt.durationMs ?? undefined,
    }));
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
        slug: topic.slug ?? undefined,
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
        slug: topic.slug ?? undefined,
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
  courseId?: Id<"posts">,
): Promise<LmsBuilderQuiz[]> {
  if (lessonIds.size === 0) {
    return [];
  }
  return fetchQuizzesByType(ctx, lessonIds, organizationId, courseId);
}

async function fetchQuizzesByType(
  ctx: QueryCtx,
  lessonIds: Set<Id<"posts">>,
  organizationId: Id<"organizations"> | undefined,
  courseId?: Id<"posts">,
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
    const topicId = meta.get("topicId");
    const metaCourseId = meta.get("courseId");
    const courseMatches =
      !courseId ||
      (typeof metaCourseId === "string" && metaCourseId === courseId);

    if (lessonMatches || courseMatches) {
      attached.push({
        _id: quiz._id,
        title: quiz.title,
        excerpt: quiz.excerpt ?? undefined,
        content: quiz.content ?? undefined,
        slug: quiz.slug ?? undefined,
        lessonId:
          typeof lessonId === "string" ? (lessonId as Id<"posts">) : undefined,
        topicId:
          typeof topicId === "string" ? (topicId as Id<"posts">) : undefined,
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
