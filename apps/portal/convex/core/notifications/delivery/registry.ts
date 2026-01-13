import type { ActionCtx } from "../../../_generated/server";

export type NotificationEventPayload = {
  orgId: any;
  eventKey: string;
  tabKey: string;
  scopeKind: string;
  scopeId: string | null;
  title: string;
  content: string | null;
  actionUrl: string | null;
  imageUrl?: string | null;
  actionData: Record<string, string> | null;
  sourceUserId: any | null;
  expiresAt: number | null;
  createdAt: number;
  emailRecipients: Array<{ userId: any; email: string }>;
};

export type NotificationSink = {
  id: string;
  handle: (ctx: ActionCtx, payload: NotificationEventPayload) => Promise<void>;
};

export const NOTIFICATION_SINKS: NotificationSink[] = [];

export const registerNotificationSink = (sink: NotificationSink) => {
  NOTIFICATION_SINKS.push(sink);
};


