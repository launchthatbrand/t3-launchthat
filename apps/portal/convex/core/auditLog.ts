import { defineTable, paginationOptsValidator } from "convex/server";
import { mutation, query } from "../_generated/server";

import { api } from "../_generated/api";
import { v } from "convex/values";

// Audit Log Schema
export const auditLogSchema = defineTable({
  // Core identification
  userId: v.optional(v.id("users")), // Optional for anonymous users
  sessionId: v.optional(v.string()),

  // Event details
  action: v.string(), // e.g., "login", "logout", "create_order", "view_page", "update_profile"
  resource: v.optional(v.string()), // e.g., "user", "order", "product", "chargeback"
  resourceId: v.optional(v.string()), // ID of the affected resource

  // Request context
  uri: v.string(), // The page/endpoint accessed
  method: v.optional(v.string()), // HTTP method: GET, POST, PUT, DELETE
  userAgent: v.optional(v.string()),
  referer: v.optional(v.string()),

  // Network information
  ipAddress: v.optional(v.string()),
  country: v.optional(v.string()),
  region: v.optional(v.string()),
  city: v.optional(v.string()),

  // Event metadata
  severity: v.union(
    v.literal("info"),
    v.literal("warning"),
    v.literal("error"),
    v.literal("critical"),
  ),
  category: v.union(
    v.literal("authentication"),
    v.literal("authorization"),
    v.literal("data_access"),
    v.literal("data_modification"),
    v.literal("system"),
    v.literal("ecommerce"),
    v.literal("navigation"),
    v.literal("security"),
  ),

  // Additional context
  details: v.optional(v.string()), // JSON string with additional context
  oldValues: v.optional(v.string()), // JSON string of previous values (for updates)
  newValues: v.optional(v.string()), // JSON string of new values (for updates)

  // Status and flags
  success: v.boolean(), // Whether the action was successful
  errorMessage: v.optional(v.string()),

  // Timestamps
  timestamp: v.number(), // When the event occurred
  processingTime: v.optional(v.number()), // How long the action took (in ms)
})
  .index("by_userId", ["userId"])
  .index("by_timestamp", ["timestamp"])
  .index("by_action", ["action"])
  .index("by_category", ["category"])
  .index("by_severity", ["severity"])
  .index("by_uri", ["uri"])
  .index("by_sessionId", ["sessionId"])
  .index("by_resourceType", ["resource"])
  .index("by_userId_timestamp", ["userId", "timestamp"])
  .index("by_action_timestamp", ["action", "timestamp"])
  .index("by_category_timestamp", ["category", "timestamp"]);

// CRUD Operations

// Create audit log entry
export const createAuditLogEntry = mutation({
  args: {
    userId: v.optional(v.id("users")),
    sessionId: v.optional(v.string()),
    action: v.string(),
    resource: v.optional(v.string()),
    resourceId: v.optional(v.string()),
    uri: v.string(),
    method: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    referer: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    country: v.optional(v.string()),
    region: v.optional(v.string()),
    city: v.optional(v.string()),
    severity: v.union(
      v.literal("info"),
      v.literal("warning"),
      v.literal("error"),
      v.literal("critical"),
    ),
    category: v.union(
      v.literal("authentication"),
      v.literal("authorization"),
      v.literal("data_access"),
      v.literal("data_modification"),
      v.literal("system"),
      v.literal("ecommerce"),
      v.literal("navigation"),
      v.literal("security"),
    ),
    details: v.optional(v.string()),
    oldValues: v.optional(v.string()),
    newValues: v.optional(v.string()),
    success: v.boolean(),
    errorMessage: v.optional(v.string()),
    processingTime: v.optional(v.number()),
  },
  returns: v.id("auditLog"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("auditLog", {
      ...args,
      timestamp: Date.now(),
    });
  },
});

// Get audit log entries with pagination
export const getAuditLogEntries = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("auditLog")
      .withIndex("by_timestamp")
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

