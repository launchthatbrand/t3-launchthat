import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";

/**
 * Hook for creating group notifications
 */
export function useGroupNotifications() {
  // Use type casting to avoid TypeScript errors since we know the API exists
  const createNotification = useMutation(
    api.notifications.createNotification as any,
  );

  return {
    /**
     * Create a notification when a user is invited to a group
     */
    createGroupInvitationNotification: async ({
      userId,
      groupId,
      groupName,
      inviterId,
      inviterName,
      invitationId,
      message,
    }: {
      userId: Id<"users">;
      groupId: Id<"groups">;
      groupName: string;
      inviterId: Id<"users">;
      inviterName: string;
      invitationId: Id<"groupInvitations">;
      message?: string;
    }) => {
      return createNotification({
        userId,
        type: "groupInvitation" as any,
        title: `You've been invited to join ${groupName}`,
        content: message
          ? `${inviterName} has invited you with a message: "${message}"`
          : `${inviterName} has invited you to join this group`,
        sourceUserId: inviterId,
        sourceGroupId: groupId,
        invitationId,
        actionUrl: `/invitations`,
      });
    },

    /**
     * Create a notification when a user accepts an invitation
     */
    createInvitationAcceptedNotification: async ({
      adminId,
      userId,
      userName,
      groupId,
      groupName,
      invitationId,
    }: {
      adminId: Id<"users">;
      userId: Id<"users">;
      userName: string;
      groupId: Id<"groups">;
      groupName: string;
      invitationId: Id<"groupInvitations">;
    }) => {
      return createNotification({
        userId: adminId,
        type: "invitationAccepted" as any,
        title: `${userName} joined ${groupName}`,
        content: `${userName} has accepted your invitation to join the group`,
        sourceUserId: userId,
        sourceGroupId: groupId,
        invitationId,
        actionUrl: `/groups/${groupId}`,
      });
    },

    /**
     * Create a notification when a user declines an invitation
     */
    createInvitationDeclinedNotification: async ({
      adminId,
      userId,
      userName,
      groupId,
      groupName,
      invitationId,
    }: {
      adminId: Id<"users">;
      userId: Id<"users">;
      userName: string;
      groupId: Id<"groups">;
      groupName: string;
      invitationId: Id<"groupInvitations">;
    }) => {
      return createNotification({
        userId: adminId,
        type: "invitationDeclined" as any,
        title: `${userName} declined to join ${groupName}`,
        content: `${userName} has declined your invitation to join the group`,
        sourceUserId: userId,
        sourceGroupId: groupId,
        invitationId,
        actionUrl: `/groups/${groupId}`,
      });
    },

    /**
     * Create a notification when a user requests to join a group
     */
    createJoinRequestNotification: async ({
      adminId,
      userId,
      userName,
      groupId,
      groupName,
      joinRequestId,
      message,
    }: {
      adminId: Id<"users">;
      userId: Id<"users">;
      userName: string;
      groupId: Id<"groups">;
      groupName: string;
      joinRequestId: Id<"groupJoinRequests">;
      message?: string;
    }) => {
      return createNotification({
        userId: adminId,
        type: "groupJoinRequest" as any,
        title: `${userName} requested to join ${groupName}`,
        content: message
          ? `${userName} has requested to join with a message: "${message}"`
          : `${userName} has requested to join the group`,
        sourceUserId: userId,
        sourceGroupId: groupId,
        joinRequestId,
        actionUrl: `/groups/${groupId}/requests`,
      });
    },

    /**
     * Create a notification when a join request is approved
     */
    createJoinRequestApprovedNotification: async ({
      userId,
      adminId,
      adminName,
      groupId,
      groupName,
      joinRequestId,
    }: {
      userId: Id<"users">;
      adminId: Id<"users">;
      adminName: string;
      groupId: Id<"groups">;
      groupName: string;
      joinRequestId: Id<"groupJoinRequests">;
    }) => {
      return createNotification({
        userId,
        type: "groupJoinApproved" as any,
        title: `Your request to join ${groupName} was approved`,
        content: `${adminName} has approved your request to join the group`,
        sourceUserId: adminId,
        sourceGroupId: groupId,
        joinRequestId,
        actionUrl: `/groups/${groupId}`,
      });
    },

    /**
     * Create a notification when a join request is rejected
     */
    createJoinRequestRejectedNotification: async ({
      userId,
      adminId,
      adminName,
      groupId,
      groupName,
      joinRequestId,
      reason,
    }: {
      userId: Id<"users">;
      adminId: Id<"users">;
      adminName: string;
      groupId: Id<"groups">;
      groupName: string;
      joinRequestId: Id<"groupJoinRequests">;
      reason?: string;
    }) => {
      return createNotification({
        userId,
        type: "groupJoinRejected" as any,
        title: `Your request to join ${groupName} was rejected`,
        content: reason
          ? `${adminName} has rejected your request with the reason: "${reason}"`
          : `${adminName} has rejected your request to join the group`,
        sourceUserId: adminId,
        sourceGroupId: groupId,
        joinRequestId,
        actionUrl: `/groups`,
      });
    },
  };
}
