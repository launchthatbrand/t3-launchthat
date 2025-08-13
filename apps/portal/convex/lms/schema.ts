// Import contentAccess schema tables

/**
 * LMS Schema Definitions
 *
 * Contains all table definitions for the LMS (Learning Management System) feature.
 * This includes courses, lessons, topics, quizzes, enrollments, progress tracking, and content access control.
 */

import { courseEnrollmentSchema } from "./courses/enrollment/schema";
import { courseSchema } from "./courses/schema";
import { lessonSchema } from "./lessons/schema";
import { lmsProgressSchema } from "./progress/schema";
import { quizSchema } from "./quizzes/schema";
import { topicSchema } from "./topics/schema";

// Export all LMS tables in the expected format
export const lmsSchema = {
  ...courseSchema,
  ...lessonSchema,
  ...topicSchema,
  ...quizSchema,
  ...courseEnrollmentSchema,
  ...lmsProgressSchema,
};
