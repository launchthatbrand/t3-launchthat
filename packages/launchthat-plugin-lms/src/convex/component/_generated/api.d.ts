/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as contentAccess_mutations from "../contentAccess/mutations.js";
import type * as contentAccess_queries from "../contentAccess/queries.js";
import type * as index from "../index.js";
import type * as posts_helpers from "../posts/helpers.js";
import type * as posts_mutations from "../posts/mutations.js";
import type * as posts_queries from "../posts/queries.js";
import type * as progress_mutations from "../progress/mutations.js";
import type * as progress_queries from "../progress/queries.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "contentAccess/mutations": typeof contentAccess_mutations;
  "contentAccess/queries": typeof contentAccess_queries;
  index: typeof index;
  "posts/helpers": typeof posts_helpers;
  "posts/mutations": typeof posts_mutations;
  "posts/queries": typeof posts_queries;
  "progress/mutations": typeof progress_mutations;
  "progress/queries": typeof progress_queries;
}>;
export type Mounts = {
  contentAccess: {
    mutations: {
      clearContentAccessRules: FunctionReference<
        "mutation",
        "public",
        {
          contentId: string;
          contentType:
            | "course"
            | "lesson"
            | "topic"
            | "download"
            | "product"
            | "quiz";
        },
        boolean
      >;
      saveContentAccessRules: FunctionReference<
        "mutation",
        "public",
        {
          contentId: string;
          contentType:
            | "course"
            | "lesson"
            | "topic"
            | "download"
            | "product"
            | "quiz";
          excludedTags: { mode: "all" | "some"; tagIds: Array<string> };
          isActive?: boolean;
          isPublic?: boolean;
          priority?: number;
          requiredTags: { mode: "all" | "some"; tagIds: Array<string> };
        },
        string
      >;
    };
    queries: {
      getContentAccessRules: FunctionReference<
        "query",
        "public",
        {
          contentId: string;
          contentType:
            | "course"
            | "lesson"
            | "topic"
            | "download"
            | "product"
            | "quiz";
        },
        {
          contentId: string;
          contentType:
            | "course"
            | "lesson"
            | "topic"
            | "download"
            | "product"
            | "quiz";
          excludedTags: { mode: "all" | "some"; tagIds: Array<string> };
          isActive?: boolean;
          isPublic?: boolean;
          priority?: number;
          requiredTags: { mode: "all" | "some"; tagIds: Array<string> };
        } | null
      >;
    };
  };
  posts: {
    mutations: {
      bulkUpdatePostStatus: FunctionReference<
        "mutation",
        "public",
        { ids: Array<string>; status: "published" | "draft" | "archived" },
        Array<string>
      >;
      createPost: FunctionReference<
        "mutation",
        "public",
        {
          category?: string;
          content?: string;
          excerpt?: string;
          featuredImage?: string;
          meta?: Record<string, string | number | boolean | null>;
          organizationId?: string;
          postTypeSlug: string;
          slug: string;
          status: "published" | "draft" | "archived";
          tags?: Array<string>;
          title: string;
        },
        string
      >;
      deletePost: FunctionReference<"mutation", "public", { id: string }, null>;
      deletePostMetaKey: FunctionReference<
        "mutation",
        "public",
        { key: string; postId: string },
        null
      >;
      updatePost: FunctionReference<
        "mutation",
        "public",
        {
          category?: string;
          content?: string;
          excerpt?: string;
          featuredImage?: string;
          id: string;
          meta?: Record<string, string | number | boolean | null>;
          slug?: string;
          status?: "published" | "draft" | "archived";
          tags?: Array<string>;
          title?: string;
        },
        string
      >;
      updatePostStatus: FunctionReference<
        "mutation",
        "public",
        { id: string; status: "published" | "draft" | "archived" },
        string
      >;
    };
    queries: {
      getAllPosts: FunctionReference<
        "query",
        "public",
        {
          filters?: {
            authorId?: string;
            category?: string;
            limit?: number;
            postTypeSlug?: string;
            status?: "published" | "draft" | "archived";
          };
          organizationId?: string;
        },
        any
      >;
      getPostById: FunctionReference<
        "query",
        "public",
        { id: string; organizationId?: string },
        any
      >;
      getPostByIdInternal: FunctionReference<
        "query",
        "public",
        { id: string },
        any
      >;
      getPostBySlug: FunctionReference<
        "query",
        "public",
        { organizationId?: string; slug: string },
        any
      >;
      getPostCategories: FunctionReference<
        "query",
        "public",
        { organizationId?: string; postTypeSlug?: string },
        any
      >;
      getPostMeta: FunctionReference<
        "query",
        "public",
        { organizationId?: string; postId: string },
        any
      >;
      getPostMetaInternal: FunctionReference<
        "query",
        "public",
        { postId: string },
        any
      >;
      getPostTags: FunctionReference<
        "query",
        "public",
        { organizationId?: string; postTypeSlug?: string },
        any
      >;
      searchPosts: FunctionReference<
        "query",
        "public",
        {
          limit?: number;
          organizationId?: string;
          postTypeSlug?: string;
          searchTerm: string;
        },
        any
      >;
    };
  };
  progress: {
    mutations: {
      insertQuizAttempt: FunctionReference<
        "mutation",
        "public",
        {
          completedAt: number;
          correctCount: number;
          courseId?: string;
          durationMs?: number;
          gradedQuestions: number;
          lessonId?: string;
          organizationId?: string;
          quizId: string;
          responses: Array<{
            answerText?: string;
            isCorrect?: boolean;
            questionId: string;
            questionType:
              | "singleChoice"
              | "multipleChoice"
              | "shortText"
              | "longText";
            selectedOptionIds?: Array<string>;
          }>;
          scorePercent: number;
          totalQuestions: number;
          userId: string;
        },
        any
      >;
      upsertCourseProgress: FunctionReference<
        "mutation",
        "public",
        {
          completedAt?: number;
          completedLessonIds?: Array<string>;
          completedTopicIds?: Array<string>;
          courseId: string;
          lastAccessedAt?: number;
          lastAccessedId?: string;
          lastAccessedType?: "lesson" | "topic";
          organizationId?: string;
          startedAt?: number;
          userId: string;
        },
        any
      >;
    };
    queries: {
      getCourseProgressByUserCourse: FunctionReference<
        "query",
        "public",
        { courseId: string; userId: string },
        any
      >;
      listQuizAttemptsByUserAndQuiz: FunctionReference<
        "query",
        "public",
        { quizId: string; userId: string },
        any
      >;
    };
  };
};
// For now fullApiWithMounts is only fullApi which provides
// jump-to-definition in component client code.
// Use Mounts for the same type without the inference.
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {};
