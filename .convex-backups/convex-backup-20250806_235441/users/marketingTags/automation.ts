import { internalMutation, mutation } from "../../_generated/server";

import { Id } from "../../_generated/dataModel";
import { internal } from "../../_generated/api";
import { v } from "convex/values";

/**
 * Automation functions for marketing tags
 * These can be called from other parts of the system to automatically assign/remove tags
 */

// Internal function to automatically assign a tag based on an event
export const autoAssignTagByTrigger = internalMutation({
  args: {
    userId: v.id("users"),
    triggerType: v.union(
      v.literal("course_completion"),
      v.literal("product_purchase"),
      v.literal("login_frequency"),
      v.literal("email_engagement"),
    ),
    triggerData: v.any(), // Event-specific data
  },
  returns: v.array(v.id("userMarketingTags")),
  handler: async (ctx, args) => {
    // Find all active rules that match this trigger type
    const rules = await ctx.db
      .query("marketingTagRules")
      .withIndex("by_trigger_type", (q) =>
        q.eq("triggerType", args.triggerType),
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const assignments: Id<"userMarketingTags">[] = [];

    for (const rule of rules) {
      try {
        // Check if trigger conditions are met
        const conditionsMet = checkTriggerConditions(
          rule.triggerConditions,
          args.triggerData,
        );

        if (!conditionsMet) continue;

        // Get the marketing tag
        const tag = await ctx.db.get(rule.marketingTagId);
        if (!tag || !tag.isActive) continue;

        // Check if user already has this tag
        const existingAssignment = await ctx.db
          .query("userMarketingTags")
          .withIndex("by_user_tag", (q) =>
            q
              .eq("userId", args.userId)
              .eq("marketingTagId", rule.marketingTagId),
          )
          .filter((q) => q.eq(q.field("isActive"), true))
          .unique();

        if (rule.action === "add" && !existingAssignment) {
          // Assign the tag
          const assignmentId = await ctx.db.insert("userMarketingTags", {
            userId: args.userId,
            marketingTagId: rule.marketingTagId,
            assignedAt: Date.now(),
            source: "automation",
            isActive: true,
          });
          assignments.push(assignmentId);

          // Update rule's last triggered time
          await ctx.db.patch(rule._id, {
            lastTriggeredAt: Date.now(),
          });
        } else if (rule.action === "remove" && existingAssignment) {
          // Remove the tag
          await ctx.db.patch(existingAssignment._id, {
            isActive: false,
          });

          // Update rule's last triggered time
          await ctx.db.patch(rule._id, {
            lastTriggeredAt: Date.now(),
          });
        } else if (rule.action === "toggle") {
          if (existingAssignment) {
            // Remove the tag
            await ctx.db.patch(existingAssignment._id, {
              isActive: false,
            });
          } else {
            // Add the tag
            const assignmentId = await ctx.db.insert("userMarketingTags", {
              userId: args.userId,
              marketingTagId: rule.marketingTagId,
              assignedAt: Date.now(),
              source: "automation",
              isActive: true,
            });
            assignments.push(assignmentId);
          }

          // Update rule's last triggered time
          await ctx.db.patch(rule._id, {
            lastTriggeredAt: Date.now(),
          });
        }
      } catch (error) {
        console.error(`Failed to process rule ${rule._id}:`, error);
      }
    }

    return assignments;
  },
});

// Helper function to check if trigger conditions are met
function checkTriggerConditions(conditions: any, triggerData: any): boolean {
  if (!conditions || typeof conditions !== "object") return true;

  try {
    switch (conditions.type) {
      case "course_completion":
        return checkCourseCompletionConditions(conditions, triggerData);
      case "product_purchase":
        return checkProductPurchaseConditions(conditions, triggerData);
      case "login_frequency":
        return checkLoginFrequencyConditions(conditions, triggerData);
      case "email_engagement":
        return checkEmailEngagementConditions(conditions, triggerData);
      default:
        return true;
    }
  } catch (error) {
    console.error("Error checking trigger conditions:", error);
    return false;
  }
}

function checkCourseCompletionConditions(
  conditions: any,
  triggerData: any,
): boolean {
  // Example: { courseIds: ["course1", "course2"], allRequired: false }
  if (conditions.courseIds && Array.isArray(conditions.courseIds)) {
    const completedCourseId = triggerData.courseId;
    const isTargetCourse = conditions.courseIds.includes(completedCourseId);
    return isTargetCourse;
  }
  return true;
}

function checkProductPurchaseConditions(
  conditions: any,
  triggerData: any,
): boolean {
  // Example: { productIds: ["product1"], minAmount: 100 }
  if (conditions.productIds && Array.isArray(conditions.productIds)) {
    const purchasedProductId = triggerData.productId;
    if (!conditions.productIds.includes(purchasedProductId)) return false;
  }

  if (conditions.minAmount && typeof conditions.minAmount === "number") {
    const purchaseAmount = triggerData.amount || 0;
    if (purchaseAmount < conditions.minAmount) return false;
  }

  return true;
}

function checkLoginFrequencyConditions(
  conditions: any,
  triggerData: any,
): boolean {
  // Example: { minLogins: 10, periodDays: 30 }
  if (conditions.minLogins && typeof conditions.minLogins === "number") {
    const loginCount = triggerData.loginCount || 0;
    if (loginCount < conditions.minLogins) return false;
  }
  return true;
}

function checkEmailEngagementConditions(
  conditions: any,
  triggerData: any,
): boolean {
  // Example: { minOpenRate: 0.5, minClickRate: 0.1 }
  if (conditions.minOpenRate && typeof conditions.minOpenRate === "number") {
    const openRate = triggerData.openRate || 0;
    if (openRate < conditions.minOpenRate) return false;
  }

  if (conditions.minClickRate && typeof conditions.minClickRate === "number") {
    const clickRate = triggerData.clickRate || 0;
    if (clickRate < conditions.minClickRate) return false;
  }

  return true;
}

/**
 * Convenience functions for specific events
 */

// Call this when a user completes a course
export const onCourseCompletion = mutation({
  args: {
    userId: v.id("users"),
    courseId: v.id("courses"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.scheduler.runAfter(
      0,
      internal.users.marketingTags.automation.autoAssignTagByTrigger,
      {
        userId: args.userId,
        triggerType: "course_completion",
        triggerData: {
          courseId: args.courseId,
          completedAt: Date.now(),
        },
      },
    );
    return null;
  },
});

// Call this when a user makes a purchase
export const onProductPurchase = mutation({
  args: {
    userId: v.id("users"),
    productId: v.string(),
    amount: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.scheduler.runAfter(
      0,
      internal.users.marketingTags.automation.autoAssignTagByTrigger,
      {
        userId: args.userId,
        triggerType: "product_purchase",
        triggerData: {
          productId: args.productId,
          amount: args.amount,
          purchasedAt: Date.now(),
        },
      },
    );
    return null;
  },
});

// Call this periodically to check login frequency
export const checkLoginFrequency = mutation({
  args: {
    userId: v.id("users"),
    loginCount: v.number(),
    periodDays: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.scheduler.runAfter(
      0,
      internal.users.marketingTags.automation.autoAssignTagByTrigger,
      {
        userId: args.userId,
        triggerType: "login_frequency",
        triggerData: {
          loginCount: args.loginCount,
          periodDays: args.periodDays,
          checkedAt: Date.now(),
        },
      },
    );
    return null;
  },
});

// Call this when email engagement metrics are updated
export const onEmailEngagement = mutation({
  args: {
    userId: v.id("users"),
    openRate: v.number(),
    clickRate: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.scheduler.runAfter(
      0,
      internal.users.marketingTags.automation.autoAssignTagByTrigger,
      {
        userId: args.userId,
        triggerType: "email_engagement",
        triggerData: {
          openRate: args.openRate,
          clickRate: args.clickRate,
          updatedAt: Date.now(),
        },
      },
    );
    return null;
  },
});
