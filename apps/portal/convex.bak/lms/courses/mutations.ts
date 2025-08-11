/**
 * Courses Mutations
 *
 * Contains all write operations for the courses feature.
 */
import { mutation } from "@/convex/_generated/server";
import { v } from "convex/values";

/**
 * Create a new course
 */
export const createCourse = mutation({
  args: {
    organizationId: v.optional(v.id("organizations")),
    title: v.string(),
    description: v.optional(v.string()),
    productId: v.optional(v.id("products")),
    isPublished: v.optional(v.boolean()),
    menuOrder: v.optional(v.number()),
    tagIds: v.optional(v.array(v.id("tags"))),
  },
  returns: v.id("courses"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("courses", {
      organizationId: args.organizationId,
      title: args.title,
      description: args.description,
      productId: args.productId,
      isPublished: args.isPublished ?? false,
      menuOrder: args.menuOrder,
      tagIds: args.tagIds,
    });
  },
});

// /**
//  * Update an existing course
//  */
// export const updateCourse = mutation({
//   args: {
//     id: v.id("courses"),
//     title: v.optional(v.string()),
//     description: v.optional(v.string()),
//     productId: v.optional(v.id("products")),
//     isPublished: v.optional(v.boolean()),
//     menuOrder: v.optional(v.number()),
//     courseStructure: v.optional(
//       v.array(v.object({ lessonId: v.id("lessons") })),
//     ),
//     finalQuizId: v.optional(v.id("quizzes")),
//     tagIds: v.optional(v.array(v.id("tags"))),
//   },
//   returns: v.null(),
//   handler: async (ctx, args) => {
//     const { id, ...updates } = args;

//     // Remove undefined fields
//     const cleanUpdates = Object.fromEntries(
//       Object.entries(updates).filter(([_, value]) => value !== undefined),
//     );

//     await ctx.db.patch(id, cleanUpdates);
//     return null;
//   },
// });

// /**
//  * Delete a course
//  */
// export const deleteCourse = mutation({
//   args: {
//     id: v.id("courses"),
//   },
//   returns: v.null(),
//   handler: async (ctx, args) => {
//     await ctx.db.delete(args.id);
//     return null;
//   },
// });

// /**
//  * Add a lesson to a course's structure
//  */
// export const addLessonToCourse = mutation({
//   args: {
//     courseId: v.id("courses"),
//     lessonId: v.id("lessons"),
//   },
//   returns: v.null(),
//   handler: async (ctx, args) => {
//     const course = await ctx.db.get(args.courseId);
//     if (!course) {
//       throw new Error("Course not found");
//     }

//     const currentStructure = course.courseStructure ?? [];
//     const newStructure = [...currentStructure, { lessonId: args.lessonId }];

//     await ctx.db.patch(args.courseId, {
//       courseStructure: newStructure,
//     });

//     // Also update the lesson to reference this course
//     await ctx.db.patch(args.lessonId, {
//       courseId: args.courseId,
//     });

//     return null;
//   },
// });

// /**
//  * Remove a lesson from a course's structure
//  */
// export const removeLessonFromCourse = mutation({
//   args: {
//     courseId: v.id("courses"),
//     lessonId: v.id("lessons"),
//   },
//   returns: v.null(),
//   handler: async (ctx, args) => {
//     const course = await ctx.db.get(args.courseId);
//     if (!course) {
//       throw new Error("Course not found");
//     }

//     const currentStructure = course.courseStructure ?? [];
//     const newStructure = currentStructure.filter(
//       (item) => item.lessonId !== args.lessonId,
//     );

//     await ctx.db.patch(args.courseId, {
//       courseStructure: newStructure,
//     });

//     // Remove course reference from lesson
//     await ctx.db.patch(args.lessonId, {
//       courseId: undefined,
//     });

//     return null;
//   },
// });

// /**
//  * Reorder lessons in a course
//  */
// export const reorderCourseLessons = mutation({
//   args: {
//     courseId: v.id("courses"),
//     lessonIds: v.array(v.id("lessons")),
//   },
//   returns: v.null(),
//   handler: async (ctx, args) => {
//     const course = await ctx.db.get(args.courseId);
//     if (!course) {
//       throw new Error("Course not found");
//     }

//     const newStructure = args.lessonIds.map((lessonId) => ({ lessonId }));

//     await ctx.db.patch(args.courseId, {
//       courseStructure: newStructure,
//     });

//     return null;
//   },
// });

// /**
//  * Set the final quiz for a course
//  */
// export const setCourseFinalQuiz = mutation({
//   args: {
//     courseId: v.id("courses"),
//     quizId: v.optional(v.id("quizzes")),
//   },
//   returns: v.null(),
//   handler: async (ctx, args) => {
//     await ctx.db.patch(args.courseId, {
//       finalQuizId: args.quizId,
//     });
//     return null;
//   },
// });

// /**
//  * Publish or unpublish a course
//  */
// export const markCoursePublished = mutation({
//   args: {
//     id: v.id("courses"),
//     isPublished: v.boolean(),
//   },
//   returns: v.null(),
//   handler: async (ctx, args) => {
//     await ctx.db.patch(args.id, {
//       isPublished: args.isPublished,
//     });
//     return null;
//   },
// });
