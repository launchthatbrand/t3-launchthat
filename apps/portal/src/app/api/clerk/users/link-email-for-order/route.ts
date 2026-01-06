import type { FunctionReference } from "convex/server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClerkClient } from "@clerk/backend";
import { ConvexHttpClient } from "convex/browser";

import { env } from "~/env";

export const runtime = "nodejs";

interface LinkEmailForOrderBody {
  organizationId?: string;
  orderId?: string;
  checkoutToken?: string;
}

const asString = (v: unknown) => (typeof v === "string" ? v : "").trim();

const normalizePhoneLoose = (phone: string): string => {
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
  if (cleaned && !cleaned.startsWith("+") && /^[0-9]{11,15}$/.test(cleaned)) {
    candidates.push(`+${cleaned}`);
  }
  if (digitsOnly.length === 10) {
    candidates.push(`+1${digitsOnly}`);
  }
  if (digitsOnly.length === 11 && digitsOnly.startsWith("1")) {
    candidates.push(`+${digitsOnly}`);
  }
  if (rawPhone.trim().startsWith("+") && digitsOnly) {
    candidates.push(`+${digitsOnly}`);
  }
  return Array.from(new Set(candidates));
};

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

function readMetaValue(
  meta: { key: string; value: unknown }[],
  key: string,
): unknown {
  return meta.find((m) => m.key === key)?.value;
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
    .catch(() => null)) as LinkEmailForOrderBody | null;
  const organizationId = asString(body?.organizationId);
  const orderId = asString(body?.orderId);
  const checkoutToken = asString(body?.checkoutToken);

  if (!organizationId || !orderId || !checkoutToken) {
    console.info("[link-email-for-order]", {
      ok: false,
      code: "bad_request",
      organizationIdPresent: Boolean(organizationId),
      orderIdPresent: Boolean(orderId),
      checkoutTokenPresent: Boolean(checkoutToken),
    });
    return NextResponse.json(
      { ok: false, code: "bad_request", error: "Missing required fields." },
      { status: 400 },
    );
  }

  const convex = new ConvexHttpClient(env.NEXT_PUBLIC_CONVEX_URL);

  const apiModule = (await import("@/convex/_generated/api.js")) as unknown as {
    api: unknown;
  };
  const apiRoot = apiModule.api as Record<string, unknown>;
  const plugins = (apiRoot.plugins ?? {}) as Record<string, unknown>;
  const commerce = (plugins.commerce ?? {}) as Record<string, unknown>;
  const orders = (commerce.orders ?? {}) as Record<string, unknown>;
  const queries = (orders.queries ?? {}) as Record<string, unknown>;
  const getOrderRef = queries.getOrder as FunctionReference<"query">;

  const orderRaw: unknown = await convex.query(getOrderRef, {
    orderId,
    organizationId,
  });
  const order = asOrder(orderRaw);
  if (!order) {
    console.info("[link-email-for-order]", {
      ok: false,
      code: "order_not_found",
      organizationId,
      orderId,
    });
    return NextResponse.json(
      { ok: false, code: "order_not_found", error: "Order not found." },
      { status: 404 },
    );
  }

  const meta = order.meta;
  const tokenInOrder = readMetaValue(meta, "order.checkoutToken");
  if (
    typeof tokenInOrder !== "string" ||
    tokenInOrder.trim() !== checkoutToken
  ) {
    console.info("[link-email-for-order]", {
      ok: false,
      code: "invalid_checkout_token",
      organizationId,
      orderId,
    });
    return NextResponse.json(
      {
        ok: false,
        code: "invalid_checkout_token",
        error: "Invalid checkout token.",
      },
      { status: 403 },
    );
  }

  const phoneRaw =
    asString(readMetaValue(meta, "order.customerPhone")) ||
    asString(readMetaValue(meta, "billing.phone")) ||
    asString(readMetaValue(meta, "shipping.phone"));
  const phoneCandidates = buildPhoneCandidates(phoneRaw);
  const candidateEmail =
    asString(readMetaValue(meta, "order.secondaryEmailCandidate")) ||
    asString(readMetaValue(meta, "order.customerEmail")) ||
    asString(readMetaValue(meta, "billing.email")) ||
    asString(order.email);

  if (!phoneRaw) {
    console.info("[link-email-for-order]", {
      ok: true,
      linked: false,
      reason: "missing_phone",
      organizationId,
      orderId,
    });
    return NextResponse.json({
      ok: true,
      linked: false,
      reason: "missing_phone",
    });
  }
  if (!candidateEmail) {
    console.info("[link-email-for-order]", {
      ok: true,
      linked: false,
      reason: "missing_candidate_email",
      organizationId,
      orderId,
      phonePresent: Boolean(phoneRaw),
    });
    return NextResponse.json({
      ok: true,
      linked: false,
      reason: "missing_candidate_email",
    });
  }

  const clerk = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });

  // Resolve the Clerk user by phone (the “master key”).
  type ClerkUserListItem = Awaited<
    ReturnType<typeof clerk.users.getUserList>
  >["data"][number];
  let phoneUser: ClerkUserListItem | null = null;
  for (const candidate of phoneCandidates) {
    const usersByPhone = await clerk.users.getUserList({
      phoneNumber: [candidate],
    });
    phoneUser =
      Array.isArray(usersByPhone.data) && usersByPhone.data.length > 0
        ? (usersByPhone.data[0] ?? null)
        : null;
    if (phoneUser) break;
  }
  if (!phoneUser) {
    console.info("[link-email-for-order]", {
      ok: true,
      linked: false,
      reason: "no_phone_user",
      organizationId,
      orderId,
    });
    return NextResponse.json({
      ok: true,
      linked: false,
      reason: "no_phone_user",
    });
  }

  // If the email is already owned by another user, do not merge.
  const usersByEmail = await clerk.users.getUserList({
    emailAddress: [candidateEmail],
  });
  const emailOwner =
    Array.isArray(usersByEmail.data) && usersByEmail.data.length > 0
      ? (usersByEmail.data[0] ?? null)
      : null;
  if (emailOwner && emailOwner.id !== phoneUser.id) {
    console.info("[link-email-for-order]", {
      ok: false,
      code: "email_owned_by_other_user",
      organizationId,
      orderId,
      phoneUserId: phoneUser.id,
      emailOwnerId: emailOwner.id,
    });
    return NextResponse.json({
      ok: false,
      code: "email_owned_by_other_user",
      error: "Email already belongs to another account.",
    });
  }

  // If already present on the user, we're done.
  const existingEmails = phoneUser.emailAddresses;
  const hasEmail = existingEmails.some(
    (e) => e.emailAddress === candidateEmail,
  );
  if (hasEmail) {
    console.info("[link-email-for-order]", {
      ok: true,
      linked: false,
      reason: "already_linked",
      organizationId,
      orderId,
      phoneUserId: phoneUser.id,
    });
    return NextResponse.json({
      ok: true,
      linked: false,
      reason: "already_linked",
    });
  }

  // Add email to the same user.
  try {
    await clerk.emailAddresses.createEmailAddress({
      userId: phoneUser.id,
      emailAddress: candidateEmail,
      verified: false,
      primary: false,
    });
    console.info("[link-email-for-order]", {
      ok: true,
      linked: true,
      organizationId,
      orderId,
      phoneUserId: phoneUser.id,
    });
    return NextResponse.json({ ok: true, linked: true });
  } catch (err: unknown) {
    // Race hardening: re-check ownership and return a stable, non-flaky result.
    try {
      const recheck = await clerk.users.getUserList({
        emailAddress: [candidateEmail],
      });
      const owner =
        Array.isArray(recheck.data) && recheck.data.length > 0
          ? (recheck.data[0] ?? null)
          : null;
      if (owner && owner.id === phoneUser.id) {
        console.info("[link-email-for-order]", {
          ok: true,
          linked: false,
          reason: "already_linked",
          organizationId,
          orderId,
          phoneUserId: phoneUser.id,
        });
        return NextResponse.json({
          ok: true,
          linked: false,
          reason: "already_linked",
        });
      }
      if (owner && owner.id !== phoneUser.id) {
        console.info("[link-email-for-order]", {
          ok: false,
          code: "email_owned_by_other_user",
          organizationId,
          orderId,
          phoneUserId: phoneUser.id,
          emailOwnerId: owner.id,
        });
        return NextResponse.json({
          ok: false,
          code: "email_owned_by_other_user",
          error: "Email already belongs to another account.",
        });
      }
    } catch {
      // ignore and fall through to generic error
    }

    console.error("[link-email-for-order] failed to link email", err);
    return NextResponse.json(
      { ok: false, code: "clerk_error", error: "Failed to link email." },
      { status: 502 },
    );
  }
}
