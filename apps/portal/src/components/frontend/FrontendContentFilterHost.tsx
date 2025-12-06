"use client";

import type { FrontendFilterContext } from "launchthat-plugin-core/frontendFilters";
import type { ReactNode } from "react";
import { getRegisteredFrontendFilters } from "launchthat-plugin-core/frontendFilters";

interface Props {
  children: ReactNode;
  filterIds: string[];
  context: FrontendFilterContext;
}

interface RegisteredContentFilter {
  handler: (children: ReactNode, ctx: FrontendFilterContext) => ReactNode;
}

export function FrontendContentFilterHost({
  children,
  filterIds,
  context,
}: Props) {
  const getRegisteredFiltersSafe = getRegisteredFrontendFilters as unknown as (
    ids: string[],
    location: "content",
  ) => RegisteredContentFilter[];
  const filters = getRegisteredFiltersSafe(filterIds, "content");
  if (!filters.length) {
    return <>{children}</>;
  }
  return (
    <>
      {filters.reduceRight<ReactNode>(
        (acc, entry) => entry.handler(acc, context),
        children,
      )}
    </>
  );
}
