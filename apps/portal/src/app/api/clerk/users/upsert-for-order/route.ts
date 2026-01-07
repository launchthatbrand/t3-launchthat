import type { FunctionReference } from "convex/server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { addClerkOrganizationMember } from "@/src/lib/auth/clerkOrgAdapter";
import { createClerkClient } from "@clerk/backend";
import { ConvexHttpClient } from "convex/browser";

import { env } from "~/env";

export const runtime = "nodejs";

interface UpsertForOrderBody {
  organizationId?: string;
  orderId?: string;
  checkoutToken?: string;
}

const asString = (v: unknown) => (typeof v === "string" ? v : "").trim();

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const normalizePhoneLoose = (phone: string): string => {
  // Normalize common formatting, but do NOT guess country codes.
  // Clerk typically stores phones as E.164, so callers should prefer providing E.164.
  return phone
    .trim()
    .replace(/[()\-\s]/g, "")
    .replace(/^00/, "+");
};

const buildPhoneCandidates = (rawPhone: string): string[] => {
  const cleaned = normalizePhoneLoose(rawPhone);
  const candidates: string[] = [];
  if (cleaned) candidates.push(cleaned);
  const digitsOnly = cleaned.replace(/[^0-9]/g, "");

  // If user entered digits that look like a country-code-prefixed number, also try adding "+".
  if (cleaned && !cleaned.startsWith("+") && /^[0-9]{11,15}$/.test(cleaned)) {
    candidates.push(`+${cleaned}`);
  }

  // Common case: US numbers entered without +1 (10 digits). Clerk may normalize these to +1...
  // We can't know the tenant's default country here, but trying +1 is safe (it just won't match if wrong).
  if (digitsOnly.length === 10) {
    candidates.push(`+1${digitsOnly}`);
  }
  // Also handle 11 digits starting with 1 as US country code.
  if (digitsOnly.length === 11 && digitsOnly.startsWith("1")) {
    candidates.push(`+${digitsOnly}`);
  }

  // If they entered a "+" number but with separators, ensure we also try strict E.164 form.
  if (rawPhone.trim().startsWith("+") && digitsOnly) {
    candidates.push(`+${digitsOnly}`);
  }
  // Dedupe while preserving order.
  return Array.from(new Set(candidates));
};

const getPrimaryEmailForUser = (user: {
  primaryEmailAddressId: string | null;
  emailAddresses: { id: string; emailAddress: string }[];
}): string => {
  const primary =
    user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId) ??
    user.emailAddresses[0] ??
    null;
  return primary ? primary.emailAddress : "";
};

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

const formatClerkErrorForLogs = (err: unknown) => {
  const e = err && typeof err === "object" ? (err as ClerkErrorLike) : null;
  const errors = Array.isArray(e?.errors) ? e.errors : [];
  return {
    status: typeof e?.status === "number" ? e.status : undefined,
    clerkTraceId: typeof e?.clerkTraceId === "string" ? e.clerkTraceId : undefined,
    errors: errors.map((row) => ({
      code: typeof row.code === "string" ? row.code : undefined,
      message: typeof row.message === "string" ? row.message : undefined,
      longMessage:
        typeof row.longMessage === "string" ? row.longMessage : undefined,
      meta: row.meta,
    })),
  };
};

function readMetaValue(
  meta: { key: string; value: unknown }[],
  key: string,
): unknown {
  return meta.find((m) => m.key === key)?.value;
}

function asMetaEntries(value: unknown): { key: string; value: unknown }[] {
  if (!Array.isArray(value)) return [];
  const out: { key: string; value: unknown }[] = [];
  for (const row of value) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    if (typeof r.key !== "string") continue;
    out.push({ key: r.key, value: r.value });
  }
  return out;
}

function asOrder(
  value: unknown,
): { meta: { key: string; value: unknown }[]; email?: string } | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const meta = asMetaEntries(v.meta);
  const email = typeof v.email === "string" ? v.email : undefined;
  return { meta, email };
}

