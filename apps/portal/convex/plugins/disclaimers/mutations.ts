/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { v } from "convex/values";

import { components as componentsTyped } from "../../_generated/api";
import { mutation } from "../../_generated/server";

const disclaimersMutations: any = (componentsTyped as any)
  .launchthat_disclaimers.mutations;
const disclaimersQueries: any = (componentsTyped as any).launchthat_disclaimers.queries;
const logsMutations: any = (componentsTyped as any).launchthat_logs.entries.mutations;

const stripUndefined = (value: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined));

export const upsertDisclaimerTemplateMeta = mutation({
  args: {
    postId: v.string(),
    organizationId: v.optional(v.string()),
    pdfFileId: v.optional(v.id("_storage")),
    consentText: v.optional(v.string()),
    description: v.optional(v.string()),
    builderTemplateJson: v.optional(v.string()),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const result: unknown = await ctx.runMutation(
      disclaimersMutations.upsertDisclaimerTemplateMeta,
      {
        ...args,
        postId: args.postId as any,
      },
    );
    return String(result);
  },
});

export const createManualIssue = mutation({
  args: {
    organizationId: v.optional(v.string()),
    templatePostId: v.string(),
    recipientEmail: v.string(),
    recipientName: v.optional(v.string()),
    recipientUserId: v.optional(v.string()),
  },
  returns: v.object({ issueId: v.string(), token: v.string() }),
  handler: async (ctx, args) => {
    const result = await ctx.runMutation(
      disclaimersMutations.createManualIssue,
      {
        ...args,
        templatePostId: args.templatePostId as any,
      },
    );
    return { issueId: String(result.issueId), token: result.token };
  },
});

export const createManualIssueFromPost = mutation({
  args: {
    organizationId: v.optional(v.string()),
    issuePostId: v.string(),
    templatePostId: v.string(),
    recipientEmail: v.string(),
    recipientName: v.optional(v.string()),
    recipientUserId: v.optional(v.string()),
  },
  returns: v.object({ issueId: v.string(), token: v.string() }),
  handler: async (ctx, args) => {
    const result = await ctx.runMutation(
      disclaimersMutations.createManualIssueFromPost,
      {
        ...args,
        issuePostId: args.issuePostId as any,
        templatePostId: args.templatePostId as any,
      },
    );
    return { issueId: String(result.issueId), token: result.token };
  },
});

export const resendIssue = mutation({
  args: {
    organizationId: v.optional(v.string()),
    issueId: v.string(),
  },
  returns: v.object({
    issueId: v.string(),
    token: v.string(),
    recipientUserId: v.optional(v.string()),
    recipientEmail: v.string(),
    templatePostId: v.string(),
  }),
  handler: async (ctx, args) => {
    const result = await ctx.runMutation(disclaimersMutations.resendIssue, {
      ...args,
      issueId: args.issueId as any,
    });
    return {
      issueId: String(result.issueId),
      token: result.token,
      recipientUserId: result.recipientUserId,
      recipientEmail: result.recipientEmail,
      templatePostId: String(result.templatePostId),
    };
  },
});

export const recordSigningView = mutation({
  args: {
    issueId: v.string(),
    tokenHash: v.string(),
    ip: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.runMutation(disclaimersMutations.recordSigningView, {
      issueId: args.issueId as any,
      tokenHash: args.tokenHash,
      ip: args.ip,
      userAgent: args.userAgent,
    });

    // Best-effort mirror into unified logs.
    try {
      const debug = await ctx.runQuery(disclaimersQueries.getSigningContextDebug, {
        issueId: args.issueId as any,
        tokenHash: args.tokenHash,
      });
      const organizationId =
        debug?.snapshot?.issueOrganizationId
          ? String(debug.snapshot.issueOrganizationId)
          : "";
      if (organizationId) {
        const meta = stripUndefined({
          issueId: String(args.issueId),
          ip: typeof args.ip === "string" ? args.ip : undefined,
          userAgent: typeof args.userAgent === "string" ? args.userAgent : undefined,
        });
        await ctx.runMutation(logsMutations.insertLogEntry as any, {
          organizationId,
          pluginKey: "disclaimers",
          kind: "disclaimers.viewed",
          level: "info",
          status: "complete",
          message: "Disclaimer viewed",
          scopeKind: "disclaimerIssue",
          scopeId: String(args.issueId),
          metadata: Object.keys(meta).length ? meta : undefined,
          createdAt: Date.now(),
        });
      }
    } catch (error) {
      console.error("[disclaimers.recordSigningView] log mirror failed:", error);
    }

    return null;
  },
});

export const recordSigningDownload = mutation({
  args: {
    issueId: v.string(),
    tokenHash: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Best-effort mirror into unified logs.
    try {
      const debug = await ctx.runQuery(disclaimersQueries.getSigningContextDebug, {
        issueId: args.issueId as any,
        tokenHash: args.tokenHash,
      });
      const organizationId =
        debug?.snapshot?.issueOrganizationId
          ? String(debug.snapshot.issueOrganizationId)
          : "";
      if (organizationId) {
        const meta = stripUndefined({
          issueId: String(args.issueId),
        });
        await ctx.runMutation(logsMutations.insertLogEntry as any, {
          organizationId,
          pluginKey: "disclaimers",
          kind: "disclaimers.downloaded",
          level: "info",
          status: "complete",
          message: "Disclaimer downloaded",
          scopeKind: "disclaimerIssue",
          scopeId: String(args.issueId),
          metadata: Object.keys(meta).length ? meta : undefined,
          createdAt: Date.now(),
        });
      }
    } catch (error) {
      console.error("[disclaimers.recordSigningDownload] log mirror failed:", error);
    }
    return null;
  },
});
