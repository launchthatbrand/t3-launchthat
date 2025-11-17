import { defineTable } from "convex/server";
import { v } from "convex/values";

export const courseEnrollmentsTable = defineTable({
  organizationId: v.optional(v.id("organizations")), // Made optional for multi-tenancy
  userId: v.id("users"),
  courseId: v.id("courses"),
  enrolledAt: v.optional(v.number()), // Timestamp
  enrollmentDate: v.optional(v.number()), // Legacy field for backward compatibility
  status: v.optional(
    v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("suspended"),
      v.literal("cancelled"),
    ),
  ),
  completedAt: v.optional(v.number()), // Timestamp when course was completed
  certificateId: v.optional(v.id("certificates")), // Link to certificate if issued
})
  .index("by_user", ["userId"])
  .index("by_course", ["courseId"])
  .index("by_user_course", ["userId", "courseId"])
  .index("by_organization", ["organizationId"]);

export const courseEnrollmentSchema = {
  courseEnrollments: courseEnrollmentsTable,
};
