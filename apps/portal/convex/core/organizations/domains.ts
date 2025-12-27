"use node";

import type { FunctionReference } from "convex/server";
import { v } from "convex/values";

import type { Id } from "../../_generated/dataModel";
import { api } from "../../_generated/api";
import { internal } from "../../_generated/api";
import { action } from "../../_generated/server";

interface DomainsInternalBag {
  requireOrgAdmin: unknown;
  internalFindOrgByCustomDomain: unknown;
  internalUpsertOrgDomainState: unknown;
}

const domainsInternal = (
  internal as unknown as {
    core: { organizations: { domainsInternal: DomainsInternalBag } };
  }
).core.organizations.domainsInternal;

type InternalQueryRef = FunctionReference<"query", "internal">;
type InternalMutationRef = FunctionReference<"mutation", "internal">;

interface DomainRecord {
  type: string;
  name: string;
  value: string;
}

const domainRecordValidator = v.object({
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
    .replace(/^\*\./, "") // don't allow wildcard on input; treat as base
    .replace(/^www\./, "")
    .replace(/\.$/, ""); // strip trailing dot
};

const getVercelConfig = () => {
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  const token = process.env.VERCEL_API_TOKEN;
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  const projectId = process.env.VERCEL_PROJECT_ID;
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  const teamId = process.env.VERCEL_TEAM_ID;

  if (!token) throw new Error("Missing VERCEL_API_TOKEN");
  if (!projectId) throw new Error("Missing VERCEL_PROJECT_ID");

  const teamIdTrimmed = teamId?.trim() ?? "";
  return {
    token,
    projectId,
    teamId: teamIdTrimmed.length > 0 ? teamIdTrimmed : undefined,
  };
};

const parseVercelDomainRecords = (payload: unknown): DomainRecord[] => {
  const obj = payload as Record<string, unknown> | null;
  const verification =
    obj && Array.isArray(obj.verification) ? obj.verification : [];
  const records: DomainRecord[] = [];
  for (const item of verification) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    const type = typeof rec.type === "string" ? rec.type : "TXT";
    const name =
      typeof rec.domain === "string"
        ? rec.domain
        : typeof rec.name === "string"
          ? rec.name
          : "";
    const value = typeof rec.value === "string" ? rec.value : "";
    if (!name || !value) continue;
    records.push({ type, name, value });
  }
  return records;
};

const isVerifiedFromVercelPayload = (payload: unknown): boolean => {
  const obj = payload as Record<string, unknown> | null;
  return Boolean(obj && obj.verified === true);
};

const getErrorFromVercelPayload = (payload: unknown): string | null => {
  if (!payload || typeof payload !== "object") return null;
  const obj = payload as Record<string, unknown>;
  if (typeof obj.error === "string") return obj.error;
  if (typeof obj.message === "string") return obj.message;
  return null;
};

const readJsonResponse = async (res: Response): Promise<unknown> => {
  const raw = await res.text();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return { raw };
  }
};

const fetchProjectDomainDetails = async (args: {
  token: string;
  projectId: string;
  teamId?: string;
  domain: string;
}): Promise<unknown> => {
  const getUrl = new URL(
    `https://api.vercel.com/v9/projects/${encodeURIComponent(args.projectId)}/domains/${encodeURIComponent(args.domain)}`,
  );
  if (args.teamId) getUrl.searchParams.set("teamId", args.teamId);
  const res = await fetch(getUrl.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${args.token}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    const body = await readJsonResponse(res);
    throw new Error(
      `Vercel project domain lookup failed (status ${res.status}). ${getErrorFromVercelPayload(body) ?? ""}`.trim(),
    );
  }
  return await readJsonResponse(res);
};

