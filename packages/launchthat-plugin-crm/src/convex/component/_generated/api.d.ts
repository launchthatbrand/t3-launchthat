/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as index from "../index.js";
import type * as marketingTags_mutations from "../marketingTags/mutations.js";
import type * as marketingTags_queries from "../marketingTags/queries.js";

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
  index: typeof index;
  "marketingTags/mutations": typeof marketingTags_mutations;
  "marketingTags/queries": typeof marketingTags_queries;
}>;
export type Mounts = {
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
