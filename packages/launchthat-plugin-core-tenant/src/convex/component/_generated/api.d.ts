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
import type * as publicProfiles_types from "../publicProfiles/types.js";
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
  "publicProfiles/types": typeof publicProfiles_types;
  queries: typeof queries;
  server: typeof server;
}>;
export type Mounts = {
  mutations: {
    createOrganization: FunctionReference<
      "mutation",
      "public",
      {
        description?: string;
        logo?: string;
        logoMediaId?: string;
        name: string;
        slug?: string;
        userId: string;
      },
      string
    >;
    createOrganizationMedia: FunctionReference<
      "mutation",
      "public",
      {
        contentType: string;
        filename?: string;
        organizationId: string;
        size: number;
        storageId: string;
        uploadedByUserId: string;
      },
      string
    >;
    deleteOrganizationMedia: FunctionReference<
      "mutation",
      "public",
      { mediaId: string },
      null
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
    generateOrganizationMediaUploadUrl: FunctionReference<
      "mutation",
      "public",
      { organizationId: string },
      string
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
    updateOrganization: FunctionReference<
      "mutation",
      "public",
      {
        description?: string;
        logo?: string | null;
        logoMediaId?: string | null;
        name?: string;
        organizationId: string;
        slug?: string;
      },
      null
    >;
    updateOrganizationPublicProfileConfig: FunctionReference<
      "mutation",
      "public",
      {
        config: null | {
          links: Array<{ label: string; url: string }>;
          sections: Array<{
            enabled: boolean;
            id: string;
            kind: "hero" | "about" | "links" | "stats";
          }>;
          version: "v1";
        };
        organizationId: string;
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
        description?: string;
        logo?: string;
        logoMediaId?: string;
        name: string;
        ownerId: string;
        publicProfileConfig?: {
          links: Array<{ label: string; url: string }>;
          sections: Array<{
            enabled: boolean;
            id: string;
            kind: "hero" | "about" | "links" | "stats";
          }>;
          version: "v1";
        };
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
        description?: string;
        logo?: string;
        logoMediaId?: string;
        name: string;
        ownerId: string;
        publicProfileConfig?: {
          links: Array<{ label: string; url: string }>;
          sections: Array<{
            enabled: boolean;
            id: string;
            kind: "hero" | "about" | "links" | "stats";
          }>;
          version: "v1";
        };
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
        description?: string;
        logo?: string;
        logoMediaId?: string;
        name: string;
        ownerId: string;
        publicProfileConfig?: {
          links: Array<{ label: string; url: string }>;
          sections: Array<{
            enabled: boolean;
            id: string;
            kind: "hero" | "about" | "links" | "stats";
          }>;
          version: "v1";
        };
        slug: string;
        updatedAt?: number;
      }
    >;
    getOrganizationMediaById: FunctionReference<
      "query",
      "public",
      { mediaId: string },
      null | {
        _creationTime: number;
        _id: string;
        contentType: string;
        createdAt: number;
        filename?: string;
        organizationId: string;
        size: number;
        storageId: string;
        updatedAt: number;
        uploadedByUserId: string;
        url: string | null;
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
    listOrganizationMedia: FunctionReference<
      "query",
      "public",
      { limit?: number; organizationId: string },
      Array<{
        _creationTime: number;
        _id: string;
        contentType: string;
        createdAt: number;
        filename?: string;
        organizationId: string;
        size: number;
        storageId: string;
        updatedAt: number;
        uploadedByUserId: string;
        url: string | null;
      }>
    >;
    listOrganizations: FunctionReference<
      "query",
      "public",
      { limit?: number; search?: string },
      Array<{
        _creationTime: number;
        _id: string;
        clerkOrganizationId?: string;
        createdAt?: number;
        description?: string;
        logo?: string;
        logoMediaId?: string;
        name: string;
        ownerId: string;
        publicProfileConfig?: {
          links: Array<{ label: string; url: string }>;
          sections: Array<{
            enabled: boolean;
            id: string;
            kind: "hero" | "about" | "links" | "stats";
          }>;
          version: "v1";
        };
        slug: string;
        updatedAt?: number;
      }>
    >;
    listOrganizationsByUserId: FunctionReference<
      "query",
      "public",
      { userId: string },
      Array<{
        isActive: boolean;
        org: {
          _id: string;
          logoUrl: string | null;
          name: string;
          slug: string;
        };
        organizationId: string;
        role: string;
      }>
    >;
    listOrganizationsPublic: FunctionReference<
      "query",
      "public",
      { includePlatform?: boolean; limit?: number; search?: string },
      Array<{
        _id: string;
        description?: string;
        logoUrl: string | null;
        name: string;
        slug: string;
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
