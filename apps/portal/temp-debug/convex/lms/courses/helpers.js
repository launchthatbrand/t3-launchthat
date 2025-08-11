/**
 * Get course statistics (lesson count, topic count, etc.)
 */
export const getCourseStats = async (ctx, courseId) => {
    const course = await ctx.db.get(courseId);
    if (!course) {
        return null;
    }
    // Count lessons in this course
    const lessons = await ctx.db
        .query("lessons")
        .withIndex("by_course", (q) => q.eq("courseId", courseId))
        .collect();
    const lessonCount = lessons.length;
    // Count topics in lessons of this course
    let topicCount = 0;
    let quizCount = 0;
    for (const lesson of lessons) {
        const topics = await ctx.db
            .query("topics")
            .filter((q) => q.eq(q.field("lessonId"), lesson._id))
            .collect();
        topicCount += topics.length;
        const quizzes = await ctx.db
            .query("quizzes")
            .withIndex("by_lessonId", (q) => q.eq("lessonId", lesson._id))
            .collect();
        quizCount += quizzes.length;
    }
    // Count enrollments
    const enrollments = await ctx.db
        .query("courseEnrollments")
        .filter((q) => q.eq(q.field("courseId"), courseId))
        .collect();
    const enrollmentCount = enrollments.length;
    return {
        lessonCount,
        topicCount,
        quizCount,
        enrollmentCount,
    };
};
/**
 * Check if a user is enrolled in a course
 */
export const isUserEnrolledInCourse = async (ctx, userId, courseId) => {
    const enrollment = await ctx.db
        .query("courseEnrollments")
        .filter((q) => q.eq(q.field("userId"), userId) && q.eq(q.field("courseId"), courseId))
        .first();
    return !!enrollment;
};
/**
 * Get course progress for a user
 */
export const getCourseProgressForUser = async (ctx, userId, courseId) => {
    const course = await ctx.db.get(courseId);
    if (!course) {
        return null;
    }
    // Get all lessons for this course
    const lessons = await ctx.db
        .query("lessons")
        .withIndex("by_course", (q) => q.eq("courseId", courseId))
        .collect();
    // Get all topics for these lessons
    let totalTopics = 0;
    let totalQuizzes = 0;
    for (const lesson of lessons) {
        const topics = await ctx.db
            .query("topics")
            .filter((q) => q.eq(q.field("lessonId"), lesson._id))
            .collect();
        totalTopics += topics.length;
        const quizzes = await ctx.db
            .query("quizzes")
            .withIndex("by_lessonId", (q) => q.eq("lessonId", lesson._id))
            .collect();
        totalQuizzes += quizzes.length;
    }
    // Add final quiz if it exists
    const finalQuizCount = course.finalQuizId ? 1 : 0;
    const totalItems = totalTopics + totalQuizzes + finalQuizCount;
    // Get user's progress records for this course
    const progressRecords = await ctx.db
        .query("progress")
        .filter((q) => q.eq(q.field("userId"), userId) && q.eq(q.field("courseId"), courseId))
        .collect();
    const completedItems = progressRecords.filter((p) => p.completed).length;
    const percentComplete = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
    return {
        totalItems,
        completedItems,
        percentComplete,
    };
};
/**
 * Validate course structure (ensure all referenced lessons exist)
 */
export const validateCourseStructure = async (ctx, courseId) => {
    const course = await ctx.db.get(courseId);
    if (!course?.courseStructure) {
        return { isValid: true, missingLessonIds: [] };
    }
    const missingLessonIds = [];
    for (const item of course.courseStructure) {
        const lesson = await ctx.db.get(item.lessonId);
        if (!lesson) {
            missingLessonIds.push(item.lessonId);
        }
    }
    return {
        isValid: missingLessonIds.length === 0,
        missingLessonIds,
    };
};
