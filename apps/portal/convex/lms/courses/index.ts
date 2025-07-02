import { filter } from "convex-helpers/server/filter";
// Remove unused type imports
// import type { Doc, Id } from "./_generated/dataModel";
// import type { MutationCtx } from "./_generated/server";
import { v } from "convex/values";

import type { Id } from "../../_generated/dataModel";
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
      ),
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
              lessonId: v.optional(v.id("lessons")),
              title: v.string(),
              contentType: v.union(
                v.literal("text"),
                v.literal("video"),
                v.literal("quiz"),
              ),
              content: v.optional(v.string()),
              order: v.optional(v.number()),
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
      lessonId: v.optional(v.id("lessons")),
      title: v.string(),
      contentType: v.union(
        v.literal("text"),
        v.literal("video"),
        v.literal("quiz"),
      ),
      content: v.optional(v.string()),
      order: v.optional(v.number()),
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
      (quiz) => !quiz.topicId && !quiz.lessonId,
    );

    return availableQuizzes;
  },
  returns: v.array(
    // Return type matches the quiz structure in the schema
    v.object({
      _id: v.id("quizzes"),
      _creationTime: v.number(),
      title: v.string(),
      description: v.optional(v.string()),
      questions: v.optional(v.array(v.any())),
    }),
  ),
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
      .withIndex("by_course_order", (q) => q.eq("courseId", args.courseId))
      .collect()
      .then((lessons) => lessons.length);

    const lessonIds = await ctx.db
      .query("lessons")
      .withIndex("by_course_order", (q) => q.eq("courseId", args.courseId))
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

    return {
      ...course,
      lessonCount,
      topicCount,
      quizCount,
    };
  },
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
          internal.lms.courses.index.internalDeleteLessonAndContent, // Corrected path
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
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    // Attach the lesson to the course (update its courseId field)
    await ctx.db.patch(args.lessonId, { courseId: args.courseId });

    // Update the course's structure to include the new lesson
    const course = await ctx.db.get(args.courseId);
    if (!course) {
      throw new Error("Course not found");
    }

    // Prevent adding the same lesson multiple times to the structure
    const existingEntry = course.courseStructure?.find(
      (item) => item.lessonId === args.lessonId,
    );
    if (existingEntry) {
      return null; // Lesson already in structure, no need to add again
    }

    const currentStructure = course.courseStructure ?? [];
    const newStructure = [
      ...currentStructure,
      { lessonId: args.lessonId }, // Removed 'type' field to match schema
    ];
    await ctx.db.patch(args.courseId, { courseStructure: newStructure });
    return null;
  },
});

/**
 * Removes a lesson from a course's structure (unlinks it from the course order).
 * This does NOT delete the lesson itself.
 * Admin-only mutation.
 */
export const removeLessonFromCourseStructure = mutation({
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

    const updatedStructure =
      course.courseStructure?.filter(
        (item) => item.lessonId !== args.lessonId,
      ) ?? [];

    await ctx.db.patch(args.courseId, { courseStructure: updatedStructure });

    // Also nullify the courseId on the lesson itself, effectively detaching it.
    await ctx.db.patch(args.lessonId, { courseId: undefined });

    return null;
  },
});

/**
 * Reorders lessons within a course's structure.
 * Admin-only mutation.
 */
export const reorderLessonsInCourse = mutation({
  args: {
    courseId: v.id("courses"),
    orderedLessonIds: v.array(v.id("lessons")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const course = await ctx.db.get(args.courseId);
    if (!course) {
      throw new Error("Course not found");
    }

    // Map the orderedLessonIds to the structure format
    const newCourseStructure = args.orderedLessonIds.map((lessonId) => ({
      lessonId: lessonId,
    }));

    await ctx.db.patch(args.courseId, { courseStructure: newCourseStructure });

    return null;
  },
});

// --- Get Course Structure ---
export const getStructure = query({
  args: {
    courseId: v.id("courses"),
  },
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.courseId);
    if (!course) {
      throw new Error("Course not found");
    }

    // Get all lessons for this course
    const lessons = await ctx.db
      .query("lessons")
      .withIndex("by_course_order", (q) => q.eq("courseId", args.courseId))
      .collect();

    // Get all topics for these lessons
    const lessonIds = lessons.map((lesson) => lesson._id);
    const topics = await filter(
      ctx.db.query("topics").withIndex("by_lessonId_order"),
      (topic) => lessonIds.includes(topic.lessonId as Id<"lessons">),
    ).collect();

    // Get all quizzes for these topics
    const topicIds = topics.map((topic) => topic._id);
    const quizzes = await filter(
      ctx.db.query("quizzes").withIndex("by_topicId"),
      (quiz) => topicIds.includes(quiz.topicId as Id<"topics">),
    ).collect();

    // Get final quiz if it exists
    const finalQuiz = course.finalQuizId
      ? await ctx.db.get(course.finalQuizId)
      : null;

    return {
      course,
      lessons,
      topics,
      quizzes,
      finalQuiz,
    };
  },
});

