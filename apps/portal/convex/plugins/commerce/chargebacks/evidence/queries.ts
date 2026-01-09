/* eslint-disable @typescript-eslint/no-explicit-any */
import { v } from "convex/values";

import { components } from "../../../../_generated/api";
import { query } from "../../../../_generated/server";

interface CommerceChargebackEvidenceQueries {
  getChargebackEvidence: unknown;
  getEvidenceSummary: unknown;
}

const evidenceQueries = (
  components as unknown as {
    launchthat_ecommerce: {
      chargebacks: { evidence: { queries: CommerceChargebackEvidenceQueries } };
    };
  }
).launchthat_ecommerce.chargebacks.evidence.queries;

export const getChargebackEvidence = query({
  args: {
    chargebackPostId: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runQuery(evidenceQueries.getChargebackEvidence as any, {
      chargebackPostId: args.chargebackPostId,
    });
  },
});

export const getEvidenceSummary = query({
  args: {
    chargebackPostId: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runQuery(evidenceQueries.getEvidenceSummary as any, {
      chargebackPostId: args.chargebackPostId,
    });
  },
});














