import type { Id } from "../../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../../_generated/server";
import type { MetaValue } from "../../../src/plugins/lms/types";

type Ctx = QueryCtx | MutationCtx;

export async function getPostMetaMap(
  ctx: Ctx,
  postId: Id<"posts">,
): Promise<Map<string, MetaValue>> {
  const metaEntries = await ctx.db
    .query("postsMeta")
    .withIndex("by_post", (q) => q.eq("postId", postId))
    .collect();

  return new Map(
    metaEntries.map((entry) => [entry.key, entry.value ?? null] as const),
  );
}

export async function setPostMetaValue(
  ctx: MutationCtx,
  postId: Id<"posts">,
  key: string,
  value: MetaValue,
): Promise<void> {
  const existing = await ctx.db
    .query("postsMeta")
    .withIndex("by_post_and_key", (q) => q.eq("postId", postId).eq("key", key))
    .unique();

  const timestamp = Date.now();
  if (existing) {
    await ctx.db.patch(existing._id, { value, updatedAt: timestamp });
    return;
  }

  await ctx.db.insert("postsMeta", {
    postId,
    key,
    value,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
}

export async function deletePostMetaValue(
  ctx: MutationCtx,
  postId: Id<"posts">,
  key: string,
): Promise<void> {
  const existing = await ctx.db
    .query("postsMeta")
    .withIndex("by_post_and_key", (q) => q.eq("postId", postId).eq("key", key))
    .unique();

  if (existing) {
    await ctx.db.delete(existing._id);
  }
}

export function parseCourseStructureMeta(value: MetaValue): Id<"posts">[] {
  if (typeof value !== "string") {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (item): item is Id<"posts"> => typeof item === "string",
      );
    }
  } catch {
    // ignore malformed JSON
  }

  return [];
}

export function serializeCourseStructureMeta(lessonIds: Id<"posts">[]): string {
  return JSON.stringify(lessonIds);
}
