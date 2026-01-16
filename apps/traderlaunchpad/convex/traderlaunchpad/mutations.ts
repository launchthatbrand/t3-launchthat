/* eslint-disable
  @typescript-eslint/no-explicit-any,
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-member-access,
  @typescript-eslint/no-unsafe-return
*/

import { v } from "convex/values";

import { components } from "../_generated/api";
import { mutation } from "../_generated/server";
import { resolveOrganizationId, resolveViewerUserId } from "./lib/resolve";

const tradeIdeasNotesMutations = components.launchthat_traderlaunchpad.tradeIdeas
  .notes as any;

export const upsertMyTradeIdeaNoteForGroup = mutation({
  args: {
    tradeIdeaGroupId: v.string(),
    thesis: v.optional(v.string()),
    setup: v.optional(v.string()),
    mistakes: v.optional(v.string()),
    outcome: v.optional(v.string()),
    nextTime: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  returns: v.object({ noteId: v.string() }),
  handler: async (ctx, args) => {
    const organizationId = resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);

    const noteId = await ctx.runMutation(tradeIdeasNotesMutations.upsertNoteForGroup, {
      organizationId,
      userId,
      tradeIdeaGroupId: args.tradeIdeaGroupId as any,
      thesis: args.thesis,
      setup: args.setup,
      mistakes: args.mistakes,
      outcome: args.outcome,
      nextTime: args.nextTime,
      tags: args.tags,
    });

    return { noteId: String(noteId) };
  },
});

export const markMyTradeIdeaReviewed = mutation({
  args: {
    tradeIdeaGroupId: v.string(),
  },
  returns: v.object({ noteId: v.string() }),
  handler: async (ctx, args) => {
    const organizationId = resolveOrganizationId();
    const userId = await resolveViewerUserId(ctx);

    const noteId = await ctx.runMutation(tradeIdeasNotesMutations.markReviewed, {
      organizationId,
      userId,
      tradeIdeaGroupId: args.tradeIdeaGroupId as any,
    });

    return { noteId: String(noteId) };
  },
});

