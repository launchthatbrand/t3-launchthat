import type { QueryCtx, ActionCtx, MutationCtx } from "../types";
import { ConvexError } from "convex/values";

export const resolveOrganizationId = (): string => {
  const orgId = process.env.TRADERLAUNCHPAD_DEFAULT_ORG_ID;
  if (typeof orgId !== "string" || !orgId.trim()) {
    throw new ConvexError(
      "Missing TRADERLAUNCHPAD_DEFAULT_ORG_ID (set in Convex env for this deployment).",
    );
  }
  return orgId.trim();
};

export const resolveViewerUserId = async (
  ctx: QueryCtx | MutationCtx | ActionCtx,
): Promise<string> => {
  const ident = await ctx.auth.getUserIdentity();
  const subject = typeof ident?.subject === "string" ? ident.subject : null;
  if (!subject) {
    throw new ConvexError("Unauthorized: You must be logged in to perform this action.");
  }
  return subject;
};


