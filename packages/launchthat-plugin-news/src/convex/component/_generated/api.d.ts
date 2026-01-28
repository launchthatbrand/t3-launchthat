/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as events_index from "../events/index.js";
import type * as events_queries from "../events/queries.js";
import type * as index from "../index.js";
import type * as ingest_actions from "../ingest/actions.js";
import type * as ingest_index from "../ingest/index.js";
import type * as ingest_internal from "../ingest/internal.js";
import type * as ingest_lib from "../ingest/lib.js";
import type * as ingest_rss from "../ingest/rss.js";
import type * as ingest_ruleTagging from "../ingest/ruleTagging.js";
import type * as ingest_symbolExtract from "../ingest/symbolExtract.js";
import type * as runs_index from "../runs/index.js";
import type * as runs_queries from "../runs/queries.js";
import type * as server from "../server.js";
import type * as sources_index from "../sources/index.js";
import type * as sources_mutations from "../sources/mutations.js";
import type * as sources_queries from "../sources/queries.js";
import type * as subscriptions_index from "../subscriptions/index.js";
import type * as subscriptions_mutations from "../subscriptions/mutations.js";
import type * as subscriptions_queries from "../subscriptions/queries.js";
import type * as types from "../types.js";

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
  "events/index": typeof events_index;
  "events/queries": typeof events_queries;
  index: typeof index;
  "ingest/actions": typeof ingest_actions;
  "ingest/index": typeof ingest_index;
  "ingest/internal": typeof ingest_internal;
  "ingest/lib": typeof ingest_lib;
  "ingest/rss": typeof ingest_rss;
  "ingest/ruleTagging": typeof ingest_ruleTagging;
  "ingest/symbolExtract": typeof ingest_symbolExtract;
  "runs/index": typeof runs_index;
  "runs/queries": typeof runs_queries;
  server: typeof server;
  "sources/index": typeof sources_index;
  "sources/mutations": typeof sources_mutations;
  "sources/queries": typeof sources_queries;
  "subscriptions/index": typeof subscriptions_index;
  "subscriptions/mutations": typeof subscriptions_mutations;
  "subscriptions/queries": typeof subscriptions_queries;
  types: typeof types;
}>;
export type Mounts = {
  events: {
    queries: {
      getEventById: FunctionReference<
        "query",
        "public",
        { eventId: string },
        null | {
          _id: string;
          canonicalKey: string;
          country?: string;
          createdAt: number;
          currency?: string;
          eventType: string;
          impact?: string;
          meta?: any;
          publishedAt?: number;
          startsAt?: number;
          summary?: string;
          title: string;
          updatedAt: number;
        }
      >;
      listEventsForSymbol: FunctionReference<
        "query",
        "public",
        { fromMs?: number; limit?: number; symbol: string; toMs?: number },
        Array<{
          at: number;
          country?: string;
          currency?: string;
          eventId: string;
          eventType: string;
          impact?: string;
          publishedAt?: number;
          startsAt?: number;
          summary?: string;
          symbol: string;
          title: string;
        }>
      >;
      listEventsGlobal: FunctionReference<
        "query",
        "public",
        { eventType?: string; fromMs?: number; limit?: number; toMs?: number },
        Array<{
          _id: string;
          country?: string;
          createdAt: number;
          currency?: string;
          eventType: string;
          impact?: string;
          publishedAt?: number;
          startsAt?: number;
          summary?: string;
          title: string;
          updatedAt: number;
        }>
      >;
      listSourcesForEvent: FunctionReference<
        "query",
        "public",
        { eventId: string; limit?: number },
        Array<{
          createdAt: number;
          externalId?: string;
          sourceKey: string;
          url?: string;
        }>
      >;
      listSymbolsForEvent: FunctionReference<
        "query",
        "public",
        { eventId: string },
        Array<{ symbol: string }>
      >;
    };
  };
  ingest: {
    actions: {
      ingestSource: FunctionReference<
        "action",
        "public",
        {
          assetAliasMap?: Record<string, string>;
          disabledAliases?: Array<string>;
          nowMs: number;
          sourceId: string;
          supportedSymbols: Array<string>;
        },
        {
          createdEventIds: Array<string>;
          createdEvents: number;
          createdRaw: number;
          dedupedEvents: number;
          error?: string;
          kind: string;
          ok: boolean;
          sourceId: string;
          sourceKey: string;
          symbolLinksWritten: number;
          updatedEvents: number;
        }
      >;
      reprocessSourceDeterministic: FunctionReference<
        "action",
        "public",
        {
          assetAliasMap?: Record<string, string>;
          disabledAliases?: Array<string>;
          limit?: number;
          lookbackDays?: number;
          sourceId: string;
          supportedSymbols: Array<string>;
        },
        {
          classificationsWritten: number;
          error?: string;
          eventsConsidered: number;
          ok: boolean;
          sourceId: string;
          symbolLinksAdded: number;
        }
      >;
    };
  };
  runs: {
    queries: {
      listRecentRuns: FunctionReference<
        "query",
        "public",
        { limit?: number; sourceKey?: string },
        Array<{
          _creationTime: number;
          _id: string;
          createdEvents?: number;
          createdRaw?: number;
          dedupedEvents?: number;
          endedAt?: number;
          kind: string;
          lastError?: string;
          ok?: boolean;
          sourceId: string;
          sourceKey: string;
          startedAt: number;
          symbolLinksWritten?: number;
          updatedEvents?: number;
        }>
      >;
    };
  };
  sources: {
    mutations: {
      createSource: FunctionReference<
        "mutation",
        "public",
        {
          cadenceSeconds?: number;
          config: any;
          enabled?: boolean;
          kind: string;
          label?: string;
          overlapSeconds?: number;
          sourceKey: string;
        },
        { sourceId: string }
      >;
      deleteSource: FunctionReference<
        "mutation",
        "public",
        { sourceId: string },
        { ok: boolean }
      >;
      updateSource: FunctionReference<
        "mutation",
        "public",
        {
          cadenceSeconds?: number;
          config?: any;
          cursor?: any;
          enabled?: boolean;
          label?: string;
          nextRunAt?: number;
          overlapSeconds?: number;
          sourceId: string;
        },
        { ok: boolean }
      >;
    };
    queries: {
      listDueSources: FunctionReference<
        "query",
        "public",
        { limit?: number; nowMs: number },
        Array<{
          _id: string;
          cadenceSeconds: number;
          config: any;
          cursor?: any;
          enabled: boolean;
          kind: string;
          label?: string;
          nextRunAt: number;
          overlapSeconds: number;
          sourceKey: string;
        }>
      >;
      listSources: FunctionReference<
        "query",
        "public",
        { limit?: number },
        Array<{
          _creationTime: number;
          _id: string;
          cadenceSeconds: number;
          config: any;
          createdAt: number;
          cursor?: any;
          enabled: boolean;
          kind: string;
          label?: string;
          nextRunAt: number;
          overlapSeconds: number;
          sourceKey: string;
          updatedAt: number;
        }>
      >;
    };
  };
  subscriptions: {
    mutations: {
      upsertSubscription: FunctionReference<
        "mutation",
        "public",
        {
          channels?: any;
          cooldownSeconds?: number;
          enabled: boolean;
          minImpact?: string;
          orgId: string;
          symbol: string;
          userId: string;
        },
        { ok: boolean }
      >;
    };
    queries: {
      getSubscriptionForUserOrgSymbol: FunctionReference<
        "query",
        "public",
        { orgId: string; symbol: string; userId: string },
        null | {
          _id: string;
          channels?: any;
          cooldownSeconds?: number;
          createdAt: number;
          enabled: boolean;
          lastSentAt?: number;
          minImpact?: string;
          updatedAt: number;
        }
      >;
      listEnabledSubscriptionsForSymbol: FunctionReference<
        "query",
        "public",
        { limit?: number; symbol: string },
        Array<{
          channels?: any;
          cooldownSeconds?: number;
          enabled: boolean;
          lastSentAt?: number;
          minImpact?: string;
          orgId: string;
          symbol: string;
          userId: string;
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
