import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";

import type { Doc } from "../../_generated/dataModel";
/**
 * Courses Queries
 *
 * Contains all read operations for the courses feature.
 */
import { query } from "../../_generated/server";
// Import shared validators
import { quizQuestionValidator } from "../quizzes/schema";

/**
 * Get a single course by ID
 */
export const getCourseById = query({
  args: {
    id: v.id("courses"),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("courses"),
      _creationTime: v.number(),
      organizationId: v.optional(v.id("organizations")),
      title: v.string(),
      description: v.optional(v.string()),
      productId: v.optional(v.id("products")),
      isPublished: v.optional(v.boolean()),
      menuOrder: v.optional(v.number()),
      courseStructure: v.optional(
        v.array(v.object({ lessonId: v.id("lessons") })),
      ),
      finalQuizId: v.optional(v.id("quizzes")),
      tagIds: v.optional(v.array(v.id("tags"))),
    }),
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get minimal metadata for a course (for lightweight lookups)
 */
export const getCourseMetadata = query({
  args: { id: v.id("courses") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("courses"),
      _creationTime: v.number(),
      title: v.string(),
      description: v.optional(v.string()),
      isPublished: v.optional(v.boolean()),
      organizationId: v.optional(v.id("organizations")),
      productId: v.optional(v.id("products")),
      menuOrder: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.id);
    if (!course) return null;
    // Return only metadata fields
    return {
      _id: course._id,
      _creationTime: course._creationTime,
      title: course.title,
      description: course.description,
      isPublished: course.isPublished,
      organizationId: course.organizationId,
      productId: course.productId,
      menuOrder: course.menuOrder,
    };
  },
});

/**
 * Get quizzes available to attach to a course (not currently attached).
 */
export const getAvailableQuizzes = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("quizzes"),
      _creationTime: v.number(),
      title: v.string(),
      description: v.optional(v.string()),
      isPublished: v.optional(v.boolean()),
      lessonId: v.optional(v.id("lessons")),
      topicId: v.optional(v.id("topics")),
      courseId: v.optional(v.id("courses")),
      order: v.optional(v.number()),
      questions: v.optional(v.array(quizQuestionValidator)),
    }),
  ),
  handler: async (ctx) => {
    const quizzes = await ctx.db
      .query("quizzes")
      .filter((q) =>
        q.and(
          q.eq(q.field("lessonId"), undefined),
          q.eq(q.field("topicId"), undefined),
          q.eq(q.field("courseId"), undefined),
        ),
      )
      .collect();

    return quizzes.map((q) => ({
      _id: q._id,
      _creationTime: q._creationTime,
      title: q.title,
      description: q.description,
      isPublished: q.isPublished,
      lessonId: q.lessonId,
      topicId: q.topicId,
      courseId: q.courseId,
      order: q.order,
      questions: q.questions,
    }));
  },
});

/**
 * List all courses with pagination
 */
export const listCourses = query({
  args: {
    paginationOpts: paginationOptsValidator,
    organizationId: v.optional(v.id("organizations")),
    isPublished: v.optional(v.boolean()),
    productId: v.optional(v.id("products")),
  },
  handler: async (ctx, args) => {
    // Query by product directly when provided
    if (args.productId) {
      return await ctx.db
        .query("courses")
        .withIndex("by_productId", (q) => q.eq("productId", args.productId))
        .paginate(args.paginationOpts);
    }

    if (args.organizationId && args.isPublished !== undefined) {
      // Use the combined index when both filters are present
      return await ctx.db
        .query("courses")
        .withIndex("by_organization_published", (q) =>
          q
            .eq("organizationId", args.organizationId)
            .eq("isPublished", args.isPublished),
        )
        .paginate(args.paginationOpts);
    } else if (args.organizationId) {
      // Use organization index and filter by isPublished if needed
      let q = ctx.db
        .query("courses")
        .withIndex("by_organization", (q) =>
          q.eq("organizationId", args.organizationId),
        );

      if (args.isPublished !== undefined) {
        q = q.filter((q) => q.eq(q.field("isPublished"), args.isPublished));
      }

      return await q.paginate(args.paginationOpts);
    } else {
      // No organization filter, use table scan with filter if needed
      let q = ctx.db.query("courses");

      if (args.isPublished !== undefined) {
        q = q.filter((q) => q.eq(q.field("isPublished"), args.isPublished));
      }

      return await q.paginate(args.paginationOpts);
    }
  },
});

