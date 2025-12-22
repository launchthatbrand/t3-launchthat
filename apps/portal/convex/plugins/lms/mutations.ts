import { v } from "convex/values";

import type { Id } from "../../_generated/dataModel";
import type { MutationCtx } from "../../_generated/server";
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any */
import {
  api as generatedApi,
  components as generatedComponents,
} from "../../_generated/api";
import { mutation as baseMutation } from "../../_generated/server";
import { PORTAL_TENANT_SLUG } from "../../constants";
import { getAuthenticatedUserDocIdByToken } from "../../core/lib/permissions";
import {
  buildQuizQuestionMetaPayload,
  deletePostMetaValue,
  fetchQuizQuestionsForQuiz,
  getPostMetaMap,
  loadQuizQuestionById,
  parseCourseStructureMeta,
  QUIZ_QUESTION_META_KEYS,
  serializeCourseStructureMeta,
  setPostMetaValue,
} from "./helpers";

const api = generatedApi as any;
const components = generatedComponents as any;
const mutation = baseMutation as any;

const ensureCourseAndLesson = async (
  ctx: MutationCtx,
  courseId: Id<"posts">,
  lessonId: Id<"posts">,
) => {
  const course = await ctx.runQuery(
    components.launchthat_lms.posts.queries.getPostByIdInternal,
    { id: courseId as unknown as string },
  );
  if (!course || course.postTypeSlug !== "courses") {
    throw new Error("Course not found");
  }
  const lesson = await ctx.runQuery(
    components.launchthat_lms.posts.queries.getPostByIdInternal,
    { id: lessonId as unknown as string },
  );
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

type PostMetaMap = Map<string, unknown>;

const getMetaString = (map: PostMetaMap, key: string): string | null => {
  const rawValue = map.get(key);
  if (typeof rawValue === "string" && rawValue.length > 0) {
    return rawValue;
  }
  return null;
};

const vimeoVideoInput: any = v.object({
  videoId: v.string(),
  title: v.string(),
  description: v.optional(v.string()),
  embedUrl: v.optional(v.string()),
  thumbnailUrl: v.optional(v.string()),
});
const postStatusValidator: any = v.optional(
  v.union(v.literal("draft"), v.literal("published")),
);

const quizQuestionOptionInput: any = v.object({
  id: v.string(),
  label: v.string(),
});

const quizQuestionTypeValidator: any = v.union(
  v.literal("singleChoice"),
  v.literal("multipleChoice"),
  v.literal("shortText"),
  v.literal("longText"),
);

const quizQuestionInputValidator: any = v.object({
  prompt: v.string(),
  questionType: quizQuestionTypeValidator,
  options: v.optional(v.array(quizQuestionOptionInput)),
  correctOptionIds: v.optional(v.array(v.string())),
  answerText: v.optional(v.union(v.string(), v.null())),
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
  questionType: quizQuestionTypeValidator,
  options: v.array(quizQuestionOptionValidator),
  correctOptionIds: v.array(v.string()),
  answerText: v.optional(v.union(v.string(), v.null())),
  order: v.number(),
});

const quizAttemptResponseInput: any = v.object({
  questionId: v.string(),
  questionType: quizQuestionTypeValidator,
  selectedOptionIds: v.optional(v.array(v.string())),
  answerText: v.optional(v.string()),
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

export const ensureQuizQuestionPostType: any = mutation({
  args: {
    organizationId: v.optional(v.id("organizations")),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx: any, args: any) => {
    await ctx.runMutation(api.core.postTypes.mutations.enableForOrganization, {
      slug: "lms-quiz-question",
      organizationId: args.organizationId ?? PORTAL_TENANT_SLUG,
      definition: {
        name: "Quiz Questions",
        description: "Individual quiz questions managed through the builder.",
        isPublic: false,
        enableApi: false,
        includeTimestamps: true,
        supports: {
          title: true,
          editor: true,
          customFields: true,
        },
        rewrite: {
          hasArchive: false,
          withFront: true,
          feeds: false,
          pages: false,
        },
        adminMenu: {
          enabled: true,
          label: "Quiz Questions",
          slug: "lms-quiz-question",
          parent: "lms",
          icon: "HelpCircle",
          position: 34,
        },
        storageKind: "component",
        storageTables: ["launchthat_lms:posts", "launchthat_lms:postsMeta"],
      },
    });

    return { success: true };
  },
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

const buildEntitySlug = (prefix: string, label: string) => {
  const base = slugify(label) || prefix;
  const randomSuffix = Math.random().toString(36).slice(-6);
  return `${base}-${randomSuffix}`;
};

const DEFAULT_EMBED_WIDTH = 640;
const DEFAULT_EMBED_HEIGHT = 360;
const VIMEO_PLAYER_BASE_URL = "https://player.vimeo.com/video/";

const extractNumericVideoId = (video: {
  videoId: string;
  embedUrl?: string;
}) => {
  const directMatch = video.videoId.match(/\d+/g);
  if (directMatch?.length) {
    return directMatch[directMatch.length - 1] as unknown as string;
  }
  if (video.embedUrl) {
    try {
      const parsed = new URL(video.embedUrl);
      const numericSegment = parsed.pathname
        .split("/")
        .filter(Boolean)
        .reverse()
        .find((segment) => /^\d+$/.test(segment));
      if (numericSegment) {
        return numericSegment;
      }
    } catch {
      // noop
    }
  }
  return video.videoId;
};

const normalizeVimeoEmbedUrl = (video: {
  videoId: string;
  embedUrl?: string;
}) => {
  const numericVideoId = extractNumericVideoId(video);
  const fallbackUrl = `${VIMEO_PLAYER_BASE_URL}${encodeURIComponent(
    numericVideoId,
  )}`;

  if (!video.embedUrl) {
    return fallbackUrl;
  }

  try {
    const parsed = new URL(video.embedUrl);
    const hostname = parsed.hostname.toLowerCase();

    if (hostname === "player.vimeo.com") {
      if (!parsed.pathname.includes(numericVideoId)) {
        parsed.pathname = `/video/${encodeURIComponent(numericVideoId)}`;
      }
      return parsed.toString();
    }

    if (!hostname.endsWith("vimeo.com")) {
      return fallbackUrl;
    }

    const pathSegments = parsed.pathname.split("/").filter(Boolean);
    const numericSegmentIndex = pathSegments.findIndex(
      (segment) => segment === numericVideoId || /^\d+$/.test(segment),
    );
    const hashFromPath =
      numericSegmentIndex >= 0 && numericSegmentIndex + 1 < pathSegments.length
        ? pathSegments[numericSegmentIndex + 1]
        : undefined;

    const normalized = new URL(
      `${VIMEO_PLAYER_BASE_URL}${encodeURIComponent(numericVideoId)}`,
    );
    const hashParam = parsed.searchParams.get("h") ?? hashFromPath;

    if (hashParam) {
      normalized.searchParams.set("h", hashParam);
    }

    parsed.searchParams.forEach((value, key) => {
      if (key === "h") {
        return;
      }
      normalized.searchParams.set(key, value);
    });

    return normalized.toString();
  } catch {
    return fallbackUrl;
  }
};

const buildVimeoEmbedHtml = (embedUrl: string) => {
  return `<iframe src="${embedUrl}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen style="width:100%;height:${DEFAULT_EMBED_HEIGHT}px;"></iframe>`;
};

const createLexicalStateWithVimeoEmbed = (video: {
  videoId: string;
  title: string;
  embedUrl?: string;
  thumbnailUrl?: string;
}) => {
  const embedUrl = normalizeVimeoEmbedUrl(video);
  const html = buildVimeoEmbedHtml(embedUrl);
  return JSON.stringify({
    root: {
      children: [
        {
          type: "oembed",
          format: "",
          indent: 0,
          direction: "ltr",
          version: 1,
          url: embedUrl,
          providerName: "Vimeo",
          title: video.title,
          html,
          width: DEFAULT_EMBED_WIDTH,
          height: DEFAULT_EMBED_HEIGHT,
          thumbnailUrl: video.thumbnailUrl ?? undefined,
          videoId: video.videoId,
        },
      ],
      direction: "ltr",
      format: "",
      indent: 0,
      type: "root",
      version: 1,
    },
    version: 1,
  });
};

const getCourseProgressDoc = async (
  ctx: MutationCtx,
  userId: Id<"users">,
  courseId: Id<"posts">,
) => {
  return await ctx.runQuery(
    components.launchthat_lms.progress.queries.getCourseProgressByUserCourse,
    {
      userId: String(userId),
      courseId: String(courseId),
    },
  );
};

const createCourseProgressDoc = async (
  ctx: MutationCtx,
  userId: Id<"users">,
  courseId: Id<"posts">,
  organizationId: Id<"organizations"> | undefined,
) => {
  return await ctx.runMutation(
    components.launchthat_lms.progress.mutations.upsertCourseProgress,
    {
      userId: String(userId),
      courseId: String(courseId),
      organizationId: organizationId ? String(organizationId) : undefined,
      completedLessonIds: [],
      completedTopicIds: [],
      startedAt: Date.now(),
    },
  );
};

const ensureCourseProgressDoc = async (
  ctx: MutationCtx,
  userId: Id<"users">,
  courseId: Id<"posts">,
  organizationId: Id<"organizations"> | undefined,
) => {
  const existing = await getCourseProgressDoc(ctx, userId, courseId);
  if (existing) {
    return existing;
  }
  return createCourseProgressDoc(ctx, userId, courseId, organizationId);
};

const resolveCourseContextFromLesson = async (
  ctx: MutationCtx,
  lessonId: Id<"posts">,
  explicitCourseId?: Id<"posts">,
) => {
  const lesson = await ctx.runQuery(
    components.launchthat_lms.posts.queries.getPostByIdInternal,
    { id: lessonId as unknown as string },
  );
  if (!lesson || lesson.postTypeSlug !== "lessons") {
    throw new Error("Lesson not found");
  }

  const lessonMeta = await getPostMetaMap(ctx, lessonId);
  const metaCourseId = getMetaString(lessonMeta, "courseId");
  const courseId = explicitCourseId ?? (metaCourseId as Id<"posts"> | null);
  if (!courseId) {
    throw new Error("Lesson is not attached to a course");
  }
  const course = await ctx.runQuery(
    components.launchthat_lms.posts.queries.getPostByIdInternal,
    { id: courseId as unknown as string },
  );
  if (!course || course.postTypeSlug !== "courses") {
    throw new Error("Course not found");
  }

  return {
    courseId,
    organizationId: course.organizationId ?? undefined,
  };
};

const resolveCourseContextFromTopic = async (
  ctx: MutationCtx,
  topicId: Id<"posts">,
  explicitLessonId?: Id<"posts">,
  explicitCourseId?: Id<"posts">,
) => {
  const topic = await ctx.runQuery(
    components.launchthat_lms.posts.queries.getPostByIdInternal,
    { id: topicId as unknown as string },
  );
  if (!topic || topic.postTypeSlug !== "topics") {
    throw new Error("Topic not found");
  }
  const topicMeta = await getPostMetaMap(ctx, topicId);
  const metaLessonId = getMetaString(topicMeta, "lessonId");
  const lessonId = explicitLessonId ?? (metaLessonId as Id<"posts"> | null);
  if (!lessonId) {
    throw new Error("Topic is not attached to a lesson");
  }
  const lessonContext = await resolveCourseContextFromLesson(
    ctx,
    lessonId,
    explicitCourseId,
  );
  return {
    lessonId,
    courseId: lessonContext.courseId,
    organizationId: lessonContext.organizationId,
  };
};

const attachLessonToCourseInternal = async (
  ctx: MutationCtx,
  courseId: Id<"posts">,
  lessonId: Id<"posts">,
) => {
  const { course } = await ensureCourseAndLesson(ctx, courseId, lessonId);

  const courseMeta = await getPostMetaMap(ctx, course._id);
  const structure = parseCourseStructureMeta(
    courseMeta.get("courseStructure") ?? null,
  );
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

export const addLessonToCourse: any = mutation({
  args: {
    courseId: v.string(),
    lessonId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx: any, args: any) => {
    await attachLessonToCourseInternal(
      ctx,
      args.courseId as unknown as Id<"posts">,
      args.lessonId as unknown as Id<"posts">,
    );
    return { success: true };
  },
});

export const removeLessonFromCourseStructure: any = mutation({
  args: {
    courseId: v.string(),
    lessonId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx: any, args: any) => {
    const course = await ctx.runQuery(
      components.launchthat_lms.posts.queries.getPostByIdInternal,
      { id: args.courseId as unknown as string },
    );
    if (!course || course.postTypeSlug !== "courses") {
      throw new Error("Course not found");
    }

    const courseMeta = await getPostMetaMap(ctx, course._id);
    const structure = parseCourseStructureMeta(
      courseMeta.get("courseStructure") ?? null,
    );
    const filtered = structure.filter((id) => id !== args.lessonId);
    await setPostMetaValue(
      ctx,
      course._id,
      "courseStructure",
      serializeCourseStructureMeta(filtered),
    );

    await deletePostMetaValue(
      ctx,
      args.lessonId as unknown as Id<"posts">,
      "courseId",
    );
    await deletePostMetaValue(
      ctx,
      args.lessonId as unknown as Id<"posts">,
      "courseOrder",
    );
    await deletePostMetaValue(
      ctx,
      args.lessonId as unknown as Id<"posts">,
      "courseSlug",
    );
    return { success: true };
  },
});

export const reorderLessonsInCourse: any = mutation({
  args: {
    courseId: v.string(),
    orderedLessonIds: v.array(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx: any, args: any) => {
    const course = await ctx.runQuery(
      components.launchthat_lms.posts.queries.getPostByIdInternal,
      { id: args.courseId as unknown as string },
    );
    if (!course || course.postTypeSlug !== "courses") {
      throw new Error("Course not found");
    }

    await setPostMetaValue(
      ctx,
      course._id,
      "courseStructure",
      serializeCourseStructureMeta(
        args.orderedLessonIds as unknown as Id<"posts">[],
      ),
    );

    await Promise.all(
      args.orderedLessonIds.map((lessonId: string, index: number) =>
        setPostMetaValue(
          ctx,
          lessonId as unknown as Id<"posts">,
          "courseOrder",
          index,
        ),
      ),
    );

    return { success: true };
  },
});

export const attachTopicToLesson: any = mutation({
  args: {
    lessonId: v.string(),
    topicId: v.string(),
    order: v.optional(v.number()),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx: any, args: any) => {
    const lesson = await ctx.runQuery(
      components.launchthat_lms.posts.queries.getPostByIdInternal,
      { id: args.lessonId as unknown as string },
    );
    if (!lesson || lesson.postTypeSlug !== "lessons") {
      throw new Error("Lesson not found");
    }
    const topic = await ctx.runQuery(
      components.launchthat_lms.posts.queries.getPostByIdInternal,
      { id: args.topicId as unknown as string },
    );
    if (!topic || topic.postTypeSlug !== "topics") {
      throw new Error("Topic not found");
    }
    if (
      (lesson.organizationId ?? undefined) !==
      (topic.organizationId ?? undefined)
    ) {
      throw new Error("Lesson and topic must belong to the same organization");
    }

    await setPostMetaValue(
      ctx,
      args.topicId as unknown as Id<"posts">,
      "lessonId",
      args.lessonId as unknown as Id<"posts">,
    );
    await setPostMetaValue(
      ctx,
      args.topicId as unknown as Id<"posts">,
      "lessonSlug",
      lesson.slug ?? lesson._id,
    );
    const lessonMeta: PostMetaMap = await getPostMetaMap(
      ctx,
      args.lessonId as unknown as Id<"posts">,
    );
    let courseSlugValue = getMetaString(lessonMeta, "courseSlug");
    if (!courseSlugValue) {
      const courseIdMeta = getMetaString(lessonMeta, "courseId");
      if (courseIdMeta) {
        const parentCourse = await ctx.runQuery(
          components.launchthat_lms.posts.queries.getPostByIdInternal,
          { id: courseIdMeta },
        );
        if (parentCourse) {
          courseSlugValue = parentCourse.slug ?? parentCourse._id;
          await setPostMetaValue(
            ctx,
            args.lessonId as unknown as Id<"posts">,
            "courseSlug",
            courseSlugValue,
          );
        }
      }
    }
    if (courseSlugValue) {
      await setPostMetaValue(
        ctx,
        args.topicId as unknown as Id<"posts">,
        "courseSlug",
        courseSlugValue,
      );
    }
    if (typeof args.order === "number") {
      await setPostMetaValue(
        ctx,
        args.topicId as unknown as Id<"posts">,
        "order",
        args.order,
      );
    }
    return { success: true };
  },
});

export const removeTopicFromLesson: any = mutation({
  args: {
    topicId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx: any, args: any) => {
    const topicId = args.topicId as unknown as Id<"posts">;
    await deletePostMetaValue(ctx, topicId, "lessonId");
    await deletePostMetaValue(ctx, topicId, "order");
    await deletePostMetaValue(ctx, topicId, "lessonSlug");
    await deletePostMetaValue(ctx, topicId, "courseSlug");
    return { success: true };
  },
});

export const reorderTopicsInLesson: any = mutation({
  args: {
    lessonId: v.string(),
    orderedTopicIds: v.array(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx: any, args: any) => {
    const lesson = await ctx.runQuery(
      components.launchthat_lms.posts.queries.getPostByIdInternal,
      { id: args.lessonId as unknown as string },
    );
    if (!lesson || lesson.postTypeSlug !== "lessons") {
      throw new Error("Lesson not found");
    }

    await Promise.all(
      args.orderedTopicIds.map((topicId: string, index: number) =>
        setPostMetaValue(
          ctx,
          topicId as unknown as Id<"posts">,
          "order",
          index,
        ),
      ),
    );
    return { success: true };
  },
});

export const attachQuizToLesson: any = mutation({
  args: {
    lessonId: v.string(),
    quizId: v.string(),
    order: v.optional(v.number()),
    isFinal: v.optional(v.boolean()),
    topicId: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx: MutationCtx, args: any) => {
    const lesson = await ctx.runQuery(
      components.launchthat_lms.posts.queries.getPostByIdInternal,
      { id: args.lessonId as unknown as string },
    );
    if (!lesson || lesson.postTypeSlug !== "lessons") {
      throw new Error("Lesson not found");
    }
    const quiz = await ctx.runQuery(
      components.launchthat_lms.posts.queries.getPostByIdInternal,
      { id: args.quizId as unknown as string },
    );
    if (!quiz || quiz.postTypeSlug !== "quizzes") {
      throw new Error("Quiz not found");
    }
    if (
      (lesson.organizationId ?? undefined) !==
      (quiz.organizationId ?? undefined)
    ) {
      throw new Error("Lesson and quiz must belong to the same organization");
    }

    await setPostMetaValue(
      ctx,
      args.quizId as unknown as Id<"posts">,
      "lessonId",
      args.lessonId as unknown as Id<"posts">,
    );
    await setPostMetaValue(
      ctx,
      args.quizId as unknown as Id<"posts">,
      "lessonSlug",
      lesson.slug ?? lesson._id,
    );
    const lessonMeta: PostMetaMap = await getPostMetaMap(
      ctx,
      args.lessonId as unknown as Id<"posts">,
    );
    let lessonCourseSlug = getMetaString(lessonMeta, "courseSlug");
    const lessonCourseIdMeta = getMetaString(lessonMeta, "courseId");
    if (lessonCourseIdMeta) {
      await setPostMetaValue(
        ctx,
        args.quizId as unknown as Id<"posts">,
        "courseId",
        lessonCourseIdMeta,
      );
    }
    if (!lessonCourseSlug) {
      if (lessonCourseIdMeta) {
        const parentCourse = await ctx.runQuery(
          components.launchthat_lms.posts.queries.getPostByIdInternal,
          { id: lessonCourseIdMeta },
        );
        if (parentCourse) {
          lessonCourseSlug = parentCourse.slug ?? parentCourse._id;
          await setPostMetaValue(
            ctx,
            args.lessonId as unknown as Id<"posts">,
            "courseSlug",
            lessonCourseSlug,
          );
        }
      }
    }
    if (lessonCourseSlug) {
      await setPostMetaValue(
        ctx,
        args.quizId as unknown as Id<"posts">,
        "courseSlug",
        lessonCourseSlug,
      );
    }
    if (typeof args.order === "number") {
      await setPostMetaValue(
        ctx,
        args.quizId as unknown as Id<"posts">,
        "order",
        args.order,
      );
    }
    if (typeof args.isFinal === "boolean") {
      await setPostMetaValue(
        ctx,
        args.quizId as unknown as Id<"posts">,
        "isFinal",
        args.isFinal,
      );
    }
    if (args.topicId) {
      await setPostMetaValue(
        ctx,
        args.quizId as unknown as Id<"posts">,
        "topicId",
        args.topicId as unknown as Id<"posts">,
      );
    }
    return { success: true };
  },
});

export const removeQuizFromLesson: any = mutation({
  args: {
    quizId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx: any, args: any) => {
    const quizId = args.quizId as unknown as Id<"posts">;
    await deletePostMetaValue(ctx, quizId, "lessonId");
    await deletePostMetaValue(ctx, quizId, "order");
    await deletePostMetaValue(ctx, quizId, "isFinal");
    await deletePostMetaValue(ctx, quizId, "lessonSlug");
    await deletePostMetaValue(ctx, quizId, "courseSlug");
    await deletePostMetaValue(ctx, quizId, "courseId");
    return { success: true };
  },
});

export const attachFinalQuizToCourse: any = mutation({
  args: {
    courseId: v.string(),
    quizId: v.string(),
    order: v.optional(v.number()),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx: any, args: any) => {
    const course = await ctx.runQuery(
      components.launchthat_lms.posts.queries.getPostByIdInternal,
      { id: args.courseId as unknown as string },
    );
    if (!course || course.postTypeSlug !== "courses") {
      throw new Error("Course not found");
    }
    const quiz = await ctx.runQuery(
      components.launchthat_lms.posts.queries.getPostByIdInternal,
      { id: args.quizId as unknown as string },
    );
    if (!quiz || quiz.postTypeSlug !== "quizzes") {
      throw new Error("Quiz not found");
    }
    if (
      (course.organizationId ?? undefined) !==
      (quiz.organizationId ?? undefined)
    ) {
      throw new Error("Course and quiz must belong to the same organization");
    }

    await deletePostMetaValue(ctx, args.quizId, "lessonId");
    await deletePostMetaValue(ctx, args.quizId, "topicId");
    await deletePostMetaValue(ctx, args.quizId, "lessonSlug");

    await setPostMetaValue(
      ctx,
      args.quizId as unknown as Id<"posts">,
      "courseId",
      args.courseId,
    );
    await setPostMetaValue(
      ctx,
      args.quizId as unknown as Id<"posts">,
      "courseSlug",
      course.slug ?? course._id,
    );
    if (typeof args.order === "number") {
      await setPostMetaValue(
        ctx,
        args.quizId as unknown as Id<"posts">,
        "order",
        args.order,
      );
    }
    await setPostMetaValue(
      ctx,
      args.quizId as unknown as Id<"posts">,
      "isFinal",
      true,
    );
    return { success: true };
  },
});

export const removeFinalQuizFromCourse: any = mutation({
  args: {
    quizId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx: any, args: any) => {
    const quizId = args.quizId as unknown as Id<"posts">;
    await deletePostMetaValue(ctx, quizId, "courseId");
    await deletePostMetaValue(ctx, quizId, "courseSlug");
    await deletePostMetaValue(ctx, quizId, "order");
    await deletePostMetaValue(ctx, quizId, "isFinal");
    return { success: true };
  },
});

export const createLessonFromVimeo: any = mutation({
  args: {
    courseId: v.string(),
    organizationId: v.optional(v.id("organizations")),
    video: vimeoVideoInput,
    status: postStatusValidator,
  },
  returns: v.object({
    lessonId: v.string(),
  }),
  handler: async (ctx: any, args: any) => {
    const normalizedEmbedUrl = normalizeVimeoEmbedUrl(args.video);
    const status = args.status ?? "draft";
    const lessonId = await ctx.runMutation(
      components.launchthat_lms.posts.mutations.createPost,
      {
        title: args.video.title,
        slug: buildSlug("lesson", args.video.title, args.video.videoId),
        status,
        postTypeSlug: "lessons",
        organizationId: args.organizationId
          ? String(args.organizationId)
          : undefined,
        content: createLexicalStateWithVimeoEmbed({
          ...args.video,
          embedUrl: normalizedEmbedUrl,
        }),
        meta: {
          vimeoVideoId: args.video.videoId,
          vimeoEmbedUrl: normalizedEmbedUrl,
          vimeoThumbnailUrl: args.video.thumbnailUrl ?? "",
          source: "vimeo",
        },
      },
    );
    await attachLessonToCourseInternal(
      ctx,
      args.courseId as unknown as Id<"posts">,
      lessonId as unknown as Id<"posts">,
    );
    return { lessonId: String(lessonId) };
  },
});

export const createTopicFromVimeo: any = mutation({
  args: {
    lessonId: v.string(),
    organizationId: v.optional(v.id("organizations")),
    video: vimeoVideoInput,
    status: postStatusValidator,
  },
  returns: v.object({
    topicId: v.string(),
  }),
  handler: async (ctx: any, args: any) => {
    const normalizedEmbedUrl = normalizeVimeoEmbedUrl(args.video);
    const status = args.status ?? "draft";
    const topicId = await ctx.runMutation(
      components.launchthat_lms.posts.mutations.createPost,
      {
        title: args.video.title,
        slug: buildSlug("topic", args.video.title, args.video.videoId),
        status,
        postTypeSlug: "topics",
        organizationId: args.organizationId
          ? String(args.organizationId)
          : undefined,
        content: createLexicalStateWithVimeoEmbed({
          ...args.video,
          embedUrl: normalizedEmbedUrl,
        }),
        meta: {
          vimeoVideoId: args.video.videoId,
          vimeoEmbedUrl: normalizedEmbedUrl,
          vimeoThumbnailUrl: args.video.thumbnailUrl ?? "",
          source: "vimeo",
        },
      },
    );
    await ctx.runMutation(api.plugins.lms.mutations.attachTopicToLesson, {
      lessonId: args.lessonId,
      topicId: topicId as unknown as Id<"posts">,
      order: 0,
    });
    return { topicId: String(topicId) };
  },
});

export const createQuizFromVimeo: any = mutation({
  args: {
    targetLessonId: v.optional(v.string()),
    targetTopicId: v.optional(v.string()),
    organizationId: v.optional(v.id("organizations")),
    video: vimeoVideoInput,
    status: postStatusValidator,
  },
  returns: v.object({
    quizId: v.string(),
  }),
  handler: async (ctx: any, args: any) => {
    if (!args.targetLessonId) {
      throw new Error("targetLessonId is required when creating quizzes");
    }
    const normalizedEmbedUrl = normalizeVimeoEmbedUrl(args.video);
    const status = args.status ?? "draft";
    const quizId = await ctx.runMutation(
      components.launchthat_lms.posts.mutations.createPost,
      {
        title: args.video.title,
        slug: buildSlug("quiz", args.video.title, args.video.videoId),
        status,
        postTypeSlug: "quizzes",
        organizationId: args.organizationId
          ? String(args.organizationId)
          : undefined,
        meta: {
          vimeoVideoId: args.video.videoId,
          vimeoEmbedUrl: normalizedEmbedUrl,
          vimeoThumbnailUrl: args.video.thumbnailUrl ?? "",
          source: "vimeo",
        },
      },
    );
    await ctx.runMutation(api.plugins.lms.mutations.attachQuizToLesson, {
      lessonId: args.targetLessonId,
      quizId: quizId as unknown as Id<"posts">,
      order: 0,
      isFinal: false,
      topicId: args.targetTopicId,
    });
    return { quizId: String(quizId) };
  },
});

export const createQuizQuestion: any = mutation({
  args: {
    quizId: v.string(),
    organizationId: v.optional(v.id("organizations")),
    question: quizQuestionInputValidator,
  },
  returns: v.object({
    question: quizQuestionValidator,
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

    const existingQuestions = await fetchQuizQuestionsForQuiz(
      ctx,
      args.quizId,
      quizOrganizationId,
    );
    const nextOrder =
      existingQuestions.length > 0
        ? Math.max(...existingQuestions.map((question) => question.order)) + 1
        : 0;

    const slug = buildEntitySlug("quiz-question", args.question.prompt);
    const questionId = await ctx.runMutation(
      components.launchthat_lms.posts.mutations.createPost,
      {
        title: args.question.prompt,
        slug,
        status: "draft",
        postTypeSlug: "lms-quiz-question",
        organizationId: quizOrganizationId,
      },
    );

    const metaPayload = buildQuizQuestionMetaPayload(
      args.quizId,
      args.question,
      nextOrder,
    );
    await Promise.all(
      Object.entries(metaPayload).map(([key, value]) =>
        setPostMetaValue(ctx, questionId as unknown as Id<"posts">, key, value),
      ),
    );

    const question = await loadQuizQuestionById(
      ctx,
      questionId as unknown as Id<"posts">,
    );
    if (!question) {
      throw new Error("Unable to load newly created question");
    }
    return { question };
  },
});

export const updateQuizQuestion: any = mutation({
  args: {
    quizId: v.string(),
    questionId: v.string(),
    question: quizQuestionInputValidator,
  },
  returns: v.object({
    question: quizQuestionValidator,
  }),
  handler: async (ctx: any, args: any) => {
    const existingQuestion = await loadQuizQuestionById(
      ctx,
      args.questionId as unknown as Id<"posts">,
    );
    if (!existingQuestion || existingQuestion.quizId !== args.quizId) {
      throw new Error("Quiz question not found");
    }

    await ctx.runMutation(
      components.launchthat_lms.posts.mutations.updatePost,
      {
        id: args.questionId as unknown as string,
        title: args.question.prompt,
      },
    );

    const metaPayload = buildQuizQuestionMetaPayload(
      args.quizId as unknown as Id<"posts">,
      args.question,
      existingQuestion.order,
    );
    await Promise.all(
      Object.entries(metaPayload).map(([key, value]) =>
        setPostMetaValue(
          ctx,
          args.questionId as unknown as Id<"posts">,
          key,
          value,
        ),
      ),
    );

    const refreshed = await loadQuizQuestionById(
      ctx,
      args.questionId as unknown as Id<"posts">,
    );
    if (!refreshed) {
      throw new Error("Unable to reload quiz question");
    }
    return { question: refreshed };
  },
});

export const deleteQuizQuestion: any = mutation({
  args: {
    quizId: v.string(),
    questionId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx: any, args: any) => {
    const existingQuestion = await loadQuizQuestionById(
      ctx,
      args.questionId as unknown as Id<"posts">,
    );
    if (!existingQuestion || existingQuestion.quizId !== args.quizId) {
      throw new Error("Quiz question not found");
    }

    await ctx.runMutation(
      components.launchthat_lms.posts.mutations.deletePost,
      {
        id: args.questionId as unknown as string,
      },
    );
    return { success: true };
  },
});

export const reorderQuizQuestions: any = mutation({
  args: {
    quizId: v.string(),
    orderedQuestionIds: v.array(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx: any, args: any) => {
    const questions = await fetchQuizQuestionsForQuiz(
      ctx,
      args.quizId as unknown as Id<"posts">,
    );
    if (questions.length !== args.orderedQuestionIds.length) {
      throw new Error("Question order mismatch");
    }

    const questionSet = new Set(questions.map((question) => question._id));
    for (const questionId of args.orderedQuestionIds) {
      if (!questionSet.has(questionId)) {
        throw new Error("Question list contains unknown entries");
      }
    }

    await Promise.all(
      args.orderedQuestionIds.map((questionId: string, index: number) =>
        setPostMetaValue(
          ctx,
          questionId as unknown as Id<"posts">,
          QUIZ_QUESTION_META_KEYS.order,
          index,
        ),
      ),
    );

    return { success: true };
  },
});

export const submitQuizAttempt: any = mutation({
  args: {
    quizId: v.string(),
    courseId: v.optional(v.string()),
    lessonId: v.optional(v.string()),
    durationMs: v.optional(v.number()),
    responses: v.array(quizAttemptResponseInput),
  },
  returns: v.object({
    attempt: quizAttemptSummaryValidator,
  }),
  handler: async (ctx: any, args: any) => {
    const userId = await getAuthenticatedUserDocIdByToken(ctx);
    const quiz = await ctx.runQuery(
      components.launchthat_lms.posts.queries.getPostByIdInternal,
      { id: args.quizId as unknown as string },
    );
    if (!quiz || quiz.postTypeSlug !== "quizzes") {
      throw new Error("Quiz not found");
    }

    const quizMeta = await getPostMetaMap(ctx, args.quizId);
    const resolvedLessonId =
      args.lessonId ??
      (getMetaString(quizMeta, "lessonId") as Id<"posts"> | null) ??
      undefined;
    const resolvedCourseId =
      args.courseId ??
      (getMetaString(quizMeta, "courseId") as Id<"posts"> | null) ??
      undefined;

    const questions = await fetchQuizQuestionsForQuiz(
      ctx,
      args.quizId,
      quiz.organizationId ?? undefined,
    );

    if (questions.length === 0) {
      throw new Error("Quiz has no questions to attempt");
    }
    if (args.responses.length !== questions.length) {
      throw new Error("All questions must be answered before submission");
    }

    const responses = args.responses as any[];
    const responseMap = new Map<string, any>(
      responses.map((response: any) => [String(response.questionId), response]),
    );

    let correctCount = 0;
    let gradedQuestions = 0;
    const normalizedResponses: {
      questionId: Id<"posts">;
      questionType: (typeof questions)[number]["questionType"];
      selectedOptionIds?: string[];
      answerText?: string;
      isCorrect?: boolean;
    }[] = [];

    for (const question of questions) {
      const response = responseMap.get(String(question._id));
      if (!response) {
        throw new Error("All questions must be answered before submission");
      }

      if (question.questionType === "singleChoice") {
        const selection = (
          response.selectedOptionIds as string[] | undefined
        )?.[0];
        if (!selection) {
          throw new Error("Please select an answer for every question");
        }
        gradedQuestions += 1;
        const cleanedSelection =
          question.options.find((option) => option.id === selection)?.id ??
          selection;
        const isCorrect = question.correctOptionIds.includes(cleanedSelection);
        if (isCorrect) {
          correctCount += 1;
        }
        normalizedResponses.push({
          questionId: question._id,
          questionType: question.questionType,
          selectedOptionIds: [cleanedSelection],
          isCorrect,
        });
        continue;
      }

      if (question.questionType === "multipleChoice") {
        const selections = Array.from(
          new Set((response.selectedOptionIds as string[] | undefined) ?? []),
        );
        if (selections.length === 0) {
          throw new Error("Please select at least one option per question");
        }
        gradedQuestions += 1;
        const selectionSet = new Set(selections);
        const correctSet = new Set(question.correctOptionIds);
        const isCorrect =
          selectionSet.size === correctSet.size &&
          question.correctOptionIds.every((id) => selectionSet.has(id));
        if (isCorrect) {
          correctCount += 1;
        }
        normalizedResponses.push({
          questionId: question._id,
          questionType: question.questionType,
          selectedOptionIds: selections,
          isCorrect,
        });
        continue;
      }

      const answerText = (response.answerText as string | undefined)?.trim();
      if (!answerText) {
        throw new Error("Please provide a response for every question");
      }
      normalizedResponses.push({
        questionId: question._id,
        questionType: question.questionType,
        answerText,
      });
    }

    const completedAt = Date.now();
    const scorePercent =
      gradedQuestions > 0
        ? Math.round((correctCount / gradedQuestions) * 10000) / 100
        : 0;

    const attempt = await ctx.runMutation(
      components.launchthat_lms.progress.mutations.insertQuizAttempt,
      {
        quizId: String(args.quizId),
        userId: String(userId),
        organizationId:
          typeof quiz.organizationId === "string"
            ? quiz.organizationId
            : undefined,
        courseId: resolvedCourseId ? String(resolvedCourseId) : undefined,
        lessonId: resolvedLessonId ? String(resolvedLessonId) : undefined,
        responses: normalizedResponses.map((response) => ({
          ...response,
          questionId: String(response.questionId),
        })),
        totalQuestions: questions.length,
        gradedQuestions,
        correctCount,
        scorePercent,
        durationMs: args.durationMs,
        completedAt,
      },
    );

    const attemptSummary = {
      _id: String(attempt?._id),
      scorePercent,
      totalQuestions: questions.length,
      gradedQuestions,
      correctCount,
      completedAt,
      durationMs: args.durationMs ?? undefined,
    };

    return { attempt: attemptSummary };
  },
});

export const setLessonCompletionStatus: any = mutation({
  args: {
    lessonId: v.string(),
    courseId: v.optional(v.string()),
    completed: v.boolean(),
  },
  returns: v.object({
    completedLessonIds: v.array(v.string()),
  }),
  handler: async (ctx: any, args: any) => {
    const userId = await getAuthenticatedUserDocIdByToken(ctx);
    const { courseId, organizationId } = await resolveCourseContextFromLesson(
      ctx,
      args.lessonId as unknown as Id<"posts">,
      (args.courseId ?? undefined) as unknown as Id<"posts"> | undefined,
    );
    const progress = await ensureCourseProgressDoc(
      ctx,
      userId,
      courseId,
      organizationId,
    );
    const completedSet = new Set(progress.completedLessonIds);
    if (args.completed) {
      completedSet.add(args.lessonId as unknown as Id<"posts">);
    } else {
      completedSet.delete(args.lessonId as unknown as Id<"posts">);
    }
    const completedLessonIds = Array.from(completedSet) as Id<"posts">[];
    await ctx.runMutation(
      components.launchthat_lms.progress.mutations.upsertCourseProgress,
      {
        userId: String(userId),
        courseId: String(courseId),
        organizationId: organizationId ? String(organizationId) : undefined,
        completedLessonIds: completedLessonIds.map(String),
        completedTopicIds: (progress.completedTopicIds ?? []).map(String),
        lastAccessedAt: Date.now(),
        lastAccessedId: String(args.lessonId),
        lastAccessedType: "lesson",
      },
    );
    return { completedLessonIds: completedLessonIds.map(String) };
  },
});

export const setTopicCompletionStatus: any = mutation({
  args: {
    topicId: v.string(),
    lessonId: v.optional(v.string()),
    courseId: v.optional(v.string()),
    completed: v.boolean(),
  },
  returns: v.object({
    completedTopicIds: v.array(v.string()),
  }),
  handler: async (ctx: any, args: any) => {
    const userId = await getAuthenticatedUserDocIdByToken(ctx);
    const {
      lessonId: _lessonId,
      courseId,
      organizationId,
    } = await resolveCourseContextFromTopic(
      ctx,
      args.topicId as unknown as Id<"posts">,
      (args.lessonId ?? undefined) as unknown as Id<"posts"> | undefined,
      (args.courseId ?? undefined) as unknown as Id<"posts"> | undefined,
    );
    const progress = await ensureCourseProgressDoc(
      ctx,
      userId,
      courseId,
      organizationId,
    );
    const topicSet = new Set(progress.completedTopicIds);
    const lessonSet = new Set(progress.completedLessonIds);
    if (args.completed) {
      topicSet.add(args.topicId as unknown as Id<"posts">);
    } else {
      topicSet.delete(args.topicId as unknown as Id<"posts">);
    }
    const completedTopicIds = Array.from(topicSet) as Id<"posts">[];

    // Auto-mark lesson completion based on topics within the lesson.
    // - If ALL topics in the lesson are completed => mark lesson complete
    // - If ANY topic becomes incomplete => mark lesson incomplete
    if (_lessonId && typeof _lessonId === "string") {
      const topics = (await ctx.runQuery(
        components.launchthat_lms.posts.queries.getAllPosts,
        {
          organizationId: organizationId ? String(organizationId) : undefined,
          filters: { postTypeSlug: "topics" },
        },
      )) as any[];

      const attachedTopicIds: string[] = [];
      await Promise.all(
        topics.map(async (topic: any) => {
          const meta = await getPostMetaMap(
            ctx,
            topic._id as unknown as Id<"posts">,
          );
          const lessonIdValue = meta.get("lessonId");
          if (lessonIdValue === String(_lessonId)) {
            attachedTopicIds.push(String(topic._id));
          }
        }),
      );

      if (attachedTopicIds.length > 0) {
        const allTopicsCompleted = attachedTopicIds.every((topicId) =>
          topicSet.has(topicId as unknown as Id<"posts">),
        );
        if (allTopicsCompleted) {
          lessonSet.add(_lessonId as unknown as Id<"posts">);
        } else {
          lessonSet.delete(_lessonId as unknown as Id<"posts">);
        }
      }
    }

    const completedLessonIds = Array.from(lessonSet) as Id<"posts">[];
    await ctx.runMutation(
      components.launchthat_lms.progress.mutations.upsertCourseProgress,
      {
        userId: String(userId),
        courseId: String(courseId),
        organizationId: organizationId ? String(organizationId) : undefined,
        completedLessonIds: completedLessonIds.map(String),
        completedTopicIds: completedTopicIds.map(String),
        lastAccessedAt: Date.now(),
        lastAccessedId: String(args.topicId),
        lastAccessedType: "topic",
      },
    );
    return { completedTopicIds: completedTopicIds.map(String) };
  },
});
