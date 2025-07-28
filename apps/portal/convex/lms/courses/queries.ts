import type { Doc, Id } from "../../_generated/dataModel";

import type { QueryCtx } from "../../_generated/server";
import { filter } from "convex-helpers/server/filter";
import { query } from "../../_generated/server";
import { v } from "convex/values";

// Helper functions for formatting lessons and topics to include tagNames
async function formatLessonWithTags(
  ctx: QueryCtx,
  lesson: Doc<"lessons">,
): Promise<Doc<"lessons"> & { tagNames: string[] }> {
  const tags = lesson.tagIds
    ? await Promise.all(lesson.tagIds.map((id) => ctx.db.get(id)))
    : [];
  const tagNames = tags.filter(Boolean).map((tag) => {
    if (tag) {
      return tag.name;
    }
    return "";
  });
  return {
    _id: lesson._id,
    _creationTime: lesson._creationTime,
    title: lesson.title,
    description: lesson.description,
    wp_id: lesson.wp_id,
    content: lesson.content,
    excerpt: lesson.excerpt,
    categories: lesson.categories,
    tagIds: lesson.tagIds,
    tagNames: tagNames,
    featuredImage: lesson.featuredImage,
    featuredMedia: lesson.featuredMedia,
    isPublished: lesson.isPublished,
    menuOrder: lesson.menuOrder,
    courseId: lesson.courseId,
  };
}

async function formatTopicWithTags(
  ctx: QueryCtx,
  topic: Doc<"topics">,
): Promise<Doc<"topics"> & { tagNames: string[] }> {
  const tags = topic.tagIds
    ? await Promise.all(topic.tagIds.map((id) => ctx.db.get(id)))
    : [];
  const tagNames = tags.filter(Boolean).map((tag) => {
    if (tag) {
      return tag.name;
    }
    return "";
  });
  return {
    _id: topic._id,
    _creationTime: topic._creationTime,
    lessonId: topic.lessonId,
    title: topic.title,
    description: topic.description,
    excerpt: topic.excerpt,
    categories: topic.categories,
    tagIds: topic.tagIds,
    tagNames: tagNames,
    wp_id: topic.wp_id,
    featuredImage: topic.featuredImage,
    featuredMedia: topic.featuredMedia,
    contentType: topic.contentType,
    content: topic.content,
    order: topic.order,
    menuOrder: topic.menuOrder,
    isPublished: topic.isPublished,
  };
}

/**
 * Enhanced query to get complete course structure for real-time subscriptions
 * This supports the unified state management system by providing all necessary data
 * in a single subscription-friendly query
 */
