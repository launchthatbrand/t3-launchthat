/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { api as apiAny } from "@/convex/_generated/api.js";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";

import { env } from "~/env";
import {
  addClerkOrganizationMember,
  createClerkOrganization,
} from "~/lib/auth/clerkOrgAdapter";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { organizationId?: string };
  const organizationId =
    typeof body.organizationId === "string" ? body.organizationId.trim() : "";

  if (!organizationId) {
    return NextResponse.json(
      { error: "organizationId is required" },
      { status: 400 },
    );
  }

  const { userId: clerkUserId, getToken } = await auth();
  if (!clerkUserId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const token = await getToken({ template: "convex" });
  if (!token) {
    return NextResponse.json(
      { error: "Missing Convex auth token" },
      { status: 401 },
    );
  }

  const convex = new ConvexHttpClient(env.NEXT_PUBLIC_CONVEX_URL);
  convex.setAuth(token);

  // Read org (user must have access, since they just created it).
  const org: unknown = await convex.query(
    apiAny.core.organizations.queries.getById,
    {
      organizationId: organizationId as any,
    },
  );
  if (!org) {
    return NextResponse.json(
      { error: "Organization not found" },
      { status: 404 },
    );
  }

  // Idempotency: if mapping already exists, we're done.
  const orgRecord = typeof org === "object" ? (org as any) : null;
  const existingClerkOrgId =
    typeof orgRecord?.clerkOrganizationId === "string"
      ? orgRecord.clerkOrganizationId.trim()
      : "";
  if (existingClerkOrgId) {
    return NextResponse.json({
      ok: true,
      clerkOrganizationId: existingClerkOrgId,
      alreadyLinked: true,
    });
  }

  const name = typeof orgRecord?.name === "string" ? orgRecord.name : "";
  const slug = typeof orgRecord?.slug === "string" ? orgRecord.slug : "";
  if (!name || !slug) {
    return NextResponse.json(
      { error: "Organization missing name/slug" },
      { status: 400 },
    );
  }

  const { clerkOrganizationId } = await createClerkOrganization({ name, slug });
  await addClerkOrganizationMember({
    clerkOrganizationId,
    clerkUserId,
    role: "org:admin",
  });

  await convex.mutation(
    apiAny.core.organizations.mutations.setClerkOrganizationId,
    {
      organizationId: organizationId as any,
      clerkOrganizationId,
    },
  );

  return NextResponse.json({ ok: true, clerkOrganizationId });
}