// Get single audit log entry by ID
export const getAuditLogEntry = query({
  args: {
    auditLogId: v.id("auditLog"),
  },
  // returns: v.union(
  //   v.object({
  //     _id: v.id("auditLog"),
  //     _creationTime: v.number(),
  //     userId: v.optional(v.id("users")),
  //     sessionId: v.optional(v.string()),
  //     action: v.string(),
  //     resource: v.optional(v.string()),
  //     resourceId: v.optional(v.string()),
  //     uri: v.string(),
  //     method: v.optional(v.string()),
  //     userAgent: v.optional(v.string()),
  //     referer: v.optional(v.string()),
  //     ipAddress: v.optional(v.string()),
  //     country: v.optional(v.string()),
  //     region: v.optional(v.string()),
  //     city: v.optional(v.string()),
  //     severity: v.union(
  //       v.literal("info"),
  //       v.literal("warning"),
  //       v.literal("error"),
  //       v.literal("critical"),
  //     ),
  //     category: v.union(
  //       v.literal("authentication"),
  //       v.literal("authorization"),
  //       v.literal("data_access"),
  //       v.literal("data_modification"),
  //       v.literal("system"),
  //       v.literal("ecommerce"),
  //       v.literal("navigation"),
  //       v.literal("security"),
  //     ),
  //     details: v.optional(v.string()),
  //     oldValues: v.optional(v.string()),
  //     newValues: v.optional(v.string()),
  //     success: v.boolean(),
  //     errorMessage: v.optional(v.string()),
  //     timestamp: v.number(),
  //     processingTime: v.optional(v.number()),
  //   }),
  //   v.null(),
  // ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.auditLogId);
  },
});

// Get audit log entries for a specific user
export const getUserAuditLog = query({
  args: {
    userId: v.id("users"),
    paginationOpts: paginationOptsValidator,
    action: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },

  handler: async (ctx, args) => {
    let query = ctx.db
      .query("auditLog")
      .withIndex("by_userId_timestamp", (q) => {
        let expr = q.eq("userId", args.userId);
        if (args.startDate) {
          expr = expr.gte("timestamp", args.startDate);
        }
        if (args.endDate) {
          expr = expr.lte("timestamp", args.endDate);
        }
        return expr;
      });

    if (args.action) {
      query = query.filter((q) => q.eq(q.field("action"), args.action));
    }

    return await query.order("desc").paginate(args.paginationOpts);
  },
});

// Delete audit log entry (admin only)
export const deleteAuditLogEntry = mutation({
  args: {
    auditLogId: v.id("auditLog"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    // TODO: Add admin permission check
    // await requirePermission(ctx, "canManageAuditLog");

    await ctx.db.delete(args.auditLogId);
    return true;
  },
});

// Bulk delete audit log entries (admin only)
export const bulkDeleteAuditLogEntries = mutation({
  args: {
    auditLogIds: v.array(v.id("auditLog")),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    // TODO: Add admin permission check
    // await requirePermission(ctx, "canManageAuditLog");

    let deletedCount = 0;
    for (const id of args.auditLogIds) {
      await ctx.db.delete(id);
      deletedCount++;
    }
    return deletedCount;
  },
});

// Get audit log statistics
export const getAuditLogStats = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  returns: v.object({
    totalEntries: v.number(),
    entriesByCategory: v.object({
      authentication: v.number(),
      authorization: v.number(),
      data_access: v.number(),
      data_modification: v.number(),
      system: v.number(),
      ecommerce: v.number(),
      navigation: v.number(),
      security: v.number(),
    }),
    entriesBySeverity: v.object({
      info: v.number(),
      warning: v.number(),
      error: v.number(),
      critical: v.number(),
    }),
    successRate: v.number(),
    uniqueUsers: v.number(),
  }),
  handler: async (ctx, args) => {
    let query = ctx.db.query("auditLog");

    if (args.startDate || args.endDate) {
      query = query.withIndex("by_timestamp");
      if (args.startDate) {
        query = query.filter((q) =>
          q.gte(q.field("timestamp"), args.startDate),
        );
      }
      if (args.endDate) {
        query = query.filter((q) => q.lte(q.field("timestamp"), args.endDate));
      }
    }

    const entries = await query.collect();
    const totalEntries = entries.length;

    const entriesByCategory = {
      authentication: entries.filter((e) => e.category === "authentication")
        .length,
      authorization: entries.filter((e) => e.category === "authorization")
        .length,
      data_access: entries.filter((e) => e.category === "data_access").length,
      data_modification: entries.filter(
        (e) => e.category === "data_modification",
      ).length,
      system: entries.filter((e) => e.category === "system").length,
      ecommerce: entries.filter((e) => e.category === "ecommerce").length,
      navigation: entries.filter((e) => e.category === "navigation").length,
      security: entries.filter((e) => e.category === "security").length,
    };

    const entriesBySeverity = {
      info: entries.filter((e) => e.severity === "info").length,
      warning: entries.filter((e) => e.severity === "warning").length,
      error: entries.filter((e) => e.severity === "error").length,
      critical: entries.filter((e) => e.severity === "critical").length,
    };

    const successfulEntries = entries.filter((e) => e.success).length;
    const successRate =
      totalEntries > 0 ? (successfulEntries / totalEntries) * 100 : 0;

    const uniqueUserIds = new Set(entries.map((e) => e.userId).filter(Boolean));
    const uniqueUsers = uniqueUserIds.size;

    return {
      totalEntries,
      entriesByCategory,
      entriesBySeverity,
      successRate,
      uniqueUsers,
    };
  },
});

