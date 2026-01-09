import { createHash } from "crypto";
import type { FunctionReference } from "convex/server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClerkClient } from "@clerk/backend";
import { ConvexHttpClient } from "convex/browser";

import { env } from "~/env";
import {
  addClerkOrganizationMember,
  createClerkOrganization,
} from "~/lib/auth/clerkOrgAdapter";
import { mapPortalRoleToClerkOrgRole } from "~/lib/auth/roleMapping";
import { getAuthHostForHost, getProtoForHostFromHeaders } from "~/lib/host";

export const runtime = "nodejs";

interface AdminUpsertAndAssignBody {
  email?: unknown;
  name?: unknown;
  role?: unknown;
  username?: unknown;
  isActive?: unknown;
}

interface ClerkErrorLike {
  status?: number;
  clerkTraceId?: string;
  errors?: {
    code?: string;
    message?: string;
    longMessage?: string;
    meta?: unknown;
  }[];
}

const formatClerkErrorForResponse = (err: unknown) => {
  const e = err && typeof err === "object" ? (err as ClerkErrorLike) : null;
  const errors = Array.isArray(e?.errors) ? e.errors : [];
  return {
    status: typeof e?.status === "number" ? e.status : undefined,
    clerkTraceId:
      typeof e?.clerkTraceId === "string" ? e.clerkTraceId : undefined,
    errors: errors.map((row) => ({
      code: typeof row.code === "string" ? row.code : undefined,
      message: typeof row.message === "string" ? row.message : undefined,
      longMessage:
        typeof row.longMessage === "string" ? row.longMessage : undefined,
      meta: row.meta,
    })),
  };
};

const SESSION_COOKIE_NAME = "tenant_session";

