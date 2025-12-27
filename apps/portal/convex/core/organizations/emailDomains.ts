"use node";

import type { FunctionReference } from "convex/server";
import { v } from "convex/values";
import psl from "psl";

import type { Id } from "../../_generated/dataModel";
import { internal } from "../../_generated/api";
import { action } from "../../_generated/server";

interface DomainsInternalBag {
  requireOrgAdmin: unknown;
  internalUpsertOrgEmailDomainState: unknown;
}

const domainsInternal = (
  internal as unknown as {
    core: { organizations: { domainsInternal: DomainsInternalBag } };
  }
).core.organizations.domainsInternal;

type InternalQueryRef = FunctionReference<"query", "internal">;
type InternalMutationRef = FunctionReference<"mutation", "internal">;

type EmailDomainStatus = "unconfigured" | "pending" | "verified" | "error";

type DnsRecord = {
  type: string;
  name: string;
  value: string;
};

const dnsRecordValidator = v.object({
  type: v.string(),
  name: v.string(),
  value: v.string(),
});

const normalizeHostname = (input: string): string => {
  const raw = input.trim().toLowerCase();
  if (!raw) return "";
  // allow users to paste full URLs
  const candidate = raw.includes("://")
    ? (() => {
        try {
          return new URL(raw).hostname;
        } catch {
          return raw;
        }
      })()
    : raw;

  return candidate
    .trim()
    .toLowerCase()
    .replace(/^\*\./, "")
    .replace(/^www\./, "")
    .replace(/\.$/, "");
};

const deriveApexDomain = (customDomain: string): string | null => {
  const normalized = normalizeHostname(customDomain);
  if (!normalized) return null;

  const parsed = psl.parse(normalized);
  if (typeof parsed === "string") return null;
  const domain = parsed.domain;
  if (!domain) return null;
  return domain;
};

const getResendKey = (): string => {
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("Missing RESEND_API_KEY");
  return key;
};

