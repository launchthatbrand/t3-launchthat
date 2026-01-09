import type { ClerkOrgRole } from "./clerkOrgAdapter";

/**
 * Portal/global roles are broader than Clerk org roles.
 * Clerk org roles are typically just org:admin / org:member.
 */
export const mapPortalRoleToClerkOrgRole = (role?: string): ClerkOrgRole => {
  return role === "admin" ? "org:admin" : "org:member";
};


