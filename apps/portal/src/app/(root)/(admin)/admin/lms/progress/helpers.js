/**
 * Get progress statistics for a user in a course
 */
export const getUserProgressStats = async (ctx, userId, courseId) => {
    // Get course progress metadata
    const courseProgress = await ctx.db
        .query("courseProgress")
        .withIndex("by_user_course", (q) => q.eq("userId", userId).eq("courseId", courseId))
        .unique();
    if (!courseProgress) {
        return null;
    }
    const percentageComplete = courseProgress.total > 0
        ? Math.round((courseProgress.completed / courseProgress.total) * 100)
        : 0;
    return {
        totalItems: courseProgress.total,
        completedItems: courseProgress.completed,
        percentageComplete,
        lastAccessedAt: courseProgress.lastAccessedAt || null,
    };
};
/**
 * Check if a user can access the next item in a course (linear progression)
 */
export const canAccessNextItem = async (ctx, userId, courseId, currentItemId) => {
    // For now, return true (non-linear access)
    // This could be enhanced to check if previous items are completed
    return true;
};
/**
 * Calculate completion percentage for a specific lesson
 */
export const calculateLessonProgress = async (ctx, userId, lessonId) => {
    // Get all topics for this lesson
    const topics = await ctx.db
        .query("topics")
        .withIndex("by_lessonId_order", (q) => q.eq("lessonId", lessonId))
        .collect();
    if (topics.length === 0) {
        return {
            percentage: 0,
            completedTopics: 0,
            totalTopics: 0,
        };
    }
    // Count completed topics
    let completedCount = 0;
    for (const topic of topics) {
        const progress = await ctx.db
            .query("progress")
            .withIndex("by_user_item", (q) => q.eq("userId", userId).eq("itemId", topic._id))
            .unique();
        if (progress?.completed) {
            completedCount++;
        }
    }
    const percentage = Math.round((completedCount / topics.length) * 100);
    return {
        percentage,
        completedTopics: completedCount,
        totalTopics: topics.length,
    };
};
/**
 * Get the next recommended item for a user in a course
 */
export const getNextRecommendedItem = async (ctx, userId, courseId) => {
    // This is a simplified implementation
    // A full implementation would follow the course structure and find the first incomplete item
    // Get course progress to see last accessed item
    const courseProgress = await ctx.db
        .query("courseProgress")
        .withIndex("by_user_course", (q) => q.eq("userId", userId).eq("courseId", courseId))
        .unique();
    if (!courseProgress || !courseProgress.lastAccessedId) {
        // Return the first lesson if no progress exists
        const firstLesson = await ctx.db
            .query("lessons")
            .withIndex("by_course", (q) => q.eq("courseId", courseId))
            .first();
        if (firstLesson) {
            return {
                itemId: firstLesson._id,
                itemType: "lesson",
            };
        }
    }
    // For now, return null (could be enhanced with proper next-item logic)
    return null;
};
