import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";

/**
 * Courses Queries
 *
 * Contains all read operations for the courses feature.
 */
import { query } from "../../_generated/server";

// Import shared validators

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

// /**
//  * List all courses with pagination
//  */
export const listCourses = query({
  args: {
    paginationOpts: paginationOptsValidator,
    organizationId: v.optional(v.id("organizations")),
    isPublished: v.optional(v.boolean()),
    productId: v.optional(v.id("products")),
  },
  returns: v.any(), // Use any for pagination result to avoid validation mismatches
  handler: async (ctx, args) => {
    // Query by product directly when provided
    if (args.productId) {
      return await ctx.db
        .query("courses")
        .withIndex("by_productId", (q) => q.eq("productId", args.productId!))
        .paginate(args.paginationOpts);
    }

    if (args.organizationId && args.isPublished !== undefined) {
      // Use the combined index when both filters are present
      return await ctx.db
        .query("courses")
        .withIndex("by_organization_published", (q) =>
          q
            .eq("organizationId", args.organizationId!)
            .eq("isPublished", args.isPublished!),
        )
        .paginate(args.paginationOpts);
    } else if (args.organizationId) {
      // Use organization index and filter by isPublished if needed
      let q = ctx.db
        .query("courses")
        .withIndex("by_organization", (q) =>
          q.eq("organizationId", args.organizationId!),
        );

      if (args.isPublished !== undefined) {
        q = q.filter((q) => q.eq(q.field("isPublished"), args.isPublished!));
      }

      return await q.paginate(args.paginationOpts);
    } else {
      // No organization filter, use table scan with filter if needed
      let q = ctx.db.query("courses");

      if (args.isPublished !== undefined) {
        q = q.filter((q) => q.eq(q.field("isPublished"), args.isPublished!));
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
// export const getCourseStructureWithItems = query({
//   args: { courseId: v.id("courses") },
//   returns: v.any(), // Use any to avoid complex validation issues
//   handler: async (ctx, args) => {
//     // Get the course
//     const course = await ctx.db.get(args.courseId);
//     if (!course) {
//       return null;
//     }

//     // Get all lessons attached to this course and order them according to course.courseStructure
//     const attachedLessons: Doc<"lessons">[] = [];
//     if (course.courseStructure) {
//       for (const structureItem of course.courseStructure) {
//         const lesson = await ctx.db.get(structureItem.lessonId);
//         if (lesson) {
//           attachedLessons.push(lesson);
//         }
//       }
//     }

//     // Get all topics attached to lessons in this course
//     const attachedTopics: Doc<"topics">[] = [];
//     for (const lessonId of attachedLessons.map((l) => l._id)) {
//       const topics = await ctx.db
//         .query("topics")
//         .withIndex("by_lesson", (q) => q.eq("lessonId", lessonId))
//         .collect();
//       attachedTopics.push(...topics);
//     }

//     // Get all quizzes attached to lessons in this course
//     const attachedQuizzes = [];
//     for (const lessonId of attachedLessons.map((l) => l._id)) {
//       const quizzes = await ctx.db
//         .query("quizzes")
//         .withIndex("by_lessonId", (q) => q.eq("lessonId", lessonId))
//         .collect();
//       attachedQuizzes.push(...quizzes);
//     }

//     return {
//       course,
//       attachedLessons,
//       attachedTopics,
//       attachedQuizzes,
//     };
//   },
// });
