"use node";

import "./registerSinks";

import { v } from "convex/values";

import type { NotificationEventPayload } from "./registry";
import { components } from "../../../_generated/api";
import { internalAction } from "../../../_generated/server";
import { NOTIFICATION_SINKS } from "./registry";
import { notificationEventPayloadValidator } from "./types";

export const runSinks = internalAction({
  args: {
    payload: notificationEventPayloadValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const payload = args.payload as unknown as NotificationEventPayload;

    const sinkIds = NOTIFICATION_SINKS.map((s) => s.id);
    const sinkStatus: Record<
      string,
      {
        status: "scheduled" | "running" | "complete" | "failed";
        error?: string;
      }
    > = {};
    for (const sinkId of sinkIds) {
      sinkStatus[sinkId] = { status: "scheduled" };
    }

    for (const sink of NOTIFICATION_SINKS) {
      sinkStatus[sink.id] = { status: "running" };
      try {
        await sink.handle(ctx, payload);
        sinkStatus[sink.id] = { status: "complete" };
      } catch (error) {
        const errorString =
          error instanceof Error ? error.message : String(error);
        sinkStatus[sink.id] = { status: "failed", error: errorString };

        console.error("[notifications.delivery.runSinks] sink failed", {
          sinkId: sink.id,
          eventKey: payload.eventKey,
          error:
            error instanceof Error
              ? { message: error.message, stack: error.stack }
              : String(error),
        });
      }
    }

    // Mirror into unified logs (best-effort).
    try {
      const anyFailed = Object.values(sinkStatus).some(
        (s) => s.status === "failed",
      );
      const email =
        Array.isArray(payload.emailRecipients) &&
        payload.emailRecipients.length === 1 &&
        typeof payload.emailRecipients[0]?.email === "string"
          ? payload.emailRecipients[0].email.trim().toLowerCase()
          : undefined;

      const metadata: Record<string, unknown> = {
        notificationType:
          typeof payload.scopeKind === "string" &&
          payload.scopeKind.trim().toLowerCase() === "test"
            ? "test"
            : "automated",
        eventKey: payload.eventKey,
        tabKey: payload.tabKey,
        scopeKind: payload.scopeKind,
        scopeId: payload.scopeId,
        createdAt: payload.createdAt,
        sinkIds,
        sinkStatus,
        emailRecipientsCount: Array.isArray(payload.emailRecipients)
          ? payload.emailRecipients.length
          : 0,
      };

      // Avoid TS “mutations does not exist” flakiness across generated types.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const componentsAny: any = components;
      await ctx.runMutation(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        componentsAny.launchthat_logs.entries.mutations.insertLogEntry,
        {
          organizationId: String(payload.orgId),
          pluginKey: "notifications",
          kind: "notification.delivery",
          email,
          level: anyFailed ? "error" : "info",
          status: anyFailed ? "failed" : "complete",
          message: payload.title,
          actionUrl: payload.actionUrl ?? undefined,
          scopeKind: payload.scopeKind,
          scopeId:
            typeof payload.scopeId === "string" && payload.scopeId.trim()
              ? payload.scopeId
              : undefined,
          metadata,
          createdAt: Date.now(),
        },
      );
    } catch (error) {
      console.error(
        "[notifications.delivery.runSinks] log mirror failed:",
        error,
      );
    }

    return null;
  },
});
