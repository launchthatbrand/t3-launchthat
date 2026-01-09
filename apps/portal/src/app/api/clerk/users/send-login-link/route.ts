import { createHash } from "crypto";
import type { FunctionReference } from "convex/server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClerkClient } from "@clerk/backend";
import { ConvexHttpClient } from "convex/browser";

import { env } from "~/env";
import { getAuthHostForHost, getProtoForHostFromHeaders } from "~/lib/host";

export const runtime = "nodejs";

interface SendLoginLinkBody {
  email?: unknown;
  name?: unknown;
  // Optional override for where the user should land after auth completes.
  returnTo?: unknown;
}

const SESSION_COOKIE_NAME = "tenant_session";
const asString = (v: unknown) => (typeof v === "string" ? v : "").trim();
const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const sha256Base64Url = (value: string): string => {
  const hash = createHash("sha256").update(value, "utf8").digest("base64");
  return hash.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

export async function POST(req: NextRequest) {
  const tenantId = (req.headers.get("x-tenant-id") ?? "").trim();
  if (!tenantId) {
    return NextResponse.json(
      { error: "Missing tenant context" },
      { status: 400 },
    );
  }

  const sessionId = (req.cookies.get(SESSION_COOKIE_NAME)?.value ?? "").trim();
  if (!sessionId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const sessionIdHash = sha256Base64Url(sessionId);

  const body = (await req.json().catch(() => null)) as SendLoginLinkBody | null;
  const email = normalizeEmail(asString(body?.email));
  const name = asString(body?.name);
  const returnToRaw = asString(body?.returnTo);

  if (!email) {
    return NextResponse.json({ error: "Missing email" }, { status: 400 });
  }

  const convex = new ConvexHttpClient(env.NEXT_PUBLIC_CONVEX_URL);
  const convexAny = convex as unknown as {
    query: (fn: unknown, args: unknown) => Promise<unknown>;
    action: (fn: unknown, args: unknown) => Promise<unknown>;
  };

  const apiModule = (await import("@/convex/_generated/api.js")) as unknown as {
    api: unknown;
  };
  const apiRoot = apiModule.api as Record<string, unknown>;
  const core = (apiRoot.core ?? {}) as Record<string, unknown>;
  const organizations = (core.organizations ?? {}) as Record<string, unknown>;
  const orgQueries = (organizations.queries ?? {}) as Record<string, unknown>;
  const emails = (core.emails ?? {}) as Record<string, unknown>;
  const reactEmailRender = (emails.reactEmailRender ?? {}) as Record<string, unknown>;

  const getOrgRef =
    orgQueries.getOrganizationForAdminFromTenantSession as FunctionReference<"query">;
  const sendEmailRef =
    reactEmailRender.sendTransactionalEmailFromTenantSession as FunctionReference<"action">;

  const orgInfo: unknown = await convexAny.query(getOrgRef, {
    organizationId: tenantId,
    sessionIdHash,
  });

  const org =
    orgInfo && typeof orgInfo === "object"
      ? (orgInfo as { name?: unknown; slug?: unknown })
      : null;
  const orgName = typeof org?.name === "string" ? org.name : "";
  const orgSlug = typeof org?.slug === "string" ? org.slug : "";
  if (!orgName || !orgSlug) {
    return NextResponse.json(
      { error: "Unable to resolve organization" },
      { status: 400 },
    );
  }

  const clerk = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });
  const usersRes = await clerk.users.getUserList({ emailAddress: [email] });
  const clerkUser =
    Array.isArray(usersRes.data) && usersRes.data.length > 0
      ? (usersRes.data[0] ?? null)
      : null;

  if (!clerkUser) {
    return NextResponse.json(
      { error: "User not found in Clerk" },
      { status: 404 },
    );
  }

  const signInToken = await clerk.signInTokens.createSignInToken({
    userId: clerkUser.id,
    expiresInSeconds: 60 * 60 * 24 * 7, // 7 days
  });

  if (!signInToken.token) {
    return NextResponse.json(
      { error: "Failed to create sign-in token" },
      { status: 500 },
    );
  }

  const requestHost = (req.headers.get("host") ?? "").trim();
  const authHost = getAuthHostForHost(requestHost, env.NEXT_PUBLIC_ROOT_DOMAIN);
  const proto = getProtoForHostFromHeaders(authHost, req.headers);

  const tenantProto = getProtoForHostFromHeaders(requestHost, req.headers);
  const returnTo =
    returnToRaw && returnToRaw.length > 0
      ? returnToRaw
      : `${tenantProto}://${requestHost}/`;

  const signInTokenUrl = new URL(`${proto}://${authHost}/sign-in-token`);
  signInTokenUrl.searchParams.set("session", signInToken.token);
  signInTokenUrl.searchParams.set("return_to", returnTo);
  signInTokenUrl.searchParams.set("tenant", orgSlug);

  const inviteeName =
    name ||
    [clerkUser.firstName, clerkUser.lastName]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    email;

  const outboxId: unknown = await convexAny.action(sendEmailRef, {
    organizationId: tenantId,
    sessionIdHash,
    to: email,
    templateKey: "core.userInvite",
    variables: {
      appName: orgName,
      inviteeName,
      inviteUrl: signInTokenUrl.toString(),
    },
  });

  return NextResponse.json({
    ok: true,
    outboxId,
  });
}
