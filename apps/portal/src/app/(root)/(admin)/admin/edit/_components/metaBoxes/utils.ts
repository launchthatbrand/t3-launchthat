import type { Doc } from "@/convex/_generated/dataModel";
import type { ReactNode } from "react";

import type { NormalizedMetaBox, ResolvedMetaBox } from "../types";

export const pickMetaBoxes = (
  allowedIds: string[] | undefined,
  fallback: NormalizedMetaBox[],
  registry: Record<string, NormalizedMetaBox>,
  useFallback: boolean,
) => {
  if (allowedIds === undefined) {
    return useFallback ? fallback : [];
  }
  if (allowedIds.length === 0) {
    return [];
  }
  const seen = new Set<string>();
  const selections: NormalizedMetaBox[] = [];
  for (const id of allowedIds) {
    if (seen.has(id)) {
      continue;
    }
    const resolved = registry[id] ?? fallback.find((box) => box.id === id);
    if (resolved) {
      selections.push(resolved);
      seen.add(id);
    }
  }
  return selections;
};

export const sortMetaBoxes = <T extends { priority: number; title: string }>(
  metaBoxes: T[],
) =>
  [...metaBoxes].sort((a, b) =>
    a.priority === b.priority
      ? a.title.localeCompare(b.title)
      : a.priority - b.priority,
  );

export const formatTimestamp = (timestamp?: number | null) => {
  if (typeof timestamp !== "number" || Number.isNaN(timestamp)) {
    return "";
  }
  return new Date(timestamp).toISOString();
};

export const deriveSystemFieldValue = (
  field: Doc<"postTypeFields">,
  post: Doc<"posts"> | null | undefined,
  isNewRecord: boolean,
): string => {
  if (!post) {
    return isNewRecord ? "Will be generated on save" : "";
  }

  switch (field.key) {
    case "_id":
      return post._id;
    case "_creationTime":
      return formatTimestamp(post._creationTime);
    case "createdAt":
      return formatTimestamp(post.createdAt ?? post._creationTime);
    case "updatedAt":
      return formatTimestamp(post.updatedAt ?? post._creationTime);
    case "slug":
      return post.slug ?? "";
    case "status":
      return post.status ?? "";
    default:
      return "";
  }
};

export type ExternalMetaBoxRenderer = (props: {
  context: {
    pluginId: string;
    pluginName: string;
    postTypeSlug: string;
    organizationId?: string;
    postId?: string;
    isNewRecord: boolean;
    post: Doc<"posts"> | null | undefined;
    postType: Doc<"postTypes"> | null;
  };
  metaBox: Pick<ResolvedMetaBox, "id" | "title" | "description" | "location">;
  fields: Array<{
    key: string;
    name: string;
    description: string | null;
    type: string;
    required: boolean;
    options: Doc<"postTypeFields">["options"] | null;
  }>;
  getValue: (fieldKey: string) => unknown;
  setValue: (fieldKey: string, value: unknown) => void;
  renderField: (fieldKey: string, options?: { idSuffix?: string }) => ReactNode;
  renderFieldControl: (
    fieldKey: string,
    options?: { idSuffix?: string },
  ) => ReactNode;
}) => ReactNode;
