import { v } from "convex/values";

import { mutation } from "./server";

interface OnboardingConfigStep {
  id: string;
  title: string;
  description?: string;
  route?: string;
  required?: boolean;
}

interface OnboardingProgressStep {
  id: string;
  completedAt: number;
}

const stepValidator = v.object({
  id: v.string(),
  title: v.string(),
  description: v.optional(v.string()),
  route: v.optional(v.string()),
  required: v.optional(v.boolean()),
});

export const upsertOnboardingConfig = mutation({
  args: {
    organizationId: v.string(),
    enabled: v.boolean(),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    ctaLabel: v.optional(v.string()),
    ctaRoute: v.optional(v.string()),
    steps: v.array(stepValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("onboardingConfigs")
      .withIndex("by_organizationId", (q: any) =>
        q.eq("organizationId", args.organizationId),
      )
      .unique();

    const payload = {
      organizationId: args.organizationId,
      enabled: args.enabled,
      title: args.title,
      description: args.description,
      ctaLabel: args.ctaLabel,
      ctaRoute: args.ctaRoute,
      steps: args.steps,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
    } else {
      await ctx.db.insert("onboardingConfigs", {
        ...payload,
        createdAt: now,
      });
    }
    return null;
  },
});

export const setStepComplete = mutation({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    stepId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    const progress = await ctx.db
      .query("onboardingProgress")
      .withIndex("by_organizationId_and_userId", (q: any) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("userId", args.userId),
      )
      .unique();

    const steps: OnboardingProgressStep[] = Array.isArray(progress?.steps)
      ? (progress?.steps as OnboardingProgressStep[])
      : [];
    if (!steps.some((step: OnboardingProgressStep) => step.id === args.stepId)) {
      steps.push({ id: args.stepId, completedAt: now });
    }

    const config = await ctx.db
      .query("onboardingConfigs")
      .withIndex("by_organizationId", (q: any) =>
        q.eq("organizationId", args.organizationId),
      )
      .unique();
    const configSteps: OnboardingConfigStep[] = Array.isArray((config as any)?.steps)
      ? ((config as any).steps as OnboardingConfigStep[])
      : [];
    const requiredSteps = configSteps.filter(
      (step: OnboardingConfigStep) => step.required !== false,
    );
    const completedIds = new Set(steps.map((step: OnboardingProgressStep) => step.id));
    const requiredComplete =
      requiredSteps && requiredSteps.length > 0
        ? requiredSteps.every((step: OnboardingConfigStep) =>
            completedIds.has(step.id),
          )
        : false;

    if (progress) {
      await ctx.db.patch(progress._id, {
        steps,
        completed: progress.completed || requiredComplete,
        completedAt: progress.completed
          ? progress.completedAt
          : requiredComplete
            ? now
            : undefined,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("onboardingProgress", {
        organizationId: args.organizationId,
        userId: args.userId,
        steps,
        completed: requiredComplete,
        completedAt: requiredComplete ? now : undefined,
        updatedAt: now,
      });
    }
    return null;
  },
});

export const markOnboardingComplete = mutation({
  args: {
    organizationId: v.string(),
    userId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    const progress = await ctx.db
      .query("onboardingProgress")
      .withIndex("by_organizationId_and_userId", (q: any) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("userId", args.userId),
      )
      .unique();

    if (progress) {
      await ctx.db.patch(progress._id, {
        completed: true,
        completedAt: now,
        updatedAt: now,
      });
      return null;
    }

    await ctx.db.insert("onboardingProgress", {
      organizationId: args.organizationId,
      userId: args.userId,
      completed: true,
      completedAt: now,
      steps: [],
      updatedAt: now,
    });
    return null;
  },
});
