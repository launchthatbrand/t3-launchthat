import { v } from "convex/values";

import { internal } from "./_generated/api";
import { internalMutation, mutation } from "./server";

export const getDefaultSendingDomain = (): string => {
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  const configured = process.env.SENDING_DOMAIN ?? process.env.PORTAL_SENDING_DOMAIN;
  const normalized = configured?.trim().toLowerCase();
  const domain = normalized && normalized.length > 0 ? normalized : "launchthat.app";
  return domain.replace(/\.$/, "");
};

export const upsertEmailDomainState = internalMutation({
  args: {
    orgId: v.string(),
    domain: v.union(v.string(), v.null()),
    status: v.union(
      v.literal("unconfigured"),
      v.literal("pending"),
      v.literal("verified"),
      v.literal("error"),
    ),
    records: v.array(
      v.object({
        type: v.string(),
        name: v.string(),
        value: v.string(),
      }),
    ),
    lastError: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("emailDomains")
      .withIndex("by_org", (q: any) => q.eq("orgId", args.orgId))
      .first();
    const patch = {
      domain: args.domain,
      status: args.status,
      records: args.records,
      lastError: args.lastError?.trim() ? args.lastError.trim() : undefined,
      updatedAt: now,
    };
    if (existing) {
      await ctx.db.patch(existing._id, patch as any);
      return null;
    }
    await ctx.db.insert("emailDomains", { orgId: args.orgId, ...patch } as any);
    return null;
  },
});

export const setEmailDomain = mutation({
  args: {
    orgId: v.string(),
    domain: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    const normalized = args.domain?.trim().toLowerCase() ?? "";
    const value = normalized ? normalized.replace(/^www\./, "").replace(/\.$/, "") : null;

    const existing = await ctx.db
      .query("emailDomains")
      .withIndex("by_org", (q: any) => q.eq("orgId", args.orgId))
      .first();
    const patch = {
      domain: value,
      status: value ? ("pending" as const) : ("unconfigured" as const),
      records: [],
      lastError: value ? undefined : "Set an email domain to enable custom sending.",
      updatedAt: now,
    };
    if (existing) {
      await ctx.db.patch(existing._id, patch as any);
      return null;
    }
    await ctx.db.insert("emailDomains", { orgId: args.orgId, ...patch } as any);
    return null;
  },
});

export const upsertEmailSettings = mutation({
  args: {
    orgId: v.string(),
    enabled: v.boolean(),
    fromName: v.string(),
    fromMode: v.union(v.literal("portal"), v.literal("custom")),
    fromLocalPart: v.string(),
    replyToEmail: v.optional(v.string()),
    designKey: v.optional(
      v.union(v.literal("clean"), v.literal("bold"), v.literal("minimal")),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("emailSettings")
      .withIndex("by_org", (q: any) => q.eq("orgId", args.orgId))
      .first();

    const row = {
      orgId: args.orgId,
      provider: "resend" as const,
      fromName: args.fromName.trim() || "LaunchThat",
      fromMode: args.fromMode,
      fromLocalPart: args.fromLocalPart.trim() || "info",
      replyToEmail: args.replyToEmail?.trim() || undefined,
      designKey: args.designKey,
      enabled: args.enabled,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, row as any);
    } else {
      await ctx.db.insert("emailSettings", row as any);
    }
    return null;
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
    } as any);
    return null;
  },
});

export const markOutboxFailedInternal = internalMutation({
  args: { outboxId: v.id("emailOutbox"), error: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.outboxId, {
      status: "failed",
      error: args.error,
      sentAt: Date.now(),
    } as any);
    return null;
  },
});

export const resolveFromEmailForOrg = async (
  ctx: any,
  args: { orgId: any; fromMode: "portal" | "custom"; fromLocalPart: string },
) => {
  const local = args.fromLocalPart.trim() || "info";
  if (args.fromMode === "portal") {
    return `${local}@${getDefaultSendingDomain()}`;
  }
  const domainRow = await ctx.db
    .query("emailDomains")
    .withIndex("by_org", (q: any) => q.eq("orgId", args.orgId))
    .first();
  const status = domainRow?.status ?? "unconfigured";
  const domain = typeof domainRow?.domain === "string" ? domainRow.domain.trim().toLowerCase() : "";
  if (status !== "verified" || !domain) {
    throw new Error("Custom sender requires a verified email domain");
  }
  return `${local}@${domain}`;
};

export const enqueueEmailImpl = async (
  ctx: any,
  args: {
    orgId: any;
    to: string;
    subject: string;
    htmlBody: string;
    textBody: string;
    templateKey?: string;
  },
) => {
  const settings = await ctx.db
    .query("emailSettings")
    .withIndex("by_org", (q: any) => q.eq("orgId", args.orgId))
    .first();
  if (!settings) {
    throw new Error("Email settings not configured for this organization.");
  }

  const fromEmail = await resolveFromEmailForOrg(ctx, {
    orgId: args.orgId,
    fromMode: settings.fromMode,
    fromLocalPart: settings.fromLocalPart,
  });

  const outboxId = await ctx.db.insert("emailOutbox", {
    orgId: args.orgId,
    to: args.to.trim(),
    fromName: settings.fromName,
    fromEmail,
    replyToEmail: settings.replyToEmail,
    templateKey: args.templateKey,
    subject: args.subject,
    htmlBody: args.htmlBody,
    textBody: args.textBody,
    status: "queued",
    createdAt: Date.now(),
  } as any);

  // Schedule send via internal action in this component.
  await ctx.scheduler.runAfter(0, (internal as any).actions.sendQueuedEmail, {
    outboxId,
  });

  return outboxId;
};

export const enqueueEmail = mutation({
  args: {
    orgId: v.string(),
    to: v.string(),
    subject: v.string(),
    htmlBody: v.string(),
    textBody: v.string(),
    templateKey: v.optional(v.string()),
  },
  returns: v.id("emailOutbox"),
  handler: async (ctx, args) => {
    return await enqueueEmailImpl(ctx, {
      orgId: args.orgId,
      to: args.to,
      subject: args.subject,
      htmlBody: args.htmlBody,
      textBody: args.textBody,
      templateKey: args.templateKey,
    });
  },
});

export const enqueueTestEmail = mutation({
  args: {
    orgId: v.string(),
    to: v.string(),
  },
  returns: v.id("emailOutbox"),
  handler: async (ctx, args) => {
    const to = args.to.trim().toLowerCase();
    if (!to) throw new Error("Missing recipient email");
    const subject = "Test email";
    const htmlBody = `<div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; font-size: 14px; line-height: 1.5; color: #0f172a;"><p>This is a test email from LaunchThat.</p></div>`;
    const textBody = "This is a test email from LaunchThat.";

    return await enqueueEmailImpl(ctx, {
      orgId: args.orgId,
      to,
      subject,
      htmlBody,
      textBody,
      templateKey: "test",
    });
  },
});

