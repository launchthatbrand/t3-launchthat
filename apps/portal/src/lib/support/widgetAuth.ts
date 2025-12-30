import type { NextRequest } from "next/server";
import { api, components } from "@/convex/_generated/api";

import type { getConvex } from "~/lib/convex";
import { resolveSupportOrganizationId } from "~/lib/support/resolveOrganizationId";

type ConvexClient = ReturnType<typeof getConvex>;

export class SupportWidgetAuthError extends Error {
  status: number;
  constructor(message: string, status = 403) {
    super(message);
    this.status = status;
  }
}

const parseStringArrayJson = (value: unknown): string[] => {
  if (typeof value !== "string") return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (v): v is string => typeof v === "string" && v.length > 0,
    );
  } catch {
    return [];
  }
};

const getOrigin = (req: Request | NextRequest): string | null => {
  const origin = req.headers.get("origin");
  if (origin && origin.length > 0) return origin;

  // Some browsers/environments may omit Origin on same-origin GETs.
  // Fall back to Referer so we can still validate an allowlist.
  const referer = req.headers.get("referer");
  if (referer && referer.length > 0) {
    try {
      return new URL(referer).origin;
    } catch {
      return null;
    }
  }

  return null;
};

export async function requireSupportWidgetAuth(args: {
  req: Request | NextRequest;
  convex: ConvexClient;
  organizationIdParam: string | null;
  widgetKey: string | null;
}): Promise<{
  organizationId: string;
  allowedOrigins: string[];
}> {
  const { req, convex, organizationIdParam, widgetKey } = args;

  if (!organizationIdParam) {
    throw new SupportWidgetAuthError("organizationId is required", 400);
  }
  if (!widgetKey || widgetKey.trim().length === 0) {
    throw new SupportWidgetAuthError("widgetKey is required", 400);
  }

  const organizationId = await resolveSupportOrganizationId(
    convex,
    organizationIdParam,
  );
  if (!organizationId) {
    throw new SupportWidgetAuthError("organization not found", 404);
  }

  const storedWidgetKey: unknown = await convex.query(
    api.plugins.support.options.getSupportOption,
    {
      organizationId,
      key: "supportWidgetKey",
    },
  );
  const allowedOriginsRaw: unknown = await convex.query(
    api.plugins.support.options.getSupportOption,
    {
      organizationId,
      key: "supportWidgetAllowedOrigins",
    },
  );

  const expectedKey =
    typeof storedWidgetKey === "string" ? storedWidgetKey : "";
  if (!expectedKey) {
    if (process.env.NODE_ENV !== "production") {
      let existingOptionKeys: string[] | undefined;
      try {
        const options = (await convex.query(
          components.launchthat_support.queries.listSupportOptions,
          { organizationId },
        )) as { key: string }[];
        existingOptionKeys = options
          .map((o) => o.key)
          .filter((k) => typeof k === "string" && k.length > 0)
          .sort();
      } catch (listError) {
        console.warn(
          "[support-chat] widget auth: failed to list support options for debug",
          JSON.stringify({
            organizationId,
            organizationIdParam,
            errorType: listError instanceof Error ? listError.name : typeof listError,
          }),
        );
      }
      console.warn(
        "[support-chat] widget auth: missing configured supportWidgetKey",
        JSON.stringify({
          organizationId,
          organizationIdParam,
          widgetKeyProvided: Boolean(widgetKey),
          storedWidgetKeyType: storedWidgetKey === null ? "null" : typeof storedWidgetKey,
          origin: getOrigin(req),
          host: req.headers.get("host"),
          referer: req.headers.get("referer"),
          existingOptionKeys,
        }),
      );
    }
    throw new SupportWidgetAuthError("support widget is not configured", 403);
  }
  if (widgetKey !== expectedKey) {
    if (process.env.NODE_ENV !== "production") {
      const safePreview = (value: string) =>
        value.length > 8 ? `${value.slice(0, 4)}…${value.slice(-4)}` : value;
      console.warn(
        "[support-chat] widget auth: invalid widgetKey",
        JSON.stringify({
          organizationId,
          widgetKeyProvided: safePreview(widgetKey ?? ""),
          expectedWidgetKey: safePreview(expectedKey),
          origin: getOrigin(req),
        }),
      );
    }
    throw new SupportWidgetAuthError("invalid widgetKey", 403);
  }

  const allowedOrigins = parseStringArrayJson(allowedOriginsRaw);
  if (allowedOrigins.length > 0) {
    const origin = getOrigin(req);
    if (!origin) {
      throw new SupportWidgetAuthError("Origin header is required", 403);
    }
    if (!allowedOrigins.includes(origin)) {
      throw new SupportWidgetAuthError("Origin not allowed", 403);
    }
  }

  return { organizationId, allowedOrigins };
}
