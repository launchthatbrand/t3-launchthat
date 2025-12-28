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
      status: v.string(),
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
      audit: v.object({
        sentAt: v.optional(v.number()),
        firstViewedAt: v.optional(v.number()),
        lastViewedAt: v.optional(v.number()),
        viewCount: v.optional(v.number()),
        completedAt: v.optional(v.number()),
      }),
      template: v.object({
        postId: v.id("posts"),
        title: v.string(),
        pdfUrl: v.string(),
        pdfVersion: v.number(),
        consentText: v.string(),
        builderTemplateJson: v.optional(v.string()),
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
    const builderTemplateJson =
      typeof meta["disclaimer.builderTemplate"] === "string"
        ? (meta["disclaimer.builderTemplate"] as string)
        : undefined;
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
      audit: {
        sentAt: issue.lastSentAt ?? issue.createdAt,
        firstViewedAt: issue.firstViewedAt,
        lastViewedAt: issue.lastViewedAt,
        viewCount: issue.viewCount,
        completedAt: issue.completedAt,
      },
      template: {
        postId: templatePost._id,
        title: templatePost.title,
        pdfUrl,
        pdfVersion,
        consentText,
        builderTemplateJson,
      },
    };
  },
});

export const getTemplateBuilderContext = query({
  args: {
    templatePostId: v.id("posts"),
    organizationId: v.optional(v.string()),
  },
  returns: v.union(
    v.null(),
    v.object({
      pdfUrl: v.optional(v.string()),
      pdfVersion: v.number(),
      builderTemplateJson: v.optional(v.string()),
      title: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    const templatePost = await ctx.db.get(args.templatePostId);
    if (!templatePost) return null;
    if (
      (templatePost.postTypeSlug ?? "").toLowerCase() !== "disclaimertemplates"
    ) {
      return null;
    }
    if (
      !organizationMatches(
        templatePost.organizationId,
        args.organizationId ?? undefined,
      )
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
        ? (meta["disclaimer.pdfFileId"] as string)
        : "";
    const pdfVersion =
      typeof meta["disclaimer.pdfVersion"] === "number"
        ? (meta["disclaimer.pdfVersion"] as number)
        : 0;
    const builderTemplateJson =
      typeof meta["disclaimer.builderTemplate"] === "string"
        ? (meta["disclaimer.builderTemplate"] as string)
        : undefined;

    const pdfUrl =
      pdfFileId.trim().length > 0
        ? await ctx.storage.getUrl(pdfFileId as any)
        : null;

    return {
      pdfUrl: pdfUrl ?? undefined,
      pdfVersion,
      builderTemplateJson,
      title: typeof templatePost.title === "string" ? templatePost.title : undefined,
    };
  },
});

export const getSigningContextDebug = query({
  args: {
    issueId: v.id("disclaimerIssues"),
    tokenHash: v.string(),
  },
  returns: v.object({
    ok: v.boolean(),
    reason: v.string(),
    checks: v.object({
      issueFound: v.boolean(),
      tokenMatch: v.boolean(),
      templateFound: v.boolean(),
      organizationMatch: v.boolean(),
      templatePostTypeMatch: v.boolean(),
      templatePdfFileIdPresent: v.boolean(),
      templatePdfUrlResolved: v.boolean(),
    }),
    snapshot: v.object({
      issueId: v.union(v.string(), v.null()),
      issueOrganizationId: v.union(v.string(), v.null()),
      templatePostId: v.union(v.string(), v.null()),
      templateOrganizationId: v.union(v.string(), v.null()),
      templatePostTypeSlug: v.union(v.string(), v.null()),
      templatePdfFileId: v.union(v.string(), v.null()),
    }),
  }),
  handler: async (ctx, args) => {
    const issue = await ctx.db.get(args.issueId);
    const issueFound = Boolean(issue);
    const tokenMatch = Boolean(issue && issue.magicTokenHash === args.tokenHash);

    const templatePost = issue ? await ctx.db.get(issue.templatePostId) : null;
    const templateFound = Boolean(templatePost);

    const organizationMatch = Boolean(
      templatePost &&
        issue &&
        organizationMatches(
          templatePost.organizationId,
          issue.organizationId ?? undefined,
        ),
    );

    const templatePostTypeMatch = Boolean(
      templatePost &&
        (templatePost.postTypeSlug ?? "").toLowerCase() === "disclaimertemplates",
    );

    let templatePdfFileId: string | null = null;
    if (templatePost) {
      const metaRows = await ctx.db
        .query("postsMeta")
        .withIndex("by_post", (q) => q.eq("postId", templatePost._id))
        .collect();
      const meta = metaToRecord(metaRows);
      templatePdfFileId =
        typeof meta["disclaimer.pdfFileId"] === "string"
          ? (meta["disclaimer.pdfFileId"] as string)
          : null;
    }

    const templatePdfFileIdPresent = Boolean(templatePdfFileId);
    const templatePdfUrlResolved = Boolean(
      templatePdfFileId && (await ctx.storage.getUrl(templatePdfFileId as any)),
    );

    const checks = {
      issueFound,
      tokenMatch,
      templateFound,
      organizationMatch,
      templatePostTypeMatch,
      templatePdfFileIdPresent,
      templatePdfUrlResolved,
    };

    const ok =
      checks.issueFound &&
      checks.tokenMatch &&
      checks.templateFound &&
      checks.organizationMatch &&
      checks.templatePostTypeMatch &&
      checks.templatePdfFileIdPresent &&
      checks.templatePdfUrlResolved;

    const reason = !checks.issueFound
      ? "issue_not_found"
      : !checks.tokenMatch
        ? "token_hash_mismatch"
        : !checks.templateFound
          ? "template_post_not_found"
          : !checks.organizationMatch
            ? "organization_mismatch"
            : !checks.templatePostTypeMatch
              ? "template_post_type_mismatch"
              : !checks.templatePdfFileIdPresent
                ? "template_pdf_missing"
                : !checks.templatePdfUrlResolved
                  ? "template_pdf_url_unavailable"
                  : "ok";

    return {
      ok,
      reason,
      checks,
      snapshot: {
        issueId: issue ? String(issue._id) : null,
        issueOrganizationId: issue?.organizationId ?? null,
        templatePostId: issue ? String(issue.templatePostId) : null,
        templateOrganizationId: templatePost?.organizationId ?? null,
        templatePostTypeSlug: templatePost?.postTypeSlug ?? null,
        templatePdfFileId,
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

export const getSigningReceipt = query({
  args: {
    issueId: v.id("disclaimerIssues"),
    tokenHash: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      signedAt: v.number(),
      signedName: v.string(),
      signedEmail: v.string(),
      signedPdfUrl: v.union(v.string(), v.null()),
      pdfSha256: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const issue = await ctx.db.get(args.issueId);
    if (!issue) return null;
    if (issue.magicTokenHash !== args.tokenHash) return null;
    if (issue.status !== "complete") return null;

    const signature = await ctx.db
      .query("disclaimerSignatures")
      .withIndex("by_org_and_issue", (q) =>
        q
          .eq("organizationId", issue.organizationId ?? undefined)
          .eq("issueId", issue._id),
      )
      .order("desc")
      .first();
    if (!signature) return null;

    const signedPdfUrl = await ctx.storage.getUrl(signature.signedPdfFileId);

    return {
      signedAt: signature.createdAt,
      signedName: signature.signedName,
      signedEmail: signature.signedEmail,
      signedPdfUrl,
      pdfSha256: signature.pdfSha256,
    };
  },
});
