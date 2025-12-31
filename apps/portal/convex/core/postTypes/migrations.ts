import { v } from "convex/values";

import { internalMutation } from "../../_generated/server";

const inferStorageComponent = (tables: readonly string[] | undefined) => {
  const storageTables = tables ?? [];
  const candidate =
    storageTables.find((t) => t.includes(":posts")) ?? storageTables[0];
  if (!candidate) return undefined;
  const prefix = candidate.split(":")[0];
  return prefix && prefix.trim().length > 0 ? prefix.trim() : undefined;
};

export const backfillStorageComponent = internalMutation({
  args: {
    dryRun: v.optional(v.boolean()),
  },
  returns: v.object({
    scanned: v.number(),
    updated: v.number(),
  }),
  handler: async (ctx, args) => {
    const dryRun = args.dryRun ?? false;
    const postTypes = await ctx.db.query("postTypes").collect();
    let updated = 0;

    for (const postType of postTypes) {
      if (postType.storageKind !== "component") continue;
      if (
        typeof postType.storageComponent === "string" &&
        postType.storageComponent
      ) {
        continue;
      }

      const inferred = inferStorageComponent(postType.storageTables);
      if (!inferred) continue;

      updated += 1;
      if (!dryRun) {
        await ctx.db.patch(postType._id, {
          storageComponent: inferred,
          updatedAt: Date.now(),
        });
      }
    }

    return { scanned: postTypes.length, updated };
  },
});