export const startCustomDomainSetup = action({
  args: {
    organizationId: v.id("organizations"),
    domain: v.string(),
  },
  returns: v.object({
    customDomain: v.string(),
    status: v.union(
      v.literal("unconfigured"),
      v.literal("pending"),
      v.literal("verified"),
      v.literal("error"),
    ),
    records: v.array(domainRecordValidator),
  }),
  handler: async (ctx, args) => {
    const { token, projectId, teamId } = getVercelConfig();
    const normalizedDomain = normalizeHostname(args.domain);
    if (!normalizedDomain) throw new Error("Invalid domain");

    const requireOrgAdminRef =
      domainsInternal.requireOrgAdmin as InternalQueryRef;
    const findOrgByDomainRef =
      domainsInternal.internalFindOrgByCustomDomain as InternalQueryRef;
    const upsertDomainStateRef =
      domainsInternal.internalUpsertOrgDomainState as InternalMutationRef;

    // Authz: must be org owner/admin
    await ctx.runQuery(requireOrgAdminRef, {
      organizationId: args.organizationId,
    });

    // Uniqueness: domain can only belong to one org
    const existingOrgId = (await ctx.runQuery(findOrgByDomainRef, {
      hostname: normalizedDomain,
    })) as Id<"organizations"> | null;
    if (existingOrgId && existingOrgId !== args.organizationId) {
      throw new Error(
        "That domain is already assigned to another organization.",
      );
    }

    const url = new URL(
      `https://api.vercel.com/v9/projects/${encodeURIComponent(projectId)}/domains`,
    );
    if (teamId) url.searchParams.set("teamId", teamId);

    const res = await fetch(url.toString(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: normalizedDomain }),
    });
    const postJson: unknown = await readJsonResponse(res);

    // If the domain is already attached (409) we can still proceed.
    if (!res.ok && res.status !== 409) {
      await ctx.runMutation(upsertDomainStateRef, {
        organizationId: args.organizationId,
        customDomain: normalizedDomain,
        status: "error",
        lastError:
          getErrorFromVercelPayload(postJson) ?? `Vercel error (${res.status})`,
      });
      throw new Error(
        `Failed to add domain in Vercel (status ${res.status}). Check Vercel API token/project configuration.`,
      );
    }

    // Always fetch the full domain details after add; this is where Vercel typically returns `verification` records.
    let details: unknown;
    try {
      details = await fetchProjectDomainDetails({
        token,
        projectId,
        teamId,
        domain: normalizedDomain,
      });
    } catch (error) {
      // If we can't read back the domain we just "added", configuration is wrong (wrong project/team/token).
      await ctx.runMutation(upsertDomainStateRef, {
        organizationId: args.organizationId,
        customDomain: normalizedDomain,
        status: "error",
        lastError:
          error instanceof Error
            ? error.message
            : "Failed to read domain from Vercel",
      });
      throw error;
    }

    const verified = isVerifiedFromVercelPayload(details);
    let records = parseVercelDomainRecords(details);

    // Fallback: if Vercel doesn't provide verification records, provide a best-effort record for subdomains.
    // This keeps the UI useful even when Vercel API doesn't return `verification`.
    if (records.length === 0 && normalizedDomain.split(".").length >= 3) {
      const parts = normalizedDomain.split(".");
      const sub = parts[0] ?? "www";
      const apex = parts.slice(1).join(".");
      records = [
        { type: "CNAME", name: sub, value: "cname.vercel-dns.com" },
        // Helpful note record (some DNS UIs want full hostnames)
        {
          type: "CNAME",
          name: `${sub}.${apex}`,
          value: "cname.vercel-dns.com",
        },
      ];
    }

    const status: "pending" | "verified" = verified ? "verified" : "pending";

    await ctx.runMutation(upsertDomainStateRef, {
      organizationId: args.organizationId,
      customDomain: normalizedDomain,
      status,
      records,
      verifiedAt: verified ? Date.now() : undefined,
      lastError: "",
    });

    // Best-effort: refresh email sending domain state in Resend (derived from customDomain apex).
    try {
      await ctx.runAction(api.core.organizations.emailDomains.syncEmailDomainFromCustomDomain, {
        organizationId: args.organizationId,
      });
    } catch (err) {
      console.warn(
        "[domains.startCustomDomainSetup] failed to sync Resend email domain",
        err,
      );
    }

    return { customDomain: normalizedDomain, status, records };
  },
});

export const verifyCustomDomain = action({
  args: {
    organizationId: v.id("organizations"),
  },
  returns: v.object({
    customDomain: v.string(),
    status: v.union(
      v.literal("unconfigured"),
      v.literal("pending"),
      v.literal("verified"),
      v.literal("error"),
    ),
    records: v.array(domainRecordValidator),
  }),
  handler: async (ctx, args) => {
    const { token, projectId, teamId } = getVercelConfig();

    const requireOrgAdminRef =
      domainsInternal.requireOrgAdmin as InternalQueryRef;
    const upsertDomainStateRef =
      domainsInternal.internalUpsertOrgDomainState as InternalMutationRef;

    const org = (await ctx.runQuery(requireOrgAdminRef, {
      organizationId: args.organizationId,
    })) as { customDomain?: string };
    const domain = normalizeHostname(org.customDomain ?? "");
    if (!domain) {
      throw new Error("No custom domain configured for this organization.");
    }

    const url = new URL(
      `https://api.vercel.com/v9/projects/${encodeURIComponent(projectId)}/domains/${encodeURIComponent(domain)}/verify`,
    );
    if (teamId) url.searchParams.set("teamId", teamId);

    const res = await fetch(url.toString(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    const raw = await res.text();
    let json: unknown = null;
    try {
      json = raw ? (JSON.parse(raw) as unknown) : null;
    } catch {
      json = { raw };
    }

    if (!res.ok) {
      await ctx.runMutation(upsertDomainStateRef, {
        organizationId: args.organizationId,
        status: "error",
        lastError:
          getErrorFromVercelPayload(json) ?? `Vercel error (${res.status})`,
      });
      throw new Error(`Domain verification failed (status ${res.status}).`);
    }

    const verified = isVerifiedFromVercelPayload(json);
    const records = parseVercelDomainRecords(json);
    const status: "pending" | "verified" = verified ? "verified" : "pending";

    await ctx.runMutation(upsertDomainStateRef, {
      organizationId: args.organizationId,
      status,
      records,
      verifiedAt: verified ? Date.now() : undefined,
      lastError: "",
    });

    // Best-effort: refresh email sending domain state in Resend (derived from customDomain apex).
    try {
      await ctx.runAction(api.core.organizations.emailDomains.syncEmailDomainFromCustomDomain, {
        organizationId: args.organizationId,
      });
    } catch (err) {
      console.warn(
        "[domains.verifyCustomDomain] failed to sync Resend email domain",
        err,
      );
    }

    return { customDomain: domain, status, records };
  },
});
