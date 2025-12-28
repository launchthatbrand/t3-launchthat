/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actions from "../actions.js";
import type * as index from "../index.js";
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
  actions: typeof actions;
  index: typeof index;
  mutations: typeof mutations;
  "posts/helpers": typeof posts_helpers;
  "posts/mutations": typeof posts_mutations;
  "posts/queries": typeof posts_queries;
  queries: typeof queries;
}>;
export type Mounts = {
  actions: {
    importTemplatePdfFromUrl: FunctionReference<
      "action",
      "public",
      { sourceUrl: string },
      string
    >;
    submitSignature: FunctionReference<
      "action",
      "public",
      {
        consentText: string;
        fieldSignatures?: Array<{ fieldId: string; signatureDataUrl: string }>;
        ip?: string;
        issueId: string;
        signatureDataUrl?: string;
        signedByUserId?: string;
        signedEmail: string;
        signedName: string;
        tokenHash: string;
        userAgent?: string;
      },
      { signatureId: string; signedPdfFileId: string }
    >;
  };
  mutations: {
    createManualIssue: FunctionReference<
      "mutation",
      "public",
      {
        organizationId?: string;
        recipientEmail: string;
        recipientName?: string;
        recipientUserId?: string;
        templatePostId: string;
      },
      { issueId: string; token: string }
    >;
    createManualIssueFromPost: FunctionReference<
      "mutation",
      "public",
      {
        issuePostId: string;
        organizationId?: string;
        recipientEmail: string;
        recipientName?: string;
        recipientUserId?: string;
        templatePostId: string;
      },
      { issueId: string; token: string }
    >;
    finalizeSignature: FunctionReference<
      "mutation",
      "public",
      {
        consentText: string;
        ip?: string;
        issueId: string;
        organizationId?: string;
        pdfSha256: string;
        signaturePngFileId?: string;
        signedByUserId?: string;
        signedEmail: string;
        signedName: string;
        signedPdfFileId: string;
        tokenHash: string;
        userAgent?: string;
      },
      { signatureId: string; signedPdfFileId: string }
    >;
    resendIssue: FunctionReference<
      "mutation",
      "public",
      { issueId: string; organizationId?: string },
      {
        issueId: string;
        recipientEmail: string;
        recipientUserId?: string;
        templatePostId: string;
        token: string;
      }
    >;
    upsertDisclaimerTemplateMeta: FunctionReference<
      "mutation",
      "public",
      {
        builderTemplateJson?: string;
        consentText?: string;
        description?: string;
        organizationId?: string;
        pdfFileId?: string;
        postId: string;
      },
      string
    >;
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
    getLatestSignatureForIssue: FunctionReference<
      "query",
      "public",
      { issueId: string; organizationId?: string },
      null | {
        createdAt: number;
        pdfSha256: string;
        signatureId: string;
        signedPdfFileId: string;
        signedPdfUrl: string | null;
      }
    >;
    getSigningContext: FunctionReference<
      "query",
      "public",
      { issueId: string; tokenHash: string },
      null | {
        issueId: string;
        recipientEmail: string;
        recipientName?: string;
        status: "incomplete" | "complete";
        template: {
          builderTemplateJson?: string;
          consentText: string;
          pdfUrl: string;
          pdfVersion: number;
          postId: string;
          title: string;
        };
      }
    >;
    getSigningContextDebug: FunctionReference<
      "query",
      "public",
      { issueId: string; tokenHash: string },
      {
        checks: {
          issueFound: boolean;
          organizationMatch: boolean;
          templateFound: boolean;
          templatePdfFileIdPresent: boolean;
          templatePdfUrlResolved: boolean;
          templatePostTypeMatch: boolean;
          tokenMatch: boolean;
        };
        ok: boolean;
        reason: string;
        snapshot: {
          issueId: string | null;
          issueOrganizationId: string | null;
          templateOrganizationId: string | null;
          templatePdfFileId: string | null;
          templatePostId: string | null;
          templatePostTypeSlug: string | null;
        };
      }
    >;
    getSigningReceipt: FunctionReference<
      "query",
      "public",
      { issueId: string; tokenHash: string },
      null | {
        pdfSha256: string;
        signedAt: number;
        signedEmail: string;
        signedName: string;
        signedPdfUrl: string | null;
      }
    >;
    getTemplateBuilderContext: FunctionReference<
      "query",
      "public",
      { organizationId?: string; templatePostId: string },
      null | {
        builderTemplateJson?: string;
        pdfUrl?: string;
        pdfVersion: number;
        title?: string;
      }
    >;
    listDisclaimerTemplates: FunctionReference<
      "query",
      "public",
      { organizationId?: string },
      Array<{
        createdAt: number;
        id: string;
        meta: Record<string, string | number | boolean | null>;
        pdfUrl: string | null;
        slug: string;
        status: string;
        title: string;
        updatedAt?: number;
      }>
    >;
    listIssues: FunctionReference<
      "query",
      "public",
      {
        limit?: number;
        organizationId?: string;
        status?: "incomplete" | "complete";
      },
      Array<{
        completedAt?: number;
        createdAt: number;
        id: string;
        lastSentAt?: number;
        organizationId?: string;
        recipientEmail: string;
        recipientName?: string;
        recipientUserId?: string;
        sendCount: number;
        status: "incomplete" | "complete";
        templatePostId: string;
        templateVersion: number;
        updatedAt: number;
      }>
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