export const getCourseStructureWithItems = query({
  args: { courseId: v.id("courses") },
  returns: v.union(
    v.null(),
    v.object({
      course: v.object({
        _id: v.id("courses"),
        _creationTime: v.number(),
        title: v.string(),
        description: v.optional(v.string()),
        wp_id: v.optional(v.float64()),
        productId: v.optional(v.string()),
        isPublished: v.optional(v.boolean()),
        categories: v.optional(v.array(v.string())),
        tagIds: v.optional(v.array(v.id("tags"))),
        menuOrder: v.optional(v.number()),
        courseStructure: v.optional(
          v.array(
            v.object({
              lessonId: v.id("lessons"),
            }),
          ),
        ),
        finalQuizId: v.optional(v.id("quizzes")),
      }),
      attachedLessons: v.array(
        v.object({
          _id: v.id("lessons"),
          _creationTime: v.number(),
          title: v.string(),
          description: v.optional(v.string()),
          content: v.optional(v.string()),
          excerpt: v.optional(v.string()),
          categories: v.optional(v.array(v.string())),
          tagIds: v.optional(v.array(v.id("tags"))),
          featuredImage: v.optional(v.string()),
          featuredMedia: v.optional(
            v.union(
              v.object({
                type: v.literal("convex"),
                mediaItemId: v.id("mediaItems"),
              }),
              v.object({
                type: v.literal("vimeo"),
                vimeoId: v.string(),
                vimeoUrl: v.string(),
              }),
              v.string(),
            ),
          ),
          isPublished: v.optional(v.boolean()),
          courseId: v.optional(v.id("courses")),
          wp_id: v.optional(v.float64()),
          menuOrder: v.optional(v.number()),
        }),
      ),
      attachedTopics: v.array(
        v.object({
          _id: v.id("topics"),
          _creationTime: v.number(),
          title: v.string(),
          description: v.optional(v.string()),
          excerpt: v.optional(v.string()),
          categories: v.optional(v.array(v.string())),
          tagIds: v.optional(v.array(v.id("tags"))),
          wp_id: v.optional(v.float64()),
          featuredImage: v.optional(v.string()),
          featuredMedia: v.optional(
            v.union(
              v.object({
                type: v.literal("convex"),
                mediaItemId: v.id("mediaItems"),
              }),
              v.object({
                type: v.literal("vimeo"),
                vimeoId: v.string(),
                vimeoUrl: v.string(),
              }),
              v.string(),
            ),
          ),
          contentType: v.optional(
            v.union(v.literal("text"), v.literal("video"), v.literal("quiz")),
          ),
          content: v.optional(v.string()),
          order: v.optional(v.number()),
          menuOrder: v.optional(v.number()),
          isPublished: v.optional(v.boolean()),
          lessonId: v.optional(v.id("lessons")),
        }),
      ),
      attachedQuizzes: v.array(
        v.object({
          _id: v.id("quizzes"),
          _creationTime: v.number(),
          title: v.string(),
          description: v.optional(v.string()),
          questions: v.optional(v.array(v.any())),
          order: v.optional(v.number()),
          lessonId: v.optional(v.id("lessons")),
          isPublished: v.optional(v.boolean()),
        }),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    // Get the course
    const course = await ctx.db.get(args.courseId);
    if (!course) {
      return null;
    }

    // Get all lessons attached to this course and order them according to course.courseStructure
    const attachedLessons: Doc<"lessons">[] = [];
    if (course.courseStructure) {
      for (const structureItem of course.courseStructure) {
        const lesson = await ctx.db.get(structureItem.lessonId);
        if (lesson) {
          attachedLessons.push(lesson);
        }
      }
    }

    // Get all topics attached to lessons in this course
    const attachedTopics: Doc<"topics">[] = [];
    for (const lessonId of attachedLessons.map((l) => l._id)) {
      const topics = await ctx.db
        .query("topics")
        .withIndex("by_lessonId_order", (q) => q.eq("lessonId", lessonId))
        .collect();
      attachedTopics.push(...topics);
    }

    // Get all quizzes attached to lessons in this course
    const attachedQuizzes = [];
    for (const lessonId of attachedLessons.map((l) => l._id)) {
      const quizzes = await ctx.db
        .query("quizzes")
        .withIndex("by_lessonId", (q) => q.eq("lessonId", lessonId))
        .collect();
      attachedQuizzes.push(...quizzes);
    }

    return {
      course: {
        _id: course._id,
        _creationTime: course._creationTime,
        title: course.title,
        description: course.description,
        productId: course.productId,
        isPublished: course.isPublished,
        tagIds: course.tagIds,
        menuOrder: course.menuOrder,
        courseStructure: course.courseStructure,
        finalQuizId: course.finalQuizId,
      },
      attachedLessons,
      attachedTopics,
      attachedQuizzes,
    };
  },
});

/**
 * Query to get available lessons (not attached to any course)
 * Supports the available items panel in the course builder
 */
export const getAvailableLessons = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("lessons"),
      _creationTime: v.number(),
      title: v.string(),
      description: v.optional(v.string()),
      wp_id: v.optional(v.float64()),
      excerpt: v.optional(v.string()),
      categories: v.optional(v.array(v.string())),
      tagIds: v.optional(v.array(v.id("tags"))),
      featuredImage: v.optional(v.string()),
      featuredMedia: v.optional(
        v.union(
          v.object({
            type: v.literal("convex"),
            mediaItemId: v.id("mediaItems"),
          }),
          v.object({
            type: v.literal("vimeo"),
            vimeoId: v.string(),
            vimeoUrl: v.string(),
          }),
          v.string(),
        ),
      ),
      content: v.optional(v.string()),
      duration: v.optional(v.number()),
      isPublished: v.optional(v.boolean()),
      order: v.optional(v.number()),
      menuOrder: v.optional(v.number()),
      courseId: v.optional(v.id("courses")),
    }),
  ),
  handler: async (ctx) => {
    // Get lessons that are not attached to any course
    const availableLessons = await ctx.db
      .query("lessons")
      .filter((q) => q.eq(q.field("courseId"), undefined))
      .collect();

    return availableLessons.map((l) => ({
      _id: l._id,
      _creationTime: l._creationTime,
      title: l.title,
      description: l.description,
      wp_id: l.wp_id,
      excerpt: l.excerpt,
      categories: l.categories,
      tagIds: l.tagIds,
      featuredImage: l.featuredImage,
      featuredMedia: l.featuredMedia,
      content: l.content,
      isPublished: l.isPublished,
      menuOrder: l.menuOrder,
      courseId: l.courseId,
    }));
  },
});

