"use client";

import type { ReactNode } from "react";

import type { PluginFrontendFilterLocation } from "./index";

export interface FrontendFilterContext {
  postTypeSlug: string;
  postId?: string;
  postMeta?: Record<string, unknown>;
}

type FilterHandler = (
  children: ReactNode,
  context: FrontendFilterContext,
) => ReactNode;

interface RegisteredFilter {
  id: string;
  location: PluginFrontendFilterLocation;
  handler: FilterHandler;
}

const registry = new Map<string, RegisteredFilter>();

export function registerFrontendFilter(definition: RegisteredFilter) {
  registry.set(definition.id, definition);
}

export function getRegisteredFrontendFilters(
  filterIds: string[],
  location: PluginFrontendFilterLocation,
): RegisteredFilter[] {
  if (!filterIds.length) {
    return [];
  }
  const entries: RegisteredFilter[] = [];
  filterIds.forEach((id) => {
    const registered = registry.get(id);
    if (registered && registered.location === location) {
      entries.push(registered);
    }
  });
  return entries;
}