const resendRequest = async <T>(args: {
  key: string;
  method: "GET" | "POST";
  path: string;
  body?: unknown;
}): Promise<{ ok: true; data: T } | { ok: false; status: number; errorText: string }> => {
  const res = await fetch(`https://api.resend.com${args.path}`, {
    method: args.method,
    headers: {
      Authorization: `Bearer ${args.key}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: args.body ? JSON.stringify(args.body) : undefined,
  });

  if (!res.ok) {
    return { ok: false, status: res.status, errorText: await res.text() };
  }

  const json = (await res.json()) as T;
  return { ok: true, data: json };
};

const coerceDnsRecords = (value: unknown): DnsRecord[] => {
  if (!Array.isArray(value)) return [];
  const out: DnsRecord[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    const type = typeof rec.type === "string" ? rec.type : "";
    const name = typeof rec.name === "string" ? rec.name : "";
    const v1 = typeof rec.value === "string" ? rec.value : "";
    // Some APIs use `record` instead of `type`
    const typeFallback = typeof rec.record === "string" ? rec.record : "";
    const finalType = type || typeFallback;
    if (!finalType || !name || !v1) continue;
    out.push({ type: finalType, name, value: v1 });
  }
  return out;
};

const mapStatus = (raw: unknown): EmailDomainStatus => {
  const s = typeof raw === "string" ? raw.toLowerCase() : "";
  if (s === "verified") return "verified";
  if (s === "pending" || s === "not_started" || s === "unverified") return "pending";
  if (!s) return "pending";
  return "pending";
};

type ResendListDomainsResponse = {
  data?: Array<{ id?: string; name?: string }>;
};

type ResendDomainResponse = {
  id?: string;
  name?: string;
  status?: string;
  records?: unknown;
};

const findOrCreateResendDomain = async (args: {
  key: string;
  name: string;
}): Promise<{ ok: true; domain: ResendDomainResponse } | { ok: false; error: string }> => {
  // List domains and match by name.
  const list = await resendRequest<ResendListDomainsResponse>({
    key: args.key,
    method: "GET",
    path: "/domains",
  });
  if (list.ok) {
    const existing = (list.data.data ?? []).find((d) => d.name === args.name);
    if (existing?.id) {
      const get = await resendRequest<ResendDomainResponse>({
        key: args.key,
        method: "GET",
        path: `/domains/${encodeURIComponent(existing.id)}`,
      });
      if (get.ok) return { ok: true, domain: get.data };
      return { ok: false, error: `Resend get-domain failed: ${get.status} ${get.errorText}` };
    }
  }

  // Create domain if not found (or list failed).
  const created = await resendRequest<{ id?: string }>({
    key: args.key,
    method: "POST",
    path: "/domains",
    body: { name: args.name },
  });
  if (!created.ok) {
    return { ok: false, error: `Resend create-domain failed: ${created.status} ${created.errorText}` };
  }
  const id = created.data.id;
  if (!id) {
    return { ok: false, error: "Resend create-domain did not return an id" };
  }
  const get = await resendRequest<ResendDomainResponse>({
    key: args.key,
    method: "GET",
    path: `/domains/${encodeURIComponent(id)}`,
  });
  if (!get.ok) {
    return { ok: false, error: `Resend get-domain failed: ${get.status} ${get.errorText}` };
  }
  return { ok: true, domain: get.data };
};

const tryVerifyResendDomain = async (args: { key: string; id: string }) => {
  // Best-effort: different Resend API versions may or may not expose this endpoint.
  await resendRequest<unknown>({
    key: args.key,
    method: "POST",
    path: `/domains/${encodeURIComponent(args.id)}/verify`,
  }).catch(() => null);
};

export const syncEmailDomainFromCustomDomain = action({
  args: {
    organizationId: v.id("organizations"),
  },
  returns: v.object({
    emailDomain: v.union(v.string(), v.null()),
    status: v.union(
      v.literal("unconfigured"),
      v.literal("pending"),
      v.literal("verified"),
      v.literal("error"),
    ),
    records: v.array(dnsRecordValidator),
    lastError: v.optional(v.string()),
    updatedAt: v.number(),
  }),
  handler: async (ctx, args) => {
    const requireOrgAdminRef = domainsInternal.requireOrgAdmin as InternalQueryRef;
    const upsertEmailDomainStateRef =
      domainsInternal.internalUpsertOrgEmailDomainState as InternalMutationRef;

    const org = (await ctx.runQuery(requireOrgAdminRef, {
      organizationId: args.organizationId,
    })) as { customDomain?: string };

    const now = Date.now();
    const customDomain = org.customDomain ?? "";
    if (!customDomain) {
      await ctx.runMutation(upsertEmailDomainStateRef, {
        organizationId: args.organizationId,
        emailDomain: undefined,
        status: "unconfigured",
        records: [],
        verifiedAt: undefined,
        lastError: "",
      });
      return {
        emailDomain: null,
        status: "unconfigured",
        records: [],
        lastError: "No custom domain configured. Set a website domain first.",
        updatedAt: now,
      };
    }

    const apex = deriveApexDomain(customDomain);
    if (!apex) {
      await ctx.runMutation(upsertEmailDomainStateRef, {
        organizationId: args.organizationId,
        emailDomain: undefined,
        status: "error",
        records: [],
        verifiedAt: undefined,
        lastError: "Failed to derive apex domain from customDomain",
      });
      return {
        emailDomain: null,
        status: "error",
        records: [],
        lastError: "Failed to derive apex domain from customDomain",
        updatedAt: now,
      };
    }

    let resendKey: string;
    try {
      resendKey = getResendKey();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await ctx.runMutation(upsertEmailDomainStateRef, {
        organizationId: args.organizationId,
        emailDomain: apex,
        status: "error",
        records: [],
        verifiedAt: undefined,
        lastError: msg,
      });
      return {
        emailDomain: apex,
        status: "error",
        records: [],
        lastError: msg,
        updatedAt: now,
      };
    }

    const ensured = await findOrCreateResendDomain({ key: resendKey, name: apex });
    if (!ensured.ok) {
      await ctx.runMutation(upsertEmailDomainStateRef, {
        organizationId: args.organizationId,
        emailDomain: apex,
        status: "error",
        records: [],
        verifiedAt: undefined,
        lastError: ensured.error,
      });
      return {
        emailDomain: apex,
        status: "error",
        records: [],
        lastError: ensured.error,
        updatedAt: now,
      };
    }

    const domain = ensured.domain;
    if (domain.id) {
      await tryVerifyResendDomain({ key: resendKey, id: domain.id });
    }

    // Refresh after best-effort verify call (if possible).
    const refreshed =
      domain.id
        ? await resendRequest<ResendDomainResponse>({
            key: resendKey,
            method: "GET",
            path: `/domains/${encodeURIComponent(domain.id)}`,
          })
        : null;

    const latest = refreshed && refreshed.ok ? refreshed.data : domain;
    const records = coerceDnsRecords(latest.records);
    const status = mapStatus(latest.status);

    await ctx.runMutation(upsertEmailDomainStateRef, {
      organizationId: args.organizationId,
      emailDomain: apex,
      status,
      records,
      verifiedAt: status === "verified" ? now : undefined,
      lastError: "",
    });

    return {
      emailDomain: apex,
      status,
      records,
      updatedAt: now,
    };
  },
});


