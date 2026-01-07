import type { Id } from "../../_generated/dataModel";
import { v } from "convex/values";

export const TEMPLATE_POST_TYPE_SLUG = "templates";

export const TEMPLATE_META_KEYS = {
  category: "templateCategory",
  targetPostType: "templateTargetPostType",
  loopContext: "templateLoopContext",
  pageIdentifier: "templatePageIdentifier",
} as const;

export const templateCategoryValidator = v.union(
  v.literal("single"),
  v.literal("archive"),
  v.literal("loop"),
  v.literal("container"),
);

export type TemplateCategory =
  | "single"
  | "archive"
  | "loop"
  | "container";

export const requiresTargetPostType = (category: TemplateCategory) =>
  category === "single" || category === "archive" || category === "loop";

export const buildTemplatePageIdentifier = ({
  organizationId,
  templateCategory,
  targetPostType,
  postId,
}: {
  organizationId?: Id<"organizations"> | null;
  templateCategory: TemplateCategory;
  targetPostType?: string | null;
  postId: Id<"posts">;
}) => {
  const normalizedTarget =
    (targetPostType?.trim().toLowerCase()) || "global";
  const base = `templates-${templateCategory}-${normalizedTarget}-${postId}`;
  if (!organizationId) {
    return base;
  }
  return `${organizationId}:${base}`;
};

