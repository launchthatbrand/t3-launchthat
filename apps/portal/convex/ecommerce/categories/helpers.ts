import type { Doc, Id } from "../../_generated/dataModel";
import type { MutationCtx } from "../../_generated/server";

/**
 * Generate a unique slug for a category
 */
export async function generateCategorySlug(
  ctx: MutationCtx,
  name: string,
  excludeId?: Id<"productCategories">,
): Promise<string> {
  const baseSlug = name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  let slug = baseSlug;
  let existingCategory = await ctx.db
    .query("productCategories")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .unique();

  let suffix = 1;
  while (existingCategory && existingCategory._id !== excludeId) {
    slug = `${baseSlug}-${suffix}`;
    existingCategory = await ctx.db
      .query("productCategories")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    suffix++;
  }

  return slug;
}

/**
 * Recursively update children paths and levels when a category's hierarchy changes
 */
export async function updateChildrenPathsAndLevels(
  ctx: MutationCtx,
  parentIdToUpdateChildrenOf: Id<"productCategories">,
  newParentLevel: number,
  newParentPath: Id<"productCategories">[],
) {
  const children: Doc<"productCategories">[] = await ctx.db
    .query("productCategories")
    .withIndex("by_parent", (q) => q.eq("parentId", parentIdToUpdateChildrenOf))
    .collect();

  for (const child of children) {
    const newChildLevel = newParentLevel + 1;
    const newChildPath = [...newParentPath, parentIdToUpdateChildrenOf];
    await ctx.db.patch(child._id, {
      level: newChildLevel,
      path: newChildPath,
      updatedAt: Date.now(),
    });
    await updateChildrenPathsAndLevels(
      ctx,
      child._id,
      newChildLevel,
      newChildPath,
    );
  }
}
