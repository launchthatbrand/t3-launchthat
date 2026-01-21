import type { FunctionReference } from "convex/server";

export type NotificationsTestMode = "forceAll" | "respectPreferences";
export type NotificationsTestSinkId = "inApp" | "email";

export type SendTestNotificationInput = {
  eventKey: string;
  title: string;
  content?: string;
  actionUrl?: string;
  mode?: NotificationsTestMode;
  sinkIds?: Array<NotificationsTestSinkId>;
};

export type SendTestNotificationResult = {
  inAppInserted: boolean;
  emailAttempted: boolean;
  emailSucceeded: boolean;
  discordAttempted: boolean;
  discordSucceeded: boolean;
  errors: Array<string>;
};

export type NotificationsToggleInfo = {
  userInAppOverride: boolean | null;
  userEmailOverride: boolean | null;
  orgInAppDefault: boolean | null;
  orgEmailDefault: boolean | null;
};

export type NotificationsTestHarnessRefs = {
  createNotification: FunctionReference<"mutation", "public" | "internal">;
  sendTransactionalEmail: FunctionReference<"mutation", "public" | "internal">;
  getDeliveryTogglesForUserEvent?: FunctionReference<"query", "public" | "internal">;
};

type RunQueryCtx = { runQuery: (ref: any, args: any) => Promise<any> };
type RunMutationCtx = { runMutation: (ref: any, args: any) => Promise<any> };

export type NotificationsTestHarnessCtx = RunQueryCtx & RunMutationCtx;

export type SendTestNotificationParams = {
  orgId: string;
  actorUserId: string;
  targetUserId?: string;
  targetUserEmail: string | null;
} & SendTestNotificationInput;

const asTrimmed = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

const getEnabledFromToggles = (opts: {
  mode: NotificationsTestMode;
  userOverride: boolean | null;
  orgDefault: boolean | null;
  fallback: boolean;
}) => {
  if (opts.mode === "forceAll") return true;
  if (typeof opts.userOverride === "boolean") return opts.userOverride;
  if (typeof opts.orgDefault === "boolean") return opts.orgDefault;
  return opts.fallback;
};

export const makeNotificationsTestHarness = (refs: NotificationsTestHarnessRefs) => {
  const sendTestNotificationToUser = async (
    ctx: NotificationsTestHarnessCtx,
    params: SendTestNotificationParams,
  ): Promise<SendTestNotificationResult> => {
    const mode: NotificationsTestMode = params.mode ?? "forceAll";
    const targetUserId = params.targetUserId ?? params.actorUserId;

    const eventKey = asTrimmed(params.eventKey);
    const title = asTrimmed(params.title);
    const content = asTrimmed(params.content);
    const actionUrl = asTrimmed(params.actionUrl);

    const errors: Array<string> = [];

    const sinkIds: Array<NotificationsTestSinkId> = Array.isArray(params.sinkIds)
      ? params.sinkIds
      : ["inApp", "email"];
    const inAppSelected = sinkIds.includes("inApp");
    const emailSelected = sinkIds.includes("email");

    let toggles: NotificationsToggleInfo = {
      userInAppOverride: null,
      userEmailOverride: null,
      orgInAppDefault: null,
      orgEmailDefault: null,
    };

    if (mode === "respectPreferences" && refs.getDeliveryTogglesForUserEvent) {
      try {
        toggles = (await ctx.runQuery(refs.getDeliveryTogglesForUserEvent, {
          orgId: params.orgId,
          userId: targetUserId,
          eventKey,
        })) as NotificationsToggleInfo;
      } catch (e) {
        errors.push(
          e instanceof Error
            ? `toggles: ${e.message}`
            : `toggles: ${String(e)}`,
        );
      }
    }

    const inAppEnabled = getEnabledFromToggles({
      mode,
      userOverride: toggles.userInAppOverride,
      orgDefault: toggles.orgInAppDefault,
      fallback: true,
    });
    const emailEnabled = getEnabledFromToggles({
      mode,
      userOverride: toggles.userEmailOverride,
      orgDefault: toggles.orgEmailDefault,
      fallback: false,
    });

    let inAppInserted = false;
    if (inAppSelected && inAppEnabled) {
      try {
        await ctx.runMutation(refs.createNotification, {
          userId: targetUserId,
          orgId: params.orgId,
          eventKey,
          tabKey: "system",
          title,
          content: content.length > 0 ? content : undefined,
          actionUrl: actionUrl.length > 0 ? actionUrl : undefined,
        });
        inAppInserted = true;
      } catch (e) {
        errors.push(
          e instanceof Error ? `inApp: ${e.message}` : `inApp: ${String(e)}`,
        );
      }
    }

    const emailAttempted =
      emailSelected &&
      emailEnabled &&
      typeof params.targetUserEmail === "string" &&
      params.targetUserEmail.trim().length > 0;
    let emailSucceeded = false;

    if (emailAttempted) {
      try {
        await ctx.runMutation(refs.sendTransactionalEmail, {
          orgId: params.orgId,
          to: params.targetUserEmail?.trim() ?? "",
          templateKey: "core.notification.event",
          variables: {
            title,
            content: content.length > 0 ? content : "",
            actionUrl: actionUrl.length > 0 ? actionUrl : "",
            eventKey,
          },
        });
        emailSucceeded = true;
      } catch (e) {
        errors.push(
          e instanceof Error ? `email: ${e.message}` : `email: ${String(e)}`,
        );
      }
    }

    return {
      inAppInserted,
      emailAttempted,
      emailSucceeded,
      // Keep Portal-compatible fields even if this harness doesn't do Discord yet.
      discordAttempted: false,
      discordSucceeded: false,
      errors,
    };
  };

  return { sendTestNotificationToUser };
};

