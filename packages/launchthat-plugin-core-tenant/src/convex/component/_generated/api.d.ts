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
import type * as mutations from "../mutations.js";
import type * as queries from "../queries.js";
import type * as server from "../server.js";

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
  mutations: typeof mutations;
  queries: typeof queries;
  server: typeof server;
}>;
export type Mounts = {
  mutations: {
    createOrganization: FunctionReference<
      "mutation",
      "public",
      { name: string; slug?: string; userId: string },
      string
    >;
    ensureMembership: FunctionReference<
      "mutation",
      "public",
      {
        organizationId: string;
        role?: "owner" | "admin" | "editor" | "viewer" | "student";
        setActive?: boolean;
        userId: string;
      },
      null
    >;
    removeMembership: FunctionReference<
      "mutation",
      "public",
      { organizationId: string; userId: string },
      null
    >;
    removeOrganizationDomain: FunctionReference<
      "mutation",
      "public",
      { appKey: string; hostname: string; organizationId: string },
      null
    >;
    setActiveOrganizationForUser: FunctionReference<
      "mutation",
      "public",
      { organizationId: string; userId: string },
      null
    >;
    setOrganizationDomainStatus: FunctionReference<
      "mutation",
      "public",
      {
        appKey: string;
        hostname: string;
        lastError?: string;
        organizationId: string;
        records?: Array<{ name: string; type: string; value: string }>;
        status: "unconfigured" | "pending" | "verified" | "error";
      },
      null
    >;
    upsertOrganizationDomain: FunctionReference<
      "mutation",
      "public",
      {
        appKey: string;
        hostname: string;
        organizationId: string;
        status?: "unconfigured" | "pending" | "verified" | "error";
      },
      null
    >;
  };
  queries: {
    getOrganizationByHostname: FunctionReference<
      "query",
      "public",
      { appKey: string; hostname: string; requireVerified?: boolean },
      null | {
        _creationTime: number;
        _id: string;
        clerkOrganizationId?: string;
        createdAt?: number;
        name: string;
        ownerId: string;
        slug: string;
        updatedAt?: number;
      }
    >;
    getOrganizationById: FunctionReference<
      "query",
      "public",
      { organizationId: string },
      null | {
        _creationTime: number;
        _id: string;
        clerkOrganizationId?: string;
        createdAt?: number;
        name: string;
        ownerId: string;
        slug: string;
        updatedAt?: number;
      }
    >;
    getOrganizationBySlug: FunctionReference<
      "query",
      "public",
      { slug: string },
      null | {
        _creationTime: number;
        _id: string;
        clerkOrganizationId?: string;
        createdAt?: number;
        name: string;
        ownerId: string;
        slug: string;
        updatedAt?: number;
      }
    >;
    listDomainsForOrg: FunctionReference<
      "query",
      "public",
      { appKey?: string; organizationId: string },
      Array<{
        _creationTime: number;
        _id: string;
        appKey: string;
        createdAt: number;
        hostname: string;
        lastError?: string;
        organizationId: string;
        records?: Array<{ name: string; type: string; value: string }>;
        status: "unconfigured" | "pending" | "verified" | "error";
        updatedAt: number;
        verifiedAt?: number;
      }>
    >;
    listMembersByOrganizationId: FunctionReference<
      "query",
      "public",
      { organizationId: string },
      Array<{ isActive: boolean; role: string; userId: string }>
    >;
    listOrganizationsByUserId: FunctionReference<
      "query",
      "public",
      { userId: string },
      Array<{
        isActive: boolean;
        org: { _id: string; name: string; slug: string };
        organizationId: string;
        role: string;
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
