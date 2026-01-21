import type { FunctionReference } from "convex/server";
import { v } from "convex/values";

import { internal } from "./_generated/api";
import { action, internalAction } from "./server";

/**
 * Note: Convex component actions can't directly import app-level `internal`.
 * We keep Resend logic in this component and persist state via component queries/mutations.
 */

type EmailDomainStatus = "unconfigured" | "pending" | "verified" | "error";

interface DnsRecord {
  type: string;
  name: string;
  value: string;
}

const dnsRecordValidator = v.object({
  type: v.string(),
  name: v.string(),
  value: v.string(),
});

const normalizeHostname = (input: string): string => {
  const raw = input.trim().toLowerCase();
  if (!raw) return "";
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
  const parts = normalized.split(".").filter(Boolean);
  if (parts.length < 2) return null;

  // Heuristic for common multi-part public suffixes.
  const multiPartTlds = new Set([
    "co.uk",
    "com.au",
    "co.nz",
    "co.jp",
    "com.br",
    "com.mx",
    "com.sg",
  ]);
  const maybeSuffix = parts.slice(-2).join(".");
  const use3 = multiPartTlds.has(maybeSuffix);
  return (use3 ? parts.slice(-3) : parts.slice(-2)).join(".");
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

interface ResendListDomainsResponse {
  data?: { id?: string; name?: string }[];
}
interface ResendDomainResponse {
  id?: string;
  name?: string;
  status?: string;
  records?: unknown;
}

const findOrCreateResendDomain = async (args: {
  key: string;
  name: string;
}): Promise<{ ok: true; domain: ResendDomainResponse } | { ok: false; error: string }> => {
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
  if (!id) return { ok: false, error: "Resend create-domain did not return an id" };

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
  await resendRequest<unknown>({
    key: args.key,
    method: "POST",
    path: `/domains/${encodeURIComponent(args.id)}/verify`,
  }).catch(() => null);
};

/**
 * Best-effort domain sync:
 * - Derive apex domain from an app-provided custom domain
 * - Create/find Resend domain
 * - Persist DNS records and status in email plugin tables
 */
export const syncEmailDomain = action({
  args: {
    orgId: v.string(),
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
    const now = Date.now();
    const unconfigured: EmailDomainStatus = "unconfigured";
    const errorStatus: EmailDomainStatus = "error";
    const domainRow = (await ctx.runQuery((internal as any).queries.getEmailDomainByOrgInternal, {
      orgId: args.orgId,
    })) as { domain?: string | null } | null;
    const raw = typeof domainRow?.domain === "string" ? domainRow.domain : "";

    if (!raw.trim()) {
      // Upsert state via component mutation (typed as any to avoid generated type churn).
      const mut = (internal as any).mutations?.upsertEmailDomainState as FunctionReference<
        "mutation",
        "internal"
      >;
      if (mut) {
        await ctx.runMutation(mut, {
          orgId: args.orgId,
          domain: null,
          status: "unconfigured",
          records: [],
          lastError: "No email domain configured.",
        });
      }
      return {
        emailDomain: null,
        status: unconfigured,
        records: [],
        lastError: "No email domain configured.",
        updatedAt: now,
      };
    }

    const apex = deriveApexDomain(raw);
    if (!apex) {
      const mut = (internal as any).mutations?.upsertEmailDomainState as FunctionReference<
        "mutation",
        "internal"
      >;
      if (mut) {
        await ctx.runMutation(mut, {
          orgId: args.orgId,
          domain: null,
          status: "error",
          records: [],
          lastError: "Failed to derive apex domain",
        });
      }
      return {
        emailDomain: null,
        status: errorStatus,
        records: [],
        lastError: "Failed to derive apex domain",
        updatedAt: now,
      };
    }

    try {
      const key = getResendKey();
      const domainRes = await findOrCreateResendDomain({ key, name: apex });
      if (!domainRes.ok) {
        const mut = (internal as any).mutations?.upsertEmailDomainState as FunctionReference<
          "mutation",
          "internal"
        >;
        if (mut) {
          await ctx.runMutation(mut, {
            orgId: args.orgId,
            domain: apex,
            status: "error",
            records: [],
            lastError: domainRes.error,
          });
        }
        return {
          emailDomain: apex,
          status: errorStatus,
          records: [],
          lastError: domainRes.error,
          updatedAt: now,
        };
      }

      if (domainRes.domain.id) {
        await tryVerifyResendDomain({ key, id: domainRes.domain.id });
      }

      const status = mapStatus(domainRes.domain.status);
      const records = coerceDnsRecords(domainRes.domain.records);

      const mut = (internal as any).mutations?.upsertEmailDomainState as FunctionReference<
        "mutation",
        "internal"
      >;
      if (mut) {
        await ctx.runMutation(mut, {
          orgId: args.orgId,
          domain: apex,
          status,
          records,
          lastError: "",
        });
      }

      return {
        emailDomain: apex,
        status: status,
        records,
        updatedAt: now,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const mut = (internal as any).mutations?.upsertEmailDomainState as FunctionReference<
        "mutation",
        "internal"
      >;
      if (mut) {
        await ctx.runMutation(mut, {
          orgId: args.orgId,
          domain: apex,
          status: "error",
          records: [],
          lastError: message,
        });
      }
      return {
        emailDomain: apex,
        status: errorStatus,
        records: [],
        lastError: message,
        updatedAt: now,
      };
    }
  },
});

/**
 * Sends a queued outbox row through Resend.
 */
export const sendQueuedEmail = internalAction({
  args: { outboxId: v.id("emailOutbox") },
  returns: v.null(),
  handler: async (ctx, args) => {
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    const resendKey = process.env.RESEND_API_KEY;
    const internalAny = internal as any;
    if (!resendKey) {
      await ctx.runMutation(internalAny.mutations.markOutboxFailedInternal, {
        outboxId: args.outboxId,
        error: "Missing RESEND_API_KEY",
      });
      return null;
    }

    const outbox = (await ctx.runQuery(internalAny.queries.getOutboxByIdInternal, {
      outboxId: args.outboxId,
    })) as any | null;
    if (!outbox || outbox.status !== "queued") return null;

    const payload: Record<string, unknown> = {
      from: `${outbox.fromName} <${outbox.fromEmail}>`,
      to: [outbox.to],
      subject: outbox.subject,
      html: outbox.htmlBody,
      text: outbox.textBody,
    };
    if (outbox.replyToEmail) {
      payload.reply_to = outbox.replyToEmail;
    }

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        await ctx.runMutation(internalAny.mutations.markOutboxFailedInternal, {
          outboxId: outbox._id,
          error: `Resend error: ${response.status} ${errorText}`,
        });
        return null;
      }

      const json = (await response.json()) as { id?: string } | null;
      await ctx.runMutation(internalAny.mutations.markOutboxSentInternal, {
        outboxId: outbox._id,
        providerMessageId: json?.id,
      });
      return null;
    } catch (err) {
      await ctx.runMutation(internalAny.mutations.markOutboxFailedInternal, {
        outboxId: outbox._id,
        error: err instanceof Error ? err.message : String(err),
      });
      return null;
    }
  },
});

