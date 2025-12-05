"use server";

import {
  defaultSupportChatSettings,
  supportChatSettingsOptionKey,
} from "launchthat-plugin-support/settings";

import type { Id } from "@/convex/_generated/dataModel";
import { NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
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
  const resolvedOrganizationId = await resolveOrganizationId(
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

async function resolveOrganizationId(
  convex: ReturnType<typeof getConvex>,
  candidate: string,
) {
  if (!candidate) {
    return null;
  }
  const looksLikeId = !candidate.includes(" ");
  if (looksLikeId && candidate.length >= 24 && !candidate.includes("/")) {
    return candidate as Id<"organizations">;
  }
  const organization = await convex.query(
    api.core.organizations.queries.getBySlug,
    {
      slug: candidate,
    },
  );
  return organization?._id ?? null;
}
