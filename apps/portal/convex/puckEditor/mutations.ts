import {
  PUCK_DATA_KEY,
  PUCK_IDENTIFIER_KEY,
  buildSlugFromIdentifier,
} from "./queries";

import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { mutation } from "../_generated/server";
import { v } from "convex/values";

interface UpdateDataArgs {
  pageIdentifier: string;
  data: string;
  postId?: Id<"posts">;
  organizationId?: Id<"organizations">;
  postTypeSlug?: string;
  title?: string;
}

export const updateData = mutation({
  args: {
    pageIdentifier: v.string(),
    data: v.string(),
    postId: v.optional(v.id("posts")),
    organizationId: v.optional(v.id("organizations")),
    postTypeSlug: v.optional(v.string()),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<Id<"posts">> => {
    const target = await resolvePost(ctx, args);
    const postId = target ?? (await createPuckPage(ctx, args));

    await upsertMeta(ctx, postId, PUCK_DATA_KEY, args.data);
    await upsertMeta(ctx, postId, PUCK_IDENTIFIER_KEY, args.pageIdentifier);

    return postId;
  },
});

async function resolvePost(
  ctx: MutationCtx,
  args: UpdateDataArgs,
): Promise<Id<"posts"> | null> {
  if (args.postId) {
    const post = await ctx.db.get(args.postId);
    if (!post) {
      return null;
    }
    const requestedOrg = args.organizationId ?? undefined;
    const postOrg = post.organizationId ?? undefined;
    if (requestedOrg && postOrg && requestedOrg !== postOrg) {
      throw new Error("Post belongs to a different organization");
    }
    return post._id;
  }

  const slug = buildSlugFromIdentifier(args.pageIdentifier);
  const organizationId = args.organizationId ?? undefined;
  if (organizationId) {
    const post = await ctx.db
      .query("posts")
      .withIndex("by_organization_slug", (q) =>
        q.eq("organizationId", organizationId).eq("slug", slug),
      )
      .unique();
    return post?._id ?? null;
  }

  const post = await ctx.db
    .query("posts")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .filter((q) => q.eq(q.field("organizationId"), undefined))
    .unique();
  return post?._id ?? null;
}

async function createPuckPage(
  ctx: MutationCtx,
  args: UpdateDataArgs,
): Promise<Id<"posts">> {
  const slug = buildSlugFromIdentifier(args.pageIdentifier);
  const now = Date.now();
  return await ctx.db.insert("posts", {
    title: args.title ?? `Page ${args.pageIdentifier}`,
    slug,
    postTypeSlug: args.postTypeSlug ?? "pages",
    organizationId: args.organizationId ?? undefined,
    status: "draft",
    createdAt: now,
    updatedAt: now,
  });
}

async function upsertMeta(
  ctx: MutationCtx,
  postId: Id<"posts">,
  key: string,
  value: string,
) {
  const existing = await ctx.db
    .query("postsMeta")
    .withIndex("by_post_and_key", (q) => q.eq("postId", postId).eq("key", key))
    .unique();

  if (existing) {
    await ctx.db.patch(existing._id, {
      value,
      updatedAt: Date.now(),
    });
  } else {
    await ctx.db.insert("postsMeta", {
      postId,
      key,
      value,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }
}

