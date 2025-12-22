import { v } from "convex/values";

import type { Doc, Id } from "../../_generated/dataModel";
import { query } from "../../_generated/server";
import { isAdmin } from "../../lib/permissions/hasPermission";
import { getAuthenticatedUser } from "../../lib/permissions/userAuth";

export const listByPost = query({
  args: {
    postId: v.string(),
    organizationId: v.optional(v.id("organizations")),
  },
  handler: async (ctx, args) => {
    const organizationId = args.organizationId ?? undefined;

    const viewer = await (async () => {
      try {
        return await getAuthenticatedUser(ctx);
      } catch {
        return null;
      }
    })();

    const viewerIsAdmin = await (async () => {
      try {
        return await isAdmin(ctx);
      } catch {
        return false;
      }
    })();

    const comments: Doc<"comments">[] = organizationId
      ? await ctx.db
          .query("comments")
          .withIndex("by_org_post", (q) =>
            q.eq("organizationId", organizationId).eq("postId", args.postId),
          )
          .order("asc")
          .collect()
      : await ctx.db
          .query("comments")
          .withIndex("by_post", (q) => q.eq("postId", args.postId))
          .filter((q) => q.eq(q.field("organizationId"), undefined))
          .order("asc")
          .collect();

    const authorIds = Array.from(
      new Set(
        comments
          .map((c) => c.authorId)
          .filter((id): id is Id<"users"> => Boolean(id)),
      ),
    );

    const authors = new Map<
      Id<"users">,
      { id: Id<"users">; name: string; image?: string | null }
    >();

    await Promise.all(
      authorIds.map(async (id) => {
        const user = await ctx.db.get(id);
        if (!user) {
          return;
        }
        const name = user.name ?? user.username ?? user.email ?? "User";
        authors.set(id, {
          id,
          name,
          image: user.image ?? null,
        });
      }),
    );

    return {
      viewerUserId: viewer?._id ?? null,
      viewerIsAdmin,
      comments: comments.map((comment) => ({
        ...comment,
        author: comment.authorId
          ? (authors.get(comment.authorId) ?? null)
          : null,
      })),
    };
  },
});
