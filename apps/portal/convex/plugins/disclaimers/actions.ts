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
const logsMutations = components.launchthat_logs.entries.mutations;

const stripUndefined = (value: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined));

const resolveActor = async (ctx: any) => {
  const identity = await ctx.auth.getUserIdentity();
  const tokenIdentifier =
    typeof identity?.tokenIdentifier === "string" ? identity.tokenIdentifier : null;
  const subject = typeof identity?.subject === "string" ? identity.subject : null;
  if (tokenIdentifier) {
    return await ctx.db
      .query("users")
      .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", tokenIdentifier))
      .unique();
  }
  if (subject) {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", subject))
      .unique();
  }
  return null;
};

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

    // Best-effort mirror into unified logs.
    try {
      const actor = await resolveActor(ctx);
      const email = String(args.recipientEmail ?? "").trim().toLowerCase();
      const meta = stripUndefined({
        issueId: String(created.issueId),
        templatePostId: String(args.templatePostId),
        issuePostId: args.issuePostId ? String(args.issuePostId) : undefined,
        recipientUserId: args.recipientUserId ? String(args.recipientUserId) : undefined,
      });
      if (args.orgId) {
        await ctx.runMutation(logsMutations.insertLogEntry as any, {
          organizationId: String(args.orgId),
          pluginKey: "disclaimers",
          kind: "disclaimers.issued",
          email: email || undefined,
          level: "info",
          status: "complete",
          message: `Issued disclaimer to ${email || "recipient"}`,
          scopeKind: "disclaimerIssue",
          scopeId: String(created.issueId),
          actorUserId: actor?._id ? String(actor._id) : undefined,
          metadata: Object.keys(meta).length ? meta : undefined,
          createdAt: Date.now(),
        });
      }
    } catch (error) {
      console.error("[disclaimers.issueDisclaimerAndSendEmail] log mirror failed:", error);
    }

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
    // Fetch org snapshot up-front (best-effort) so we can log regardless of action outcome.
    let orgIdForLog: string | null = null;
    let recipientEmailForLog: string | null = null;
    try {
      const debug = await ctx.runQuery(
        components.launchthat_disclaimers.queries.getSigningContextDebug,
        { issueId: args.issueId, tokenHash: args.tokenHash },
      );
      orgIdForLog =
        debug?.snapshot?.issueOrganizationId
          ? String(debug.snapshot.issueOrganizationId)
          : null;
      // If we can’t infer recipientEmail from debug, keep it null.
    } catch {
      // ignore
    }

    const result = (await ctx.runAction(disclaimersActions.submitSignature, {
      issueId: args.issueId,
      tokenHash: args.tokenHash,
      signatureDataUrl: args.signatureDataUrl,
      fieldSignatures: args.fieldSignatures,
      ip: args.ip,
      userAgent: args.userAgent,
    })) as { signatureId: string; signedPdfFileId: any };

    // Best-effort mirror into unified logs.
    try {
      const actor = await resolveActor(ctx);
      if (orgIdForLog) {
        const meta = stripUndefined({
          issueId: String(args.issueId),
          signatureId: String(result.signatureId),
          signedPdfFileId: String(result.signedPdfFileId),
          ip: typeof args.ip === "string" ? args.ip : undefined,
          userAgent: typeof args.userAgent === "string" ? args.userAgent : undefined,
        });
        await ctx.runMutation(logsMutations.insertLogEntry as any, {
          organizationId: String(orgIdForLog),
          pluginKey: "disclaimers",
          kind: "disclaimers.signed",
          email: recipientEmailForLog ?? undefined,
          level: "info",
          status: "complete",
          message: "Disclaimer signed",
          scopeKind: "disclaimerIssue",
          scopeId: String(args.issueId),
          actorUserId: actor?._id ? String(actor._id) : undefined,
          metadata: Object.keys(meta).length ? meta : undefined,
          createdAt: Date.now(),
        });
      }
    } catch (error) {
      console.error("[disclaimers.submitSignature] log mirror failed:", error);
    }

    return {
      signatureId: String(result.signatureId),
      signedPdfFileId: String(result.signedPdfFileId),
    };
  },
});
