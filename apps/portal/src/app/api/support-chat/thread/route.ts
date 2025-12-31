import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";

import { getConvex } from "~/lib/convex";
import {
  requireSupportWidgetAuth,
  SupportWidgetAuthError,
} from "~/lib/support/widgetAuth";
import { checkIpRateLimit, getClientIp } from "~/lib/support/ipRateLimit";

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const ipLimit = checkIpRateLimit({
      key: `support-chat:thread:ip:${ip}`,
      limit: 30,
      windowMs: 60_000,
    });
    if (!ipLimit.allowed) {
      console.warn(
        JSON.stringify({
          event: "support_chat_rate_limited",
          route: "thread",
          scope: "ip",
          ip,
          retryAfterMs: ipLimit.retryAfterMs,
        }),
      );
      return NextResponse.json(
        { error: "Rate limited" },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil(ipLimit.retryAfterMs / 1000)) },
        },
      );
    }

    const { searchParams } = new URL(req.url);
    const organizationIdParam = searchParams.get("organizationId");
    const widgetKey = searchParams.get("widgetKey");
    const clientSessionId = searchParams.get("clientSessionId") ?? undefined;
    const contactId = searchParams.get("contactId") ?? undefined;
    const contactEmail = searchParams.get("contactEmail") ?? undefined;
    const contactName = searchParams.get("contactName") ?? undefined;

    const convex = getConvex();
    const { organizationId } = await requireSupportWidgetAuth({
      req,
      convex,
      organizationIdParam,
      widgetKey,
    });

    if (clientSessionId) {
      const sessionLimit = checkIpRateLimit({
        key: `support-chat:thread:session:${organizationId}:${clientSessionId}`,
        limit: 10,
        windowMs: 60_000,
      });
      if (!sessionLimit.allowed) {
        console.warn(
          JSON.stringify({
            event: "support_chat_rate_limited",
            route: "thread",
            scope: "clientSessionId",
            organizationId,
            clientSessionId,
            retryAfterMs: sessionLimit.retryAfterMs,
          }),
        );
      return NextResponse.json(
          { error: "Rate limited" },
          {
            status: 429,
            headers: {
              "Retry-After": String(Math.ceil(sessionLimit.retryAfterMs / 1000)),
            },
          },
      );
      }
    }

    const result = await convex.mutation(
      (api as any).plugins.support.mutations.createThread,
      {
        organizationId,
        clientSessionId,
        contactId,
        contactEmail,
        contactName,
        mode: undefined,
      },
    );

    return NextResponse.json({ threadId: result.threadId });
  } catch (error) {
    if (error instanceof SupportWidgetAuthError) {
      const { searchParams } = new URL(req.url);
      console.warn(
        JSON.stringify({
          event: "support_chat_auth_failed",
          route: "thread",
          status: error.status,
          message: error.message,
          organizationIdParam: searchParams.get("organizationId"),
          origin: req.headers.get("origin"),
          host: req.headers.get("host"),
        }),
      );
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[support-chat] thread error", error);
    return NextResponse.json(
      { error: "Unable to create a support thread." },
      { status: 500 },
    );
  }
}


