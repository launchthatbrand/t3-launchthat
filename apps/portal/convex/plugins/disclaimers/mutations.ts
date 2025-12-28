/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { v } from "convex/values";

import { components as componentsTyped } from "../../_generated/api";
import { mutation } from "../../_generated/server";

const disclaimersMutations: any = (componentsTyped as any)
  .launchthat_disclaimers.mutations;

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