/**
 * Query to get available topics
 * If lessonId is provided, returns topics attached to that lesson
 * If lessonId is not provided, returns topics not attached to any lesson
 * Supports the available items panel in the course builder
 */
export const getAvailableTopics = query({
  args: {
    lessonId: v.optional(v.id("lessons")),
  },
  returns: v.array(
    v.object({
      _id: v.id("topics"),
      _creationTime: v.number(),
      lessonId: v.optional(v.id("lessons")),
      title: v.string(),
      description: v.optional(v.string()),
      excerpt: v.optional(v.string()),
      categories: v.optional(v.array(v.string())),
      tagIds: v.optional(v.array(v.id("tags"))),
      wp_id: v.optional(v.float64()),
      featuredImage: v.optional(v.string()),
      featuredMedia: v.optional(
        v.union(
          v.object({
            type: v.literal("convex"),
            mediaItemId: v.id("mediaItems"),
          }),
          v.object({
            type: v.literal("vimeo"),
            vimeoId: v.string(),
            vimeoUrl: v.string(),
          }),
          v.string(),
        ),
      ),
      contentType: v.optional(
        v.union(v.literal("text"), v.literal("video"), v.literal("quiz")),
      ),
      content: v.optional(v.string()),
      order: v.optional(v.number()),
      menuOrder: v.optional(v.number()),
      isPublished: v.optional(v.boolean()),
    }),
  ),
  handler: async (ctx, args) => {
    let topics;

    if (args.lessonId) {
      // Get topics attached to the specified lesson
      topics = await ctx.db
        .query("topics")
        .filter((q) => q.eq(q.field("lessonId"), args.lessonId))
        .collect();
    } else {
      // Get topics that are not attached to any lesson (available for assignment)
      topics = await ctx.db
        .query("topics")
        .filter((q) => q.eq(q.field("lessonId"), undefined))
        .collect();
    }

    return topics.map((topic) => ({
      _id: topic._id,
      _creationTime: topic._creationTime,
      title: topic.title,
      description: topic.description,
      wp_id: topic.wp_id,
      featuredImage: topic.featuredImage,
      featuredMedia: topic.featuredMedia,
      content: topic.content,
      order: topic.order,
      menuOrder: topic.menuOrder,
      isPublished: topic.isPublished,
      lessonId: topic.lessonId,
      categories: topic.categories,
      tagIds: topic.tagIds,
      excerpt: topic.excerpt,
      contentType: topic.contentType,
    }));
  },
});

/**
 * Query to get available quizzes (not attached to any lesson)
 * Supports the available items panel in the course builder
 */
export const getAvailableQuizzes = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("quizzes"),
      _creationTime: v.number(),
      title: v.string(),
      description: v.optional(v.string()),
      questions: v.optional(v.array(v.any())),
      order: v.optional(v.number()),
      lessonId: v.optional(v.id("lessons")),
      isPublished: v.optional(v.boolean()),
    }),
  ),
  handler: async (ctx) => {
    // Get quizzes that are not attached to any lesson
    const availableQuizzes = await ctx.db
      .query("quizzes")
      .filter((q) => q.eq(q.field("lessonId"), undefined))
      .collect();

    return availableQuizzes;
  },
});

