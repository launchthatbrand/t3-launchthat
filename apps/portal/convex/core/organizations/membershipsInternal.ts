"use node";

import type { FunctionReference } from "convex/server";
import { createClerkClient } from "@clerk/backend";

import { internal } from "../../_generated/api";
import { v } from "convex/values";
import { internalAction } from "../../_generated/server";

const getClerkSecretKey = (): string => {
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  const key = process.env.CLERK_SECRET_KEY;
  if (!key) throw new Error("Missing CLERK_SECRET_KEY in Convex environment");
  return key;
};

type InternalQueryRef = FunctionReference<"query", "internal">;

interface MembershipsInternalQueriesBag {
  getOrganizationClerkOrganizationId: unknown;
  getUserClerkId: unknown;
}

const membershipsInternalQueries = (
  internal as unknown as {
    core: { organizations: { membershipsInternalQueries: MembershipsInternalQueriesBag } };
  }
).core.organizations.membershipsInternalQueries;

export const removeUserFromClerkOrganization = internalAction({
  args: {
    organizationId: v.id("organizations"),
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const orgRef =
      membershipsInternalQueries.getOrganizationClerkOrganizationId as InternalQueryRef;
    const userRef =
      membershipsInternalQueries.getUserClerkId as InternalQueryRef;

    const [{ clerkOrganizationId }, { clerkUserId }] = await Promise.all([
      ctx.runQuery(orgRef, { organizationId: args.organizationId }) as Promise<{
        clerkOrganizationId: string | null;
      }>,
      ctx.runQuery(userRef, { userId: args.userId }) as Promise<{
        clerkUserId: string | null;
      }>,
    ]);

    if (!clerkOrganizationId || !clerkUserId) return null;

    const clerk = createClerkClient({ secretKey: getClerkSecretKey() });
    const orgsAny = clerk.organizations as unknown as {
      deleteOrganizationMembership?: (args: {
        organizationId: string;
        userId: string;
      }) => Promise<unknown>;
    };

    try {
      if (typeof orgsAny.deleteOrganizationMembership === "function") {
        await orgsAny.deleteOrganizationMembership({
          organizationId: clerkOrganizationId,
          userId: clerkUserId,
        });
      } else {
        throw new Error(
          "Clerk SDK does not expose organizations.deleteOrganizationMembership",
        );
      }
    } catch (err) {
      // Best-effort: user may already be removed in Clerk, org mapping may be stale, etc.
      console.warn("[membershipsInternal] failed to remove Clerk org membership", {
        organizationId: String(args.organizationId),
        clerkOrganizationId,
        userId: String(args.userId),
        clerkUserId,
        err: err instanceof Error ? err.message : err,
      });
    }

    return null;
  },
});


