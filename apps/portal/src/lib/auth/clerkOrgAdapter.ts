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
    const message =
      err instanceof Error ? err.message : typeof err === "string" ? err : "";
    if (message.toLowerCase().includes("already")) {
      return { membershipId: "existing" };
    }
    throw err;
  }
}
