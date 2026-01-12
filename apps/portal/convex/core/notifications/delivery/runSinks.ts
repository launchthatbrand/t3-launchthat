"use node";

import { internalAction } from "../../../_generated/server";
import { v } from "convex/values";

import type { NotificationEventPayload } from "./registry";
import { NOTIFICATION_SINKS } from "./registry";
import "./registerSinks";
import { notificationEventPayloadValidator } from "./types";

export const runSinks = internalAction({
  args: {
    payload: notificationEventPayloadValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const payload = args.payload as unknown as NotificationEventPayload;

    for (const sink of NOTIFICATION_SINKS) {
      try {
        await sink.handle(ctx, payload);
      } catch (error) {
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

    return null;
  },
});


