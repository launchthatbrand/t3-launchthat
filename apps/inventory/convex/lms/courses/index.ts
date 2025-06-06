// Remove unused type imports
// import type { Doc, Id } from "./_generated/dataModel";
// import type { MutationCtx } from "./_generated/server";
import { v } from "convex/values";

import { internal } from "../../_generated/api"; // Ensure internal is imported
import { internalMutation, mutation, query } from "../../_generated/server";
import { requireAdmin } from "../../lib/permissions/requirePermission"; // Use the consolidated version

// Courses logic will be moved here
export {};

// --- Query Functions ---

/**
 * List all courses, optionally searching by title.
 * Returns an array of course documents.
 */
export const listCourses = query({
  args: { searchTitle: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.searchTitle) {
      const courses = await ctx.db
        .query("courses")
        .withSearchIndex("search_title", (q) =>
          q.search("title", args.searchTitle ?? ""),
        )
        // TODO: Add pagination later
        .collect();
      return courses;
    } else {
      // Otherwise, fetch all courses (or implement default sort/pagination later)
      const courses = await ctx.db.query("courses").collect();
      return courses;
    }
    // TODO: Add filtering for other columns (e.g., status) later.
  },
  // Keep explicit return type validator
  returns: v.array(
    v.object({
      _id: v.id("courses"),
      _creationTime: v.number(),
      title: v.string(),
      description: v.optional(v.string()),
      productId: v.optional(v.id("products")),
      isPublished: v.optional(v.boolean()),
      courseStructure: v.optional(
        v.array(v.object({ lessonId: v.id("lessons") })),
      ),
    }),
  ),
});

/**
 * Get a single course by its ID.
 * Publicly accessible query.
 */
export const getCourse = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.courseId);
    return course;
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("courses"),
      _creationTime: v.number(),
      title: v.string(),
      description: v.optional(v.string()),
      productId: v.optional(v.id("products")),
      isPublished: v.optional(v.boolean()),
      courseStructure: v.optional(
        v.array(v.object({ lessonId: v.id("lessons") })),
      ),
    }),
  ),
});

/**
 * Get the full structure of a course, including its lessons and topics, sorted by order.
 * Used by the CourseBuilder component.
 */
