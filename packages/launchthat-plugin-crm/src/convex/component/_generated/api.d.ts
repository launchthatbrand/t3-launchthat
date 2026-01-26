/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as contacts_index from "../contacts/index.js";
import type * as contacts_mutations from "../contacts/mutations.js";
import type * as contacts_queries from "../contacts/queries.js";
import type * as index from "../index.js";
import type * as marketingTags_index from "../marketingTags/index.js";
import type * as marketingTags_mutations from "../marketingTags/mutations.js";
import type * as marketingTags_queries from "../marketingTags/queries.js";
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
  "contacts/index": typeof contacts_index;
  "contacts/mutations": typeof contacts_mutations;
  "contacts/queries": typeof contacts_queries;
  index: typeof index;
  "marketingTags/index": typeof marketingTags_index;
  "marketingTags/mutations": typeof marketingTags_mutations;
  "marketingTags/queries": typeof marketingTags_queries;
  queries: typeof queries;
}>;
export type Mounts = {
  contacts: {
    mutations: {
      createContact: FunctionReference<
        "mutation",
        "public",
        {
          authorId?: string;
          category?: string;
          content?: string;
          excerpt?: string;
          featuredImageUrl?: string;
          meta?: any;
          organizationId?: string;
          postTypeSlug: string;
          slug: string;
          status: string;
          tags?: Array<string>;
          title: string;
          userId?: string;
        },
        string
      >;
      deleteContact: FunctionReference<
        "mutation",
        "public",
        { contactId: string; organizationId?: string },
        null
      >;
      updateContact: FunctionReference<
        "mutation",
        "public",
        {
          authorId?: string;
          category?: string;
          contactId: string;
          content?: string;
          excerpt?: string;
          featuredImageUrl?: string;
          meta?: any;
          organizationId?: string;
          slug?: string;
          status?: string;
          tags?: Array<string>;
          title?: string;
          userId?: string;
        },
        null
      >;
    };
    queries: {
      getContactById: FunctionReference<
        "query",
        "public",
        { contactId: string; organizationId?: string },
        null | {
          _creationTime: number;
          _id: string;
          authorId?: string;
          category?: string;
          content?: string;
          createdAt: number;
          excerpt?: string;
          featuredImageUrl?: string;
          organizationId?: string;
          postTypeSlug: string;
          slug: string;
          status: string;
          tags?: Array<string>;
          title: string;
          updatedAt?: number;
          userId?: string;
        }
      >;
      getContactBySlug: FunctionReference<
        "query",
        "public",
        { organizationId?: string; slug: string },
        null | {
          _creationTime: number;
          _id: string;
          authorId?: string;
          category?: string;
          content?: string;
          createdAt: number;
          excerpt?: string;
          featuredImageUrl?: string;
          organizationId?: string;
          postTypeSlug: string;
          slug: string;
          status: string;
          tags?: Array<string>;
          title: string;
          updatedAt?: number;
          userId?: string;
        }
      >;
      getContactIdForUser: FunctionReference<
        "query",
        "public",
        { organizationId?: string; userId: string },
        string | null
      >;
      getContactMeta: FunctionReference<
        "query",
        "public",
        { contactId: string },
        Array<{
          _creationTime: number;
          _id: string;
          contactId: string;
          createdAt: number;
          key: string;
          updatedAt?: number;
          value?: string | number | boolean | null;
        }>
      >;
      listContacts: FunctionReference<
        "query",
        "public",
        { limit?: number; organizationId?: string; status?: string },
        Array<{
          _creationTime: number;
          _id: string;
          authorId?: string;
          category?: string;
          content?: string;
          createdAt: number;
          excerpt?: string;
          featuredImageUrl?: string;
          organizationId?: string;
          postTypeSlug: string;
          slug: string;
          status: string;
          tags?: Array<string>;
          title: string;
          updatedAt?: number;
          userId?: string;
        }>
      >;
    };
  };
  marketingTags: {
    mutations: {
      assignMarketingTagToUser: FunctionReference<
        "mutation",
        "public",
        {
          assignedBy?: string;
          contactId: string;
          expiresAt?: number;
          marketingTagId: string;
          notes?: string;
          organizationId?: string;
          source?: string;
        },
        string
      >;
      createMarketingTag: FunctionReference<
        "mutation",
        "public",
        {
          category?: string;
          color?: string;
          createdBy?: string;
          description?: string;
          isActive?: boolean;
          name: string;
          organizationId?: string;
          slug?: string;
        },
        string
      >;
      removeMarketingTagFromUser: FunctionReference<
        "mutation",
        "public",
        { contactId: string; marketingTagId: string; organizationId?: string },
        boolean
      >;
    };
    queries: {
      contactHasMarketingTags: FunctionReference<
        "query",
        "public",
        {
          contactId: string;
          organizationId?: string;
          requireAll?: boolean;
          tagSlugs: Array<string>;
        },
        {
          hasAccess: boolean;
          matchingTags: Array<string>;
          missingTags: Array<string>;
        }
      >;
      getContactIdForUser: FunctionReference<
        "query",
        "public",
        { organizationId?: string; userId: string },
        string | null
      >;
      getContactMarketingTags: FunctionReference<
        "query",
        "public",
        { contactId: string; organizationId?: string },
        Array<{
          _id: string;
          assignedAt: number;
          assignedBy?: string;
          contactId: string;
          expiresAt?: number;
          marketingTag: {
            _creationTime: number;
            _id: string;
            category?: string;
            color?: string;
            createdAt?: number;
            createdBy?: string;
            description?: string;
            isActive?: boolean;
            name: string;
            organizationId?: string;
            slug?: string;
          };
          notes?: string;
          source?: string;
        }>
      >;
      getUserMarketingTags: FunctionReference<
        "query",
        "public",
        { organizationId?: string; userId: string },
        Array<{
          _id: string;
          assignedAt: number;
          assignedBy?: string;
          contactId: string;
          expiresAt?: number;
          marketingTag: {
            _creationTime: number;
            _id: string;
            category?: string;
            color?: string;
            createdAt?: number;
            createdBy?: string;
            description?: string;
            isActive?: boolean;
            name: string;
            organizationId?: string;
            slug?: string;
          };
          notes?: string;
          source?: string;
        }>
      >;
      listMarketingTags: FunctionReference<
        "query",
        "public",
        { organizationId?: string },
        Array<{
          _creationTime: number;
          _id: string;
          category?: string;
          color?: string;
          createdAt?: number;
          createdBy?: string;
          description?: string;
          isActive?: boolean;
          name: string;
          organizationId?: string;
          slug?: string;
        }>
      >;
    };
  };
  queries: {
    getCrmDashboardMetrics: FunctionReference<
      "query",
      "public",
      { limit?: number },
      {
        contacts: { isTruncated: boolean; total: number };
        tagAssignments: { isTruncated: boolean; total: number };
        tags: { isTruncated: boolean; total: number };
      }
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