/**
 * Lightweight query for course metadata only
 * Useful for components that only need basic course info
 */
export const getCourseMetadata = query({
  args: { courseId: v.id("courses") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("courses"),
      _creationTime: v.number(),
      title: v.string(),
      description: v.optional(v.string()),
      isPublished: v.optional(v.boolean()),
      lessonCount: v.number(),
      topicCount: v.number(),
      quizCount: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.courseId);
    if (!course) {
      return null;
    }

    // Get counts for dashboard/summary views
    const lessonCount = await ctx.db
      .query("lessons")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect()
      .then((lessons) => lessons.length);

    const lessonIds = await ctx.db
      .query("lessons")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect()
      .then((lessons) => lessons.map((l) => l._id));

    let topicCount = 0;
    let quizCount = 0;

    for (const lessonId of lessonIds) {
      const topics = await ctx.db
        .query("topics")
        .withIndex("by_lessonId_order", (q) => q.eq("lessonId", lessonId))
        .collect();
      topicCount += topics.length;

      const quizzes = await ctx.db
        .query("quizzes")
        .withIndex("by_lessonId", (q) => q.eq("lessonId", lessonId))
        .collect();
      quizCount += quizzes.length;
    }

    // Return only the whitelisted fields expected by the validator
    return {
      _id: course._id,
      _creationTime: course._creationTime,
      title: course.title,
      description: course.description,
      isPublished: course.isPublished,
      lessonCount,
      topicCount,
      quizCount,
    };
  },
});

/**
 * List all published courses for frontend view
 */
export const listPublishedCourses = query({
  args: { searchTitle: v.optional(v.string()) },
  returns: v.array(
    v.object({
      _id: v.id("courses"),
      _creationTime: v.number(),
      title: v.string(),
      description: v.optional(v.string()),
      isPublished: v.optional(v.boolean()),
    }),
  ),
  handler: async (ctx, args) => {
    const queryBuilder = ctx.db
      .query("courses")
      .filter((q) => q.eq(q.field("isPublished"), true));

    const results = args.searchTitle
      ? await queryBuilder
          .withSearchIndex("search_title", (q) =>
            q.search("title", args.searchTitle ?? ""),
          )
          .collect()
      : await queryBuilder.collect();

    // Return only the whitelisted fields expected by the validator
    return results.map((course) => ({
      _id: course._id,
      _creationTime: course._creationTime, // Explicitly include _creationTime
      title: course.title,
      description: course.description,
      isPublished: course.isPublished,
    }));
  },
});

