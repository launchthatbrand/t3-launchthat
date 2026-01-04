import "~/lib/plugins/installHooks.server";

import type { Doc, Id } from "@/convex/_generated/dataModel";
import type { fetchQuery as convexFetchQuery } from "convex/nextjs";
import type { ReactNode } from "react";

import { applyFilters } from "@acme/admin-runtime/hooks";

import { pluginDefinitions } from "~/lib/plugins/definitions";
import { FRONTEND_ROUTE_HANDLERS_FILTER } from "~/lib/plugins/hookSlots";

type FetchQuery = typeof convexFetchQuery;
type PluginOptionDoc = Doc<"options">;

export interface FrontendRouteHandlerContext {
  segments: string[];
  searchParams?: Record<string, string | string[] | undefined>;
  organizationId: Id<"organizations"> | null;
  enabledPluginIds: string[];
  fetchQuery: FetchQuery;
  api: unknown;
}

export interface FrontendRouteHandler {
  id: string;
  priority: number;
  resolve: (
    ctx: FrontendRouteHandlerContext,
  ) => Promise<ReactNode | null> | ReactNode | null;
}

const getEnabledPluginIds = (args: {
  pluginOptions: PluginOptionDoc[] | undefined;
}): string[] => {
  const optionMap = new Map(
    (args.pluginOptions ?? []).map((o) => [o.metaKey, Boolean(o.metaValue)]),
  );

  const enabledIds: string[] = [];
  for (const plugin of pluginDefinitions) {
    if (!plugin.activation) {
      enabledIds.push(plugin.id);
      continue;
    }

    const stored = optionMap.get(plugin.activation.optionKey);
    const isEnabled = stored ?? plugin.activation.defaultEnabled ?? false;
    if (isEnabled) enabledIds.push(plugin.id);
  }

  return enabledIds;
};

export async function resolveFrontendRoute(args: {
  segments: string[];
  searchParams?: Record<string, string | string[] | undefined>;
  organizationId: Id<"organizations"> | null;
  fetchQuery: FetchQuery;
}): Promise<ReactNode | null> {
  // Avoid importing Convex generated API at module scope to prevent TS “excessively deep” instantiation issues.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
  const apiAny = (await import("@/convex/_generated/api")).api as any;

  const pluginOptions =
    ((await args.fetchQuery(apiAny.core.options.getByType, {
      type: "site",
      ...(args.organizationId ? { orgId: args.organizationId } : {}),
    })) as Doc<"options">[]) ?? [];

  const debugRouting = (() => {
    const raw = args.searchParams?.debugRouting;
    const value = Array.isArray(raw) ? raw[0] : raw;
    return value === "1" || value === "true";
  })();

  const ctx: FrontendRouteHandlerContext = {
    segments: args.segments,
    searchParams: args.searchParams,
    organizationId: args.organizationId,
    enabledPluginIds: getEnabledPluginIds({ pluginOptions }),
    fetchQuery: args.fetchQuery,
    api: apiAny,
  };

  const handlersRaw = applyFilters(FRONTEND_ROUTE_HANDLERS_FILTER, [], ctx);
  const handlers = Array.isArray(handlersRaw)
    ? (handlersRaw as FrontendRouteHandler[])
    : [];

  const sorted = [...handlers].sort(
    (a, b) => (a?.priority ?? 10) - (b?.priority ?? 10),
  );

  if (debugRouting) {
    console.log("[frontendRouting] resolve start", {
      segments: args.segments,
      organizationId: args.organizationId,
      enabledPluginIds: ctx.enabledPluginIds,
      handlerCount: sorted.length,
      handlerIds: sorted.map((h) => h?.id).filter(Boolean),
    });
  }

  for (const handler of sorted) {
    try {
      if (debugRouting) {
        console.log("[frontendRouting] try handler", {
          handlerId: handler?.id,
          priority: handler?.priority,
        });
      }
      const result = await handler.resolve(ctx);
      if (debugRouting) {
        console.log("[frontendRouting] handler result", {
          handlerId: handler?.id,
          isNull: result === null,
          type: typeof result,
        });
      }
      if (result) return result;
    } catch (error) {
      const digest =
        error && typeof error === "object"
          ? (error as { digest?: unknown }).digest
          : undefined;
      // Next.js navigation errors (redirect/notFound) must be re-thrown so Next can handle them.
      if (
        typeof digest === "string" &&
        (digest.startsWith("NEXT_REDIRECT") ||
          digest.startsWith("NEXT_NOT_FOUND"))
      ) {
        if (debugRouting) {
          console.log("[frontendRouting] navigation error (rethrow)", {
            handlerId: handler?.id,
            digest,
          });
        }
        throw error;
      }
      console.error("[frontendRouting] route handler failed", {
        handlerId: handler?.id,
        error,
      });
    }
  }

  if (debugRouting) {
    console.log("[frontendRouting] resolve end (no match)", {
      segments: args.segments,
    });
  }

  return null;
}