const asString = (v: unknown) => (typeof v === "string" ? v : "").trim();
const asBooleanOrNull = (v: unknown): boolean | null =>
  typeof v === "boolean" ? v : null;

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const sha256Base64Url = (value: string): string => {
  const hash = createHash("sha256").update(value, "utf8").digest("base64");
  return hash.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

const splitName = (name: string): { firstName?: string; lastName?: string } => {
  const trimmed = name.trim();
  if (!trimmed) return {};
  const parts = trimmed.split(/\s+/);
  if (parts.length <= 1) return { firstName: trimmed };
  const firstName = parts[0] ?? "";
  const lastName = parts.slice(1).join(" ").trim();
  return { firstName: firstName || undefined, lastName: lastName || undefined };
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

  const body = (await req
    .json()
    .catch(() => null)) as AdminUpsertAndAssignBody | null;
  const email = normalizeEmail(asString(body?.email));
  const name = asString(body?.name);
  const role = asString(body?.role);
  const username = asString(body?.username);
  const isActive = asBooleanOrNull(body?.isActive);

  if (!email) {
    return NextResponse.json({ error: "Missing email" }, { status: 400 });
  }

  const convex = new ConvexHttpClient(env.NEXT_PUBLIC_CONVEX_URL);
  const convexAny = convex as unknown as {
    query: (fn: unknown, args: unknown) => Promise<unknown>;
    mutation: (fn: unknown, args: unknown) => Promise<unknown>;
    action: (fn: unknown, args: unknown) => Promise<unknown>;
  };

  // Avoid TS “type instantiation is excessively deep” and avoid relying on generated TS types
  // for newly-added functions by resolving FunctionReferences dynamically.
  const apiModule = (await import("@/convex/_generated/api.js")) as unknown as {
    api: unknown;
  };
  const apiRoot = apiModule.api as Record<string, unknown>;
  const core = (apiRoot.core ?? {}) as Record<string, unknown>;
  const organizations = (core.organizations ?? {}) as Record<string, unknown>;
  const orgQueries = (organizations.queries ?? {}) as Record<string, unknown>;
  const orgMutations = (organizations.mutations ?? {}) as Record<
    string,
    unknown
  >;
  const users = (core.users ?? {}) as Record<string, unknown>;
  const userMutations = (users.mutations ?? {}) as Record<string, unknown>;
  const emails = (core.emails ?? {}) as Record<string, unknown>;
  const reactEmailRender = (emails.reactEmailRender ?? {}) as Record<string, unknown>;

  const getOrgRef =
    orgQueries.getOrganizationForAdminFromTenantSession as FunctionReference<"query">;
  const setOrgClerkIdRef =
    orgMutations.setClerkOrganizationIdFromTenantSession as FunctionReference<"mutation">;
  const upsertUserRef =
    userMutations.upsertUserFromClerkAdminViaTenantSession as FunctionReference<"mutation">;
  const sendEmailRef =
    reactEmailRender.sendTransactionalEmailFromTenantSession as FunctionReference<"action">;

  // Ensure the caller is authorized (validated inside Convex using the tenant session),
  // and load org details + existing Clerk org mapping.
  const orgInfo: unknown = await convexAny.query(getOrgRef, {
    organizationId: tenantId,
    sessionIdHash,
  });
  const org =
    orgInfo && typeof orgInfo === "object"
      ? (orgInfo as {
          name?: unknown;
          slug?: unknown;
          clerkOrganizationId?: unknown;
        })
      : null;
  const orgName = typeof org?.name === "string" ? org.name : "";
  const orgSlug = typeof org?.slug === "string" ? org.slug : "";
  let clerkOrganizationId =
    typeof org?.clerkOrganizationId === "string"
      ? org.clerkOrganizationId.trim()
      : "";

  if (!orgName || !orgSlug) {
    return NextResponse.json(
      { error: "Unable to resolve organization" },
      { status: 400 },
    );
  }

  // Create the Clerk org mapping if it doesn't exist yet.
  if (!clerkOrganizationId) {
    const created = await createClerkOrganization({
      name: orgName,
      slug: orgSlug,
    });
    clerkOrganizationId = created.clerkOrganizationId;
    await convexAny.mutation(setOrgClerkIdRef, {
      organizationId: tenantId,
      sessionIdHash,
      clerkOrganizationId,
    });
  }

  // Find-or-create Clerk user by email.
  const clerk = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });
  const usersRes = await clerk.users.getUserList({ emailAddress: [email] });
  const existing =
    Array.isArray(usersRes.data) && usersRes.data.length > 0
      ? usersRes.data[0]
      : null;

  const { firstName, lastName } = splitName(name);
  let clerkUser = existing;
  if (!clerkUser) {
    try {
      clerkUser = await clerk.users.createUser({
        emailAddress: [email],
        firstName,
        lastName,
        publicMetadata: role ? { role } : undefined,
        // Do not require a password; sign-in happens via magic link/OTP.
        skipPasswordRequirement: true,
      });
    } catch (err: unknown) {
      const formatted = formatClerkErrorForResponse(err);
      // If Clerk rejected creation due to a race (email already exists), re-check by email.
      if (formatted.status === 422) {
        const retry = await clerk.users.getUserList({ emailAddress: [email] });
        const retryUser =
          Array.isArray(retry.data) && retry.data.length > 0
            ? retry.data[0]
            : null;
        if (retryUser) {
          clerkUser = retryUser;
        } else {
          return NextResponse.json(
            {
              error: "Clerk rejected user creation",
              code: "clerk_create_user_failed",
              ...formatted,
            },
            { status: 422 },
          );
        }
      } else {
        return NextResponse.json(
          {
            error: "Clerk rejected user creation",
            code: "clerk_create_user_failed",
            ...formatted,
          },
          { status: formatted.status ?? 500 },
        );
      }
    }
  }

  const clerkUserId = clerkUser.id;

  // Keep metadata reasonably in sync for existing users too.
  if (existing && role) {
    const existingPublicMetadata = existing.publicMetadata as Record<
      string,
      unknown
    >;
    await clerk.users.updateUser(clerkUserId, {
      firstName,
      lastName,
      publicMetadata: { ...existingPublicMetadata, role },
    });
  }

  // Add membership in the tenant's Clerk org (idempotent).
  await addClerkOrganizationMember({
    clerkOrganizationId,
    clerkUserId,
    role: mapPortalRoleToClerkOrgRole(role || undefined),
  });

  // Mirror to Convex: upsert core user + membership (validated inside Convex using tenant session).
  const emailVerified = Boolean(
    Array.isArray(clerkUser.emailAddresses) &&
      clerkUser.emailAddresses.some(
        (e) =>
          e.emailAddress === email && e.verification?.status === "verified",
      ),
  );

  const result: unknown = await convexAny.mutation(upsertUserRef, {
    organizationId: tenantId,
    sessionIdHash,
    clerkUserId,
    email,
    name: name || undefined,
    username: username || undefined,
    role: role || undefined,
    isActive: isActive ?? undefined,
    isEmailVerified: emailVerified,
  });

  // Send the user a sign-in link (Clerk sign-in token) so they can log in immediately.
  try {
    const signInToken = await clerk.signInTokens.createSignInToken({
      userId: clerkUserId,
      expiresInSeconds: 60 * 60 * 24 * 7, // 7 days
    });

    if (signInToken.token) {
      const requestHost = (req.headers.get("host") ?? "").trim();
      const authHost = getAuthHostForHost(
        requestHost,
        env.NEXT_PUBLIC_ROOT_DOMAIN,
      );
      const proto = getProtoForHostFromHeaders(authHost, req.headers);
      const tenantProto = getProtoForHostFromHeaders(requestHost, req.headers);
      const returnTo = `${tenantProto}://${requestHost}/`;

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

      await convexAny.action(sendEmailRef, {
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
    }
  } catch (err) {
    // Best-effort: user creation succeeded even if email sending fails.
    console.warn("[admin-upsert-and-assign] invite_email_failed", err);
  }

  return NextResponse.json({
    ok: true,
    clerkUserId,
    clerkOrganizationId,
    result,
  });
}
