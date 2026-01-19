import { query } from "./server";
import { v } from "convex/values";

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

export const getOnboardingConfig = query({
  args: { organizationId: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      organizationId: v.string(),
      enabled: v.boolean(),
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      ctaLabel: v.optional(v.string()),
      ctaRoute: v.optional(v.string()),
      steps: v.array(
        v.object({
          id: v.string(),
          title: v.string(),
          description: v.optional(v.string()),
          route: v.optional(v.string()),
          required: v.optional(v.boolean()),
        }),
      ),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("onboardingConfigs")
      .withIndex("by_organizationId", (q: any) =>
        q.eq("organizationId", args.organizationId),
      )
      .unique();
    if (!row) return null;
    return {
      organizationId: row.organizationId,
      enabled: row.enabled,
      title: row.title ?? undefined,
      description: row.description ?? undefined,
      ctaLabel: row.ctaLabel ?? undefined,
      ctaRoute: row.ctaRoute ?? undefined,
      steps: row.steps,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  },
});

export const getOnboardingStatus = query({
  args: { organizationId: v.string(), userId: v.string() },
  returns: v.object({
    shouldBlock: v.boolean(),
    enabled: v.boolean(),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    ctaLabel: v.optional(v.string()),
    ctaRoute: v.optional(v.string()),
    steps: v.array(
      v.object({
        id: v.string(),
        title: v.string(),
        description: v.optional(v.string()),
        route: v.optional(v.string()),
        completed: v.boolean(),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    const config = await ctx.db
      .query("onboardingConfigs")
      .withIndex("by_organizationId", (q: any) =>
        q.eq("organizationId", args.organizationId),
      )
      .unique();

    if (!config || !config.enabled) {
      return {
        shouldBlock: false,
        enabled: false,
        title: config?.title ?? undefined,
        description: config?.description ?? undefined,
        ctaLabel: config?.ctaLabel ?? undefined,
        ctaRoute: config?.ctaRoute ?? undefined,
        steps: [],
      };
    }

    const progress = await ctx.db
      .query("onboardingProgress")
      .withIndex("by_organizationId_and_userId", (q: any) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("userId", args.userId),
      )
      .unique();

    const progressSteps: OnboardingProgressStep[] = Array.isArray(progress?.steps)
      ? (progress?.steps as OnboardingProgressStep[])
      : [];
    const completedIds = new Set(
      progressSteps.map((step: OnboardingProgressStep) => step.id),
    );

    const configSteps: OnboardingConfigStep[] = Array.isArray((config as any)?.steps)
      ? ((config as any).steps as OnboardingConfigStep[])
      : [];

    const steps = configSteps.map((step: OnboardingConfigStep) => ({
      id: step.id,
      title: step.title,
      description: step.description ?? undefined,
      route: step.route ?? undefined,
      completed: completedIds.has(step.id),
    }));
    const requiredSteps = configSteps.filter(
      (step: OnboardingConfigStep) => step.required !== false,
    );
    const requiredComplete = requiredSteps.every((step: OnboardingConfigStep) =>
      completedIds.has(step.id),
    );
    const isComplete = progress?.completed || requiredComplete;

    return {
      shouldBlock: config.enabled && !isComplete,
      enabled: config.enabled,
      title: config.title ?? undefined,
      description: config.description ?? undefined,
      ctaLabel: config.ctaLabel ?? undefined,
      ctaRoute: config.ctaRoute ?? undefined,
      steps,
    };
  },
});
