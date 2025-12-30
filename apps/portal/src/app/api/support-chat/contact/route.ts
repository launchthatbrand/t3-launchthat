"use server";

import { NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { z } from "zod";

import { getConvex } from "~/lib/convex";
import { checkIpRateLimit, getClientIp } from "~/lib/support/ipRateLimit";
import {
  requireSupportWidgetAuth,
  SupportWidgetAuthError,
} from "~/lib/support/widgetAuth";

const contactSchema = z.object({
  organizationId: z.string(),
  widgetKey: z.string(),
  threadId: z.string().optional(),
  sessionId: z.string().optional(),
  email: z.string().email().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  fullName: z.string().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const ipLimit = checkIpRateLimit({
      key: `support-chat:contact:ip:${ip}`,
      limit: 60,
      windowMs: 60_000,
    });
    if (!ipLimit.allowed) {
      console.warn(
        JSON.stringify({
          event: "support_chat_rate_limited",
          route: "contact",
          scope: "ip",
          ip,
          retryAfterMs: ipLimit.retryAfterMs,
        }),
      );
      return NextResponse.json(
        { error: "Rate limited" },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(ipLimit.retryAfterMs / 1000)),
          },
        },
      );
    }

    const payload = contactSchema.parse(await request.json());
    const convex = getConvex();
    const { organizationId: resolvedOrgId } = await requireSupportWidgetAuth({
      req: request,
      convex,
      organizationIdParam: payload.organizationId,
      widgetKey: payload.widgetKey,
    });
    const contactId = await convex.mutation(
      api.core.crm.contacts.mutations.upsert,
      {
        organizationId: resolvedOrgId,
        email: payload.email,
        phone: payload.phone,
        firstName: payload.firstName,
        lastName: payload.lastName,
        fullName: payload.fullName,
        company: payload.company,
      },
    );

    return NextResponse.json({
      contactId,
      contact: {
        contactId,
        fullName:
          payload.fullName ??
          [payload.firstName, payload.lastName]
            .filter(Boolean)
            .join(" ")
            .trim(),
        email: payload.email,
      },
    });
  } catch (error) {
    if (error instanceof SupportWidgetAuthError) {
      console.warn(
        JSON.stringify({
          event: "support_chat_auth_failed",
          route: "contact",
          status: error.status,
          message: error.message,
          origin: request.headers.get("origin"),
          host: request.headers.get("host"),
        }),
      );
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error("[support-chat][contact] failed", error);
    return NextResponse.json(
      { error: "Unable to capture contact" },
      { status: 400 },
    );
  }
}
