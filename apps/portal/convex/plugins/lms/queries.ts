/* eslint-disable @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any, @typescript-eslint/consistent-generic-constructors */
import { v } from "convex/values";

import type { Id } from "../../_generated/dataModel";
import type { QueryCtx } from "../../_generated/server";
import { components as generatedComponents } from "../../_generated/api";
import { query } from "../../_generated/server";
import { getAuthenticatedUserDocIdByToken } from "../../core/lib/permissions";
import {
  fetchQuizQuestionsForQuiz,
  getPostMetaMap,
  parseCourseStructureMeta,
} from "./helpers";

const components = generatedComponents as any;

const builderLessonValidator: any = v.object({
  _id: v.string(),
  title: v.string(),
  content: v.optional(v.string()),
  excerpt: v.optional(v.string()),
  status: v.optional(v.string()),
  order: v.optional(v.number()),
  slug: v.optional(v.string()),
});

const builderTopicValidator: any = v.object({
  _id: v.string(),
  title: v.string(),
  excerpt: v.optional(v.string()),
  content: v.optional(v.string()),
  slug: v.optional(v.string()),
  lessonId: v.optional(v.string()),
  order: v.optional(v.number()),
});

const builderQuizValidator: any = v.object({
  _id: v.string(),
  title: v.string(),
  excerpt: v.optional(v.string()),
  content: v.optional(v.string()),
  slug: v.optional(v.string()),
  lessonId: v.optional(v.string()),
  topicId: v.optional(v.string()),
  order: v.optional(v.number()),
  isFinal: v.optional(v.boolean()),
});

const quizQuestionOptionValidator: any = v.object({
  id: v.string(),
  label: v.string(),
});

