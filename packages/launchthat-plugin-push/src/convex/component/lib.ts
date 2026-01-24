import { ConvexError } from "convex/values";
import type { MutationCtx, QueryCtx } from "convex/server";

export const resolveViewerUserId = async (
  ctx: QueryCtx | MutationCtx,
): Promise<string> => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError("Unauthorized");

  const subject =
    typeof identity.subject === "string" ? identity.subject.trim() : "";
  if (subject) return subject;

  const tokenIdentifier =
    typeof identity.tokenIdentifier === "string"
      ? identity.tokenIdentifier.trim()
      : "";
  if (tokenIdentifier) return tokenIdentifier;

  throw new ConvexError("Unauthorized");
};