// Sample data creation for testing (temporary)
export const createSampleAuditLogs = mutation({
  args: {},
  returns: v.object({
    success: v.boolean(),
    count: v.number(),
    message: v.string(),
    mockUserId: v.optional(v.id("users")),
  }),
  handler: async (ctx) => {
    // Get or create mock user
    const mockUserResult = await ctx.runMutation(
      api.users.mockData.createMockUser,
      {},
    );

    if (!mockUserResult.success || !mockUserResult.userId) {
      throw new Error("Failed to create or retrieve mock user");
    }

    const mockUserId = mockUserResult.userId;
    const sampleLogs = [];

    // Sample actions for variety
    const sampleActions = [
      "Login Successful",
      "Password Changed",
      "Profile Updated",
      "Order Created",
      "Payment Processed",
      "File Downloaded",
      "Settings Modified",
      "Data Exported",
      "User Registered",
      "Session Expired",
      "Password Reset",
      "Two-Factor Enabled",
      "Product Viewed",
      "Cart Updated",
      "Checkout Initiated",
      "Invoice Generated",
    ];

    const sampleURIs = [
      "/api/auth/login",
      "/api/user/profile",
      "/api/orders/create",
      "/api/payments/process",
      "/api/files/download",
      "/api/settings/update",
      "/api/data/export",
      "/api/auth/register",
      "/api/auth/logout",
      "/api/auth/reset-password",
      "/api/security/2fa",
      "/api/products/view",
      "/api/cart/update",
      "/api/checkout/init",
      "/api/invoices/generate",
    ];

    for (let i = 0; i < 75; i++) {
      const actionIndex = Math.floor(Math.random() * sampleActions.length);
      const log = await ctx.db.insert("auditLog", {
        userId: mockUserId, // Assign to mock user
        sessionId: `session_${Date.now()}_${i}`,
        action: sampleActions[actionIndex],
        uri: sampleURIs[actionIndex] || `/api/sample/${i + 1}`,
        method: ["GET", "POST", "PUT", "DELETE"][Math.floor(Math.random() * 4)],
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        userAgent: "Mozilla/5.0 (Test Browser) AppleWebKit/537.36",
        referer: i > 0 ? `https://example.com/page${i}` : undefined,
        severity: ["info", "warning", "error", "critical"][
          Math.floor(Math.random() * 4)
        ] as any,
        category: [
          "authentication",
          "authorization",
          "data_access",
          "data_modification",
          "system",
          "ecommerce",
          "navigation",
          "security",
        ][Math.floor(Math.random() * 8)] as any,
        success: Math.random() > 0.15, // 85% success rate
        timestamp: Date.now() - i * 60000, // 1 minute apart
        details: `Mock audit log entry ${i + 1} for user testing - Action: ${sampleActions[actionIndex]}`,
        errorMessage:
          Math.random() > 0.85 ? `Sample error message ${i + 1}` : undefined,
        processingTime: Math.floor(Math.random() * 1000), // Random processing time in ms
        country: "United States",
        region: "California",
        city: "San Francisco",
      });
      sampleLogs.push(log);
    }

    return {
      success: true,
      count: sampleLogs.length,
      message: `Created ${sampleLogs.length} sample audit log entries for mock user`,
      mockUserId: mockUserId,
    };
  },
});