// /**
//  * Search courses by title
//  */
// export const searchCourses = query({
//   args: {
//     searchTerm: v.string(),
//     organizationId: v.optional(v.id("organizations")),
//     isPublished: v.optional(v.boolean()),
//     limit: v.optional(v.number()),
//   },
//   returns: v.array(
//     v.object({
//       _id: v.id("courses"),
//       _creationTime: v.number(),
//       organizationId: v.optional(v.id("organizations")),
//       title: v.string(),
//       description: v.optional(v.string()),
//       productId: v.optional(v.id("products")),
//       isPublished: v.optional(v.boolean()),
//       menuOrder: v.optional(v.number()),
//       courseStructure: v.optional(
//         v.array(v.object({ lessonId: v.id("lessons") })),
//       ),
//       finalQuizId: v.optional(v.id("quizzes")),
//       tagIds: v.optional(v.array(v.id("tags"))),
//     }),
//   ),
//   handler: async (ctx, args) => {
//     let searchQuery = ctx.db
//       .query("courses")
//       .withSearchIndex("search_title", (q) =>
//         q.search("title", args.searchTerm),
//       );

//     if (args.organizationId) {
//       searchQuery = searchQuery.filter((q) =>
//         q.eq(q.field("organizationId"), args.organizationId),
//       );
//     }

//     if (args.isPublished !== undefined) {
//       searchQuery = searchQuery.filter((q) =>
//         q.eq(q.field("isPublished"), args.isPublished),
//       );
//     }

//     return await searchQuery.take(args.limit ?? 50);
//   },
// });

// /**
//  * Count courses
//  */
// export const countCourses = query({
//   args: {
//     organizationId: v.optional(v.id("organizations")),
//     isPublished: v.optional(v.boolean()),
//   },
//   returns: v.number(),
//   handler: async (ctx, args) => {
//     if (args.organizationId && args.isPublished !== undefined) {
//       // Use the combined index when both filters are present
//       const results = await ctx.db
//         .query("courses")
//         .withIndex("by_organization_published", (q) =>
//           q
//             .eq("organizationId", args.organizationId)
//             .eq("isPublished", args.isPublished),
//         )
//         .collect();
//       return results.length;
//     } else if (args.organizationId) {
//       let query = ctx.db
//         .query("courses")
//         .withIndex("by_organization", (q) =>
//           q.eq("organizationId", args.organizationId),
//         );

//       if (args.isPublished !== undefined) {
//         query = query.filter((q) =>
//           q.eq(q.field("isPublished"), args.isPublished),
//         );
//       }

//       const results = await query.collect();
//       return results.length;
//     } else {
//       let query = ctx.db.query("courses");

//       if (args.isPublished !== undefined) {
//         query = query.filter((q) =>
//           q.eq(q.field("isPublished"), args.isPublished),
//         );
//       }

//       const results = await query.collect();
//       return results.length;
//     }
//   },
// });

// /**
//  * List published courses with optional search
//  * Designed for frontend course listing page
//  */
// export const listPublishedCourses = query({
//   args: {
//     searchTitle: v.optional(v.string()),
//     organizationId: v.optional(v.id("organizations")),
//     limit: v.optional(v.number()),
//   },
//   returns: v.array(
//     v.object({
//       _id: v.id("courses"),
//       _creationTime: v.number(),
//       organizationId: v.optional(v.id("organizations")),
//       title: v.string(),
//       description: v.optional(v.string()),
//       productId: v.optional(v.id("products")),
//       isPublished: v.optional(v.boolean()),
//       menuOrder: v.optional(v.number()),
//       courseStructure: v.optional(
//         v.array(v.object({ lessonId: v.id("lessons") })),
//       ),
//       finalQuizId: v.optional(v.id("quizzes")),
//       tagIds: v.optional(v.array(v.id("tags"))),
//     }),
//   ),
//   handler: async (ctx, args) => {
//     // If search term provided, use search index
//     if (args.searchTitle && args.searchTitle.trim().length > 0) {
//       let searchQuery = ctx.db
//         .query("courses")
//         .withSearchIndex("search_title", (q) =>
//           q.search("title", args.searchTitle!.trim()),
//         );

