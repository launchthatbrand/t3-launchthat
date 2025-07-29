import { mutation, query } from "../../_generated/server";

import { v } from "convex/values";

// Get all evidence for a specific chargeback
export const getChargebackEvidence = query({
  args: {
    chargebackId: v.id("chargebacks"),
    documentType: v.optional(v.string()),
    submissionStatus: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      _id: v.id("chargebackEvidence"),
      _creationTime: v.number(),
      chargebackId: v.id("chargebacks"),
      documentType: v.union(
        v.literal("receipt"),
        v.literal("shipping_proof"),
        v.literal("customer_communication"),
        v.literal("refund_policy"),
        v.literal("terms_of_service"),
        v.literal("product_description"),
        v.literal("customer_signature"),
        v.literal("billing_statement"),
        v.literal("transaction_history"),
        v.literal("dispute_response"),
        v.literal("audit_log"),
        v.literal("other"),
      ),
      title: v.string(),
      description: v.optional(v.string()),
      fileStorageId: v.optional(v.id("_storage")),
      textContent: v.optional(v.string()),
      url: v.optional(v.string()),
      processorRelevance: v.optional(
        v.object({
          stripe: v.optional(v.boolean()),
          authorizeNet: v.optional(v.boolean()),
          paypal: v.optional(v.boolean()),
          square: v.optional(v.boolean()),
        }),
      ),
      submissionStatus: v.union(
        v.literal("draft"),
        v.literal("ready"),
        v.literal("submitted"),
        v.literal("accepted"),
        v.literal("rejected"),
      ),
      submittedAt: v.optional(v.number()),
      submittedBy: v.optional(v.string()),
      importance: v.union(
        v.literal("critical"),
        v.literal("high"),
        v.literal("medium"),
        v.literal("low"),
      ),
      tags: v.optional(v.array(v.string())),
      metadata: v.optional(v.any()),
    }),
  ),
  handler: async (ctx, args) => {
    const query = ctx.db
      .query("chargebackEvidence")
      .withIndex("by_chargebackId", (q) =>
        q.eq("chargebackId", args.chargebackId),
      );

    const result = await query.order("desc").collect();

    // Apply additional filters after collecting
    let filteredResult = result;

    if (args.documentType) {
      filteredResult = filteredResult.filter(
        (item) => item.documentType === args.documentType,
      );
    }

    if (args.submissionStatus) {
      filteredResult = filteredResult.filter(
        (item) => item.submissionStatus === args.submissionStatus,
      );
    }

    return filteredResult;
  },
});

// Get a single evidence document
export const getEvidence = query({
  args: { evidenceId: v.id("chargebackEvidence") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("chargebackEvidence"),
      _creationTime: v.number(),
      chargebackId: v.id("chargebacks"),
      documentType: v.union(
        v.literal("receipt"),
        v.literal("shipping_proof"),
        v.literal("customer_communication"),
        v.literal("refund_policy"),
        v.literal("terms_of_service"),
        v.literal("product_description"),
        v.literal("customer_signature"),
        v.literal("billing_statement"),
        v.literal("transaction_history"),
        v.literal("dispute_response"),
        v.literal("other"),
      ),
      title: v.string(),
      description: v.optional(v.string()),
      fileStorageId: v.optional(v.id("_storage")),
      textContent: v.optional(v.string()),
      url: v.optional(v.string()),
      processorRelevance: v.optional(
        v.object({
          stripe: v.optional(v.boolean()),
          authorizeNet: v.optional(v.boolean()),
          paypal: v.optional(v.boolean()),
          square: v.optional(v.boolean()),
        }),
      ),
      submissionStatus: v.union(
        v.literal("draft"),
        v.literal("ready"),
        v.literal("submitted"),
        v.literal("accepted"),
        v.literal("rejected"),
      ),
      submittedAt: v.optional(v.number()),
      submittedBy: v.optional(v.string()),
      importance: v.union(
        v.literal("critical"),
        v.literal("high"),
        v.literal("medium"),
        v.literal("low"),
      ),
      tags: v.optional(v.array(v.string())),
      metadata: v.optional(v.any()),
    }),
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.evidenceId);
  },
});

