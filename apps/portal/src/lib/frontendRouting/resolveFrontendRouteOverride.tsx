import "~/lib/plugins/installHooks";

import type { Doc, Id } from "@/convex/_generated/dataModel";
import type { ReactNode } from "react";
import { applyFilters } from "@acme/admin-runtime/hooks";

import { pluginDefinitions } from "~/lib/plugins/definitions";
import { FRONTEND_ROUTE_HANDLERS_FILTER } from "~/lib/plugins/hookSlots";

type PluginOptionDoc = Doc<"options">;

export interface FrontendRouteHandlerContext {
  segments: string[];
  searchParams?: Record<string, string | string[] | undefined>;
  organizationId: Id<"organizations"> | null;
  enabledPluginIds: string[];
  // Portal-provided utilities for handlers (kept as unknown to avoid cross-package typing issues)
  fetchQuery?: unknown;
  api?: unknown;
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

export async function resolveFrontendRouteOverride(args: {
  segments: string[];
  searchParams?: Record<string, string | string[] | undefined>;
  organizationId: Id<"organizations"> | null;
  pluginOptions: PluginOptionDoc[] | undefined;
  fetchQuery?: unknown;
  api?: unknown;
}): Promise<ReactNode | null> {
  const enabledPluginIds = getEnabledPluginIds({ pluginOptions: args.pluginOptions });

  const ctx: FrontendRouteHandlerContext = {
    segments: args.segments,
    searchParams: args.searchParams,
    organizationId: args.organizationId,
    enabledPluginIds,
    fetchQuery: args.fetchQuery,
    api: args.api,
  };

  const handlersRaw = applyFilters(FRONTEND_ROUTE_HANDLERS_FILTER, [], ctx);
  const handlers = Array.isArray(handlersRaw)
    ? (handlersRaw as FrontendRouteHandler[])
    : [];

  const sorted = [...handlers].sort(
    (a, b) => (a?.priority ?? 10) - (b?.priority ?? 10),
  );

  for (const handler of sorted) {
    try {
      const result = await handler.resolve(ctx);
      if (result) return result;
    } catch (error) {
      console.error("[frontendRouting] route handler failed", {
        handlerId: handler?.id,
        error,
      });
    }
  }

  return null;
}