//       // Always filter to published courses
//       searchQuery = searchQuery.filter((q) =>
//         q.eq(q.field("isPublished"), true),
//       );

//       // Optional organization filter
//       if (args.organizationId) {
//         searchQuery = searchQuery.filter((q) =>
//           q.eq(q.field("organizationId"), args.organizationId),
//         );
//       }

//       return await searchQuery.take(args.limit ?? 50);
//     } else {
//       // No search, use regular query
//       if (args.organizationId) {
//         // Use organization index and filter for published
//         return await ctx.db
//           .query("courses")
//           .withIndex("by_organization_published", (q) =>
//             q.eq("organizationId", args.organizationId).eq("isPublished", true),
//           )
//           .take(args.limit ?? 50);
//       } else {
//         // No organization filter, use table scan
//         return await ctx.db
//           .query("courses")
//           .filter((q) => q.eq(q.field("isPublished"), true))
//           .take(args.limit ?? 50);
//       }
//     }
//   },
// });

// /**
//  * Get course structure with all associated items (lessons, topics, quizzes)
//  */
export const getCourseStructureWithItems = query({
  args: { courseId: v.id("courses") },
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
        .withIndex("by_lessonId", (q) => q.eq("lessonId", lessonId))
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
      course,
      attachedLessons,
      attachedTopics,
      attachedQuizzes,
    };
  },
});

/**
 * Get lessons available to attach to a course (not currently attached).
 */
export const getAvailableLessons = query({
  args: {},
  returns: v.array(
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
      menuOrder: v.optional(v.number()),
      courseId: v.optional(v.id("courses")),
    }),
  ),
  handler: async (ctx) => {
    const lessons = await ctx.db
      .query("lessons")
      .filter((q) => q.eq(q.field("courseId"), undefined))
      .collect();

    return lessons.map((l) => ({
      _id: l._id,
      _creationTime: l._creationTime,
      title: l.title,
      description: l.description,
      content: l.content,
      excerpt: l.excerpt,
      categories: l.categories,
      tagIds: l.tagIds,
      featuredImage: l.featuredImage,
      featuredMedia: l.featuredMedia,
      isPublished: l.isPublished,
      menuOrder: l.menuOrder,
      courseId: l.courseId,
    }));
  },
});

/**
 * Get topics available to attach to a lesson/course (not currently attached).
 */
export const getAvailableTopics = query({
  args: {},
  returns: v.array(
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
  handler: async (ctx) => {
    const topics = await ctx.db
      .query("topics")
      .filter((q) => q.eq(q.field("lessonId"), undefined))
      .collect();

    return topics.map((t) => ({
      _id: t._id,
      _creationTime: t._creationTime,
      title: t.title,
      description: t.description,
      excerpt: t.excerpt,
      categories: t.categories,
      tagIds: t.tagIds,
      wp_id: t.wp_id,
      featuredImage: t.featuredImage,
      featuredMedia: t.featuredMedia,
      contentType: t.contentType,
      content: t.content,
      order: t.order,
      menuOrder: t.menuOrder,
      isPublished: t.isPublished,
      lessonId: t.lessonId,
    }));
  },
});

/**
 * List members (enrolled users) of a course
 */
export const listCourseMembers = query({
  args: { courseId: v.id("courses") },
  returns: v.array(
    v.object({
      _id: v.id("users"),
      name: v.optional(v.string()),
      email: v.string(),
      image: v.optional(v.string()),
      enrolledAt: v.optional(v.number()),
      status: v.optional(
        v.union(
          v.literal("active"),
          v.literal("completed"),
          v.literal("suspended"),
          v.literal("cancelled"),
        ),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    // Find enrollments for the course
    const enrollments = await ctx.db
      .query("courseEnrollments")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect();

    if (enrollments.length === 0) return [];

    // Load user docs in parallel and map with enrollment metadata
    const users = await Promise.all(
      enrollments.map(async (en) => {
        const user = await ctx.db.get(en.userId);
        return user
          ? {
              _id: user._id,
              name: user.name ?? undefined,
              email: user.email,
              image: user.image ?? undefined,
              enrolledAt: en.enrolledAt ?? en.enrollmentDate,
              status: en.status,
            }
          : null;
      }),
    );

    return users.filter((u): u is NonNullable<typeof u> => u !== null);
  },
});
