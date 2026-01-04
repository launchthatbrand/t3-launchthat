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
import type * as internalMutations from "../internalMutations.js";
import type * as syncState_mutations from "../syncState/mutations.js";
import type * as syncState_queries from "../syncState/queries.js";
import type * as videos_mutations from "../videos/mutations.js";
import type * as videos_queries from "../videos/queries.js";

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
  internalMutations: typeof internalMutations;
  "syncState/mutations": typeof syncState_mutations;
  "syncState/queries": typeof syncState_queries;
  "videos/mutations": typeof videos_mutations;
  "videos/queries": typeof videos_queries;
}>;
export type Mounts = {
  syncState: {
    mutations: {
      updateSyncState: FunctionReference<
        "mutation",
        "public",
        {
          connectionId: string;
          estimatedTotalPages?: number | null;
          finishedAt?: number | null;
          lastError?: string | null;
          nextPage?: number;
          pagesFetchedDelta?: number;
          perPage?: number;
          setPagesFetched?: number;
          setSyncedCount?: number;
          startedAt?: number | null;
          status?: "idle" | "running" | "error" | "done";
          syncedCountDelta?: number;
          totalVideos?: number | null;
          webhookId?: string | null;
          webhookLastError?: string | null;
          webhookLastEventAt?: number | null;
          webhookSecret?: string | null;
          webhookStatus?: "idle" | "active" | "error" | "disabled" | null;
          workflowId?: string | null;
        },
        string
      >;
    };
    queries: {
      getSyncStateByConnection: FunctionReference<
        "query",
        "public",
        { connectionId: string },
        any
      >;
    };
  };
  videos: {
    mutations: {
      createVideo: FunctionReference<
        "mutation",
        "public",
        {
          connectionId: string;
          createdAt: number;
          description?: string;
          embedUrl: string;
          publishedAt: number;
          thumbnailUrl?: string;
          title: string;
          updatedAt: number;
          videoId: string;
        },
        string
      >;
      markVideoDeleted: FunctionReference<
        "mutation",
        "public",
        { connectionId: string; deletedAt: number; videoId: string },
        boolean
      >;
      updateVideo: FunctionReference<
        "mutation",
        "public",
        {
          description?: string;
          embedUrl?: string;
          id: string;
          publishedAt?: number;
          thumbnailUrl?: string;
          title?: string;
          updatedAt: number;
        },
        string
      >;
      upsertVideo: FunctionReference<
        "mutation",
        "public",
        {
          connectionId: string;
          now: number;
          video: {
            description?: string;
            embedUrl: string;
            publishedAt: number;
            thumbnailUrl?: string;
            title: string;
            videoId: string;
          };
        },
        { id: string; inserted: boolean }
      >;
      upsertVideosPage: FunctionReference<
        "mutation",
        "public",
        {
          connectionId: string;
          now: number;
          videos: Array<{
            description?: string;
            embedUrl: string;
            publishedAt: number;
            thumbnailUrl?: string;
            title: string;
            videoId: string;
          }>;
        },
        { inserted: number; updated: number }
      >;
    };
    queries: {
      getVideoByExternalId: FunctionReference<
        "query",
        "public",
        { connectionId: string; videoId: string },
        any
      >;
      listVideosByConnectionPaginated: FunctionReference<
        "query",
        "public",
        {
          connectionId: string;
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
          search?: string;
        },
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