const quizQuestionValidator: any = v.object({
  _id: v.string(),
  title: v.string(),
  prompt: v.string(),
  quizId: v.string(),
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

const quizAttemptSummaryValidator: any = v.object({
  _id: v.string(),
  scorePercent: v.number(),
  totalQuestions: v.number(),
  gradedQuestions: v.number(),
  correctCount: v.number(),
  completedAt: v.number(),
  durationMs: v.optional(v.number()),
});

const courseStructureValidator: any = v.array(
  v.object({
    lessonId: v.string(),
  }),
);

const courseSummaryValidator: any = v.object({
  _id: v.string(),
  title: v.string(),
  slug: v.optional(v.string()),
  status: v.optional(v.string()),
});

export const listCourses = query({
  args: {
    organizationId: v.optional(v.id("organizations")),
  },
  returns: v.array(courseSummaryValidator),
  handler: async (ctx: any, args: any) => {
    const courses = (await ctx.runQuery(
      components.launchthat_lms.posts.queries.getAllPosts,
      {
        organizationId: args.organizationId
          ? String(args.organizationId)
          : undefined,
        filters: { postTypeSlug: "courses", limit: 200 },
      },
    )) as any[];
    return (courses ?? []).map((course) => ({
      _id: String(course._id),
      title: (course.title ?? "Untitled course") as string,
      slug: (course.slug ?? undefined) as string | undefined,
      status: (course.status ?? undefined) as string | undefined,
    }));
  },
});

export const getCourseStructureWithItems = query({
  args: {
    courseId: v.optional(v.string()),
    courseSlug: v.optional(v.string()),
    organizationId: v.optional(v.id("organizations")),
  },
  returns: v.object({
    course: v.object({
      _id: v.string(),
      slug: v.optional(v.string()),
      title: v.string(),
      status: v.optional(v.string()),
      courseStructure: courseStructureValidator,
    }),
    attachedLessons: v.array(builderLessonValidator),
    attachedTopics: v.array(builderTopicValidator),
    attachedQuizzes: v.array(builderQuizValidator),
  }),
  handler: async (ctx: any, args: any): Promise<any> => {
    if (!args.courseId && !args.courseSlug) {
      throw new Error("courseId or courseSlug is required");
    }

    const course = await resolveCourse(ctx, args);
    console.log("[getCourseStructureWithItems] Course:", course);
    const organizationId = course.organizationId ?? undefined;
    if (
      args.organizationId &&
      organizationId !== (args.organizationId ?? undefined)
    ) {
      throw new Error("Course does not belong to this organization");
    }

    const courseMeta = await getPostMetaMap(ctx, course._id);
    const structureIds = parseCourseStructureMeta(
      courseMeta.get("courseStructure") ?? null,
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

    const structure: any[] = structureIds.map((lessonId) => ({ lessonId }));

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
    courseId: v.string(),
    organizationId: v.optional(v.id("organizations")),
  },
  returns: v.union(
    v.object({
      courseId: v.string(),
      userId: v.id("users"),
      completedLessonIds: v.array(v.string()),
      completedTopicIds: v.array(v.string()),
      startedAt: v.optional(v.number()),
      completedAt: v.optional(v.number()),
      updatedAt: v.optional(v.number()),
      lastAccessedAt: v.optional(v.number()),
      lastAccessedId: v.optional(v.string()),
      lastAccessedType: v.optional(
        v.union(v.literal("lesson"), v.literal("topic")),
      ),
    }),
    v.null(),
  ),
  handler: async (ctx: any, args: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    const userId = await getAuthenticatedUserDocIdByToken(ctx);
    const progress = await ctx.runQuery(
      components.launchthat_lms.progress.queries.getCourseProgressByUserCourse,
      {
        userId: String(userId),
        courseId: String(args.courseId),
      },
    );
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
      progress.organizationId !== String(args.organizationId)
    ) {
      return null;
    }
    return {
      courseId: progress.courseId as Id<"posts">,
      userId,
      completedLessonIds: (progress.completedLessonIds ?? []) as Id<"posts">[],
      completedTopicIds: (progress.completedTopicIds ?? []) as Id<"posts">[],
      startedAt: progress.startedAt ?? undefined,
      completedAt: progress.completedAt ?? undefined,
      updatedAt: progress.updatedAt ?? undefined,
      lastAccessedAt: progress.lastAccessedAt ?? undefined,
      lastAccessedId: progress.lastAccessedId as Id<"posts"> | undefined,
      lastAccessedType: progress.lastAccessedType ?? undefined,
    };
  },
});

const resolveCourse = async (
  ctx: QueryCtx,
  args: {
    courseId?: string;
    courseSlug?: string;
    organizationId?: Id<"organizations">;
  },
) => {
  if (args.courseId) {
    try {
      const course = await ctx.runQuery(
        components.launchthat_lms.posts.queries.getPostByIdInternal,
        { id: args.courseId as unknown as string },
      );
      if (course && course.postTypeSlug === "courses") {
        return course;
      }
    } catch (error) {
      // If the caller passed an ID from a different table (e.g. contentAccessRules),
      // ignore and fall back to slug-based resolution.
      console.warn(
        "Failed to resolve course by courseId, falling back to slug",
        {
          courseId: args.courseId,
          error,
        },
      );
    }
  }

  if (args.courseSlug) {
    const course = await ctx.runQuery(
      components.launchthat_lms.posts.queries.getPostBySlug,
      {
        slug: args.courseSlug,
        organizationId: args.organizationId
          ? String(args.organizationId)
          : undefined,
      },
    );
    if (course && course.postTypeSlug === "courses") return course;
  }

  throw new Error("Course not found");
};

export const getAvailableLessons = query({
  args: {
    courseId: v.string(),
    organizationId: v.optional(v.id("organizations")),
  },
  returns: v.array(builderLessonValidator),
  handler: async (ctx: any, args: any) => {
    const course = await ctx.runQuery(
      components.launchthat_lms.posts.queries.getPostByIdInternal,
      { id: args.courseId as unknown as string },
    );
    if (!course || course.postTypeSlug !== "courses") {
      throw new Error("Course not found");
    }
    const organizationId = course.organizationId ?? undefined;
    if (
      args.organizationId &&
      organizationId !== String(args.organizationId ?? "")
    ) {
      throw new Error("Course does not belong to this organization");
    }

    const lessons = await fetchLessonsByType(ctx, "lessons", organizationId);
    const available: any[] = [];
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
  handler: async (ctx: any, args: any) => {
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
  handler: async (ctx: any, args: any) => {
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
  handler: async (ctx: any, args: any) => {
    const quiz = await ctx.runQuery(
      components.launchthat_lms.posts.queries.getPostByIdInternal,
      { id: args.quizId as unknown as string },
    );
    if (!quiz || quiz.postTypeSlug !== "quizzes") {
      throw new Error("Quiz not found");
    }
    const quizOrganizationId = quiz.organizationId ?? undefined;
    if (
      args.organizationId &&
      quizOrganizationId !== String(args.organizationId ?? "")
    ) {
      throw new Error("Quiz does not belong to this organization");
    }

    const questions: any[] = await fetchQuizQuestionsForQuiz(
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
  handler: async (ctx: any, args: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const userId = await getAuthenticatedUserDocIdByToken(ctx);
    const attempts = (await ctx.runQuery(
      components.launchthat_lms.progress.queries.listQuizAttemptsByUserAndQuiz,
      {
        userId: String(userId),
        quizId: String(args.quizId),
      },
    )) as any[];

    return (attempts ?? [])
      .sort((a: any, b: any) => (b.completedAt ?? 0) - (a.completedAt ?? 0))
      .slice(0, 10)
      .map((attempt) => ({
        _id: String(attempt._id),
        scorePercent: attempt.scorePercent as number,
        totalQuestions: attempt.totalQuestions as number,
        gradedQuestions: attempt.gradedQuestions as number,
        correctCount: attempt.correctCount as number,
        completedAt: attempt.completedAt as number,
        durationMs: (attempt.durationMs ?? undefined) as number | undefined,
      }));
  },
});

async function fetchLessonsByType(
  ctx: QueryCtx,
  postTypeSlug: string,
  organizationId: Id<"organizations"> | undefined,
): Promise<any[]> {
  const posts = (await ctx.runQuery(
    components.launchthat_lms.posts.queries.getAllPosts,
    {
      organizationId: organizationId ? String(organizationId) : undefined,
      filters: { postTypeSlug },
    },
  )) as any[];
  const lessons: any[] = [];
  for (const post of posts) {
    lessons.push({
      _id: post._id as Id<"posts">,
      title: (post.title ?? "Untitled") as string,
      content: (post.content ?? undefined) as string | undefined,
      excerpt: (post.excerpt ?? undefined) as string | undefined,
      status: (post.status ?? undefined) as string | undefined,
      slug: (post.slug ?? undefined) as string | undefined,
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
): Promise<any[]> {
  const lessons = await fetchLessonsByType(ctx, "lessons", organizationId);
  const attached: any[] = [];
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
): Promise<any[]> {
  if (lessonIds.size === 0) {
    return [];
  }
  return fetchTopicsByType(ctx, lessonIds, organizationId);
}

async function fetchTopicsByType(
  ctx: QueryCtx,
  lessonIds: Set<Id<"posts">>,
  organizationId: Id<"organizations"> | undefined,
): Promise<any[]> {
  const topics = (await ctx.runQuery(
    components.launchthat_lms.posts.queries.getAllPosts,
    {
      organizationId: organizationId ? String(organizationId) : undefined,
      filters: { postTypeSlug: "topics" },
    },
  )) as any[];
  const attached: any[] = [];
  for (const topic of topics) {
    const meta = await getPostMetaMap(ctx, topic._id);
    const lessonId = meta.get("lessonId");
    if (
      lessonId &&
      typeof lessonId === "string" &&
      (lessonIds.size === 0 || lessonIds.has(lessonId as Id<"posts">))
    ) {
      attached.push({
        _id: topic._id as Id<"posts">,
        title: (topic.title ?? "Untitled") as string,
        excerpt: (topic.excerpt ?? undefined) as string | undefined,
        content: (topic.content ?? undefined) as string | undefined,
        slug: (topic.slug ?? undefined) as string | undefined,
        lessonId: lessonId as Id<"posts">,
        order:
          typeof meta.get("order") === "number"
            ? (meta.get("order") as number)
            : undefined,
      });
    } else if (lessonIds.size === 0 && !lessonId) {
      attached.push({
        _id: topic._id as Id<"posts">,
        title: (topic.title ?? "Untitled") as string,
        excerpt: (topic.excerpt ?? undefined) as string | undefined,
        content: (topic.content ?? undefined) as string | undefined,
        slug: (topic.slug ?? undefined) as string | undefined,
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
): Promise<any[]> {
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
): Promise<any[]> {
  const quizzes = (await ctx.runQuery(
    components.launchthat_lms.posts.queries.getAllPosts,
    {
      organizationId: organizationId ? String(organizationId) : undefined,
      filters: { postTypeSlug: "quizzes" },
    },
  )) as any[];
  const attached: any[] = [];
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
        _id: quiz._id as Id<"posts">,
        title: (quiz.title ?? "Untitled") as string,
        excerpt: (quiz.excerpt ?? undefined) as string | undefined,
        content: (quiz.content ?? undefined) as string | undefined,
        slug: (quiz.slug ?? undefined) as string | undefined,
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
