import { v } from "convex/values";

import { mutation } from "./_generated/server";
import { upsertPostMeta } from "./posts/helpers";

const randomHex = (size = 32): string => {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

const sha256Hex = async (input: string): Promise<string> => {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const arr = new Uint8Array(digest);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

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

export const upsertDisclaimerTemplateMeta = mutation({
  args: {
    postId: v.id("posts"),
    organizationId: v.optional(v.string()),
    pdfFileId: v.optional(v.id("_storage")),
    consentText: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  returns: v.id("posts"),
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Template not found.");
    if ((post.postTypeSlug ?? "").toLowerCase() !== "disclaimertemplates") {
      throw new Error("Not a disclaimer template.");
    }
    if (
      (post.organizationId ?? undefined) !== (args.organizationId ?? undefined)
    ) {
      throw new Error("Template does not belong to this organization.");
    }

    const metaRows = await ctx.db
      .query("postsMeta")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();
    const meta = metaToRecord(metaRows);
    const currentVersion =
      typeof meta["disclaimer.pdfVersion"] === "number"
        ? (meta["disclaimer.pdfVersion"] as number)
        : 0;

    const updates: Record<string, string | number | boolean | null> = {};
    if (args.pdfFileId) {
      updates["disclaimer.pdfFileId"] = String(args.pdfFileId);
      updates["disclaimer.pdfVersion"] = currentVersion + 1;
    }
    if (typeof args.consentText === "string") {
      updates["disclaimer.consentText"] = args.consentText;
    }
    if (typeof args.description === "string") {
      updates["disclaimer.description"] = args.description;
    }

    if (Object.keys(updates).length > 0) {
      await upsertPostMeta(ctx, args.postId, updates);
    }
    await ctx.db.patch(args.postId, { updatedAt: Date.now() });
    return args.postId;
  },
});

export const createManualIssue = mutation({
  args: {
    organizationId: v.optional(v.string()),
    templatePostId: v.id("posts"),
    recipientEmail: v.string(),
    recipientName: v.optional(v.string()),
    recipientUserId: v.optional(v.string()),
  },
  returns: v.object({
    issueId: v.id("disclaimerIssues"),
    token: v.string(),
  }),
  handler: async (ctx, args) => {
    const orgId = args.organizationId ?? undefined;
    const recipientEmail = args.recipientEmail.trim().toLowerCase();
    if (!recipientEmail) throw new Error("Recipient email is required.");

    const templatePost = await ctx.db.get(args.templatePostId);
    if (!templatePost) throw new Error("Template not found.");
    if (
      (templatePost.postTypeSlug ?? "").toLowerCase() !== "disclaimertemplates"
    ) {
      throw new Error("Not a disclaimer template.");
    }
    if ((templatePost.organizationId ?? undefined) !== orgId) {
      throw new Error("Template does not belong to this organization.");
    }

    const metaRows = await ctx.db
      .query("postsMeta")
      .withIndex("by_post", (q) => q.eq("postId", args.templatePostId))
      .collect();
    const meta = metaToRecord(metaRows);
    const templateVersion =
      typeof meta["disclaimer.pdfVersion"] === "number"
        ? (meta["disclaimer.pdfVersion"] as number)
        : 1;

    const existing = await ctx.db
      .query("disclaimerIssues")
      .withIndex("by_org_template_and_recipientEmail", (q) =>
        q
          .eq("organizationId", orgId)
          .eq("templatePostId", args.templatePostId)
          .eq("recipientEmail", recipientEmail),
      )
      .order("desc")
      .first();
    if (existing && existing.status === "incomplete") {
      const token = randomHex(32);
      const tokenHash = await sha256Hex(token);
      const now = Date.now();
      if (existing.issuePostId) {
        await ctx.db.patch(existing.issuePostId, {
          updatedAt: now,
        });
        await upsertPostMeta(ctx, existing.issuePostId, {
          "disclaimer.issueStatus": "incomplete",
          "disclaimer.lastSentAt": now,
          "disclaimer.sendCount": (existing.sendCount ?? 0) + 1,
        });
      }
      await ctx.db.patch(existing._id, {
        magicTokenHash: tokenHash,
        lastSentAt: now,
        sendCount: (existing.sendCount ?? 0) + 1,
        updatedAt: now,
      });
      return { issueId: existing._id, token };
    }

    const token = randomHex(32);
    const tokenHash = await sha256Hex(token);
    const now = Date.now();
    const templateTitle = templatePost.title ?? "Disclaimer";
    const issuePostId = await ctx.db.insert("posts", {
      title: `${templateTitle} — ${recipientEmail}`,
      slug: `disclaimer-${Date.now()}`,
      status: "draft",
      postTypeSlug: "disclaimers",
      organizationId: orgId,
      createdAt: now,
      updatedAt: now,
    });
    await upsertPostMeta(ctx, issuePostId, {
      "disclaimer.issueStatus": "incomplete",
      "disclaimer.templatePostId": String(args.templatePostId),
      "disclaimer.templateTitle": templateTitle,
      "disclaimer.recipientEmail": recipientEmail,
      "disclaimer.recipientName": args.recipientName ?? null,
      "disclaimer.recipientUserId": args.recipientUserId ?? null,
      "disclaimer.sendCount": 1,
      "disclaimer.lastSentAt": now,
    });

    const issueId = await ctx.db.insert("disclaimerIssues", {
      organizationId: orgId,
      issuePostId,
      templatePostId: args.templatePostId,
      templateVersion,
      status: "incomplete",
      recipientUserId: args.recipientUserId,
      recipientEmail,
      recipientName: args.recipientName,
      magicTokenHash: tokenHash,
      lastSentAt: now,
      sendCount: 1,
      createdAt: now,
      updatedAt: now,
    });
    await upsertPostMeta(ctx, issuePostId, {
      "disclaimer.issueId": String(issueId),
    });

    return { issueId, token };
  },
});

export const resendIssue = mutation({
  args: {
    organizationId: v.optional(v.string()),
    issueId: v.id("disclaimerIssues"),
  },
  returns: v.object({
    issueId: v.id("disclaimerIssues"),
    token: v.string(),
    recipientUserId: v.optional(v.string()),
    recipientEmail: v.string(),
    templatePostId: v.id("posts"),
  }),
  handler: async (ctx, args) => {
    const issue = await ctx.db.get(args.issueId);
    if (!issue) throw new Error("Issue not found.");
    if (
      (issue.organizationId ?? undefined) !== (args.organizationId ?? undefined)
    ) {
      throw new Error("Issue does not belong to this organization.");
    }

    const token = randomHex(32);
    const tokenHash = await sha256Hex(token);
    const now = Date.now();
    await ctx.db.patch(issue._id, {
      magicTokenHash: tokenHash,
      lastSentAt: now,
      sendCount: (issue.sendCount ?? 0) + 1,
      updatedAt: now,
    });

    return {
      issueId: issue._id,
      token,
      recipientUserId: issue.recipientUserId,
      recipientEmail: issue.recipientEmail,
      templatePostId: issue.templatePostId,
    };
  },
});

export const finalizeSignature = mutation({
  args: {
    organizationId: v.optional(v.string()),
    issueId: v.id("disclaimerIssues"),
    tokenHash: v.string(),
    signedName: v.string(),
    signedEmail: v.string(),
    signedByUserId: v.optional(v.string()),
    consentText: v.string(),
    signaturePngFileId: v.optional(v.id("_storage")),
    signedPdfFileId: v.id("_storage"),
    pdfSha256: v.string(),
    ip: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  returns: v.object({
    signatureId: v.id("disclaimerSignatures"),
    signedPdfFileId: v.id("_storage"),
  }),
  handler: async (ctx, args) => {
    const issue = await ctx.db.get(args.issueId);
    if (!issue) throw new Error("Issue not found.");
    if (issue.magicTokenHash !== args.tokenHash)
      throw new Error("Invalid token.");
    if (issue.status !== "incomplete")
      throw new Error("Issue is already complete.");

    const templatePost = await ctx.db.get(issue.templatePostId);
    if (!templatePost) throw new Error("Template not found.");
    const metaRows = await ctx.db
      .query("postsMeta")
      .withIndex("by_post", (q) => q.eq("postId", templatePost._id))
      .collect();
    const meta = metaToRecord(metaRows);
    const pdfFileId = meta["disclaimer.pdfFileId"];
    if (typeof pdfFileId !== "string" || !pdfFileId) {
      throw new Error("Template PDF is not configured.");
    }

    const now = Date.now();
    const signatureId = await ctx.db.insert("disclaimerSignatures", {
      organizationId: issue.organizationId,
      issueId: issue._id,
      signedByUserId: args.signedByUserId,
      signedName: args.signedName,
      signedEmail: args.signedEmail,
      signaturePngFileId: args.signaturePngFileId,
      signedPdfFileId: args.signedPdfFileId,
      pdfSha256: args.pdfSha256,
      ip: args.ip,
      userAgent: args.userAgent,
      consentText: args.consentText,
      createdAt: now,
    });

    await ctx.db.patch(issue._id, {
      status: "complete",
      completedAt: now,
      updatedAt: now,
    });

    if (issue.issuePostId) {
      await ctx.db.patch(issue.issuePostId, {
        status: "published",
        updatedAt: now,
      });
      await upsertPostMeta(ctx, issue.issuePostId, {
        "disclaimer.issueStatus": "complete",
        "disclaimer.completedAt": now,
        "disclaimer.signedPdfFileId": String(args.signedPdfFileId),
        "disclaimer.pdfSha256": args.pdfSha256,
      });
    }

    return { signatureId, signedPdfFileId: args.signedPdfFileId };
  },
});
