import { createClerkClient } from "@clerk/backend";

import { env } from "~/env";

export type ClerkOrgRole = "admin" | "member" | "org:admin" | "org:member";

const getClerkClient = () => {
  return createClerkClient({ secretKey: env.CLERK_SECRET_KEY });
};

const normalizeRole = (role: ClerkOrgRole): "org:admin" | "org:member" => {
  if (role === "admin" || role === "org:admin") return "org:admin";
  return "org:member";
};

export async function createClerkOrganization(args: {
  name: string;
  slug: string;
}): Promise<{ clerkOrganizationId: string }> {
  const clerk = getClerkClient();
  const created = await clerk.organizations.createOrganization({
    name: args.name,
    slug: args.slug,
  });
  return { clerkOrganizationId: created.id };
}

export async function addClerkOrganizationMember(args: {
  clerkOrganizationId: string;
  clerkUserId: string;
  role: ClerkOrgRole;
}): Promise<{ membershipId: string }> {
  const clerk = getClerkClient();
  const orgId = args.clerkOrganizationId;
  const userId = args.clerkUserId;
  const role = normalizeRole(args.role);

  try {
    const membership = await clerk.organizations.createOrganizationMembership({
      organizationId: orgId,
      userId,
      role,
    });
    return { membershipId: membership.id };
  } catch (err: unknown) {
    // Idempotency: if the user is already a member, Clerk will throw.
    // We keep this adapter dependency-light; callers can optionally fetch membership lists.
    const e =
      err && typeof err === "object"
        ? (err as {
            status?: unknown;
            clerkTraceId?: unknown;
            errors?: { code?: unknown; message?: unknown }[];
            message?: unknown;
          })
        : null;
    const message =
      err instanceof Error ? err.message : typeof err === "string" ? err : "";
    const codes = Array.isArray(e?.errors)
      ? e.errors
          .map((row) => (typeof row.code === "string" ? row.code : ""))
          .filter(Boolean)
      : [];

    // Clerk can express "already a member" in a few ways depending on version:
    // - message contains "already"
    // - errors[].code indicates a uniqueness violation / existing membership
    if (
      message.toLowerCase().includes("already") ||
      codes.includes("organization_membership_exists") ||
      codes.includes("organization_membership_already_exists") ||
      codes.includes("already_exists")
    ) {
      return { membershipId: "existing" };
    }
    console.warn("[clerkOrgAdapter] addClerkOrganizationMember failed", {
      status: typeof e?.status === "number" ? e.status : undefined,
      clerkTraceId: typeof e?.clerkTraceId === "string" ? e.clerkTraceId : undefined,
      codes,
      message,
    });
    throw err;
  }
}