export const getCourseStructure = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    // 1. Fetch the course details
    const course = await ctx.db.get(args.courseId);
    if (!course) {
      return null; // Course not found
    }

    // 2. Get ordered lesson IDs from courseStructure
    const orderedLessonStructure = course.courseStructure; // Array of { lessonId: Id<"lessons"> }
    if (!orderedLessonStructure || orderedLessonStructure.length === 0) {
      // Course exists but has no lessons defined in its structure
      return { ...course, lessons: [] };
    }

    const orderedLessonIds = orderedLessonStructure.map(
      (item) => item.lessonId,
    );

    // 3. Fetch lesson documents based on the ordered IDs
    const lessonDocs = await Promise.all(
      orderedLessonIds.map((lessonId) => ctx.db.get(lessonId)),
    );

    // Filter out any null results (if a lessonId in structure doesn't exist)
    const validLessons = lessonDocs.filter(
      (doc): doc is NonNullable<typeof doc> => doc !== null,
    );

    // Create a map for quick lookup if needed later, though order is primary now
    // const lessonsById = new Map(validLessons.map(lesson => [lesson._id, lesson]));

    // 4. Fetch topics for each valid lesson, sorted by topic order
    const lessonsWithTopics = await Promise.all(
      validLessons.map(async (lesson) => {
        const topics = await ctx.db
          .query("topics")
          .withIndex("by_lessonId_order", (q) => q.eq("lessonId", lesson._id))
          .order("asc") // Order topics by their own 'order' field
          .collect();

        // TODO: Fetch quizzes for each topic here if needed
        // const topicsWithQuizzes = await Promise.all(topics.map(async topic => {...}));

        return { ...lesson, topics }; // Combine lesson with its topics
      }),
    );

    // 5. Ensure the final lessons array respects the order from courseStructure
    const finalOrderedLessons = orderedLessonIds
      .map((lessonId) => {
        const foundLesson = lessonsWithTopics.find((l) => l._id === lessonId);
        return foundLesson; // Will be undefined if the lesson doc was null/invalid
      })
      .filter((l): l is NonNullable<typeof l> => l !== undefined);

    // 6. Combine course details with the correctly ordered lessons+topics
    return { ...course, lessons: finalOrderedLessons };
  },
  // Define a detailed return type validator for the nested structure
  returns: v.union(
    v.null(),
    v.object({
      // Course fields from schema
      _id: v.id("courses"),
      _creationTime: v.number(),
      title: v.string(),
      description: v.optional(v.string()),
      productId: v.optional(v.id("products")),
      isPublished: v.optional(v.boolean()),
      courseStructure: v.optional(
        v.array(v.object({ lessonId: v.id("lessons") })),
      ), // Include courseStructure in return
      // Nested lessons array
      lessons: v.array(
        v.object({
          // Lesson fields from updated schema
          _id: v.id("lessons"),
          _creationTime: v.number(),
          // courseId: v.id("courses"), // Removed
          title: v.string(),
          description: v.optional(v.string()),
          // order: v.number(), // Removed
          isPublished: v.optional(v.boolean()),
          // Nested topics array (structure reflects updated schema)
          topics: v.array(
            v.object({
              // Topic fields from schema
              _id: v.id("topics"),
              _creationTime: v.number(),
              lessonId: v.optional(v.id("lessons")), // Make optional
              title: v.string(),
              contentType: v.union(
                v.literal("text"),
                v.literal("video"),
                v.literal("quiz"),
              ),
              content: v.optional(v.string()),
              order: v.optional(v.number()), // Make optional
              isPublished: v.optional(v.boolean()),
            }),
          ),
        }),
      ),
    }),
  ),
});

/**
 * Get topics that are not currently associated with any lesson.
 */
export const getAvailableTopics = query({
  args: {},
  handler: async (ctx) => {
    // Corrected logic: Use the index to find unattached topics directly
    const availableTopics = await ctx.db
      .query("topics")
      .withIndex("by_unattached", (q) => q.eq("lessonId", undefined))
      .collect();

    return availableTopics;
  },
  returns: v.array(
    // Update validator to match the schema (lessonId and order are optional)
    v.object({
      _id: v.id("topics"),
      _creationTime: v.number(),
      lessonId: v.optional(v.id("lessons")), // Make optional
      title: v.string(),
      contentType: v.union(
        v.literal("text"),
        v.literal("video"),
        v.literal("quiz"),
      ),
      content: v.optional(v.string()),
      order: v.optional(v.number()), // Make optional
      isPublished: v.optional(v.boolean()),
    }),
  ),
});

/**
 * Get quizzes that are not currently associated with any topic or lesson.
 */
export const getAvailableQuizzes = query({
  args: {},
  handler: async (ctx) => {
    // Fetch all quizzes
    // Consider pagination
    const allQuizzes = await ctx.db.query("quizzes").collect();

    // Filter out quizzes linked to a topic or lesson
    const availableQuizzes = allQuizzes.filter(
      (quiz) => !quiz.topicId && !quiz.lessonId, // Check both optional fields
    );

    return availableQuizzes;
  },
  returns: v.array(
    // Return type matches the quiz structure in the schema
    v.object({
      _id: v.id("quizzes"),
      _creationTime: v.number(),
      title: v.string(),
      lessonId: v.optional(v.id("lessons")),
      topicId: v.optional(v.id("topics")),
      questions: v.array(
        v.object({
          questionText: v.string(),
          type: v.union(
            v.literal("single-choice"),
            v.literal("multiple-choice"),
            v.literal("true-false"),
          ),
          options: v.optional(v.array(v.string())),
          correctAnswer: v.union(v.string(), v.boolean(), v.array(v.string())),
          explanation: v.optional(v.string()),
        }),
      ),
      timeLimit: v.optional(v.number()), // in minutes
      passThreshold: v.optional(v.number()), // percentage (e.g., 70)
      isPublished: v.optional(v.boolean()),
    }),
  ),
});

