import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";

import { getConvex } from "~/lib/convex";
import { resolveSupportOrganizationId } from "~/lib/support/resolveOrganizationId";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const organizationIdParam = searchParams.get("organizationId");
    const contactId = searchParams.get("contactId") ?? undefined;
    const contactEmail = searchParams.get("contactEmail") ?? undefined;
    const contactName = searchParams.get("contactName") ?? undefined;

    if (!organizationIdParam) {
      return NextResponse.json(
        { error: "organizationId is required" },
        { status: 400 },
      );
    }

    const convex = getConvex();
    const organizationId = await resolveSupportOrganizationId(
      convex,
      organizationIdParam,
    );
    if (!organizationId) {
      return NextResponse.json(
        { error: "organization not found" },
        { status: 404 },
      );
    }

    const result = await convex.mutation(
      api.plugins.support.mutations.createThread,
      {
        organizationId,
        contactId,
        contactEmail,
        contactName,
        mode: undefined,
      },
    );

    return NextResponse.json({ threadId: result.threadId });
  } catch (error) {
    console.error("[support-chat] thread error", error);
    return NextResponse.json(
      { error: "Unable to create a support thread." },
      { status: 500 },
    );
  }
}
