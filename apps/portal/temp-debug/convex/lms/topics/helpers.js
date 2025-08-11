/**
 * Get topic statistics (quiz count, completion rate, etc.)
 */
export const getTopicStats = async (ctx, topicId) => {
    const topic = await ctx.db.get(topicId);
    if (!topic) {
        return null;
    }
    // Count quizzes in this topic
    const quizzes = await ctx.db
        .query("quizzes")
        .withIndex("by_lesson", (q) => q.eq("lessonId", topicId)) // Note: this might need adjustment based on actual schema
        .collect();
    const quizCount = quizzes.length;
    const isPublished = topic.isPublished ?? false;
    const hasContent = !!topic.content && topic.content.trim().length > 0;
    return {
        quizCount,
        isPublished,
        hasContent,
    };
};
/**
 * Check if a topic is ready for publication
 */
export const isTopicReadyForPublication = async (ctx, topicId) => {
    const topic = await ctx.db.get(topicId);
    if (!topic) {
        return false;
    }
    // Basic requirements for publication
    const hasTitle = !!topic.title && topic.title.trim().length > 0;
    const hasContent = !!topic.content && topic.content.trim().length > 0;
    const hasContentType = !!topic.contentType;
    return hasTitle && hasContent && hasContentType;
};
/**
 * Get next order value for a lesson
 */
export const getNextOrderForLesson = async (ctx, lessonId) => {
    const existingTopics = await ctx.db
        .query("topics")
        .withIndex("by_lessonId_order", (q) => q.eq("lessonId", lessonId))
        .order("desc")
        .take(1);
    return (existingTopics[0]?.order ?? 0) + 1;
};
