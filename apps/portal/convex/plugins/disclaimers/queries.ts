/* eslint-disable @typescript-eslint/no-explicit-any */
import { v } from "convex/values";

import { components as componentsTyped } from "../../_generated/api";
import { query } from "../../_generated/server";

const disclaimersQueries: any = (componentsTyped as any).launchthat_disclaimers
  .queries;

export const listDisclaimerTemplates = query({
  args: { organizationId: v.optional(v.string()) },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runQuery(disclaimersQueries.listDisclaimerTemplates, args);
  },
});

export const listIssues = query({
  args: {
    organizationId: v.optional(v.string()),
    status: v.optional(v.union(v.literal("incomplete"), v.literal("complete"))),
    limit: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runQuery(disclaimersQueries.listIssues, args);
  },
});

export const getSigningContext = query({
  args: {
    issueId: v.string(),
    tokenHash: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runQuery(disclaimersQueries.getSigningContext, {
      issueId: args.issueId as any,
      tokenHash: args.tokenHash,
    });
  },
});

export const getSigningContextDebug = query({
  args: {
    issueId: v.string(),
    tokenHash: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runQuery(disclaimersQueries.getSigningContextDebug, {
      issueId: args.issueId as any,
      tokenHash: args.tokenHash,
    });
  },
});

export const getLatestSignatureForIssue = query({
  args: {
    organizationId: v.optional(v.string()),
    issueId: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runQuery(disclaimersQueries.getLatestSignatureForIssue, {
      organizationId: args.organizationId,
      issueId: args.issueId as any,
    });
  },
});

export const getSigningReceipt = query({
  args: {
    issueId: v.string(),
    tokenHash: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runQuery(disclaimersQueries.getSigningReceipt, {
      issueId: args.issueId as any,
      tokenHash: args.tokenHash,
    });
  },
});

export const getSigningViewEvents = query({
  args: {
    issueId: v.string(),
    tokenHash: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runQuery(disclaimersQueries.getSigningViewEvents, {
      issueId: args.issueId as any,
      tokenHash: args.tokenHash,
      limit: args.limit,
    });
  },
});

export const getTemplateBuilderContext = query({
  args: {
    templatePostId: v.string(),
    organizationId: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.runQuery(disclaimersQueries.getTemplateBuilderContext, {
      templatePostId: args.templatePostId as any,
      organizationId: args.organizationId,
    });
  },
});
