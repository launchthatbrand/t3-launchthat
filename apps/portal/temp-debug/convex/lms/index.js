// LMS Module Index - Creates nested API structure
// This enables api.lms.courses.queries.searchCourses syntax
import * as contentAccessMutations from "./contentAccess/mutations";
import * as contentAccessQueries from "./contentAccess/queries";
import * as coursesHelpers from "./courses/helpers";
import * as coursesMutations from "./courses/mutations";
import * as coursesQueries from "./courses/queries";
import * as enrollmentsHelpers from "./enrollments/helpers";
// enrollments only has helpers file - no queries/mutations yet
import * as lessonsHelpers from "./lessons/helpers";
import * as lessonsMutations from "./lessons/mutations";
import * as lessonsQueries from "./lessons/queries";
import * as progressHelpers from "./progress/helpers";
import * as progressMutations from "./progress/mutations";
import * as progressQueries from "./progress/queries";
import * as quizzesHelpers from "./quizzes/helpers";
import * as quizzesMutations from "./quizzes/mutations";
import * as quizzesQueries from "./quizzes/queries";
import * as topicsHelpers from "./topics/helpers";
import * as topicsMutations from "./topics/mutations";
import * as topicsQueries from "./topics/queries";
// Export nested structure
export const courses = {
    queries: coursesQueries,
    mutations: coursesMutations,
    helpers: coursesHelpers,
};
export const lessons = {
    queries: lessonsQueries,
    mutations: lessonsMutations,
    helpers: lessonsHelpers,
};
export const topics = {
    queries: topicsQueries,
    mutations: topicsMutations,
    helpers: topicsHelpers,
};
export const quizzes = {
    queries: quizzesQueries,
    mutations: quizzesMutations,
    helpers: quizzesHelpers,
};
export const enrollments = {
    helpers: enrollmentsHelpers,
};
export const progress = {
    queries: progressQueries,
    mutations: progressMutations,
    helpers: progressHelpers,
};
export const contentAccess = {
    queries: contentAccessQueries,
    mutations: contentAccessMutations,
};
// Legacy flat exports for backward compatibility
export * as coursesQueries from "./courses/queries";
export * as coursesMutations from "./courses/mutations";
export * as coursesHelpers from "./courses/helpers";
export * as lessonsQueries from "./lessons/queries";
export * as lessonsMutations from "./lessons/mutations";
export * as lessonsHelpers from "./lessons/helpers";
export * as topicsQueries from "./topics/queries";
export * as topicsMutations from "./topics/mutations";
export * as topicsHelpers from "./topics/helpers";
export * as quizzesQueries from "./quizzes/queries";
export * as quizzesMutations from "./quizzes/mutations";
export * as quizzesHelpers from "./quizzes/helpers";
// enrollments queries/mutations not implemented yet
export * as enrollmentsHelpers from "./enrollments/helpers";
export * as progressQueries from "./progress/queries";
export * as progressMutations from "./progress/mutations";
export * as progressHelpers from "./progress/helpers";
export * as contentAccessQueries from "./contentAccess/queries";
export * as contentAccessMutations from "./contentAccess/mutations";