export async function POST(req: NextRequest) {
  const body = (await req
    .json()
    .catch(() => null)) as UpsertForOrderBody | null;
  const organizationId = asString(body?.organizationId);
  const orderId = asString(body?.orderId);
  const checkoutToken = asString(body?.checkoutToken);

  if (!organizationId || !orderId || !checkoutToken) {
    console.info("[upsert-for-order]", {
      ok: false,
      code: "bad_request",
      organizationIdPresent: Boolean(organizationId),
      orderIdPresent: Boolean(orderId),
      checkoutTokenPresent: Boolean(checkoutToken),
    });
    return NextResponse.json(
      {
        error: "Missing organizationId, orderId, or checkoutToken",
        code: "bad_request",
      },
      { status: 400 },
    );
  }

  // Load the order from Convex (public query), and validate the checkout token.
  const convex = new ConvexHttpClient(env.NEXT_PUBLIC_CONVEX_URL);
  // Avoid TS "type instantiation is excessively deep" by erasing the specific function ref type here.
  const apiModule = (await import("@/convex/_generated/api.js")) as unknown as {
    api: unknown;
  };
  const apiRoot = apiModule.api as Record<string, unknown>;
  const plugins = (apiRoot.plugins ?? {}) as Record<string, unknown>;
  const commerce = (plugins.commerce ?? {}) as Record<string, unknown>;
  const orders = (commerce.orders ?? {}) as Record<string, unknown>;
  const queries = (orders.queries ?? {}) as Record<string, unknown>;
  const getOrderRef = queries.getOrder as FunctionReference<"query">;
  const checkout = (commerce.checkout ?? {}) as Record<string, unknown>;
  const checkoutMutations = (checkout.mutations ?? {}) as Record<
    string,
    unknown
  >;
  const attachOrderToClerkUserRef =
    checkoutMutations.attachOrderToClerkUser as FunctionReference<"mutation">;
  const orderRaw: unknown = await convex.query(getOrderRef, {
    orderId,
    organizationId,
  });
  const order = asOrder(orderRaw);
  if (!order) {
    console.info("[upsert-for-order]", {
      ok: false,
      code: "order_not_found",
      organizationId,
      orderId,
    });
    return NextResponse.json(
      { error: "Order not found", code: "order_not_found" },
      { status: 404 },
    );
  }

  const meta = order.meta;
  const tokenInOrder = readMetaValue(meta, "order.checkoutToken");
  if (
    typeof tokenInOrder !== "string" ||
    tokenInOrder.trim() !== checkoutToken
  ) {
    console.info("[upsert-for-order]", {
      ok: false,
      code: "invalid_checkout_token",
      organizationId,
      orderId,
    });
    return NextResponse.json(
      {
        error: "Invalid checkout token",
        code: "invalid_checkout_token",
      },
      { status: 403 },
    );
  }

  const emailRaw =
    asString(readMetaValue(meta, "order.customerEmail")) ||
    asString(readMetaValue(meta, "billing.email")) ||
    asString(order.email);
  const phoneRaw =
    asString(readMetaValue(meta, "order.customerPhone")) ||
    asString(readMetaValue(meta, "billing.phone")) ||
    asString(readMetaValue(meta, "shipping.phone"));

  const email = normalizeEmail(emailRaw);
  const phoneCandidates = buildPhoneCandidates(phoneRaw);
  const phoneForCreate =
    phoneCandidates.find((p) => p.startsWith("+")) ??
    phoneCandidates[0] ??
    "";

  if (!email) {
    console.info("[upsert-for-order]", {
      ok: false,
      code: "missing_email",
      organizationId,
      orderId,
    });
    return NextResponse.json(
      { error: "Order missing email", code: "missing_email" },
      { status: 400 },
    );
  }

  const clerk = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });

  // Resolve user by email, else by phone, else create.
  let clerkUserId = "";
  let resolvedBy: "email" | "phone" | "create" = "email";
  let resolvedUser:
    | {
        id: string;
        primaryEmailAddressId: string | null;
        emailAddresses: { id: string; emailAddress: string }[];
      }
    | null = null;
  let emailForCore = email;

  const lookupByPhone = async (): Promise<typeof resolvedUser> => {
    for (const candidate of phoneCandidates) {
      const res = await clerk.users.getUserList({ phoneNumber: [candidate] });
      const u =
        Array.isArray(res.data) && res.data.length > 0 ? (res.data[0] ?? null) : null;
      if (u) return u as typeof resolvedUser;
    }
    return null;
  };
  try {
    const existing = await clerk.users.getUserList({ emailAddress: [email] });
    const existingUser =
      Array.isArray(existing.data) && existing.data.length > 0
        ? (existing.data[0] ?? null)
        : null;
    if (existingUser) {
      clerkUserId = existingUser.id;
      resolvedBy = "email";
      resolvedUser = existingUser as typeof resolvedUser;
      emailForCore = email;
    } else {
      const phoneUser = phoneCandidates.length > 0 ? await lookupByPhone() : null;
      if (phoneUser) {
        clerkUserId = phoneUser.id;
        resolvedBy = "phone";
        resolvedUser = phoneUser;
        // IMPORTANT: do NOT overwrite the user's canonical email with the buyer-entered email.
        // We'll store the buyer email on the order as `order.secondaryEmailCandidate` and only
        // attach it after OTP/email-link verification.
        const primaryEmail = getPrimaryEmailForUser(phoneUser);
        emailForCore = primaryEmail ? normalizeEmail(primaryEmail) : email;
      } else {
        try {
          const created = await clerk.users.createUser({
            emailAddress: [email],
            ...(phoneForCreate ? { phoneNumber: [phoneForCreate] } : {}),
            // Do not require a password; sign-in happens on the confirmation screen.
            skipPasswordRequirement: true,
          });
          clerkUserId = created.id;
          resolvedBy = "create";
          resolvedUser = created as typeof resolvedUser;
          emailForCore = email;
        } catch (errCreate: unknown) {
          // If Clerk rejected creation because the phone/email already exists (422),
          // fall back to lookup by phone/email again rather than failing checkout.
          const status =
            errCreate && typeof errCreate === "object"
              ? (errCreate as { status?: unknown }).status
              : undefined;
          if (status === 422) {
            const fallbackPhoneUser =
              phoneCandidates.length > 0 ? await lookupByPhone() : null;
            if (fallbackPhoneUser) {
              clerkUserId = fallbackPhoneUser.id;
              resolvedBy = "phone";
              resolvedUser = fallbackPhoneUser;
              const primaryEmail = getPrimaryEmailForUser(fallbackPhoneUser);
              emailForCore = primaryEmail ? normalizeEmail(primaryEmail) : email;
            } else {
              // Might be email conflict (case normalization etc). Try email again.
              const fallbackByEmail = await clerk.users.getUserList({
                emailAddress: [email],
              });
              const fallbackEmailUser =
                Array.isArray(fallbackByEmail.data) && fallbackByEmail.data.length > 0
                  ? (fallbackByEmail.data[0] ?? null)
                  : null;
              if (fallbackEmailUser) {
                clerkUserId = fallbackEmailUser.id;
                resolvedBy = "email";
                resolvedUser = fallbackEmailUser as typeof resolvedUser;
                emailForCore = email;
              } else {
                throw errCreate;
              }
            }
          } else {
            throw errCreate;
          }
        }
      }
    }
  } catch (err: unknown) {
    const details = formatClerkErrorForLogs(err);
    console.error("[upsert-for-order] clerk user upsert failed", err);
    console.info("[upsert-for-order] clerk error details", details);
    console.info("[upsert-for-order] phone candidates", {
      phoneRaw,
      phoneCandidates,
      phoneForCreate,
      email,
    });
    console.info("[upsert-for-order]", {
      ok: false,
      code: "clerk_error",
      organizationId,
      orderId,
    });
    return NextResponse.json(
      {
        error: "Could not prepare account.",
        code: "clerk_error",
        clerkTraceId: details.clerkTraceId,
      },
      { status: 502 },
    );
  }

  // Best-effort: add membership to the tenant Clerk org immediately.
  // Note: active org can't be set until there's a session (handled after OTP/email link).
  const tenantSlugFromMeta = readMetaValue(meta, "order.tenantSlug");
  const tenantSlug =
    typeof tenantSlugFromMeta === "string"
      ? tenantSlugFromMeta.trim()
      : asString(req.headers.get("x-tenant-slug"));
  console.info("[upsert-for-order]", {
    ok: true,
    resolvedBy,
    organizationId,
    orderId,
    joinedOrgAttempted: Boolean(tenantSlug),
  });
  if (tenantSlug) {
    try {
      const orgsApi = clerk.organizations as unknown as {
        getOrganizationList: (args: {
          query: string;
          limit: number;
        }) => Promise<{ data: { id: string; slug?: string }[] }>;
      };
      const list = await orgsApi.getOrganizationList({
        query: tenantSlug,
        limit: 10,
      });
      const match = Array.isArray(list.data)
        ? (list.data.find((o) => o.slug === tenantSlug) ?? null)
        : null;
      const clerkOrganizationId = match ? match.id : "";
      if (clerkOrganizationId) {
        await addClerkOrganizationMember({
          clerkOrganizationId,
          clerkUserId,
          role: "org:member",
        });
      }
    } catch (err) {
      console.warn(
        "[upsert-for-order] failed to add clerk org membership",
        err,
      );
    }
  }

  // Create/ensure a pending core user + link order→user (token-gated mutation).
  let attachResultRaw: unknown;
  try {
    attachResultRaw = await convex.mutation(attachOrderToClerkUserRef, {
      organizationId,
      orderId,
      checkoutToken,
      clerkUserId,
      email: emailForCore,
      phone: phoneForCreate || undefined,
    });
  } catch (err: unknown) {
    console.error("[upsert-for-order] convex attach failed", err);
    console.info("[upsert-for-order]", {
      ok: false,
      code: "convex_error",
      organizationId,
      orderId,
      resolvedBy,
    });
    return NextResponse.json(
      { error: "Could not prepare account.", code: "convex_error" },
      { status: 502 },
    );
  }
  const attachResult =
    attachResultRaw && typeof attachResultRaw === "object"
      ? (attachResultRaw as Record<string, unknown>)
      : null;

  return NextResponse.json({
    ok: true,
    clerkUserId,
    coreUserId:
      attachResult && typeof attachResult.coreUserId === "string"
        ? attachResult.coreUserId
        : null,
  });
}
