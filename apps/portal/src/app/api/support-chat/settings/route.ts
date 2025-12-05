"use server";

import {
  defaultSupportChatSettings,
  supportChatSettingsOptionKey,
} from "launchthat-plugin-support/settings";

import { NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { getConvex } from "~/lib/convex";
import { resolveSupportOrganizationId } from "~/lib/support/resolveOrganizationId";

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
  const option = await convex.query(api.core.options.get, {
    metaKey: supportChatSettingsOptionKey,
    type: "store",
    orgId: resolvedOrganizationId as never,
  });

  const settings = {
    ...defaultSupportChatSettings,
    ...(option?.metaValue ?? {}),
  };

  return NextResponse.json({ settings });
}
