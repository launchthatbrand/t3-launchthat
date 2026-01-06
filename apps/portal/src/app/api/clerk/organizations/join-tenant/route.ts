/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { ConvexHttpClient } from "convex/browser";
import { auth } from "@clerk/nextjs/server";

import { api as apiAny } from "@/convex/_generated/api.js";
import { env } from "~/env";
import { addClerkOrganizationMember } from "~/lib/auth/clerkOrgAdapter";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const tenantSlug = (req.headers.get("x-tenant-slug") ?? "").trim();
  if (!tenantSlug) {
    return NextResponse.json(
      { error: "Missing tenant context" },
      { status: 400 },
    );
  }

  // Public query: resolve tenant org by slug to find its Clerk org mapping.
  const convex = new ConvexHttpClient(env.NEXT_PUBLIC_CONVEX_URL);
  const org: unknown = await convex.query(apiAny.core.organizations.queries.getBySlug, {
    slug: tenantSlug,
  });

  const orgRecord = org && typeof org === "object" ? (org as any) : null;
  const clerkOrganizationId =
    typeof orgRecord?.clerkOrganizationId === "string"
      ? orgRecord.clerkOrganizationId.trim()
      : "";

  if (!clerkOrganizationId) {
    return NextResponse.json(
      { error: "Tenant is not linked to a Clerk organization yet." },
      { status: 409 },
    );
  }

  await addClerkOrganizationMember({
    clerkOrganizationId,
    clerkUserId,
    role: "org:member",
  });

  return NextResponse.json({ ok: true, clerkOrganizationId });
}


