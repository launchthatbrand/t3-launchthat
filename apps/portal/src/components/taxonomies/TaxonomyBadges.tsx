"use client";

import type { Id } from "@convex-config/_generated/dataModel";
import { useMemo } from "react";
import Link from "next/link";
import { api } from "@convex-config/_generated/api";
import { useQuery } from "convex/react";
import { useLmsCourseContext } from "launchthat-plugin-lms";

import { Badge } from "@acme/ui/badge";

import { applyFilters } from "~/lib/hooks";

interface TermBadge {
  taxonomySlug: string;
  taxonomyName: string;
  termId: string;
  termSlug: string;
  termName: string;
}

const isTermBadge = (value: unknown): value is TermBadge => {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.taxonomySlug === "string" &&
    typeof v.taxonomyName === "string" &&
    typeof v.termId === "string" &&
    typeof v.termSlug === "string" &&
    typeof v.termName === "string"
  );
};

export function TaxonomyBadges(props: {
  organizationId: string;
  objectId: string;
  postTypeSlug?: string | null;
  categoryBase: string;
  tagBase: string;
}) {
  const lmsContext = useLmsCourseContext();
  const courseSlug =
    typeof lmsContext?.courseSlug === "string"
      ? lmsContext.courseSlug
      : undefined;

  const badges = useQuery(api.core.taxonomies.queries.listObjectTermBadges, {
    organizationId: props.organizationId as Id<"organizations">,
    objectId: props.objectId,
    postTypeSlug: props.postTypeSlug ?? undefined,
  });

  const filtered = useMemo(() => {
    const list = Array.isArray(badges) ? badges.filter(isTermBadge) : [];
    return list.filter(
      (item) => item.termSlug.length > 0 && item.taxonomySlug.length > 0,
    );
  }, [badges]);

  const categoryBase = (props.categoryBase || "categories").replace(
    /^\/+|\/+$/g,
    "",
  );
  const tagBase = (props.tagBase || "tags").replace(/^\/+|\/+$/g, "");

  const rendered = useMemo(() => {
    const hookName = "frontend.single.taxonomy.termLink";

    return filtered.map((item) => {
      const taxonomySlug = item.taxonomySlug;
      const termSlug = item.termSlug;

      const defaultHref =
        taxonomySlug === "category"
          ? `/${categoryBase}/${termSlug}`
          : taxonomySlug === "post_tag"
            ? `/${tagBase}/${termSlug}`
            : `/${taxonomySlug}/${termSlug}`;

      const context = {
        organizationId: props.organizationId,
        postId: props.objectId,
        postTypeSlug: props.postTypeSlug ?? undefined,
        taxonomySlug,
        taxonomyName: item.taxonomyName,
        termSlug,
        termName: item.termName,
        defaultHref,
        courseSlug,
      };

      const filteredHref = applyFilters(hookName, defaultHref, context);
      const href =
        typeof filteredHref === "string" && filteredHref.trim().length > 0
          ? filteredHref
          : defaultHref;

      return {
        key: `${taxonomySlug}:${termSlug}`,
        href,
        label: item.termName,
      };
    });
  }, [
    filtered,
    categoryBase,
    tagBase,
    props.organizationId,
    props.objectId,
    props.postTypeSlug,
    courseSlug,
  ]);

  if (!rendered.length) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 pt-2">
      {rendered.map((item) => (
        <Badge key={item.key} variant="secondary" className="rounded-full p-0">
          <Link className="px-3 py-1" href={item.href}>
            {item.label}
          </Link>
        </Badge>
      ))}
    </div>
  );
}
