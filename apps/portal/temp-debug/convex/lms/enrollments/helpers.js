/**
 * Get enrollment statistics for a course
 */
export const getCourseEnrollmentStats = async (ctx, courseId) => {
    const course = await ctx.db.get(courseId);
    if (!course) {
        return null;
    }
    const enrollments = await ctx.db
        .query("courseEnrollments")
        .withIndex("by_course", (q) => q.eq("courseId", courseId))
        .collect();
    const totalEnrollments = enrollments.length;
    const activeEnrollments = enrollments.filter((e) => e.status === "active").length;
    const inactiveEnrollments = totalEnrollments - activeEnrollments;
    return {
        totalEnrollments,
        activeEnrollments,
        inactiveEnrollments,
    };
};
/**
 * Get enrollment statistics for a user
 */
export const getUserEnrollmentStats = async (ctx, userId) => {
    const user = await ctx.db.get(userId);
    if (!user) {
        return null;
    }
    const enrollments = await ctx.db
        .query("courseEnrollments")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();
    const totalEnrollments = enrollments.length;
    const activeEnrollments = enrollments.filter((e) => e.status === "active").length;
    const completedEnrollments = enrollments.filter((e) => e.status === "completed").length;
    return {
        totalEnrollments,
        activeEnrollments,
        completedEnrollments,
    };
};
/**
 * Check if enrollment is valid and active
 */
export const isEnrollmentActive = (enrollment) => {
    return enrollment !== null && enrollment.status === "active";
};
/**
 * Calculate days since enrollment
 */
export const getDaysSinceEnrollment = (enrollmentDate) => {
    const now = Date.now();
    const daysDiff = Math.floor((now - enrollmentDate) / (1000 * 60 * 60 * 24));
    return daysDiff;
};
