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
    createNotification: FunctionReference<
      "mutation",
      "public",
      {
        actionUrl?: string;
        content?: string;
        eventKey: string;
        orgId: string;
        tabKey?: string;
        title: string;
        userId: string;
      },
      null | string
    >;
    createNotificationOnce: FunctionReference<
      "mutation",
      "public",
      {
        actionUrl?: string;
        content?: string;
        eventKey: string;
        orgId: string;
        tabKey?: string;
        title: string;
        userId: string;
      },
      null | string
    >;
    markAllNotificationsAsReadByUserId: FunctionReference<
      "mutation",
      "public",
      { userId: string },
      number
    >;
    markAllNotificationsAsReadByUserIdAndOrgId: FunctionReference<
      "mutation",
      "public",
      { orgId: string; userId: string },
      number
    >;
    markNotificationAsRead: FunctionReference<
      "mutation",
      "public",
      { notificationId: string },
      boolean
    >;
    trackNotificationEvent: FunctionReference<
      "mutation",
      "public",
      {
        channel: string;
        eventType: string;
        notificationId: string;
        targetUrl?: string;
        userId: string;
      },
      null
    >;
  };
  queries: {
    getDeliveryTogglesForUserEvent: FunctionReference<
      "query",
      "public",
      { eventKey: string; orgId: string; userId: string },
      {
        orgEmailDefault: boolean | null;
        orgInAppDefault: boolean | null;
        userEmailOverride: boolean | null;
        userInAppOverride: boolean | null;
      }
    >;
    getEventsAnalyticsSummary: FunctionReference<
      "query",
      "public",
      { daysBack?: number; maxRows?: number },
      {
        eventKeyMetrics: Array<{
          ctrPct: number;
          eventKey: string;
          interactions: number;
          sent: number;
        }>;
        fromCreatedAt: number;
        interactions: {
          byChannelAndType: Array<{
            channel: string;
            count: number;
            eventType: string;
          }>;
          byEventKey: Array<{ count: number; eventKey: string }>;
          events: number;
          uniqueNotifications: number;
          uniqueUsers: number;
        };
        interactionsByChannelDaily: Array<{
          date: string;
          email: number;
          inApp: number;
          other: number;
          push: number;
        }>;
        sent: {
          byEventKey: Array<{ count: number; eventKey: string }>;
          notifications: number;
        };
        timeSeriesDaily: Array<{
          ctrPct: number;
          date: string;
          interactions: number;
          sent: number;
        }>;
      }
    >;
    getUnreadCountByUserIdAcrossOrgs: FunctionReference<
      "query",
      "public",
      { userId: string },
      number
    >;
    getUnreadCountByUserIdAndOrgId: FunctionReference<
      "query",
      "public",
      { orgId: string; userId: string },
      number
    >;
    paginateByUserIdAcrossOrgs: FunctionReference<
      "query",
      "public",
      {
        filters?: { eventKey?: string; tabKey?: string };
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
      { continueCursor: string | null; isDone: boolean; page: Array<any> }
    >;
    paginateByUserIdAndOrgId: FunctionReference<
      "query",
      "public",
      {
        filters?: { eventKey?: string; tabKey?: string };
        orgId: string;
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
      { continueCursor: string | null; isDone: boolean; page: Array<any> }
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
