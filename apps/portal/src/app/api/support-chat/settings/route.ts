"use server";

import { NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import {
  defaultSupportChatSettings,
  supportChatSettingsOptionKey,
} from "launchthat-plugin-support/settings";

import { getConvex } from "~/lib/convex";

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
  const option = await convex.query(api.core.options.get, {
    metaKey: supportChatSettingsOptionKey,
    type: "store",
    orgId: organizationId as never,
  });

  const settings = {
    ...defaultSupportChatSettings,
    ...(option?.metaValue ?? {}),
  };

  return NextResponse.json({ settings });
}
