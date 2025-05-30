/**
 * Type definitions for the groups module
 */
import { Id } from "../../_generated/dataModel";

/**
 * Group privacy settings
 */
export type GroupPrivacy = "public" | "private" | "restricted";

/**
 * Member role within a group
 */
export type GroupMemberRole = "admin" | "moderator" | "member";

/**
 * Member status within a group
 */
export type GroupMemberStatus = "active" | "invited" | "requested" | "blocked";

/**
 * Group member status for API responses (maps "requested" to "pending")
 */
export type GroupMemberAPIStatus = "active" | "invited" | "pending" | "blocked";

/**
 * Group settings
 */
export interface GroupSettings {
  allowMemberPosts: boolean;
  allowMemberInvites: boolean;
  showInDirectory: boolean;
  moderationEnabled?: boolean;
  autoApproveMembers?: boolean;
}

/**
 * Group database record
 */
export interface Group {
  _id: Id<"groups">;
  _creationTime: number;
  name: string;
  description: string;
  privacy: GroupPrivacy;
  avatar?: string;
  coverImage?: string;
  categoryTags?: string[];
  settings: GroupSettings;
  isArchived?: boolean;
  createdBy: Id<"users">;
}

/**
 * Group member record
 */
export interface GroupMember {
  _id: Id<"groupMembers">;
  _creationTime: number;
  groupId: Id<"groups">;
  userId: Id<"users">;
  role: GroupMemberRole;
  status: GroupMemberStatus;
  joinedAt: number;
  invitedBy?: Id<"users">;
}

/**
 * Group invitation record
 */
export interface GroupInvitation {
  _id: Id<"groupInvitations">;
  _creationTime: number;
  groupId: Id<"groups">;
  invitedUserId: Id<"users">;
  invitedByUserId: Id<"users">;
  status: "pending" | "accepted" | "declined";
  expiresAt?: number;
}

/**
 * Extended group with additional calculated fields
 */
export interface GroupWithDetails extends Group {
  memberCount: number;
  userMembership: {
    role: GroupMemberRole;
    status: GroupMemberAPIStatus;
  } | null;
}