// List members enrolled in a course
export const listCourseMembers = query({
  args: {
    courseId: v.id("courses"),
  },
  returns: v.array(
    v.object({
      _id: v.id("users"),
      name: v.optional(v.string()),
      email: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    // Find all enrollments for course
    const enrollments = await ctx.db
      .query("courseEnrollments")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect();

    const users = await Promise.all(
      enrollments.map(async (enroll) => {
        const usr = await ctx.db.get(enroll.userId);
        if (!usr) return null;
        return {
          _id: usr._id,
          name: usr.name,
          email: usr.email,
        };
      }),
    );

    return users.filter((u): u is NonNullable<typeof u> => u !== null);
  },
});

// --- Additional queries moved from index.ts ---

export const listCourses = query({
  args: { searchTitle: v.optional(v.string()) },
  returns: v.array(
    v.object({
      _id: v.id("courses"),
      _creationTime: v.number(),
      title: v.string(),
      description: v.optional(v.string()),
      productId: v.optional(v.string()), // Changed to v.string() as per schema
      isPublished: v.optional(v.boolean()),
      courseStructure: v.optional(
        v.array(v.object({ lessonId: v.id("lessons") })),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    if (args.searchTitle) {
      return await ctx.db
        .query("courses")
        .withSearchIndex("search_title", (q) =>
          q.search("title", args.searchTitle ?? ""),
        )
        .collect();
    }
    return await ctx.db.query("courses").collect();
  },
});

export const getCourse = query({
  args: { courseId: v.id("courses") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("courses"),
      _creationTime: v.number(),
      title: v.string(),
      description: v.optional(v.string()),
      productId: v.optional(v.string()), // Changed to v.string() as per schema
      isPublished: v.optional(v.boolean()),
      courseStructure: v.optional(
        v.array(v.object({ lessonId: v.id("lessons") })),
      ),
    }),
  ),
  handler: async (ctx, args) => ctx.db.get(args.courseId),
});

export const getCourseStructure = query({
  args: { courseId: v.id("courses") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("courses"),
      _creationTime: v.number(),
      title: v.string(),
      description: v.optional(v.string()),
      productId: v.optional(v.string()), // Changed to v.string() as per schema
      isPublished: v.optional(v.boolean()),
      tagIds: v.optional(v.array(v.id("tags"))),
      menuOrder: v.optional(v.number()),
      courseStructure: v.optional(
        v.array(v.object({ lessonId: v.id("lessons") })),
      ),
      lessons: v.array(
        v.object({
          _id: v.id("lessons"),
          _creationTime: v.number(),
          title: v.string(),
          description: v.optional(v.string()),
          content: v.optional(v.string()),
          menuOrder: v.optional(v.number()),
          isPublished: v.optional(v.boolean()),
          courseId: v.optional(v.id("courses")),
          featuredImage: v.optional(v.string()),
          featuredMedia: v.optional(
            v.union(
              v.object({
                type: v.literal("convex"),
                mediaItemId: v.id("mediaItems"),
              }),
              v.object({
                type: v.literal("vimeo"),
                vimeoId: v.string(),
                vimeoUrl: v.string(),
              }),
              v.string(),
            ),
          ),
          excerpt: v.optional(v.string()),
          categories: v.optional(v.array(v.string())),
          tagIds: v.optional(v.array(v.id("tags"))),
        }),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.courseId);
    if (!course) return null;

    const orderedIds = (course.courseStructure ?? []).map((i) => i.lessonId);
    const lessonDocs = await Promise.all(
      orderedIds.map((id) => ctx.db.get(id)),
    );
    const validLessons = lessonDocs.filter(
      (l): l is NonNullable<typeof l> => l !== null,
    );
    const lessonsWithTopics = await Promise.all(
      validLessons.map(async (lesson) => {
        const topics = await ctx.db
          .query("topics")
          .withIndex("by_lessonId_order", (q) => q.eq("lessonId", lesson._id))
          .order("asc")
          .collect();
        return {
          _id: lesson._id,
          _creationTime: lesson._creationTime,
          title: lesson.title,
          description: lesson.description,
          content: lesson.content,
          menuOrder: lesson.menuOrder,
          isPublished: lesson.isPublished,
          courseId: lesson.courseId,
          featuredImage: lesson.featuredImage,
          featuredMedia: lesson.featuredMedia,
          excerpt: lesson.excerpt,
          categories: lesson.categories,
          tagIds: lesson.tagIds,
          topics: topics.map((t) => ({
            _id: t._id,
            _creationTime: t._creationTime,
            lessonId: t.lessonId,
            title: t.title,
            contentType: t.contentType,
            content: t.content,
            order: t.order,
            menuOrder: t.menuOrder,
            isPublished: t.isPublished,
            description: t.description,
            excerpt: t.excerpt,
            categories: t.categories,
            tagIds: t.tagIds,
            wp_id: t.wp_id,
            featuredImage: t.featuredImage,
            featuredMedia: t.featuredMedia,
          })),
        };
      }),
    );

    const orderedLessons = orderedIds
      .map((id) => lessonsWithTopics.find((l) => l._id === id))
      .filter((l): l is NonNullable<typeof l> => l !== undefined);

    return {
      _id: course._id,
      _creationTime: course._creationTime,
      title: course.title,
      description: course.description,
      productId: course.productId,
      isPublished: course.isPublished,
      tagIds: course.tagIds,
      menuOrder: course.menuOrder,
      courseStructure: course.courseStructure,
      lessons: orderedLessons,
    };
  },
});

export const getStructure = query({
  args: { courseId: v.id("courses") },
  returns: v.union(
    v.null(),
    v.object({
      course: v.object({
        _id: v.id("courses"),
        _creationTime: v.number(),
        title: v.string(),
        description: v.optional(v.string()),
        productId: v.optional(v.string()), // Changed to v.string() as per schema
        isPublished: v.optional(v.boolean()),
        tagIds: v.optional(v.array(v.id("tags"))),
        menuOrder: v.optional(v.number()),
      }),
      lessons: v.array(
        v.object({
          _id: v.id("lessons"),
          _creationTime: v.number(),
          title: v.string(),
          description: v.optional(v.string()),
          tagIds: v.optional(v.array(v.id("tags"))),
          featuredImage: v.optional(v.string()),
          featuredMedia: v.optional(
            v.union(
              v.object({
                type: v.literal("convex"),
                mediaItemId: v.id("mediaItems"),
              }),
              v.object({
                type: v.literal("vimeo"),
                vimeoId: v.string(),
                vimeoUrl: v.string(),
              }),
              v.string(),
            ),
          ),
          excerpt: v.optional(v.string()),
          content: v.optional(v.string()),
          menuOrder: v.optional(v.number()),
          isPublished: v.optional(v.boolean()),
          courseId: v.optional(v.id("courses")),
        }),
      ),
      topics: v.array(
        v.object({
          _id: v.id("topics"),
          _creationTime: v.number(),
          title: v.string(),
          contentType: v.optional(
            v.union(v.literal("text"), v.literal("video"), v.literal("quiz")),
          ),
          categories: v.optional(v.array(v.string())),
          tagIds: v.optional(v.array(v.id("tags"))),
          description: v.optional(v.string()),
          excerpt: v.optional(v.string()),
          wp_id: v.optional(v.float64()),
          featuredImage: v.optional(v.string()),
          featuredMedia: v.optional(
            v.union(
              v.object({
                type: v.literal("convex"),
                mediaItemId: v.id("mediaItems"),
              }),
              v.object({
                type: v.literal("vimeo"),
                vimeoId: v.string(),
                vimeoUrl: v.string(),
              }),
              v.string(),
            ),
          ),
          content: v.optional(v.string()),
          order: v.optional(v.number()),
          menuOrder: v.optional(v.number()),
          isPublished: v.optional(v.boolean()),
          lessonId: v.optional(v.id("lessons")),
        }),
      ),
      quizzes: v.array(
        v.object({
          _id: v.id("quizzes"),
          _creationTime: v.number(),
          title: v.string(),
        }),
      ),
      finalQuiz: v.optional(
        v.object({
          _id: v.id("quizzes"),
          _creationTime: v.number(),
          title: v.string(),
        }),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.courseId);
    if (!course) throw new Error("Course not found");

    const lessonDocs = await ctx.db
      .query("lessons")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect();

    const lessons = lessonDocs.map((l) => ({
      _id: l._id,
      _creationTime: l._creationTime,
      title: l.title,
      description: l.description,
      categories: l.categories,
      tagIds: l.tagIds,
      featuredImage: l.featuredImage,
      featuredMedia: l.featuredMedia,
      excerpt: l.excerpt,
      content: l.content,
      menuOrder: l.menuOrder,
      isPublished: l.isPublished,
      courseId: l.courseId,
    }));

    const lessonIds = lessonDocs.map((l) => l._id);

    const topicDocs = await filter(
      ctx.db.query("topics").withIndex("by_lessonId_order"),
      (t) => lessonIds.includes(t.lessonId as Id<"lessons">),
    ).collect();

    const topics = topicDocs.map((t) => ({
      _id: t._id,
      _creationTime: t._creationTime,
      title: t.title,
      contentType: t.contentType,
      categories: t.categories,
      tagIds: t.tagIds,
      description: t.description,
      excerpt: t.excerpt,
      wp_id: t.wp_id,
      featuredImage: t.featuredImage,
      featuredMedia: t.featuredMedia,
      content: t.content,
      order: t.order,
      menuOrder: t.menuOrder,
      isPublished: t.isPublished,
      lessonId: t.lessonId,
    }));

    const topicIds = topicDocs.map((t) => t._id);

    const quizDocs = await filter(
      ctx.db.query("quizzes").withIndex("by_topicId"),
      (qz) => topicIds.includes(qz.topicId as Id<"topics">),
    ).collect();

    const quizzes = quizDocs.map((q) => ({
      _id: q._id,
      _creationTime: q._creationTime,
      title: q.title,
    }));

    const finalQuizDoc = course.finalQuizId
      ? await ctx.db.get(course.finalQuizId)
      : null;
    const finalQuiz = finalQuizDoc
      ? {
          _id: finalQuizDoc._id,
          _creationTime: finalQuizDoc._creationTime,
          title: finalQuizDoc.title,
        }
      : undefined;

    return {
      course: {
        _id: course._id,
        _creationTime: course._creationTime,
        title: course.title,
        description: course.description,
        productId: course.productId,
        isPublished: course.isPublished,
        tagIds: course.tagIds,
        menuOrder: course.menuOrder,
      },
      lessons,
      topics,
      quizzes,
      finalQuiz,
    };
  },
});

export const getRelatedContentByTagIds = query({
  args: {
    tagIds: v.array(v.id("tags")),
    currentLessonId: v.optional(v.id("lessons")),
    currentTopicId: v.optional(v.id("topics")),
  },
  returns: v.object({
    lessons: v.array(
      v.object({
        _id: v.id("lessons"),
        _creationTime: v.number(),
        title: v.string(),
        description: v.optional(v.string()),
        wp_id: v.optional(v.float64()),
        content: v.optional(v.string()),
        excerpt: v.optional(v.string()),
        categories: v.optional(v.array(v.string())),
        tagIds: v.optional(v.array(v.id("tags"))),
        featuredImage: v.optional(v.string()),
        featuredMedia: v.optional(
          v.union(
            v.object({
              type: v.literal("convex"),
              mediaItemId: v.id("mediaItems"),
            }),
            v.object({
              type: v.literal("vimeo"),
              vimeoId: v.string(),
              vimeoUrl: v.string(),
            }),
            v.string(),
          ),
        ),
        isPublished: v.optional(v.boolean()),
        menuOrder: v.optional(v.number()),
        courseId: v.optional(v.id("courses")),
      }),
    ),
    topics: v.array(
      v.object({
        _id: v.id("topics"),
        _creationTime: v.number(),
        lessonId: v.optional(v.id("lessons")),
        title: v.string(),
        description: v.optional(v.string()),
        excerpt: v.optional(v.string()),
        categories: v.optional(v.array(v.string())),
        tagIds: v.optional(v.array(v.id("tags"))),
        tagNames: v.array(v.string()), // New field for tag names
        wp_id: v.optional(v.float64()),
        featuredImage: v.optional(v.string()),
        featuredMedia: v.optional(
          v.union(
            v.object({
              type: v.literal("convex"),
              mediaItemId: v.id("mediaItems"),
            }),
            v.object({
              type: v.literal("vimeo"),
              vimeoId: v.string(),
              vimeoUrl: v.string(),
            }),
            v.string(),
          ),
        ),
        contentType: v.optional(
          v.union(v.literal("text"), v.literal("video"), v.literal("quiz")),
        ),
        content: v.optional(v.string()),
        order: v.optional(v.number()),
        menuOrder: v.optional(v.number()),
        isPublished: v.optional(v.boolean()),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    const searchTagIds = args.tagIds.map((id) => id.toString());

    const allLessons = (await ctx.db.query("lessons").collect()).filter(
      (lesson) =>
        lesson._id !== args.currentLessonId &&
        lesson.tagIds &&
        searchTagIds.some((searchId) =>
          lesson.tagIds?.map((id) => id.toString()).includes(searchId),
        ),
    );
    const allTopics = (await ctx.db.query("topics").collect()).filter(
      (topic) =>
        topic._id !== args.currentTopicId &&
        topic.tagIds &&
        searchTagIds.some((searchId) =>
          topic.tagIds?.map((id) => id.toString()).includes(searchId),
        ),
    );

    // No need for explicit deduplication here as we are filtering from all, not pushing from multiple queries

    return {
      lessons: await Promise.all(
        allLessons.map((lesson) => formatLessonWithTags(ctx, lesson)),
      ),
      topics: await Promise.all(
        allTopics.map((topic) => formatTopicWithTags(ctx, topic)),
      ),
    };
  },
});