// --- Mutation Functions ---

/**
 * Create a new course.
 * Admin-only mutation.
 */
export const createCourse = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    productId: v.optional(v.id("products")),
    isPublished: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    // Create the course
    const courseId = await ctx.db.insert("courses", {
      title: args.title,
      description: args.description,
      productId: args.productId,
      isPublished: args.isPublished ?? false, // Default to not published
      // courseStructure will be empty initially, managed by updateCourseStructure
      courseStructure: [],
    });

    return courseId;
  },
  returns: v.id("courses"),
});

/**
 * Update an existing course.
 * Admin-only mutation.
 */
export const updateCourse = mutation({
  args: {
    courseId: v.id("courses"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    productId: v.optional(v.id("products")),
    isPublished: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const { courseId, ...updates } = args;

    // Fetch the existing course to ensure it exists
    const existingCourse = await ctx.db.get(courseId);
    if (!existingCourse) {
      throw new Error("Course not found");
    }

    // Perform the patch operation
    await ctx.db.patch(courseId, updates);

    return { success: true };
  },
  returns: v.object({ success: v.boolean() }),
});

/**
 * Delete a course. This will also internally handle deletion/unlinking of associated lessons and topics.
 * Admin-only mutation.
 */
export const deleteCourse = mutation({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    // Fetch the course to get its structure
    const course = await ctx.db.get(args.courseId);
    if (!course) {
      throw new Error("Course not found and cannot be deleted.");
    }

    // 1. Delete all lessons in the course structure and their topics/quizzes
    if (course.courseStructure && course.courseStructure.length > 0) {
      for (const lessonItem of course.courseStructure) {
        // Schedule internal deletion for each lesson
        await ctx.scheduler.runAfter(
          0,
          internal.lms.courses.internalDeleteLessonAndContent, // Corrected path
          {
            lessonId: lessonItem.lessonId,
          },
        );
      }
    }

    // 2. Delete the course itself
    await ctx.db.delete(args.courseId);

    return { success: true };
  },
  returns: v.object({ success: v.boolean() }),
});

// --- Internal Mutation for Deleting Lesson and its Content (Topics, Quizzes) ---
export const internalDeleteLessonAndContent = internalMutation({
  args: { lessonId: v.id("lessons") },
  handler: async (ctx, args) => {
    // 1. Fetch topics associated with the lesson
    const topics = await ctx.db
      .query("topics")
      .withIndex("by_lessonId_order", (q) => q.eq("lessonId", args.lessonId))
      .collect();

    // 2. For each topic, delete associated quizzes, then the topic itself
    for (const topic of topics) {
      // Delete quizzes linked to this topic
      const topicQuizzes = await ctx.db
        .query("quizzes")
        .withIndex("by_topicId", (q) => q.eq("topicId", topic._id))
        .collect();
      for (const quiz of topicQuizzes) {
        await ctx.db.delete(quiz._id);
      }
      // Delete the topic
      await ctx.db.delete(topic._id);
    }

    // 3. Delete quizzes directly linked to the lesson (if any)
    const lessonQuizzes = await ctx.db
      .query("quizzes")
      .withIndex("by_lessonId", (q) => q.eq("lessonId", args.lessonId))
      .collect();
    for (const quiz of lessonQuizzes) {
      await ctx.db.delete(quiz._id);
    }

    // 4. Delete the lesson itself
    const lesson = await ctx.db.get(args.lessonId);
    if (lesson) {
      await ctx.db.delete(args.lessonId);
    }
  },
  // No specific return value needed, or v.null() for consistency
  returns: v.null(),
});

