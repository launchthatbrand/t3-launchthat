"use node";

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { v } from "convex/values";

import {
  api as apiTyped,
  components as componentsTyped,
} from "../../_generated/api";
import { action as actionTyped } from "../../_generated/server";

const resolvePortalOrigin = () =>
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  process.env.CLIENT_ORIGIN ?? "http://localhost:3024";

const buildSignUrl = (issueId: string, token: string) => {
  const url = new URL(
    `/disclaimers/${encodeURIComponent(issueId)}`,
    resolvePortalOrigin(),
  );
  url.searchParams.set("token", token);
  return url.toString();
};

const api = apiTyped as any;
const components = componentsTyped as any;
const action = actionTyped as any;

const disclaimersPostsQueries = components.launchthat_disclaimers.posts.queries;
const disclaimersActions = components.launchthat_disclaimers.actions;

export const issueDisclaimerAndSendEmail = action({
  args: {
    orgId: v.optional(v.string()),
    templatePostId: v.string(),
    recipientEmail: v.string(),
    recipientName: v.optional(v.string()),
    recipientUserId: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx: any, args: any) => {
    const created = (await ctx.runMutation(
      api.plugins.disclaimers.mutations.createManualIssue,
      {
        organizationId: args.orgId ? String(args.orgId) : undefined,
        templatePostId: args.templatePostId,
        recipientEmail: args.recipientEmail,
        recipientName: args.recipientName,
        recipientUserId: args.recipientUserId,
      },
    )) as { issueId: string; token: string };

    const signUrl = buildSignUrl(created.issueId, created.token);

    const templatePost = await ctx.runQuery(
      disclaimersPostsQueries.getPostById,
      {
        id: args.templatePostId,
        organizationId: args.orgId ? String(args.orgId) : undefined,
      },
    );
    const templateTitle =
      templatePost && typeof templatePost.title === "string"
        ? templatePost.title
        : "Disclaimer";

    await ctx.runAction(
      api.core.emails.reactEmailRender.sendTransactionalEmail,
      {
        orgId: args.orgId,
        to: args.recipientEmail,
        templateKey: "core.disclaimer.request",
        variables: {
          disclaimerTitle: templateTitle,
          signUrl,
        },
      },
    );

    return { issueId: created.issueId, signUrl };
  },
});

export const resendDisclaimerAndSendEmail = action({
  args: {
    orgId: v.optional(v.string()),
    issueId: v.string(),
  },
  returns: v.any(),
  handler: async (ctx: any, args: any) => {
    const result = (await ctx.runMutation(
      api.plugins.disclaimers.mutations.resendIssue,
      {
        organizationId: args.orgId ? String(args.orgId) : undefined,
        issueId: args.issueId,
      },
    )) as {
      issueId: string;
      token: string;
      recipientUserId?: string;
      recipientEmail: string;
      templatePostId: string;
    };

    const signUrl = buildSignUrl(result.issueId, result.token);

    const templatePost = await ctx.runQuery(
      disclaimersPostsQueries.getPostById,
      {
        id: result.templatePostId,
        organizationId: args.orgId ? String(args.orgId) : undefined,
      },
    );
    const templateTitle =
      templatePost && typeof templatePost.title === "string"
        ? templatePost.title
        : "Disclaimer";

    await ctx.runAction(
      api.core.emails.reactEmailRender.sendTransactionalEmail,
      {
        orgId: args.orgId,
        to: result.recipientEmail,
        templateKey: "core.disclaimer.request",
        variables: {
          disclaimerTitle: templateTitle,
          signUrl,
        },
      },
    );

    if (result.recipientUserId) {
      await ctx.runMutation(api.notifications.mutations.createNotification, {
        userId: result.recipientUserId,
        orgId: args.orgId,
        eventKey: "disclaimers.issue.resent",
        title: "Disclaimer resent",
        content: "A disclaimer has been resent and still needs your signature.",
        actionUrl: signUrl,
      });
    }

    return { issueId: result.issueId, signUrl };
  },
});

export const submitSignature = action({
  args: {
    issueId: v.string(),
    tokenHash: v.string(),
    signatureDataUrl: v.string(),
    signedName: v.string(),
    signedEmail: v.string(),
    consentText: v.string(),
    userAgent: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx: any, args: any) => {
    const result = (await ctx.runAction(disclaimersActions.submitSignature, {
      issueId: args.issueId,
      tokenHash: args.tokenHash,
      signatureDataUrl: args.signatureDataUrl,
      signedName: args.signedName,
      signedEmail: args.signedEmail,
      consentText: args.consentText,
      userAgent: args.userAgent,
    })) as { signatureId: string; signedPdfFileId: any };

    return {
      signatureId: String(result.signatureId),
      signedPdfFileId: String(result.signedPdfFileId),
    };
  },
});
