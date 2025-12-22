/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as crons from "../crons.js";
import type * as index from "../index.js";
import type * as lib_recommendationEngine from "../lib/recommendationEngine.js";
import type * as lib_trendingAlgorithm from "../lib/trendingAlgorithm.js";
import type * as mutations from "../mutations.js";
import type * as queries from "../queries.js";

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
  crons: typeof crons;
  index: typeof index;
  "lib/recommendationEngine": typeof lib_recommendationEngine;
  "lib/trendingAlgorithm": typeof lib_trendingAlgorithm;
  mutations: typeof mutations;
  queries: typeof queries;
}>;
export type Mounts = {
  mutations: {
    addComment: FunctionReference<
      "mutation",
      "public",
      {
        content: string;
        feedItemId?: string;
        mediaUrls?: Array<string>;
        parentCommentId?: string;
        parentId?: string;
        parentType?:
          | "feedItem"
          | "course"
          | "lesson"
          | "topic"
          | "quiz"
          | "post"
          | "download"
          | "helpdeskArticle";
        userId: string;
      },
      string
    >;
    addReaction: FunctionReference<
      "mutation",
      "public",
      {
        feedItemId: string;
        reactionType:
          | "like"
          | "love"
          | "celebrate"
          | "support"
          | "insightful"
          | "curious";
        userId: string;
      },
      string
    >;
    createOrUpdateTopic: FunctionReference<
      "mutation",
      "public",
      {
        category?: string;
        coverImage?: string;
        description?: string;
        tag: string;
      },
      string
    >;
    createPost: FunctionReference<
      "mutation",
      "public",
      {
        content: string;
        creatorId: string;
        mediaUrls?: Array<string>;
        moduleId?: string;
        moduleType?: "blog" | "course" | "group" | "event";
        visibility: "public" | "private" | "group";
      },
      string
    >;
    deleteComment: FunctionReference<
      "mutation",
      "public",
      { asAdmin?: boolean; commentId: string; userId: string },
      boolean
    >;
    deletePost: FunctionReference<
      "mutation",
      "public",
      { postId: string; userId: string },
      boolean
    >;
    followTopic: FunctionReference<
      "mutation",
      "public",
      { topicId: string; userId: string },
      boolean
    >;
    generateUserRecommendations: FunctionReference<
      "mutation",
      "public",
      { limit?: number; userId: string },
      boolean
    >;
    markRecommendationAsInteracted: FunctionReference<
      "mutation",
      "public",
      {
        contentId: string;
        reaction?: "like" | "dislike" | "neutral";
        userId: string;
      },
      boolean
    >;
    markRecommendationAsSeen: FunctionReference<
      "mutation",
      "public",
      { contentId: string; userId: string },
      boolean
    >;
    shareContent: FunctionReference<
      "mutation",
      "public",
      {
        content?: string;
        creatorId: string;
        moduleId?: string;
        moduleType?: "blog" | "course" | "group" | "event";
        originalContentId: string;
        visibility: "public" | "private" | "group";
      },
      string
    >;
    unfollowTopic: FunctionReference<
      "mutation",
      "public",
      { topicId: string; userId: string },
      boolean
    >;
    updateComment: FunctionReference<
      "mutation",
      "public",
      { asAdmin?: boolean; commentId: string; content: string; userId: string },
      boolean
    >;
    updatePost: FunctionReference<
      "mutation",
      "public",
      {
        content?: string;
        mediaUrls?: Array<string>;
        postId: string;
        userId: string;
        visibility?: "public" | "private" | "group";
      },
      boolean
    >;
    updatePostTrendingMetrics: FunctionReference<
      "mutation",
      "public",
      { contentId: string },
      boolean
    >;
  };
  queries: {
    checkTopicFollow: FunctionReference<
      "query",
      "public",
      { topicId: string; userId: string },
      boolean
    >;
    getAllCommentsForParent: FunctionReference<
      "query",
      "public",
      {
        parentId: string;
        parentType:
          | "feedItem"
          | "course"
          | "lesson"
          | "topic"
          | "quiz"
          | "post"
          | "download"
          | "helpdeskArticle";
      },
      Array<{
        _creationTime: number;
        _id: string;
        content: string;
        hashtags?: Array<string>;
        mediaUrls?: Array<string>;
        mentionedUserIds?: Array<string>;
        mentions?: Array<string>;
        parentCommentId?: string;
        parentId: string;
        parentType:
          | "feedItem"
          | "course"
          | "lesson"
          | "topic"
          | "quiz"
          | "post"
          | "download"
          | "helpdeskArticle";
        updatedAt?: number;
        userId: string;
      }>
    >;
    getComments: FunctionReference<
      "query",
      "public",
      {
        paginationOpts: {
          cursor: string | null;
          endCursor?: string | null;
          id?: number;
          maximumBytesRead?: number;
          maximumRowsRead?: number;
          numItems: number;
        };
        parentId: string;
        parentType: "feedItem" | "post" | "download" | "helpdeskArticle";
        sortOrder?: "newest" | "oldest";
      },
      {
        continueCursor: string | null;
        isDone: boolean;
        page: Array<{
          _creationTime: number;
          _id: string;
          content: string;
          hashtags?: Array<string>;
          mediaUrls?: Array<string>;
          mentionedUserIds?: Array<string>;
          mentions?: Array<string>;
          parentCommentId?: string;
          parentId: string;
          parentType:
            | "feedItem"
            | "course"
            | "lesson"
            | "topic"
            | "quiz"
            | "post"
            | "download"
            | "helpdeskArticle";
          repliesCount: number;
          updatedAt?: number;
          user: { _id: string; image?: string; name: string };
          userId: string;
        }>;
      }
    >;
    getFeedItem: FunctionReference<
      "query",
      "public",
      { feedItemId: string },
      null | {
        _creationTime: number;
        _id: string;
        commentsCount: number;
        content: string;
        contentType: "post" | "share" | "comment";
        creator: { _id: string; image?: string; name: string };
        creatorId: string;
        hashtags?: Array<string>;
        mediaUrls?: Array<string>;
        mentionedUserIds?: Array<string>;
        mentions?: Array<string>;
        moduleId?: string;
        moduleType?: "blog" | "course" | "group" | "event";
        originalContentId?: string;
        reactionsCount: number;
        visibility: "public" | "private" | "group";
      }
    >;
    getGroupFeed: FunctionReference<
      "query",
      "public",
      {
        groupId: string;
        paginationOpts: {
          cursor: string | null;
          endCursor?: string | null;
          id?: number;
          maximumBytesRead?: number;
          maximumRowsRead?: number;
          numItems: number;
        };
      },
      {
        continueCursor: string | null;
        isDone: boolean;
        page: Array<{
          _creationTime: number;
          _id: string;
          commentsCount: number;
          content: string;
          contentType: "post" | "share" | "comment";
          creator: { _id: string; image?: string; name: string };
          creatorId: string;
          hashtags?: Array<string>;
          mediaUrls?: Array<string>;
          mentionedUserIds?: Array<string>;
          mentions?: Array<string>;
          moduleId?: string;
          moduleType?: "blog" | "course" | "group" | "event";
          originalContentId?: string;
          reactionsCount: number;
          visibility: "public" | "private" | "group";
        }>;
      }
    >;
    getHashtagFeed: FunctionReference<
      "query",
      "public",
      {
        paginationOpts: {
          cursor: string | null;
          endCursor?: string | null;
          id?: number;
          maximumBytesRead?: number;
          maximumRowsRead?: number;
          numItems: number;
        };
        tag: string;
      },
      {
        feedItems: {
          continueCursor: string | null;
          isDone: boolean;
          page: Array<{
            _creationTime: number;
            _id: string;
            commentsCount: number;
            content: string;
            contentType: "post" | "share" | "comment";
            creator: { _id: string; image?: string; name: string };
            creatorId: string;
            hashtags?: Array<string>;
            mediaUrls?: Array<string>;
            mentionedUserIds?: Array<string>;
            mentions?: Array<string>;
            moduleId?: string;
            moduleType?: "blog" | "course" | "group" | "event";
            originalContentId?: string;
            reactionsCount: number;
            visibility: "public" | "private" | "group";
          }>;
        };
        hashtag: null | {
          _creationTime: number;
          _id: string;
          category?: string;
          coverImage?: string;
          description?: string;
          followerCount?: number;
          isBlocked?: boolean;
          isTopic?: boolean;
          lastUsed: number;
          relatedTags?: Array<string>;
          tag: string;
          usageCount: number;
        };
      }
    >;
    getPersonalizedFeed: FunctionReference<
      "query",
      "public",
      {
        paginationOpts: {
          cursor: string | null;
          endCursor?: string | null;
          id?: number;
          maximumBytesRead?: number;
          maximumRowsRead?: number;
          numItems: number;
        };
        userId: string;
      },
      {
        continueCursor: string | null;
        isDone: boolean;
        page: Array<{
          _creationTime: number;
          _id: string;
          commentsCount: number;
          content: string;
          contentType: "post" | "share" | "comment";
          creator: { _id: string; image?: string; name: string };
          creatorId: string;
          hashtags?: Array<string>;
          mediaUrls?: Array<string>;
          mentionedUserIds?: Array<string>;
          mentions?: Array<string>;
          moduleId?: string;
          moduleType?: "blog" | "course" | "group" | "event";
          originalContentId?: string;
          reactionsCount: number;
          visibility: "public" | "private" | "group";
        }>;
      }
    >;
    getRecommendedContent: FunctionReference<
      "query",
      "public",
      {
        paginationOpts: {
          cursor: string | null;
          endCursor?: string | null;
          id?: number;
          maximumBytesRead?: number;
          maximumRowsRead?: number;
          numItems: number;
        };
        userId: string;
      },
      {
        continueCursor: string | null;
        isDone: boolean;
        page: Array<{
          _creationTime: number;
          _id: string;
          commentsCount: number;
          content: string;
          contentType: "post" | "share" | "comment";
          creator: { _id: string; image?: string; name: string };
          creatorId: string;
          hashtags?: Array<string>;
          mediaUrls?: Array<string>;
          mentionedUserIds?: Array<string>;
          mentions?: Array<string>;
          moduleId?: string;
          moduleType?: "blog" | "course" | "group" | "event";
          originalContentId?: string;
          reactionsCount: number;
          visibility: "public" | "private" | "group";
        }>;
      }
    >;
    getRecommendedHashtags: FunctionReference<
      "query",
      "public",
      { limit: number; userId: string },
      Array<{
        _creationTime: number;
        _id: string;
        category?: string;
        coverImage?: string;
        description?: string;
        followerCount?: number;
        isBlocked?: boolean;
        isTopic?: boolean;
        lastUsed: number;
        relatedTags?: Array<string>;
        tag: string;
        usageCount: number;
      }>
    >;
    getReplies: FunctionReference<
      "query",
      "public",
      {
        paginationOpts: {
          cursor: string | null;
          endCursor?: string | null;
          id?: number;
          maximumBytesRead?: number;
          maximumRowsRead?: number;
          numItems: number;
        };
        parentCommentId: string;
      },
      {
        continueCursor: string | null;
        isDone: boolean;
        page: Array<{
          _creationTime: number;
          _id: string;
          content: string;
          hashtags?: Array<string>;
          mediaUrls?: Array<string>;
          mentionedUserIds?: Array<string>;
          mentions?: Array<string>;
          parentCommentId?: string;
          parentId: string;
          parentType:
            | "feedItem"
            | "course"
            | "lesson"
            | "topic"
            | "quiz"
            | "post"
            | "download"
            | "helpdeskArticle";
          repliesCount: number;
          updatedAt?: number;
          user: { _id: string; image?: string; name: string };
          userId: string;
        }>;
      }
    >;
    getTopic: FunctionReference<
      "query",
      "public",
      { topicId: string },
      {
        _creationTime: number;
        _id: string;
        category?: string;
        coverImage?: string;
        description?: string;
        followerCount?: number;
        isBlocked?: boolean;
        isTopic?: boolean;
        lastUsed: number;
        relatedTags?: Array<string>;
        tag: string;
        usageCount: number;
      } | null
    >;
    getTopicSuggestions: FunctionReference<
      "query",
      "public",
      { limit?: number; userId: string },
      Array<{
        _creationTime: number;
        _id: string;
        category?: string;
        coverImage?: string;
        description?: string;
        followerCount?: number;
        isBlocked?: boolean;
        isTopic?: boolean;
        lastUsed: number;
        relatedTags?: Array<string>;
        tag: string;
        usageCount: number;
      }>
    >;
    getTopics: FunctionReference<
      "query",
      "public",
      {
        category?: string;
        paginationOpts: {
          cursor: string | null;
          endCursor?: string | null;
          id?: number;
          maximumBytesRead?: number;
          maximumRowsRead?: number;
          numItems: number;
        };
        query?: string;
      },
      Array<{
        _creationTime: number;
        _id: string;
        category?: string;
        coverImage?: string;
        description?: string;
        followerCount?: number;
        isBlocked?: boolean;
        isTopic?: boolean;
        lastUsed: number;
        relatedTags?: Array<string>;
        tag: string;
        usageCount: number;
      }>
    >;
    getUniversalFeed: FunctionReference<
      "query",
      "public",
      {
        paginationOpts: {
          cursor: string | null;
          endCursor?: string | null;
          id?: number;
          maximumBytesRead?: number;
          maximumRowsRead?: number;
          numItems: number;
        };
      },
      {
        continueCursor: string | null;
        isDone: boolean;
        page: Array<{
          _creationTime: number;
          _id: string;
          commentsCount: number;
          content: string;
          contentType: "post" | "share" | "comment";
          creator: { _id: string; image?: string; name: string };
          creatorId: string;
          hashtags?: Array<string>;
          mediaUrls?: Array<string>;
          mentionedUserIds?: Array<string>;
          mentions?: Array<string>;
          moduleId?: string;
          moduleType?: "blog" | "course" | "group" | "event";
          originalContentId?: string;
          reactionsCount: number;
          visibility: "public" | "private" | "group";
        }>;
      }
    >;
    getUserFollowedTopics: FunctionReference<
      "query",
      "public",
      {
        paginationOpts: {
          cursor: string | null;
          endCursor?: string | null;
          id?: number;
          maximumBytesRead?: number;
          maximumRowsRead?: number;
          numItems: number;
        };
        userId: string;
      },
      Array<{
        _creationTime: number;
        _id: string;
        category?: string;
        coverImage?: string;
        description?: string;
        followerCount?: number;
        isBlocked?: boolean;
        isTopic?: boolean;
        lastUsed: number;
        relatedTags?: Array<string>;
        tag: string;
        usageCount: number;
      }>
    >;
    getUserProfileFeed: FunctionReference<
      "query",
      "public",
      {
        paginationOpts: {
          cursor: string | null;
          endCursor?: string | null;
          id?: number;
          maximumBytesRead?: number;
          maximumRowsRead?: number;
          numItems: number;
        };
        profileId: string;
        viewerId?: string;
      },
      {
        continueCursor: string | null;
        isDone: boolean;
        page: Array<{
          _creationTime: number;
          _id: string;
          commentsCount: number;
          content: string;
          contentType: "post" | "share" | "comment";
          creator: { _id: string; image?: string; name: string };
          creatorId: string;
          hashtags?: Array<string>;
          mediaUrls?: Array<string>;
          mentionedUserIds?: Array<string>;
          mentions?: Array<string>;
          moduleId?: string;
          moduleType?: "blog" | "course" | "group" | "event";
          originalContentId?: string;
          reactionsCount: number;
          visibility: "public" | "private" | "group";
        }>;
      }
    >;
    searchUsersForMentions: FunctionReference<
      "query",
      "public",
      { limit?: number; query: string },
      Array<{ _id: string; image?: string; name: string }>
    >;
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
