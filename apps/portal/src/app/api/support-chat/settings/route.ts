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
import { resolveSupportOrganizationId } from "~/lib/support/resolveOrganizationId";

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
  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get("organizationId");

  if (!organizationId) {
    return NextResponse.json(
      { error: "organizationId is required" },
      { status: 400 },
    );
  }

  const convex = getConvex();
  const resolvedOrganizationId = await resolveSupportOrganizationId(
    convex,
    organizationId,
  );
  if (!resolvedOrganizationId) {
    return NextResponse.json(
      { error: "organization not found" },
      { status: 404 },
    );
  }
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
}
