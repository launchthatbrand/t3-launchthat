import { v } from "convex/values";

import type { Id } from "../../_generated/dataModel";
import type { MutationCtx } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { mutation } from "../../_generated/server";
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
const postStatusValidator = v.optional(
  v.union(v.literal("draft"), v.literal("published")),
);

const quizQuestionOptionInput = v.object({
  id: v.string(),
  label: v.string(),
});

const quizQuestionTypeValidator = v.union(
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
  _id: v.id("posts"),
  title: v.string(),
  prompt: v.string(),
  quizId: v.id("posts"),
  questionType: quizQuestionTypeValidator,
  options: v.array(quizQuestionOptionValidator),
  correctOptionIds: v.array(v.string()),
  answerText: v.optional(v.union(v.string(), v.null())),
  order: v.number(),
});

const quizAttemptResponseInput = v.object({
  questionId: v.id("posts"),
  questionType: quizQuestionTypeValidator,
  selectedOptionIds: v.optional(v.array(v.string())),
  answerText: v.optional(v.string()),
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

export const ensureQuizQuestionPostType = mutation({
  args: {
    organizationId: v.optional(v.id("organizations")),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    await ctx.runMutation(
      internal.core.postTypes.mutations.enableForOrganization,
      {
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
          storageKind: "posts",
          storageTables: ["posts", "postsMeta"],
        },
      },
    );

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
    return directMatch[directMatch.length - 1] ?? video.videoId;
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
  return ctx.db
    .query("courseProgress")
    .withIndex("by_user_course", (q) =>
      q.eq("userId", userId).eq("courseId", courseId),
    )
    .unique();
};

const createCourseProgressDoc = async (
  ctx: MutationCtx,
  userId: Id<"users">,
  courseId: Id<"posts">,
  organizationId: Id<"organizations"> | undefined,
) => {
  const timestamp = Date.now();
  const progressId = await ctx.db.insert("courseProgress", {
    organizationId,
    userId,
    courseId,
    completedLessonIds: [],
    completedTopicIds: [],
    startedAt: timestamp,
    updatedAt: timestamp,
  });
  const created = await ctx.db.get(progressId);
  if (!created) {
    throw new Error("Failed to create course progress document");
  }
  return created;
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
  const lesson = await ctx.db.get(lessonId);
  if (!lesson || lesson.postTypeSlug !== "lessons") {
    throw new Error("Lesson not found");
  }

  const lessonMeta = await getPostMetaMap(ctx, lessonId);
  const metaCourseId = getMetaString(lessonMeta, "courseId");
  const courseId = explicitCourseId ?? (metaCourseId as Id<"posts"> | null);
  if (!courseId) {
    throw new Error("Lesson is not attached to a course");
  }
  const course = await ctx.db.get(courseId);
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
  const topic = await ctx.db.get(topicId);
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
    const lessonCourseIdMeta = getMetaString(lessonMeta, "courseId");
    if (lessonCourseIdMeta) {
      await setPostMetaValue(ctx, args.quizId, "courseId", lessonCourseIdMeta);
    }
    if (!lessonCourseSlug) {
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
    await deletePostMetaValue(ctx, args.quizId, "courseId");
    return { success: true };
  },
});

export const attachFinalQuizToCourse = mutation({
  args: {
    courseId: v.id("posts"),
    quizId: v.id("posts"),
    order: v.optional(v.number()),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.courseId);
    if (!course || course.postTypeSlug !== "courses") {
      throw new Error("Course not found");
    }
    const quiz = await ctx.db.get(args.quizId);
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

    await setPostMetaValue(ctx, args.quizId, "courseId", args.courseId);
    await setPostMetaValue(
      ctx,
      args.quizId,
      "courseSlug",
      course.slug ?? course._id,
    );
    if (typeof args.order === "number") {
      await setPostMetaValue(ctx, args.quizId, "order", args.order);
    }
    await setPostMetaValue(ctx, args.quizId, "isFinal", true);
    return { success: true };
  },
});

export const removeFinalQuizFromCourse = mutation({
  args: {
    quizId: v.id("posts"),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    await deletePostMetaValue(ctx, args.quizId, "courseId");
    await deletePostMetaValue(ctx, args.quizId, "courseSlug");
    await deletePostMetaValue(ctx, args.quizId, "order");
    await deletePostMetaValue(ctx, args.quizId, "isFinal");
    return { success: true };
  },
});

export const createLessonFromVimeo = mutation({
  args: {
    courseId: v.id("posts"),
    organizationId: v.optional(v.id("organizations")),
    video: vimeoVideoInput,
    status: postStatusValidator,
  },
  returns: v.object({
    lessonId: v.id("posts"),
  }),
  handler: async (ctx, args) => {
    const normalizedEmbedUrl = normalizeVimeoEmbedUrl(args.video);
    const status = args.status ?? "draft";
    const lessonId = await ctx.runMutation(
      internal.core.posts.mutations.createPost,
      {
        title: args.video.title,
        slug: buildSlug("lesson", args.video.title, args.video.videoId),
        status,
        postTypeSlug: "lessons",
        organizationId: args.organizationId,
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
    await attachLessonToCourseInternal(ctx, args.courseId, lessonId);
    return { lessonId };
  },
});

export const createTopicFromVimeo = mutation({
  args: {
    lessonId: v.id("posts"),
    organizationId: v.optional(v.id("organizations")),
    video: vimeoVideoInput,
    status: postStatusValidator,
  },
  returns: v.object({
    topicId: v.id("posts"),
  }),
  handler: async (ctx, args) => {
    const normalizedEmbedUrl = normalizeVimeoEmbedUrl(args.video);
    const status = args.status ?? "draft";
    const topicId = await ctx.runMutation(
      internal.core.posts.mutations.createPost,
      {
        title: args.video.title,
        slug: buildSlug("topic", args.video.title, args.video.videoId),
        status,
        postTypeSlug: "topics",
        organizationId: args.organizationId,
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
    status: postStatusValidator,
  },
  returns: v.object({
    quizId: v.id("posts"),
  }),
  handler: async (ctx, args) => {
    if (!args.targetLessonId) {
      throw new Error("targetLessonId is required when creating quizzes");
    }
    const normalizedEmbedUrl = normalizeVimeoEmbedUrl(args.video);
    const status = args.status ?? "draft";
    const quizId = await ctx.runMutation(
      internal.core.posts.mutations.createPost,
      {
        title: args.video.title,
        slug: buildSlug("quiz", args.video.title, args.video.videoId),
        status,
        postTypeSlug: "quizzes",
        organizationId: args.organizationId,
        meta: {
          vimeoVideoId: args.video.videoId,
          vimeoEmbedUrl: normalizedEmbedUrl,
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

export const createQuizQuestion = mutation({
  args: {
    quizId: v.id("posts"),
    organizationId: v.optional(v.id("organizations")),
    question: quizQuestionInputValidator,
  },
  returns: v.object({
    question: quizQuestionValidator,
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
      internal.core.posts.mutations.createPost,
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
        setPostMetaValue(ctx, questionId, key, value),
      ),
    );

    const question = await loadQuizQuestionById(ctx, questionId);
    if (!question) {
      throw new Error("Unable to load newly created question");
    }
    return { question };
  },
});

export const updateQuizQuestion = mutation({
  args: {
    quizId: v.id("posts"),
    questionId: v.id("posts"),
    question: quizQuestionInputValidator,
  },
  returns: v.object({
    question: quizQuestionValidator,
  }),
  handler: async (ctx, args) => {
    const existingQuestion = await loadQuizQuestionById(ctx, args.questionId);
    if (!existingQuestion || existingQuestion.quizId !== args.quizId) {
      throw new Error("Quiz question not found");
    }

    await ctx.runMutation(internal.core.posts.mutations.updatePost, {
      id: args.questionId,
      title: args.question.prompt,
    });

    const metaPayload = buildQuizQuestionMetaPayload(
      args.quizId,
      args.question,
      existingQuestion.order,
    );
    await Promise.all(
      Object.entries(metaPayload).map(([key, value]) =>
        setPostMetaValue(ctx, args.questionId, key, value),
      ),
    );

    const refreshed = await loadQuizQuestionById(ctx, args.questionId);
    if (!refreshed) {
      throw new Error("Unable to reload quiz question");
    }
    return { question: refreshed };
  },
});

export const deleteQuizQuestion = mutation({
  args: {
    quizId: v.id("posts"),
    questionId: v.id("posts"),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const existingQuestion = await loadQuizQuestionById(ctx, args.questionId);
    if (!existingQuestion || existingQuestion.quizId !== args.quizId) {
      throw new Error("Quiz question not found");
    }

    await ctx.runMutation(internal.core.posts.mutations.deletePost, {
      id: args.questionId,
    });
    return { success: true };
  },
});

export const reorderQuizQuestions = mutation({
  args: {
    quizId: v.id("posts"),
    orderedQuestionIds: v.array(v.id("posts")),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const questions = await fetchQuizQuestionsForQuiz(ctx, args.quizId);
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
      args.orderedQuestionIds.map((questionId, index) =>
        setPostMetaValue(ctx, questionId, QUIZ_QUESTION_META_KEYS.order, index),
      ),
    );

    return { success: true };
  },
});

export const submitQuizAttempt = mutation({
  args: {
    quizId: v.id("posts"),
    courseId: v.optional(v.id("posts")),
    lessonId: v.optional(v.id("posts")),
    durationMs: v.optional(v.number()),
    responses: v.array(quizAttemptResponseInput),
  },
  returns: v.object({
    attempt: quizAttemptSummaryValidator,
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserDocIdByToken(ctx);
    const quiz = await ctx.db.get(args.quizId);
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

    const responseMap = new Map(
      args.responses.map((response) => [response.questionId, response]),
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
      const response = responseMap.get(question._id);
      if (!response) {
        throw new Error("All questions must be answered before submission");
      }

      if (question.questionType === "singleChoice") {
        const selection = response.selectedOptionIds?.[0];
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
          new Set(response.selectedOptionIds ?? []),
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

      const answerText = response.answerText?.trim();
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

    const attemptId = await ctx.db.insert("quizAttempts", {
      quizId: args.quizId,
      userId,
      organizationId: quiz.organizationId ?? undefined,
      courseId: resolvedCourseId,
      lessonId: resolvedLessonId,
      responses: normalizedResponses,
      totalQuestions: questions.length,
      gradedQuestions,
      correctCount,
      scorePercent,
      durationMs: args.durationMs,
      completedAt,
    });

    const attemptSummary = {
      _id: attemptId,
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

export const setLessonCompletionStatus = mutation({
  args: {
    lessonId: v.id("posts"),
    courseId: v.optional(v.id("posts")),
    completed: v.boolean(),
  },
  returns: v.object({
    completedLessonIds: v.array(v.id("posts")),
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserDocIdByToken(ctx);
    const { courseId, organizationId } = await resolveCourseContextFromLesson(
      ctx,
      args.lessonId,
      args.courseId ?? undefined,
    );
    const progress = await ensureCourseProgressDoc(
      ctx,
      userId,
      courseId,
      organizationId,
    );
    const completedSet = new Set(progress.completedLessonIds);
    if (args.completed) {
      completedSet.add(args.lessonId);
    } else {
      completedSet.delete(args.lessonId);
    }
    const completedLessonIds = Array.from(completedSet);
    await ctx.db.patch(progress._id, {
      completedLessonIds,
      updatedAt: Date.now(),
      lastAccessedAt: Date.now(),
      lastAccessedId: args.lessonId,
      lastAccessedType: "lesson",
    });
    return { completedLessonIds };
  },
});

export const setTopicCompletionStatus = mutation({
  args: {
    topicId: v.id("posts"),
    lessonId: v.optional(v.id("posts")),
    courseId: v.optional(v.id("posts")),
    completed: v.boolean(),
  },
  returns: v.object({
    completedTopicIds: v.array(v.id("posts")),
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthenticatedUserDocIdByToken(ctx);
    const { lessonId, courseId, organizationId } =
      await resolveCourseContextFromTopic(
        ctx,
        args.topicId,
        args.lessonId ?? undefined,
        args.courseId ?? undefined,
      );
    const progress = await ensureCourseProgressDoc(
      ctx,
      userId,
      courseId,
      organizationId,
    );
    const topicSet = new Set(progress.completedTopicIds);
    if (args.completed) {
      topicSet.add(args.topicId);
    } else {
      topicSet.delete(args.topicId);
    }
    const completedTopicIds = Array.from(topicSet);
    await ctx.db.patch(progress._id, {
      completedTopicIds,
      updatedAt: Date.now(),
      lastAccessedAt: Date.now(),
      lastAccessedId: args.topicId,
      lastAccessedType: "topic",
    });
    return { completedTopicIds };
  },
});
