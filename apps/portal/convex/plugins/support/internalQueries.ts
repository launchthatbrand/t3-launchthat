import { v } from "convex/values";

import type { Id } from "../../_generated/dataModel";
import { components } from "../../_generated/api";
import { internalQuery } from "../../_generated/server";

type SupportPostRecord = {
  _id: string;
  slug: string;
};

const supportQueries = components.launchthat_support.queries as unknown as {
  listSupportPosts: unknown;
  getSupportPostMeta: unknown;
};

export const getConversationMetadata = internalQuery({
  args: {
    organizationId: v.id("organizations"),
    sessionId: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      contactId: v.optional(v.string()),
      contactName: v.optional(v.string()),
      contactEmail: v.optional(v.string()),
      agentThreadId: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    const conversations = (await ctx.runQuery(supportQueries.listSupportPosts as any, {
      organizationId: args.organizationId,
      filters: { postTypeSlug: "support_conversation" },
    })) as SupportPostRecord[];
    const convo = conversations.find((c) => c.slug === args.sessionId);
    if (!convo) {
      return null;
    }

    const metas = (await ctx.runQuery(supportQueries.getSupportPostMeta as any, {
      postId: convo._id as Id<"posts">,
      organizationId: args.organizationId,
    })) as Array<{ key: string; value: unknown }>;

    const meta: Record<string, unknown> = {};
    for (const m of metas) {
      meta[m.key] = m.value ?? null;
    }

    return {
      contactId: typeof meta.contactId === "string" ? meta.contactId : undefined,
      contactName:
        typeof meta.contactName === "string" ? meta.contactName : undefined,
      contactEmail:
        typeof meta.contactEmail === "string" ? meta.contactEmail : undefined,
      agentThreadId:
        typeof meta.agentThreadId === "string" ? meta.agentThreadId : undefined,
    };
  },
});


