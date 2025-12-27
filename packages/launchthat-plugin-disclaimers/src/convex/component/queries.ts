import { v } from "convex/values";

import { query } from "./_generated/server";
import { organizationMatches } from "./posts/helpers";

type MetaRow = { key?: string; value?: string | number | boolean | null };

const metaToRecord = (
  rows: MetaRow[],
): Record<string, string | number | boolean | null> => {
  const out: Record<string, string | number | boolean | null> = {};
  for (const row of rows) {
    const key = typeof row.key === "string" ? row.key : "";
    if (!key) continue;
    out[key] = (row.value ?? null) as any;
  }
  return out;
};

export const listDisclaimerTemplates = query({
  args: {
    organizationId: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      id: v.id("posts"),
      title: v.string(),
      slug: v.string(),
      status: v.union(
        v.literal("published"),
        v.literal("draft"),
        v.literal("archived"),
      ),
      createdAt: v.number(),
      updatedAt: v.optional(v.number()),
      meta: v.record(
        v.string(),
        v.union(v.string(), v.number(), v.boolean(), v.null()),
      ),
      pdfUrl: v.union(v.string(), v.null()),
    }),
  ),
  handler: async (ctx, args) => {
    const organizationId = args.organizationId ?? undefined;
    const posts = organizationId
      ? await ctx.db
          .query("posts")
          .withIndex("by_org_postTypeSlug", (q) =>
            q
              .eq("organizationId", organizationId)
              .eq("postTypeSlug", "disclaimertemplates"),
          )
          .order("desc")
          .take(200)
      : await ctx.db
          .query("posts")
          .withIndex("by_postTypeSlug", (q) =>
            q.eq("postTypeSlug", "disclaimertemplates"),
          )
          .filter((q) => q.eq(q.field("organizationId"), undefined))
          .order("desc")
          .take(200);

    const result = [];
    for (const post of posts) {
      const metaRows = await ctx.db
        .query("postsMeta")
        .withIndex("by_post", (q) => q.eq("postId", post._id))
        .collect();
      const meta = metaToRecord(metaRows);
      const pdfFileId =
        typeof meta["disclaimer.pdfFileId"] === "string"
          ? meta["disclaimer.pdfFileId"]
          : null;
      const pdfUrl = pdfFileId
        ? ((await ctx.storage.getUrl(pdfFileId as any)) as string | null)
        : null;

      result.push({
        id: post._id,
        title: post.title,
        slug: post.slug,
        status: post.status,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        meta,
        pdfUrl,
      });
    }

    return result;
  },
});

export const listIssues = query({
  args: {
    organizationId: v.optional(v.string()),
    status: v.optional(v.union(v.literal("incomplete"), v.literal("complete"))),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      id: v.id("disclaimerIssues"),
      organizationId: v.optional(v.string()),
      templatePostId: v.id("posts"),
      templateVersion: v.number(),
      status: v.union(v.literal("incomplete"), v.literal("complete")),
      recipientUserId: v.optional(v.string()),
      recipientEmail: v.string(),
      recipientName: v.optional(v.string()),
      lastSentAt: v.optional(v.number()),
      sendCount: v.number(),
      completedAt: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const organizationId = args.organizationId ?? undefined;
    const limit = args.limit ?? 200;
    const status = args.status;
    const queryBuilder = status
      ? ctx.db
          .query("disclaimerIssues")
          .withIndex("by_org_and_status", (q) =>
            q.eq("organizationId", organizationId).eq("status", status),
          )
      : ctx.db
          .query("disclaimerIssues")
          .filter((q) => q.eq(q.field("organizationId"), organizationId));

    const issues = await queryBuilder.order("desc").take(limit);
    return issues.map((row) => ({
      id: row._id,
      organizationId: row.organizationId,
      templatePostId: row.templatePostId,
      templateVersion: row.templateVersion,
      status: row.status,
      recipientUserId: row.recipientUserId,
      recipientEmail: row.recipientEmail,
      recipientName: row.recipientName,
      lastSentAt: row.lastSentAt,
      sendCount: row.sendCount,
      completedAt: row.completedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  },
});

export const getSigningContext = query({
  args: {
    issueId: v.id("disclaimerIssues"),
    tokenHash: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      issueId: v.id("disclaimerIssues"),
      status: v.union(v.literal("incomplete"), v.literal("complete")),
      recipientEmail: v.string(),
      recipientName: v.optional(v.string()),
      template: v.object({
        postId: v.id("posts"),
        title: v.string(),
        pdfUrl: v.string(),
        pdfVersion: v.number(),
        consentText: v.string(),
      }),
    }),
  ),
  handler: async (ctx, args) => {
    const issue = await ctx.db.get(args.issueId);
    if (!issue) return null;
    if (issue.magicTokenHash !== args.tokenHash) return null;

    const templatePost = await ctx.db.get(issue.templatePostId);
    if (!templatePost) return null;
    if (
      !organizationMatches(
        templatePost.organizationId,
        issue.organizationId ?? undefined,
      )
    ) {
      return null;
    }
    if (
      (templatePost.postTypeSlug ?? "").toLowerCase() !== "disclaimertemplates"
    ) {
      return null;
    }

    const metaRows = await ctx.db
      .query("postsMeta")
      .withIndex("by_post", (q) => q.eq("postId", templatePost._id))
      .collect();
    const meta = metaToRecord(metaRows);
    const pdfFileId =
      typeof meta["disclaimer.pdfFileId"] === "string"
        ? meta["disclaimer.pdfFileId"]
        : "";
    const consentText =
      typeof meta["disclaimer.consentText"] === "string"
        ? (meta["disclaimer.consentText"] as string)
        : "I agree to the terms of this disclaimer.";
    const pdfVersion =
      typeof meta["disclaimer.pdfVersion"] === "number"
        ? (meta["disclaimer.pdfVersion"] as number)
        : issue.templateVersion;

    const pdfUrl = await ctx.storage.getUrl(pdfFileId as any);
    if (!pdfUrl) return null;

    return {
      issueId: issue._id,
      status: issue.status,
      recipientEmail: issue.recipientEmail,
      recipientName: issue.recipientName,
      template: {
        postId: templatePost._id,
        title: templatePost.title,
        pdfUrl,
        pdfVersion,
        consentText,
      },
    };
  },
});

export const getLatestSignatureForIssue = query({
  args: {
    organizationId: v.optional(v.string()),
    issueId: v.id("disclaimerIssues"),
  },
  returns: v.union(
    v.null(),
    v.object({
      signatureId: v.id("disclaimerSignatures"),
      signedPdfFileId: v.id("_storage"),
      signedPdfUrl: v.union(v.string(), v.null()),
      pdfSha256: v.string(),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const issue = await ctx.db.get(args.issueId);
    if (!issue) return null;
    if (
      (issue.organizationId ?? undefined) !== (args.organizationId ?? undefined)
    ) {
      return null;
    }

    const signature = await ctx.db
      .query("disclaimerSignatures")
      .withIndex("by_org_and_issue", (q) =>
        q
          .eq("organizationId", args.organizationId ?? undefined)
          .eq("issueId", args.issueId),
      )
      .order("desc")
      .first();
    if (!signature) return null;

    const signedPdfUrl = await ctx.storage.getUrl(signature.signedPdfFileId);

    return {
      signatureId: signature._id,
      signedPdfFileId: signature.signedPdfFileId,
      signedPdfUrl,
      pdfSha256: signature.pdfSha256,
      createdAt: signature.createdAt,
    };
  },
});
