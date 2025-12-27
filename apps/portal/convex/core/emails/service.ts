import { paginationOptsValidator } from "convex/server";
import { ConvexError, v } from "convex/values";

import type { Doc, Id } from "../../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../../_generated/server";
import type { EmailDesignKey, EmailTemplateDefinition } from "./reactEmail";
import { internal } from "../../_generated/api";
import {
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "../../_generated/server";
import { PORTAL_TENANT_ID } from "../../constants";
import { requireAdmin } from "../../lib/permissions/requirePermission";
import {
  getEmailTemplateDefinition,
  listEmailTemplateKeys,
} from "./reactEmail";
import { interpolateTemplateVariables } from "./render";

type TemplateKey = string;

type FromMode = "portal" | "custom";

type TemplateDesignOverrideKey = "inherit" | "clean" | "bold" | "minimal";

const normalizeOrgId = (orgId: Id<"organizations"> | null | undefined) =>
  orgId ?? PORTAL_TENANT_ID;

const getPortalSendingDomain = (): string => {
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  const configured = process.env.PORTAL_SENDING_DOMAIN;
  const normalized = configured?.trim().toLowerCase();
  const domain =
    normalized && normalized.length > 0 ? normalized : "launchthat.app";
  return domain.replace(/\.$/, "");
};

const parseEmailAddress = (
  value: string,
): { localPart: string; domain: string } | null => {
  const trimmed = value.trim();
  const at = trimmed.lastIndexOf("@");
  if (at <= 0) return null;
  const localPart = trimmed.slice(0, at).trim();
  const domain = trimmed
    .slice(at + 1)
    .trim()
    .toLowerCase();
  if (!localPart || !domain) return null;
  return { localPart, domain };
};

const getOrgResendDomainState = (org: Doc<"organizations">) => {
  const status = org.emailDomainStatus ?? "unconfigured";
  const normalized = org.emailDomain?.trim().toLowerCase();
  const domain = normalized && normalized.length > 0 ? normalized : null;
  return { status, domain };
};

const assertSenderAllowed = async (
  ctx: Pick<QueryCtx | MutationCtx, "db">,
  args: {
    orgId: Id<"organizations">;
    fromMode: FromMode;
    fromLocalPart: string;
  },
) => {
  const org: Doc<"organizations"> | null = await ctx.db.get(args.orgId);
  if (!org) throw new ConvexError("Organization not found.");

  if (args.fromMode === "portal") {
    // Always allowed (plan gating can be added later).
    return {
      org,
      fromEmail: `${args.fromLocalPart.trim()}@${getPortalSendingDomain()}`,
    };
  }

  const { status, domain } = getOrgResendDomainState(org);
  if (status !== "verified" || !domain) {
    throw new ConvexError(
      "To send from your own domain, you must verify it in Domains first.",
    );
  }
  return { org, fromEmail: `${args.fromLocalPart.trim()}@${domain}` };
};

const emailSettingsReturnValidator = v.object({
  _id: v.id("emailSettings"),
  _creationTime: v.number(),
  orgId: v.id("organizations"),
  provider: v.literal("resend"),
  fromName: v.string(),
  fromEmail: v.string(),
  fromMode: v.union(v.literal("portal"), v.literal("custom")),
  fromLocalPart: v.string(),
  replyToEmail: v.optional(v.string()),
  enabled: v.boolean(),
  designKey: v.optional(
    v.union(v.literal("clean"), v.literal("bold"), v.literal("minimal")),
  ),
  createdAt: v.number(),
  updatedAt: v.number(),
  updatedBy: v.optional(v.id("users")),
});

const emailTemplateReturnValidator = v.object({
  _id: v.id("emailTemplates"),
  _creationTime: v.number(),
  orgId: v.id("organizations"),
  templateKey: v.string(),
  subjectOverride: v.optional(v.string()),
  copyOverrides: v.optional(v.record(v.string(), v.string())),
  designOverrideKey: v.optional(
    v.union(
      v.literal("inherit"),
      v.literal("clean"),
      v.literal("bold"),
      v.literal("minimal"),
    ),
  ),
  // legacy fields (not rendered)
  subject: v.optional(v.string()),
  markdownBody: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
  updatedBy: v.optional(v.id("users")),
});

const emailOutboxReturnValidator = v.object({
  _id: v.id("emailOutbox"),
  _creationTime: v.number(),
  orgId: v.id("organizations"),
  to: v.string(),
  fromName: v.string(),
  fromEmail: v.string(),
  replyToEmail: v.optional(v.string()),
  templateKey: v.optional(v.string()),
  subject: v.string(),
  htmlBody: v.string(),
  textBody: v.string(),
  status: v.union(v.literal("queued"), v.literal("sent"), v.literal("failed")),
  providerMessageId: v.optional(v.string()),
  error: v.optional(v.string()),
  createdAt: v.number(),
  sentAt: v.optional(v.number()),
});

export const getProviderStatus = query({
  args: {},
  returns: v.object({
    resendConfigured: v.boolean(),
  }),
  handler: () => {
    return {
      // eslint-disable-next-line turbo/no-undeclared-env-vars
      resendConfigured: Boolean(process.env.RESEND_API_KEY),
    };
  },
});

export const getSettings = query({
  args: {
    orgId: v.optional(v.id("organizations")),
  },
  returns: v.union(emailSettingsReturnValidator, v.null()),
  handler: async (ctx, args) => {
    const orgId = normalizeOrgId(args.orgId ?? null);
    const existing: Doc<"emailSettings"> | null = await ctx.db
      .query("emailSettings")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .first();
    if (!existing) return null;

    const portalDomain = getPortalSendingDomain();
    const parsed = parseEmailAddress(existing.fromEmail);
    const inferredMode: FromMode =
      (existing as unknown as { fromMode?: FromMode }).fromMode ??
      (parsed?.domain === portalDomain ? "portal" : "custom");
    const inferredLocalPart: string =
      (existing as unknown as { fromLocalPart?: string }).fromLocalPart ??
      parsed?.localPart ??
      "info";

    // Best-effort computed fromEmail for display, but don't throw here.
    let fromEmail = existing.fromEmail;
    if (inferredMode === "portal") {
      fromEmail = `${inferredLocalPart}@${portalDomain}`;
    }

    return {
      ...existing,
      fromMode: inferredMode,
      fromLocalPart: inferredLocalPart,
      fromEmail,
      designKey: existing.designKey ?? "clean",
    };
  },
});

export const getSendMetaForOrg = internalQuery({
  args: {
    orgId: v.optional(v.id("organizations")),
  },
  returns: v.object({
    orgId: v.id("organizations"),
    enabled: v.boolean(),
    fromName: v.string(),
    fromEmail: v.string(),
    replyToEmail: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const orgId = normalizeOrgId(args.orgId ?? null);

    const settings: Doc<"emailSettings"> | null = await ctx.db
      .query("emailSettings")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .first();
    if (!settings) {
      throw new ConvexError(
        "Email settings not configured for this organization.",
      );
    }
    if (!settings.enabled) {
      return {
        orgId,
        enabled: false,
        fromName: settings.fromName,
        fromEmail: settings.fromEmail,
        replyToEmail: settings.replyToEmail ?? null,
      };
    }

    const portalDomain = getPortalSendingDomain();
    const parsed = parseEmailAddress(settings.fromEmail);
    const fromMode: FromMode =
      (settings as unknown as { fromMode?: FromMode }).fromMode ??
      (parsed?.domain === portalDomain ? "portal" : "custom");
    const fromLocalPart: string =
      (settings as unknown as { fromLocalPart?: string }).fromLocalPart ??
      parsed?.localPart ??
      "info";

    const { fromEmail } = await assertSenderAllowed(ctx, {
      orgId,
      fromMode,
      fromLocalPart,
    });

    return {
      orgId,
      enabled: true,
      fromName: settings.fromName,
      fromEmail,
      replyToEmail: settings.replyToEmail ?? null,
    };
  },
});

export const listTemplates = query({
  args: {
    orgId: v.optional(v.id("organizations")),
  },
  returns: v.array(emailTemplateReturnValidator),
  handler: async (ctx, args) => {
    const orgId = normalizeOrgId(args.orgId ?? null);
    return await ctx.db
      .query("emailTemplates")
      .withIndex("by_org_and_key", (q) => q.eq("orgId", orgId))
      .collect();
  },
});

export const listTemplateCatalog = query({
  args: {
    orgId: v.optional(v.id("organizations")),
  },
  returns: v.array(
    v.object({
      templateId: v.optional(v.id("emailTemplates")),
      templateKey: v.string(),
      title: v.string(),
      subject: v.string(),
      hasOverride: v.boolean(),
      designOverrideKey: v.optional(
        v.union(
          v.literal("inherit"),
          v.literal("clean"),
          v.literal("bold"),
          v.literal("minimal"),
        ),
      ),
      updatedAt: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const orgId = normalizeOrgId(args.orgId ?? null);

    const overrides = await ctx.db
      .query("emailTemplates")
      .withIndex("by_org_and_key", (q) => q.eq("orgId", orgId))
      .collect();

    const overrideByKey = new Map<string, (typeof overrides)[number]>();
    for (const row of overrides) {
      overrideByKey.set(row.templateKey, row);
    }

    const keys = new Set<string>([
      ...listEmailTemplateKeys(),
      ...overrides.map((t) => t.templateKey),
    ]);

    const result: {
      templateId?: Id<"emailTemplates">;
      templateKey: string;
      title: string;
      subject: string;
      hasOverride: boolean;
      designOverrideKey?: "inherit" | "clean" | "bold" | "minimal";
      updatedAt?: number;
    }[] = [];

    for (const key of keys) {
      const def = getEmailTemplateDefinition(key);
      if (!def) {
        // Unknown/legacy key. Keep it visible so admins can clean it up.
        const override = overrideByKey.get(key);
        if (override) {
          result.push({
            templateId: override._id,
            templateKey: key,
            title: key,
            subject:
              override.subjectOverride ?? override.subject ?? "(no subject)",
            hasOverride: true,
            designOverrideKey: override.designOverrideKey ?? "inherit",
            updatedAt: override.updatedAt,
          });
        }
        continue;
      }

      const override = overrideByKey.get(key);
      if (override) {
        result.push({
          templateId: override._id,
          templateKey: key,
          title: def.title,
          subject: override.subjectOverride ?? def.defaultSubject,
          hasOverride: true,
          designOverrideKey: override.designOverrideKey ?? "inherit",
          updatedAt: override.updatedAt,
        });
        continue;
      }

      result.push({
        templateKey: key,
        title: def.title,
        subject: def.defaultSubject,
        hasOverride: false,
        designOverrideKey: undefined,
      });
    }

    result.sort((a, b) => a.templateKey.localeCompare(b.templateKey));
    return result;
  },
});

export const resetTemplateOverride = mutation({
  args: {
    orgId: v.optional(v.id("organizations")),
    templateId: v.id("emailTemplates"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const orgId = normalizeOrgId(args.orgId ?? null);
    const doc = await ctx.db.get(args.templateId);
    if (!doc || doc.orgId !== orgId) {
      throw new ConvexError("Template override not found.");
    }
    await ctx.db.patch(doc._id, {
      subjectOverride: undefined,
      copyOverrides: {},
      designOverrideKey: "inherit",
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const getTemplateById = query({
  args: {
    orgId: v.optional(v.id("organizations")),
    templateId: v.id("emailTemplates"),
  },
  returns: v.union(
    v.object({
      _id: v.id("emailTemplates"),
      templateKey: v.string(),
      subjectOverride: v.optional(v.string()),
      copyOverrides: v.optional(v.record(v.string(), v.string())),
      designOverrideKey: v.optional(
        v.union(
          v.literal("inherit"),
          v.literal("clean"),
          v.literal("bold"),
          v.literal("minimal"),
        ),
      ),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const orgId = normalizeOrgId(args.orgId ?? null);
    const doc = await ctx.db.get(args.templateId);
    if (!doc) return null;
    if (doc.orgId !== orgId) {
      throw new ConvexError("Template not found.");
    }
    return {
      _id: doc._id,
      templateKey: doc.templateKey,
      subjectOverride: doc.subjectOverride,
      copyOverrides: doc.copyOverrides,
      designOverrideKey: doc.designOverrideKey,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  },
});

export const getTemplateEditorById = query({
  args: {
    orgId: v.optional(v.id("organizations")),
    templateId: v.id("emailTemplates"),
  },
  returns: v.object({
    template: v.object({
      _id: v.id("emailTemplates"),
      templateKey: v.string(),
      subjectOverride: v.optional(v.string()),
      copyOverrides: v.optional(v.record(v.string(), v.string())),
      designOverrideKey: v.optional(
        v.union(
          v.literal("inherit"),
          v.literal("clean"),
          v.literal("bold"),
          v.literal("minimal"),
        ),
      ),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    definition: v.object({
      templateKey: v.string(),
      title: v.string(),
      defaultSubject: v.string(),
      copySchema: v.array(
        v.object({
          key: v.string(),
          label: v.string(),
          description: v.optional(v.string()),
          placeholder: v.optional(v.string()),
          multiline: v.optional(v.boolean()),
          kind: v.optional(
            v.union(
              v.literal("singleLine"),
              v.literal("multiLine"),
              v.literal("url"),
            ),
          ),
          maxLength: v.optional(v.number()),
        }),
      ),
      defaultCopy: v.record(v.string(), v.string()),
    }),
    orgDesignKey: v.union(
      v.literal("clean"),
      v.literal("bold"),
      v.literal("minimal"),
    ),
  }),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const orgId = normalizeOrgId(args.orgId ?? null);
    const doc = await ctx.db.get(args.templateId);
    if (!doc || doc.orgId !== orgId) {
      throw new ConvexError("Template not found.");
    }

    const def = getEmailTemplateDefinition(doc.templateKey);
    if (!def) {
      throw new ConvexError(
        `Template "${doc.templateKey}" is not implemented in React Email.`,
      );
    }

    const settings: Doc<"emailSettings"> | null = await ctx.db
      .query("emailSettings")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .first();
    const orgDesignKey = (settings?.designKey ?? "clean") as EmailDesignKey;

    return {
      template: {
        _id: doc._id,
        templateKey: doc.templateKey,
        subjectOverride: doc.subjectOverride,
        copyOverrides: doc.copyOverrides,
        designOverrideKey: doc.designOverrideKey,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      },
      definition: {
        templateKey: def.templateKey,
        title: def.title,
        defaultSubject: def.defaultSubject,
        copySchema: def.copySchema,
        defaultCopy: def.defaultCopy,
      },
      orgDesignKey,
    };
  },
});

export const previewTemplateInputById = internalQuery({
  args: {
    orgId: v.optional(v.id("organizations")),
    templateId: v.id("emailTemplates"),
    variables: v.optional(v.record(v.string(), v.string())),
  },
  returns: v.object({
    subject: v.string(),
    subjectTemplateUsed: v.string(),
    templateKey: v.string(),
    variables: v.record(v.string(), v.string()),
    copyUsed: v.record(v.string(), v.string()),
    designKey: v.union(
      v.literal("clean"),
      v.literal("bold"),
      v.literal("minimal"),
    ),
    warnings: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const orgId = normalizeOrgId(args.orgId ?? null);
    const doc = await ctx.db.get(args.templateId);
    if (!doc || doc.orgId !== orgId) {
      throw new ConvexError("Template not found.");
    }

    const vars: Record<string, string> = args.variables ?? {};
    const def = getEmailTemplateDefinition(doc.templateKey);
    if (!def) {
      throw new ConvexError(
        `Template "${doc.templateKey}" is not implemented in React Email.`,
      );
    }

    const settings: Doc<"emailSettings"> | null = await ctx.db
      .query("emailSettings")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .first();

    const orgDesign: EmailDesignKey = (settings?.designKey ??
      "clean") as EmailDesignKey;
    const templateDesignOverride: TemplateDesignOverrideKey =
      (doc.designOverrideKey ?? "inherit") as TemplateDesignOverrideKey;
    const designKey: EmailDesignKey =
      templateDesignOverride === "inherit"
        ? orgDesign
        : (templateDesignOverride as EmailDesignKey);

    const subjectTemplate = doc.subjectOverride ?? def.defaultSubject;
    const subject = interpolateTemplateVariables(subjectTemplate, vars);

    const mergedCopy: Record<string, string> = {
      ...def.defaultCopy,
      ...(doc.copyOverrides ?? {}),
    };
    for (const k in mergedCopy) {
      if (!Object.prototype.hasOwnProperty.call(mergedCopy, k)) continue;
      mergedCopy[k] = interpolateTemplateVariables(mergedCopy[k] ?? "", vars);
    }

    const warnings: string[] = [];
    if (def.requiredVariables && def.requiredVariables.length > 0) {
      const missing = def.requiredVariables.filter((key) => {
        const value = vars[key];
        return typeof value !== "string" || value.trim().length === 0;
      });
      if (missing.length > 0) {
        warnings.push(`Missing variables: ${missing.join(", ")}`);
      }
    }

    return {
      subject,
      subjectTemplateUsed: subjectTemplate,
      templateKey: doc.templateKey,
      variables: vars,
      copyUsed: mergedCopy,
      designKey,
      warnings,
    };
  },
});

export const previewTemplateInputByIdWithOverrides = internalQuery({
  args: {
    orgId: v.optional(v.id("organizations")),
    templateId: v.id("emailTemplates"),
    variables: v.optional(v.record(v.string(), v.string())),
    overrides: v.object({
      subjectOverride: v.optional(v.string()),
      copyOverrides: v.optional(v.record(v.string(), v.string())),
      designOverrideKey: v.optional(
        v.union(
          v.literal("inherit"),
          v.literal("clean"),
          v.literal("bold"),
          v.literal("minimal"),
        ),
      ),
    }),
  },
  returns: v.object({
    subject: v.string(),
    subjectTemplateUsed: v.string(),
    templateKey: v.string(),
    variables: v.record(v.string(), v.string()),
    copyUsed: v.record(v.string(), v.string()),
    designKey: v.union(
      v.literal("clean"),
      v.literal("bold"),
      v.literal("minimal"),
    ),
    warnings: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const orgId = normalizeOrgId(args.orgId ?? null);
    const doc = await ctx.db.get(args.templateId);
    if (!doc || doc.orgId !== orgId) {
      throw new ConvexError("Template not found.");
    }

    const vars: Record<string, string> = args.variables ?? {};
    const def = getEmailTemplateDefinition(doc.templateKey);
    if (!def) {
      throw new ConvexError(
        `Template "${doc.templateKey}" is not implemented in React Email.`,
      );
    }

    const settings: Doc<"emailSettings"> | null = await ctx.db
      .query("emailSettings")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .first();

    const orgDesign: EmailDesignKey = (settings?.designKey ??
      "clean") as EmailDesignKey;
    const overrideDesign: TemplateDesignOverrideKey = (args.overrides
      .designOverrideKey ??
      doc.designOverrideKey ??
      "inherit") as TemplateDesignOverrideKey;
    const designKey: EmailDesignKey =
      overrideDesign === "inherit"
        ? orgDesign
        : (overrideDesign as EmailDesignKey);

    const subjectTemplate =
      args.overrides.subjectOverride ??
      doc.subjectOverride ??
      def.defaultSubject;
    const subject = interpolateTemplateVariables(subjectTemplate, vars);

    const mergedCopy: Record<string, string> = {
      ...def.defaultCopy,
      ...(doc.copyOverrides ?? {}),
      ...(args.overrides.copyOverrides ?? {}),
    };
    for (const k in mergedCopy) {
      if (!Object.prototype.hasOwnProperty.call(mergedCopy, k)) continue;
      mergedCopy[k] = interpolateTemplateVariables(mergedCopy[k] ?? "", vars);
    }

    const warnings: string[] = [];
    if (def.requiredVariables && def.requiredVariables.length > 0) {
      const missing = def.requiredVariables.filter((key) => {
        const value = vars[key];
        return typeof value !== "string" || value.trim().length === 0;
      });
      if (missing.length > 0) {
        warnings.push(`Missing variables: ${missing.join(", ")}`);
      }
    }

    return {
      subject,
      subjectTemplateUsed: subjectTemplate,
      templateKey: doc.templateKey,
      variables: vars,
      copyUsed: mergedCopy,
      designKey,
      warnings,
    };
  },
});

export const ensureTemplateOverrideForKey = mutation({
  args: {
    orgId: v.optional(v.id("organizations")),
    templateKey: v.string(),
  },
  returns: v.id("emailTemplates"),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const orgId = normalizeOrgId(args.orgId ?? null);
    const key = args.templateKey;

    const def = getEmailTemplateDefinition(key);
    if (!def) {
      throw new ConvexError(
        `Template "${key}" is not implemented in React Email.`,
      );
    }

    const existing = await ctx.db
      .query("emailTemplates")
      .withIndex("by_org_and_key", (q) =>
        q.eq("orgId", orgId).eq("templateKey", key),
      )
      .first();
    if (existing) return existing._id;

    const now = Date.now();
    return await ctx.db.insert("emailTemplates", {
      orgId,
      templateKey: key,
      subjectOverride: undefined,
      copyOverrides: {},
      designOverrideKey: "inherit",
      // legacy fields left undefined
      createdAt: now,
      updatedAt: now,
      updatedBy: undefined,
    });
  },
});

export const listOutbox = query({
  args: {
    orgId: v.optional(v.id("organizations")),
    paginationOpts: paginationOptsValidator,
    status: v.optional(
      v.union(v.literal("queued"), v.literal("sent"), v.literal("failed")),
    ),
  },
  returns: v.object({
    page: v.array(emailOutboxReturnValidator),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const orgId = normalizeOrgId(args.orgId ?? null);
    const status = args.status;
    const base = status
      ? ctx.db
          .query("emailOutbox")
          .withIndex("by_org_and_status", (q) =>
            q.eq("orgId", orgId).eq("status", status),
          )
      : ctx.db
          .query("emailOutbox")
          .withIndex("by_org_and_createdAt", (q) => q.eq("orgId", orgId));

    const result = await base.order("desc").paginate(args.paginationOpts);
    return {
      page: result.page,
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  },
});

export const updateSettings = mutation({
  args: {
    orgId: v.optional(v.id("organizations")),
    enabled: v.boolean(),
    fromName: v.string(),
    fromMode: v.union(v.literal("portal"), v.literal("custom")),
    fromLocalPart: v.string(),
    replyToEmail: v.optional(v.string()),
    designKey: v.optional(
      v.union(v.literal("clean"), v.literal("bold"), v.literal("minimal")),
    ),
  },
  returns: v.id("emailSettings"),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const orgId = normalizeOrgId(args.orgId ?? null);
    const now = Date.now();

    const { fromEmail } = await assertSenderAllowed(ctx, {
      orgId,
      fromMode: args.fromMode,
      fromLocalPart: args.fromLocalPart,
    });

    const existing = await ctx.db
      .query("emailSettings")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .first();

    const payload: Omit<Doc<"emailSettings">, "_id" | "_creationTime"> = {
      orgId,
      provider: "resend",
      enabled: args.enabled,
      fromName: args.fromName,
      fromEmail,
      fromMode: args.fromMode,
      fromLocalPart: args.fromLocalPart,
      replyToEmail: args.replyToEmail,
      designKey: args.designKey ?? existing?.designKey ?? "clean",
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      updatedBy: undefined,
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return existing._id;
    }
    return await ctx.db.insert("emailSettings", payload);
  },
});

export const upsertTemplate = mutation({
  args: {
    orgId: v.optional(v.id("organizations")),
    templateKey: v.string(),
    subjectOverride: v.optional(v.string()),
    copyOverrides: v.optional(v.record(v.string(), v.string())),
    designOverrideKey: v.optional(
      v.union(
        v.literal("inherit"),
        v.literal("clean"),
        v.literal("bold"),
        v.literal("minimal"),
      ),
    ),
  },
  returns: v.id("emailTemplates"),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const orgId = normalizeOrgId(args.orgId ?? null);
    const now = Date.now();

    const def = getEmailTemplateDefinition(args.templateKey);
    if (!def) {
      throw new ConvexError(
        `Template "${args.templateKey}" is not implemented in React Email.`,
      );
    }

    const existing = await ctx.db
      .query("emailTemplates")
      .withIndex("by_org_and_key", (q) =>
        q.eq("orgId", orgId).eq("templateKey", args.templateKey),
      )
      .first();

    const payload: Omit<Doc<"emailTemplates">, "_id" | "_creationTime"> = {
      orgId,
      templateKey: args.templateKey,
      subjectOverride: args.subjectOverride,
      copyOverrides: args.copyOverrides ?? {},
      designOverrideKey: args.designOverrideKey ?? "inherit",
      // legacy fields retained but not used
      subject: existing?.subject,
      markdownBody: existing?.markdownBody,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      updatedBy: undefined,
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return existing._id;
    }
    return await ctx.db.insert("emailTemplates", payload);
  },
});

export const migrateLegacyMarkdownTemplatesForOrg = mutation({
  args: {
    orgId: v.optional(v.id("organizations")),
  },
  returns: v.object({
    migratedCount: v.number(),
  }),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const orgId = normalizeOrgId(args.orgId ?? null);

    const docs = await ctx.db
      .query("emailTemplates")
      .withIndex("by_org_and_key", (q) => q.eq("orgId", orgId))
      .collect();

    let migratedCount = 0;
    for (const doc of docs) {
      const hasLegacy = Boolean(doc.markdownBody) || Boolean(doc.subject);
      const hasNew =
        doc.subjectOverride !== undefined ||
        (doc.copyOverrides && Object.keys(doc.copyOverrides).length > 0);
      if (!hasLegacy || hasNew) continue;

      await ctx.db.patch(doc._id, {
        subjectOverride: doc.subject ?? undefined,
        copyOverrides: {
          body: doc.markdownBody ?? "",
        },
        designOverrideKey: doc.designOverrideKey ?? "inherit",
        updatedAt: Date.now(),
      });
      migratedCount += 1;
    }

    return { migratedCount };
  },
});

export const queueRenderedEmail = internalMutation({
  args: {
    orgId: v.id("organizations"),
    to: v.string(),
    templateKey: v.string(),
    subject: v.string(),
    htmlBody: v.string(),
    textBody: v.string(),
    fromName: v.string(),
    fromEmail: v.string(),
    replyToEmail: v.optional(v.string()),
  },
  returns: v.id("emailOutbox"),
  handler: async (ctx, args) => {
    const now = Date.now();
    const outboxId = await ctx.db.insert("emailOutbox", {
      orgId: args.orgId,
      to: args.to,
      fromName: args.fromName,
      fromEmail: args.fromEmail,
      replyToEmail: args.replyToEmail,
      templateKey: args.templateKey,
      subject: args.subject,
      htmlBody: args.htmlBody,
      textBody: args.textBody,
      status: "queued",
      createdAt: now,
    });

    await ctx.scheduler.runAfter(
      0,
      internal.core.emails.service.internalSendQueuedEmail,
      { outboxId },
    );

    return outboxId;
  },
});

const resolveDesignKey = (args: {
  orgDesignKey: EmailDesignKey;
  templateOverrideKey?: TemplateDesignOverrideKey | null;
}): EmailDesignKey => {
  const override = args.templateOverrideKey ?? "inherit";
  if (override === "inherit") return args.orgDesignKey;
  return override;
};

const getTemplateDefOrThrow = (
  templateKey: string,
): EmailTemplateDefinition => {
  const def = getEmailTemplateDefinition(templateKey);
  if (!def) {
    throw new ConvexError(
      `Template "${templateKey}" is not implemented in React Email.`,
    );
  }
  return def;
};

export const sendTransactionalEmail = mutation({
  args: {
    orgId: v.optional(v.id("organizations")),
    to: v.string(),
    templateKey: v.string(),
    variables: v.optional(v.record(v.string(), v.string())),
  },
  returns: v.id("emailOutbox"),
  handler: async (ctx, args) => {
    // Rendering is performed in a Node action (React Email renderer depends on Node runtime).
    throw new ConvexError(
      "This endpoint has moved to a Node action. Use api.core.emails.reactEmailRender.sendTransactionalEmail.",
    );
  },
});

export const sendTestEmail = mutation({
  args: {
    orgId: v.optional(v.id("organizations")),
    to: v.string(),
  },
  returns: v.id("emailOutbox"),
  handler: async (ctx, args) => {
    throw new ConvexError(
      "This endpoint has moved to a Node action. Use api.core.emails.reactEmailRender.sendTestEmail.",
    );
  },
});

export const getSenderOptions = query({
  args: {
    orgId: v.optional(v.id("organizations")),
  },
  returns: v.object({
    portalDomain: v.string(),
    canUseCustomDomain: v.boolean(),
    customDomain: v.union(v.string(), v.null()),
    customDomainStatus: v.union(
      v.literal("unconfigured"),
      v.literal("pending"),
      v.literal("verified"),
      v.literal("error"),
    ),
  }),
  handler: async (ctx, args) => {
    const orgId = normalizeOrgId(args.orgId ?? null);
    const portalDomain = getPortalSendingDomain();

    const org: Doc<"organizations"> | null = await ctx.db.get(orgId);
    const customDomainStatus = org?.emailDomainStatus ?? "unconfigured";

    // Plan gating: “free and up” => all plans currently allow.
    // Keep the hook here so we can restrict later.
    const canUseCustomDomain = true;

    return {
      portalDomain,
      canUseCustomDomain,
      customDomain: org?.emailDomain?.trim().toLowerCase() ?? null,
      customDomainStatus,
    };
  },
});

// ---------- internal helpers for the send action ----------

export const getOutboxByIdInternal = internalQuery({
  args: {
    outboxId: v.id("emailOutbox"),
  },
  returns: v.union(emailOutboxReturnValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.outboxId);
  },
});

export const markOutboxSentInternal = internalMutation({
  args: {
    outboxId: v.id("emailOutbox"),
    providerMessageId: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.outboxId, {
      status: "sent",
      providerMessageId: args.providerMessageId,
      sentAt: Date.now(),
      error: undefined,
    });
    return null;
  },
});

export const markOutboxFailedInternal = internalMutation({
  args: {
    outboxId: v.id("emailOutbox"),
    error: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.outboxId, {
      status: "failed",
      error: args.error,
      sentAt: Date.now(),
    });
    return null;
  },
});

export const internalSendQueuedEmail = internalAction({
  args: {
    outboxId: v.id("emailOutbox"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      await ctx.runMutation(
        internal.core.emails.service.markOutboxFailedInternal,
        {
          outboxId: args.outboxId,
          error: "Missing RESEND_API_KEY",
        },
      );
      return null;
    }

    const outbox: Doc<"emailOutbox"> | null = await ctx.runQuery(
      internal.core.emails.service.getOutboxByIdInternal,
      { outboxId: args.outboxId },
    );
    if (!outbox) {
      return null;
    }

    if (outbox.status !== "queued") {
      return null;
    }

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
        await ctx.runMutation(
          internal.core.emails.service.markOutboxFailedInternal,
          {
            outboxId: outbox._id,
            error: `Resend error: ${response.status} ${errorText}`,
          },
        );
        return null;
      }

      const json = (await response.json()) as { id?: string } | null;
      await ctx.runMutation(
        internal.core.emails.service.markOutboxSentInternal,
        {
          outboxId: outbox._id,
          providerMessageId: json?.id,
        },
      );
      return null;
    } catch (err) {
      await ctx.runMutation(
        internal.core.emails.service.markOutboxFailedInternal,
        {
          outboxId: outbox._id,
          error: err instanceof Error ? err.message : String(err),
        },
      );
      return null;
    }
  },
});