// Create new evidence document
export const createEvidence = mutation({
  args: {
    chargebackId: v.id("chargebacks"),
    documentType: v.union(
      v.literal("receipt"),
      v.literal("shipping_proof"),
      v.literal("customer_communication"),
      v.literal("refund_policy"),
      v.literal("terms_of_service"),
      v.literal("product_description"),
      v.literal("customer_signature"),
      v.literal("billing_statement"),
      v.literal("transaction_history"),
      v.literal("dispute_response"),
      v.literal("other"),
    ),
    title: v.string(),
    description: v.optional(v.string()),
    fileStorageId: v.optional(v.id("_storage")),
    textContent: v.optional(v.string()),
    url: v.optional(v.string()),
    processorRelevance: v.optional(
      v.object({
        stripe: v.optional(v.boolean()),
        authorizeNet: v.optional(v.boolean()),
        paypal: v.optional(v.boolean()),
        square: v.optional(v.boolean()),
      }),
    ),
    importance: v.union(
      v.literal("critical"),
      v.literal("high"),
      v.literal("medium"),
      v.literal("low"),
    ),
    tags: v.optional(v.array(v.string())),
    submittedBy: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  returns: v.id("chargebackEvidence"),
  handler: async (ctx, args) => {
    const evidenceId = await ctx.db.insert("chargebackEvidence", {
      ...args,
      submissionStatus: "draft",
    });
    return evidenceId;
  },
});

// Update evidence document
export const updateEvidence = mutation({
  args: {
    id: v.id("chargebackEvidence"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    fileStorageId: v.optional(v.id("_storage")),
    textContent: v.optional(v.string()),
    url: v.optional(v.string()),
    processorRelevance: v.optional(
      v.object({
        stripe: v.optional(v.boolean()),
        authorizeNet: v.optional(v.boolean()),
        paypal: v.optional(v.boolean()),
        square: v.optional(v.boolean()),
      }),
    ),
    submissionStatus: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("ready"),
        v.literal("submitted"),
        v.literal("accepted"),
        v.literal("rejected"),
      ),
    ),
    importance: v.optional(
      v.union(
        v.literal("critical"),
        v.literal("high"),
        v.literal("medium"),
        v.literal("low"),
      ),
    ),
    tags: v.optional(v.array(v.string())),
    metadata: v.optional(v.any()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    // Filter out undefined values
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined),
    );

    await ctx.db.patch(id, filteredUpdates);
    return null;
  },
});

// Submit evidence (mark as submitted)
export const submitEvidence = mutation({
  args: {
    evidenceIds: v.array(v.id("chargebackEvidence")),
    submittedBy: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    submittedCount: v.number(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      let submittedCount = 0;
      const now = Date.now();

      for (const evidenceId of args.evidenceIds) {
        const evidence = await ctx.db.get(evidenceId);
        if (evidence && evidence.submissionStatus !== "submitted") {
          await ctx.db.patch(evidenceId, {
            submissionStatus: "submitted",
            submittedAt: now,
            submittedBy: args.submittedBy,
          });
          submittedCount++;
        }
      }

      return { success: true, submittedCount };
    } catch (error) {
      console.error("Error submitting evidence:", error);
      return {
        success: false,
        submittedCount: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

// Delete evidence document
export const deleteEvidence = mutation({
  args: { id: v.id("chargebackEvidence") },
  returns: v.null(),
  handler: async (ctx, args) => {
    // First get the evidence to check if there's a file to delete
    const evidence = await ctx.db.get(args.id);

    // Delete the file from storage if it exists
    if (evidence?.fileStorageId) {
      await ctx.storage.delete(evidence.fileStorageId);
    }

    // Delete the evidence record
    await ctx.db.delete(args.id);
    return null;
  },
});

// Generate file upload URL for evidence
export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Get evidence summary statistics for a chargeback
export const getEvidenceSummary = query({
  args: { chargebackId: v.id("chargebacks") },
  returns: v.object({
    totalCount: v.number(),
    draftCount: v.number(),
    readyCount: v.number(),
    submittedCount: v.number(),
    acceptedCount: v.number(),
    rejectedCount: v.number(),
    criticalCount: v.number(),
    documentsWithFiles: v.number(),
    documentsWithText: v.number(),
    documentsWithUrls: v.number(),
  }),
  handler: async (ctx, args) => {
    const evidence = await ctx.db
      .query("chargebackEvidence")
      .withIndex("by_chargebackId", (q) =>
        q.eq("chargebackId", args.chargebackId),
      )
      .collect();

    return {
      totalCount: evidence.length,
      draftCount: evidence.filter((e) => e.submissionStatus === "draft").length,
      readyCount: evidence.filter((e) => e.submissionStatus === "ready").length,
      submittedCount: evidence.filter((e) => e.submissionStatus === "submitted")
        .length,
      acceptedCount: evidence.filter((e) => e.submissionStatus === "accepted")
        .length,
      rejectedCount: evidence.filter((e) => e.submissionStatus === "rejected")
        .length,
      criticalCount: evidence.filter((e) => e.importance === "critical").length,
      documentsWithFiles: evidence.filter((e) => e.fileStorageId).length,
      documentsWithText: evidence.filter((e) => e.textContent).length,
      documentsWithUrls: evidence.filter((e) => e.url).length,
    };
  },
});
