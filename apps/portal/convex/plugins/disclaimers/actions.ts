"use node";

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { v } from "convex/values";
import { createHash } from "node:crypto";

import {
  api as apiTyped,
  components as componentsTyped,
} from "../../_generated/api";
import { action as actionTyped } from "../../_generated/server";

const resolvePortalOrigin = () =>
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  process.env.CLIENT_ORIGIN ?? "http://localhost:3024";

const normalizeClientOrigin = (value: unknown) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.origin;
  } catch {
    return null;
  }
};

const sha256Hex = (input: string) =>
  createHash("sha256").update(input, "utf8").digest("hex");

const buildSignUrl = (issueId: string, token: string, origin?: string | null) => {
  const url = new URL(
    `/disclaimer/${encodeURIComponent(issueId)}`,
    origin ?? resolvePortalOrigin(),
  );
  // Keep `token` for backwards-compat. Prefer `tokenHash` in new links so the
  // client doesn't need to hash (and we avoid subtle encoding mismatches).
  url.searchParams.set("token", token);
  url.searchParams.set("tokenHash", sha256Hex(token));
  return url.toString();
};

const api = apiTyped as any;
const components = componentsTyped as any;
const action = actionTyped as any;

const disclaimersPostsQueries = components.launchthat_disclaimers.posts.queries;
const disclaimersActions = components.launchthat_disclaimers.actions;

export const importTemplatePdfAndAttach = action({
  args: {
    orgId: v.optional(v.string()),
    templatePostId: v.string(),
    sourceUrl: v.string(),
    consentText: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx: any, args: any) => {
    const sourceUrl = String(args.sourceUrl ?? "").trim();
    if (!sourceUrl) {
      throw new Error("Missing source URL.");
    }

    // Copy the PDF into the Disclaimers component storage so `ctx.storage.getUrl`
    // inside the component can resolve it (component storage is scoped).
    const pdfFileId = await ctx.runAction(
      components.launchthat_disclaimers.actions.importTemplatePdfFromUrl,
      { sourceUrl },
    );

    await ctx.runMutation(api.plugins.disclaimers.mutations.upsertDisclaimerTemplateMeta, {
      postId: args.templatePostId,
      organizationId: args.orgId ? String(args.orgId) : undefined,
      pdfFileId: String(pdfFileId),
      consentText: args.consentText,
      description: args.description,
    });

    return { pdfFileId: String(pdfFileId) };
  },
});

export const issueDisclaimerAndSendEmail = action({
  args: {
    orgId: v.optional(v.string()),
    issuePostId: v.optional(v.string()),
    templatePostId: v.string(),
    recipientEmail: v.string(),
    recipientName: v.optional(v.string()),
    recipientUserId: v.optional(v.string()),
    clientOrigin: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx: any, args: any) => {
    const created = (await ctx.runMutation(
      args.issuePostId
        ? api.plugins.disclaimers.mutations.createManualIssueFromPost
        : api.plugins.disclaimers.mutations.createManualIssue,
      args.issuePostId
        ? {
            organizationId: args.orgId ? String(args.orgId) : undefined,
            issuePostId: args.issuePostId,
            templatePostId: args.templatePostId,
            recipientEmail: args.recipientEmail,
            recipientName: args.recipientName,
            recipientUserId: args.recipientUserId,
          }
        : {
            organizationId: args.orgId ? String(args.orgId) : undefined,
            templatePostId: args.templatePostId,
            recipientEmail: args.recipientEmail,
            recipientName: args.recipientName,
            recipientUserId: args.recipientUserId,
          },
    )) as { issueId: string; token: string };

    const signUrl = buildSignUrl(
      created.issueId,
      created.token,
      normalizeClientOrigin(args.clientOrigin),
    );

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
    clientOrigin: v.optional(v.string()),
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

    const signUrl = buildSignUrl(
      result.issueId,
      result.token,
      normalizeClientOrigin(args.clientOrigin),
    );

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
      await ctx.runMutation(api.core.notifications.mutations.createNotification, {
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
    signatureDataUrl: v.optional(v.string()),
    fieldSignatures: v.optional(
      v.array(
        v.object({
          fieldId: v.string(),
          signatureDataUrl: v.string(),
        }),
      ),
    ),
    ip: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  returns: v.any(),
  handler: async (ctx: any, args: any) => {
    const result = (await ctx.runAction(disclaimersActions.submitSignature, {
      issueId: args.issueId,
      tokenHash: args.tokenHash,
      signatureDataUrl: args.signatureDataUrl,
      fieldSignatures: args.fieldSignatures,
      ip: args.ip,
      userAgent: args.userAgent,
    })) as { signatureId: string; signedPdfFileId: any };

    return {
      signatureId: String(result.signatureId),
      signedPdfFileId: String(result.signedPdfFileId),
    };
  },
});
