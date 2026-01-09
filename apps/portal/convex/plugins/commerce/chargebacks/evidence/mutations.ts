/* eslint-disable @typescript-eslint/no-explicit-any */
import { v } from "convex/values";

import { components } from "../../../../_generated/api";
import { mutation } from "../../../../_generated/server";

interface CommerceChargebackEvidenceMutations {
  createEvidence: unknown;
  deleteEvidence: unknown;
}

const evidenceMutations = (
  components as unknown as {
    launchthat_ecommerce: {
      chargebacks: {
        evidence: { mutations: CommerceChargebackEvidenceMutations };
      };
    };
  }
).launchthat_ecommerce.chargebacks.evidence.mutations;

export const createEvidence = mutation({
  args: {
    chargebackPostId: v.string(),
    documentType: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    fileStorageId: v.optional(v.id("_storage")),
    importance: v.string(),
    tags: v.optional(v.array(v.string())),
    status: v.optional(v.string()),
    textContent: v.optional(v.string()),
    urls: v.optional(v.array(v.string())),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runMutation(evidenceMutations.createEvidence as any, args);
  },
});

export const deleteEvidence = mutation({
  args: {
    id: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runMutation(evidenceMutations.deleteEvidence as any, {
      id: args.id,
    });
  },
});