// --- Course Structure Management ---

/**
 * Add a lesson to a course's structure.
 * Admin-only mutation.
 */
export const addLessonToCourse = mutation({
  args: {
    courseId: v.id("courses"),
    lessonId: v.id("lessons"),
    order: v.optional(v.number()), // Optional: if not provided, appends to the end
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const course = await ctx.db.get(args.courseId);
    if (!course) {
      throw new Error("Course not found");
    }

    const lesson = await ctx.db.get(args.lessonId);
    if (!lesson) {
      throw new Error("Lesson not found");
    }

    // Ensure lesson is not already in the course structure
    const existingEntry = (course.courseStructure ?? []).find(
      (item) => item.lessonId === args.lessonId,
    );
    if (existingEntry) {
      throw new Error("Lesson already exists in this course");
    }

    const newStructureItem = { lessonId: args.lessonId };
    let updatedStructure = [...(course.courseStructure ?? [])];

    if (args.order !== undefined && args.order >= 0) {
      updatedStructure.splice(args.order, 0, newStructureItem);
    } else {
      updatedStructure.push(newStructureItem);
    }

    await ctx.db.patch(args.courseId, { courseStructure: updatedStructure });

    // Update the lesson to link it to this course
    // No, lessons are standalone, their presence in courseStructure implies the link.
    // await ctx.db.patch(args.lessonId, { courseId: args.courseId });

    return { success: true };
  },
  returns: v.object({ success: v.boolean() }),
});

/**
 * Remove a lesson from a course's structure.
 * Does NOT delete the lesson itself, only unlinks it from the course structure.
 * Admin-only mutation.
 */
export const removeLessonFromCourse = mutation({
  args: {
    courseId: v.id("courses"),
    lessonId: v.id("lessons"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const course = await ctx.db.get(args.courseId);
    if (!course) {
      throw new Error("Course not found");
    }

    const lesson = await ctx.db.get(args.lessonId);
    if (!lesson) {
      // Lesson might have been deleted, which is okay for removal from structure
      console.warn(
        `Lesson ${args.lessonId} not found, attempting removal from course structure anyway.`,
      );
    }

    const updatedStructure = (course.courseStructure ?? []).filter(
      (item) => item.lessonId !== args.lessonId,
    );

    if (updatedStructure.length === (course.courseStructure ?? []).length) {
      // Lesson was not found in the structure, maybe already removed
      // For idempotency, we can return success or a specific message
      // throw new Error("Lesson not found in course structure");
      console.warn(
        `Lesson ${args.lessonId} not found in structure of course ${args.courseId}.`,
      );
      return {
        success: true,
        message: "Lesson not found in structure or already removed.",
      };
    }

    await ctx.db.patch(args.courseId, { courseStructure: updatedStructure });

    // Unlink the lesson from the course
    // No, lessons are standalone. Removing from courseStructure is sufficient.
    // if (lesson && lesson.courseId === args.courseId) {
    //   await ctx.db.patch(args.lessonId, { courseId: undefined });
    // }

    return { success: true };
  },
  returns: v.object({ success: v.boolean(), message: v.optional(v.string()) }),
});

/**
 * Reorder lessons within a course's structure.
 * Admin-only mutation.
 */
export const reorderLessonsInCourse = mutation({
  args: {
    courseId: v.id("courses"),
    // Expects an array of lesson IDs in the new desired order
    orderedLessonIds: v.array(v.id("lessons")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const course = await ctx.db.get(args.courseId);
    if (!course) {
      throw new Error("Course not found");
    }

    const updatedStructure = args.orderedLessonIds.map((lessonId) => ({
      lessonId,
      order:
        course.courseStructure?.findIndex(
          (item) => item.lessonId === lessonId,
        ) ?? 0,
    }));

    await ctx.db.patch(args.courseId, { courseStructure: updatedStructure });

    return { success: true };
  },
  returns: v.object({ success: v.boolean() }),
});