// --- Update Course Structure ---
export const updateStructure = mutation({
  args: {
    courseId: v.id("courses"),
    lessonIds: v.array(v.id("lessons")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    // Update course structure
    await ctx.db.patch(args.courseId, {
      courseStructure: args.lessonIds.map((lessonId) => ({ lessonId })),
    });

    // Update lesson orders
    for (let i = 0; i < args.lessonIds.length; i++) {
      await ctx.db.patch(args.lessonIds[i], {
        courseId: args.courseId,
        order: i,
      });
    }
  },
});

// --- Set Final Quiz ---
export const setFinalQuiz = mutation({
  args: {
    courseId: v.id("courses"),
    quizId: v.optional(v.id("quizzes")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    // Get current final quiz ID
    const course = await ctx.db.get(args.courseId);
    if (!course) {
      throw new Error("Course not found");
    }

    // If there was a previous final quiz, unlink it
    if (course.finalQuizId) {
      await ctx.db.patch(course.finalQuizId, {
        courseId: undefined,
        order: undefined,
      });
    }

    // Update course with new final quiz
    await ctx.db.patch(args.courseId, {
      finalQuizId: args.quizId,
    });

    // If setting a new quiz, link it to the course
    if (args.quizId) {
      await ctx.db.patch(args.quizId, {
        courseId: args.courseId,
        order: 0, // Final quiz is always first/only
      });
    }
  },
});

// --- Remove Lesson from Course ---
export const removeLesson = mutation({
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

    // Remove lesson from course structure
    const newStructure =
      course.courseStructure?.filter(
        (item) => item.lessonId !== args.lessonId,
      ) ?? [];

    await ctx.db.patch(args.courseId, {
      courseStructure: newStructure,
    });

    // Unlink lesson from course
    await ctx.db.patch(args.lessonId, {
      courseId: undefined,
      order: undefined,
    });
  },
});

export const saveCourseStructure = mutation({
  args: {
    courseId: v.id("courses"),
    structure: v.object({
      lessons: v.array(
        v.object({
          lessonId: v.id("lessons"),
        }),
      ),
    }),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    // Verify the course exists
    const course = await ctx.db.get(args.courseId);
    if (!course) {
      throw new Error("Course not found");
    }

    console.log("Saving course structure:", {
      courseId: args.courseId,
      structure: args.structure,
      currentStructure: course.courseStructure,
    });

    // Get current course structure to find lessons to detach
    const currentStructure = course.courseStructure ?? [];
    const currentLessonIds = new Set(
      currentStructure.map((item) => item.lessonId),
    );
    const newLessonIds = new Set(
      args.structure.lessons.map((item) => item.lessonId),
    );

    console.log("Lesson IDs:", {
      current: Array.from(currentLessonIds),
      new: Array.from(newLessonIds),
    });

    // 1. Detach lessons that are no longer in the structure
    for (const { lessonId } of currentStructure) {
      if (!newLessonIds.has(lessonId)) {
        console.log("Detaching lesson:", lessonId);
        // Remove courseId and order from the lesson
        await ctx.db.patch(lessonId, {
          courseId: undefined,
          order: undefined,
        });
      }
    }

    // 2. Update lesson attachments and order
    for (let i = 0; i < args.structure.lessons.length; i++) {
      const { lessonId } = args.structure.lessons[i];
      console.log("Updating lesson:", { lessonId, order: i });

      // First verify the lesson exists
      const lesson = await ctx.db.get(lessonId);
      if (!lesson) {
        console.log("Warning: Lesson not found:", lessonId);
        continue;
      }

      // Attach lesson to course and set its order
      await ctx.db.patch(lessonId, {
        courseId: args.courseId,
        order: i,
      });
    }

    // 3. Update the course structure
    console.log("Updating course structure");
    await ctx.db.patch(args.courseId, {
      courseStructure: args.structure.lessons,
    });

    console.log("Course structure saved successfully");
    return { success: true };
  },
});
