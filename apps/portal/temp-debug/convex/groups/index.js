// Export modules for hierarchical access
import * as libModule from "./lib";
import * as schemaModule from "./schema";
/**
 * Group management functionality
 */
// Re-export query functions
export { countPendingInvitationsByClerkId, listGroups, getGroupById, listGroupMembers, } from "./queries";
// Re-export mutation functions
export { createGroup, updateGroup, joinGroup, leaveGroup, inviteToGroup, acceptInvitation, declineInvitation, removeGroupMember, updateGroupMemberRole, } from "./mutations";
// For backwards compatibility
export { listGroups as listAllGroups } from "./queries";
// Re-export schema and types
export * from "./schema";
export * from "./lib";
export const lib = libModule;
export const schema = schemaModule;
