"use server";

import { NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import {
  defaultSupportChatSettings,
  supportContactCaptureFieldsKey,
  supportContactCaptureKey,
  supportIntroHeadlineKey,
  supportPrivacyMessageKey,
  supportWelcomeMessageKey,
} from "launchthat-plugin-support/settings";

import { getConvex } from "~/lib/convex";
import {
  requireSupportWidgetAuth,
  SupportWidgetAuthError,
} from "~/lib/support/widgetAuth";
import { checkIpRateLimit, getClientIp } from "~/lib/support/ipRateLimit";

const parseBooleanOption = (
  value: string | number | boolean | null | undefined,
  fallback: boolean,
) => {
  if (typeof value === "boolean") return value;
  if (value === 1) return true;
  if (value === 0) return false;
  if (typeof value === "string") {
    if (value === "1" || value.toLowerCase() === "true") return true;
    if (value === "0" || value.toLowerCase() === "false") return false;
  }
  return fallback;
};

const parseStringOption = (
  value: string | number | boolean | null | undefined,
  fallback: string,
) => (typeof value === "string" ? value : fallback);

const parseFieldsOption = (
  value: string | number | boolean | null | undefined,
  fallback: typeof defaultSupportChatSettings.fields,
) => {
  if (typeof value !== "string") return fallback;
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return fallback;
    const flags = { ...fallback };
    Object.keys(flags).forEach((key) => {
      flags[key as keyof typeof flags] = parsed.includes(key);
    });
    return flags;
  } catch {
    return fallback;
  }
};

export async function GET(request: Request) {
  try {
    const ip = getClientIp(request);
    const ipLimit = checkIpRateLimit({
      key: `support-chat:settings:ip:${ip}`,
      limit: 120,
      windowMs: 60_000,
    });
    if (!ipLimit.allowed) {
      console.warn(
        JSON.stringify({
          event: "support_chat_rate_limited",
          route: "settings",
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

    const { searchParams } = new URL(request.url);
    const organizationIdParam = searchParams.get("organizationId");
    const widgetKey = searchParams.get("widgetKey");

    const convex = getConvex();
    const { organizationId: resolvedOrganizationId } =
      await requireSupportWidgetAuth({
        req: request,
        convex,
        organizationIdParam,
        widgetKey,
      });

    const [
      requireContact,
      contactFields,
      introHeadline,
      welcomeMessage,
      privacyMessage,
    ] = await Promise.all([
      convex.query(api.plugins.support.options.getSupportOption, {
        organizationId: resolvedOrganizationId,
        key: supportContactCaptureKey,
      }),
      convex.query(api.plugins.support.options.getSupportOption, {
        organizationId: resolvedOrganizationId,
        key: supportContactCaptureFieldsKey,
      }),
      convex.query(api.plugins.support.options.getSupportOption, {
        organizationId: resolvedOrganizationId,
        key: supportIntroHeadlineKey,
      }),
      convex.query(api.plugins.support.options.getSupportOption, {
        organizationId: resolvedOrganizationId,
        key: supportWelcomeMessageKey,
      }),
      convex.query(api.plugins.support.options.getSupportOption, {
        organizationId: resolvedOrganizationId,
        key: supportPrivacyMessageKey,
      }),
    ]);

  const settings = {
    ...defaultSupportChatSettings,
    requireContact: parseBooleanOption(
      requireContact,
      defaultSupportChatSettings.requireContact,
    ),
    fields: parseFieldsOption(contactFields, defaultSupportChatSettings.fields),
    introHeadline: parseStringOption(
      introHeadline,
      defaultSupportChatSettings.introHeadline,
    ),
    welcomeMessage: parseStringOption(
      welcomeMessage,
      defaultSupportChatSettings.welcomeMessage,
    ),
    privacyMessage: parseStringOption(
      privacyMessage,
      defaultSupportChatSettings.privacyMessage,
    ),
  };

    return NextResponse.json({ settings });
  } catch (error) {
    if (error instanceof SupportWidgetAuthError) {
      const { searchParams } = new URL(request.url);
      console.warn(
        JSON.stringify({
          event: "support_chat_auth_failed",
          route: "settings",
          status: error.status,
          message: error.message,
          organizationIdParam: searchParams.get("organizationId"),
          origin: request.headers.get("origin"),
          host: request.headers.get("host"),
        }),
      );
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[support-chat][settings] failed", error);
    return NextResponse.json(
      { error: "Unable to load support settings" },
      { status: 500 },
    );
  }
}
