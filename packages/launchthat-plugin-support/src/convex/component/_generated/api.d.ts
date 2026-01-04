/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as helpers from "../helpers.js";
import type * as mutations from "../mutations.js";
import type * as posts_helpers from "../posts/helpers.js";
import type * as posts_mutations from "../posts/mutations.js";
import type * as posts_queries from "../posts/queries.js";
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
  helpers: typeof helpers;
  mutations: typeof mutations;
  "posts/helpers": typeof posts_helpers;
  "posts/mutations": typeof posts_mutations;
  "posts/queries": typeof posts_queries;
  queries: typeof queries;
}>;
export type Mounts = {
  mutations: {
    addConversationNote: FunctionReference<
      "mutation",
      "public",
      {
        actorId?: string;
        actorName?: string;
        note: string;
        organizationId: string;
        sessionId?: string;
        threadId?: string;
      },
      null
    >;
    appendConversationEvent: FunctionReference<
      "mutation",
      "public",
      {
        actorId?: string;
        actorName?: string;
        eventType: string;
        organizationId: string;
        payload?: any;
        sessionId?: string;
        threadId?: string;
      },
      null
    >;
    assignConversation: FunctionReference<
      "mutation",
      "public",
      {
        actorId?: string;
        actorName?: string;
        assignedAgentId: string;
        assignedAgentName?: string;
        organizationId: string;
        sessionId?: string;
        threadId?: string;
      },
      null
    >;
    createSupportPost: FunctionReference<
      "mutation",
      "public",
      {
        authorId?: string;
        content?: string;
        excerpt?: string;
        meta?: Array<{ key: string; value?: string | number | boolean | null }>;
        organizationId: string;
        parentId?: string;
        parentTypeSlug?: string;
        postTypeSlug: string;
        slug: string;
        status: "published" | "draft" | "archived";
        tags?: Array<string>;
        title: string;
      },
      any
    >;
    deleteRagSourceConfig: FunctionReference<
      "mutation",
      "public",
      { organizationId: string; sourceId: string },
      null
    >;
    rateLimitOrThrow: FunctionReference<
      "mutation",
      "public",
      { key: string; limit: number; windowMs: number },
      null
    >;
    recordMessageIndexUpdate: FunctionReference<
      "mutation",
      "public",
      {
        contactEmail?: string;
        contactId?: string;
        contactName?: string;
        mode?: "agent" | "manual";
        organizationId: string;
        role: "user" | "assistant";
        sessionId: string;
        snippet: string;
        threadId: string;
      },
      null
    >;
    saveRagSourceConfig: FunctionReference<
      "mutation",
      "public",
      {
        additionalMetaKeys?: string;
        baseInstructions?: string;
        displayName?: string;
        fields?: Array<string>;
        includeTags?: boolean;
        isEnabled?: boolean;
        metaFieldKeys?: Array<string>;
        organizationId: string;
        postTypeSlug: string;
        sourceId?: string;
        sourceType?: "postType" | "lmsPostType";
        useCustomBaseInstructions?: boolean;
      },
      { ragSourceId: string }
    >;
    setAgentPresence: FunctionReference<
      "mutation",
      "public",
      {
        agentName?: string;
        agentUserId: string;
        organizationId: string;
        sessionId?: string;
        status: "typing" | "idle";
        threadId?: string;
      },
      null
    >;
    setConversationMode: FunctionReference<
      "mutation",
      "public",
      {
        actorId?: string;
        actorName?: string;
        mode: "agent" | "manual";
        organizationId: string;
        sessionId?: string;
        threadId?: string;
      },
      null
    >;
    setConversationStatus: FunctionReference<
      "mutation",
      "public",
      {
        actorId?: string;
        actorName?: string;
        organizationId: string;
        sessionId?: string;
        status: "open" | "snoozed" | "closed";
        threadId?: string;
      },
      null
    >;
    touchRagSourceIndexedAt: FunctionReference<
      "mutation",
      "public",
      { sourceId: string },
      null
    >;
    unassignConversation: FunctionReference<
      "mutation",
      "public",
      {
        actorId?: string;
        actorName?: string;
        organizationId: string;
        sessionId?: string;
        threadId?: string;
      },
      null
    >;
    updateSupportPost: FunctionReference<
      "mutation",
      "public",
      {
        authorId?: string;
        content?: string;
        excerpt?: string;
        id: string;
        meta?: Array<{ key: string; value?: string | number | boolean | null }>;
        organizationId: string;
        parentId?: string;
        parentTypeSlug?: string;
        postTypeSlug: string;
        slug: string;
        status: "published" | "draft" | "archived";
        tags?: Array<string>;
        title: string;
      },
      any
    >;
    upsertConversationIndex: FunctionReference<
      "mutation",
      "public",
      {
        agentThreadId?: string;
        assignedAgentId?: string;
        assignedAgentName?: string;
        contactEmail?: string;
        contactId?: string;
        contactName?: string;
        emailThreadId?: string;
        firstMessageAt?: number;
        inboundAlias?: string;
        lastMessageAt?: number;
        lastMessageAuthor?: "user" | "assistant";
        lastMessageSnippet?: string;
        mode?: "agent" | "manual";
        organizationId: string;
        origin: "chat" | "email";
        sessionId: string;
        status?: "open" | "snoozed" | "closed";
        subject?: string;
        totalMessages?: number;
      },
      null
    >;
    upsertRagIndexStatus: FunctionReference<
      "mutation",
      "public",
      {
        entryKey: string;
        lastAttemptAt: number;
        lastEntryId?: string;
        lastEntryStatus?: "pending" | "ready" | "replaced";
        lastError?: string;
        lastStatus: string;
        lastSuccessAt?: number;
        organizationId: string;
        postId: string;
        postTypeSlug: string;
        sourceType: "postType" | "lmsPostType";
      },
      null
    >;
    upsertSupportOption: FunctionReference<
      "mutation",
      "public",
      {
        key: string;
        organizationId: string;
        value?: string | number | boolean | null;
      },
      any
    >;
    upsertSupportPostMeta: FunctionReference<
      "mutation",
      "public",
      {
        entries: Array<{
          key: string;
          value?: string | number | boolean | null;
        }>;
        organizationId: string;
        postId: string;
      },
      any
    >;
  };
  posts: {
    mutations: {
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
          organizationId?: string;
          slug?: string;
          status?: "published" | "draft" | "archived";
          tags?: Array<string>;
          title?: string;
        },
        null
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
      getPostBySlug: FunctionReference<
        "query",
        "public",
        { organizationId?: string; slug: string },
        any
      >;
      getPostMeta: FunctionReference<
        "query",
        "public",
        { organizationId?: string; postId: string },
        any
      >;
    };
  };
  queries: {
    getAgentPresence: FunctionReference<
      "query",
      "public",
      { organizationId: string; sessionId?: string; threadId?: string },
      any
    >;
    getConversationIndex: FunctionReference<
      "query",
      "public",
      { organizationId: string; sessionId?: string; threadId?: string },
      any
    >;
    getConversationMode: FunctionReference<
      "query",
      "public",
      { organizationId: string; sessionId?: string; threadId?: string },
      any
    >;
    getRagIndexStatusForPost: FunctionReference<
      "query",
      "public",
      { organizationId: string; postId: string; postTypeSlug: string },
      any
    >;
    getRagSourceConfigForPostType: FunctionReference<
      "query",
      "public",
      { organizationId: string; postTypeSlug: string },
      any
    >;
    getRagSourceForPostType: FunctionReference<
      "query",
      "public",
      {
        organizationId: string;
        postTypeSlug: string;
        sourceType: "postType" | "lmsPostType";
      },
      any
    >;
    getRagSourceForPostTypeAny: FunctionReference<
      "query",
      "public",
      { organizationId: string; postTypeSlug: string },
      any
    >;
    getSupportOption: FunctionReference<
      "query",
      "public",
      { key: string; organizationId: string },
      any
    >;
    getSupportPostById: FunctionReference<
      "query",
      "public",
      { id: string; organizationId?: string },
      any
    >;
    getSupportPostMeta: FunctionReference<
      "query",
      "public",
      { organizationId?: string; postId: string },
      any
    >;
    listConversationEvents: FunctionReference<
      "query",
      "public",
      { organizationId: string; sessionId?: string; threadId?: string },
      any
    >;
    listConversationNotes: FunctionReference<
      "query",
      "public",
      { organizationId: string; sessionId?: string; threadId?: string },
      any
    >;
    listConversations: FunctionReference<
      "query",
      "public",
      { limit?: number; organizationId: string },
      any
    >;
    listRagSources: FunctionReference<
      "query",
      "public",
      { organizationId: string },
      any
    >;
    listSupportOptions: FunctionReference<
      "query",
      "public",
      { organizationId: string },
      any
    >;
    listSupportPosts: FunctionReference<
      "query",
      "public",
      {
        filters?: {
          limit?: number;
          parentId?: string;
          postTypeSlug?: string;
          status?: "published" | "draft" | "archived";
        };
        organizationId: string;
      },
      any
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
