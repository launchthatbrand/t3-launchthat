import type { Id } from "../_generated/dataModel";
import { query } from "../_generated/server";
import { v } from "convex/values";

const PUCK_DATA_KEY = "puck_data";
const PUCK_IDENTIFIER_KEY = "puck_page_identifier";

export const getData = query({
  args: {
    pageIdentifier: v.string(),
    postId: v.optional(v.id("posts")),
    organizationId: v.optional(v.id("organizations")),
  },
  handler: async (ctx, args): Promise<string | null> => {
    interface MinimalPost {
      _id: Id<"posts">;
      content?: string | null;
      organizationId?: Id<"organizations"> | undefined;
    }

    const resolvePost = async (): Promise<MinimalPost | null> => {
      if (args.postId) {
        const post = (await ctx.db.get(args.postId)) as MinimalPost | null;
        if (!post) {
          return null;
        }
        const requestedOrg = args.organizationId ?? undefined;
        const postOrg = post.organizationId ?? undefined;
        if (requestedOrg && postOrg && requestedOrg !== postOrg) {
          return null;
        }
        return post;
      }

      return await findPostByIdentifier(args.pageIdentifier, args.organizationId);
    };

    const findPostByIdentifier = async (
      identifier: string,
      organizationId?: Id<"organizations">,
    ): Promise<MinimalPost | null> => {
      const slug = buildSlugFromIdentifier(identifier);
      if (organizationId) {
        return (await ctx.db
          .query("posts")
          .withIndex("by_organization_slug", (q: any) =>
            q.eq("organizationId", organizationId).eq("slug", slug),
          )
          .unique()) as MinimalPost | null;
      }

      return (await ctx.db
        .query("posts")
        .withIndex("by_slug", (q: any) => q.eq("slug", slug))
        .filter((q: any) => q.eq(q.field("organizationId"), undefined))
        .unique()) as MinimalPost | null;
    };

    const targetPost = await resolvePost();
    if (!targetPost) {
      return null;
    }

    const puckMeta = await ctx.db
      .query("postsMeta")
      .withIndex("by_post_and_key", (q: any) =>
        q.eq("postId", targetPost._id).eq("key", PUCK_DATA_KEY),
      )
      .unique();

    if (typeof puckMeta?.value === "string") {
      return puckMeta.value;
    }

    // Legacy fallback: read from post content if we have never migrated this entry
    if (typeof targetPost.content === "string") {
      return targetPost.content;
    }

    return null;
  },
});

export function buildSlugFromIdentifier(identifier: string) {
  const normalized = identifier
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return normalized.length > 0 ? `puck-${normalized}` : `puck-${Date.now().toString(36)}`;
}

export { PUCK_DATA_KEY, PUCK_IDENTIFIER_KEY };

