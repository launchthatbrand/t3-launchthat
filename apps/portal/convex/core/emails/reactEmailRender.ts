"use node";

/* eslint-disable
  @typescript-eslint/no-unsafe-assignment,
  @typescript-eslint/no-unsafe-member-access
*/
import type React from "react";
import { render } from "@react-email/render";
import { v } from "convex/values";

import type { Id } from "../../_generated/dataModel";
import { api, internal } from "../../_generated/api";
import { action } from "../../_generated/server";
import { buildEmailElement } from "./reactEmail";

type RenderFn = (
  element: React.ReactElement,
  options?: { plainText?: boolean },
) => Promise<string>;

const renderEmail = render as unknown as RenderFn;

interface SendMeta {
  orgId: Id<"organizations">;
  enabled: boolean;
  fromName: string;
  fromEmail: string;
  replyToEmail: string | null;
}

export const previewTemplateById = action({
  args: {
    orgId: v.optional(v.id("organizations")),
    templateId: v.id("emailTemplates"),
    variables: v.optional(v.record(v.string(), v.string())),
  },
  returns: v.object({
    subject: v.string(),
    subjectTemplateUsed: v.string(),
    html: v.string(),
    text: v.string(),
    designKey: v.union(
      v.literal("clean"),
      v.literal("bold"),
      v.literal("minimal"),
    ),
    copyUsed: v.record(v.string(), v.string()),
    warnings: v.array(v.string()),
  }),
  handler: async (
    ctx,
    args,
  ): Promise<{
    subject: string;
    subjectTemplateUsed: string;
    html: string;
    text: string;
    designKey: "clean" | "bold" | "minimal";
    copyUsed: Record<string, string>;
    warnings: string[];
  }> => {
    const input: {
      subject: string;
      subjectTemplateUsed: string;
      templateKey: string;
      variables: Record<string, string>;
      copyUsed: Record<string, string>;
      designKey: "clean" | "bold" | "minimal";
      warnings: string[];
    } = await ctx.runQuery(
      internal.core.emails.service.previewTemplateInputById,
      {
        orgId: args.orgId,
        templateId: args.templateId,
        variables: args.variables,
      },
    );

    const element = buildEmailElement({
      templateKey: input.templateKey,
      variables: input.variables,
      copy: input.copyUsed,
      designKey: input.designKey,
    });

    const html = await renderEmail(element);
    const text = await renderEmail(element, { plainText: true });

    return {
      subject: input.subject,
      subjectTemplateUsed: input.subjectTemplateUsed,
      html,
      text,
      designKey: input.designKey,
      copyUsed: input.copyUsed,
      warnings: input.warnings,
    };
  },
});

export const previewTemplateByIdWithOverrides = action({
  args: {
    orgId: v.optional(v.id("organizations")),
    templateId: v.id("emailTemplates"),
    variables: v.optional(v.record(v.string(), v.string())),
    overrides: v.object({
      subjectOverride: v.optional(v.string()),
      copyOverrides: v.optional(v.record(v.string(), v.string())),
      designOverrideKey: v.optional(
        v.union(
          v.literal("inherit"),
          v.literal("clean"),
          v.literal("bold"),
          v.literal("minimal"),
        ),
      ),
    }),
  },
  returns: v.object({
    subject: v.string(),
    subjectTemplateUsed: v.string(),
    html: v.string(),
    text: v.string(),
    designKey: v.union(
      v.literal("clean"),
      v.literal("bold"),
      v.literal("minimal"),
    ),
    copyUsed: v.record(v.string(), v.string()),
    warnings: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const input: {
      subject: string;
      subjectTemplateUsed: string;
      templateKey: string;
      variables: Record<string, string>;
      copyUsed: Record<string, string>;
      designKey: "clean" | "bold" | "minimal";
      warnings: string[];
    } = await ctx.runQuery(
      internal.core.emails.service.previewTemplateInputByIdWithOverrides,
      {
        orgId: args.orgId,
        templateId: args.templateId,
        variables: args.variables,
        overrides: args.overrides,
      },
    );

    const element = buildEmailElement({
      templateKey: input.templateKey,
      variables: input.variables,
      copy: input.copyUsed,
      designKey: input.designKey,
    });

    const html = await renderEmail(element);
    const text = await renderEmail(element, { plainText: true });

    return {
      subject: input.subject,
      subjectTemplateUsed: input.subjectTemplateUsed,
      html,
      text,
      designKey: input.designKey,
      copyUsed: input.copyUsed,
      warnings: input.warnings,
    };
  },
});

export const sendTransactionalEmail = action({
  args: {
    orgId: v.optional(v.id("organizations")),
    to: v.string(),
    templateKey: v.string(),
    variables: v.optional(v.record(v.string(), v.string())),
  },
  returns: v.id("emailOutbox"),
  handler: async (ctx, args) => {
    // Ensure an override exists so we can resolve copy/design via the same path as the editor.
    const templateId: Id<"emailTemplates"> = await ctx.runMutation(
      api.core.emails.service.ensureTemplateOverrideForKey,
      { orgId: args.orgId, templateKey: args.templateKey },
    );

    const input: {
      subject: string;
      subjectTemplateUsed: string;
      templateKey: string;
      variables: Record<string, string>;
      copyUsed: Record<string, string>;
      designKey: "clean" | "bold" | "minimal";
      warnings: string[];
    } = await ctx.runQuery(
      internal.core.emails.service.previewTemplateInputById,
      {
        orgId: args.orgId,
        templateId,
        variables: args.variables,
      },
    );

    const element = buildEmailElement({
      templateKey: input.templateKey,
      variables: input.variables,
      copy: input.copyUsed,
      designKey: input.designKey,
    });

    const htmlBody = await renderEmail(element);
    const textBody = await renderEmail(element, { plainText: true });

    const sendMeta: SendMeta = await ctx.runQuery(
      internal.core.emails.service.getSendMetaForOrg,
      { orgId: args.orgId },
    );
    if (!sendMeta.enabled) {
      throw new Error("Email is not enabled for this organization.");
    }

    const outboxId: Id<"emailOutbox"> = await ctx.runMutation(
      internal.core.emails.service.queueRenderedEmail,
      {
        orgId: sendMeta.orgId,
        to: args.to,
        templateKey: input.templateKey,
        subject: input.subject,
        htmlBody,
        textBody,
        fromName: sendMeta.fromName,
        fromEmail: sendMeta.fromEmail,
        replyToEmail: sendMeta.replyToEmail ?? undefined,
      },
    );

    return outboxId;
  },
});

export const sendTransactionalEmailFromTenantSession = action({
  args: {
    organizationId: v.id("organizations"),
    sessionIdHash: v.string(),
    to: v.string(),
    templateKey: v.string(),
    variables: v.optional(v.record(v.string(), v.string())),
  },
  returns: v.id("emailOutbox"),
  handler: async (ctx, args) => {
    const templateId: Id<"emailTemplates"> = await ctx.runMutation(
      internal.core.emails.service.ensureTemplateOverrideForKeyFromTenantSession,
      {
        orgId: args.organizationId,
        sessionIdHash: args.sessionIdHash,
        templateKey: args.templateKey,
      },
    );

    const input: {
      subject: string;
      subjectTemplateUsed: string;
      templateKey: string;
      variables: Record<string, string>;
      copyUsed: Record<string, string>;
      designKey: "clean" | "bold" | "minimal";
      warnings: string[];
    } = await ctx.runQuery(
      internal.core.emails.service.previewTemplateInputByIdFromTenantSession,
      {
        orgId: args.organizationId,
        sessionIdHash: args.sessionIdHash,
        templateId,
        variables: args.variables,
      },
    );

    const element = buildEmailElement({
      templateKey: input.templateKey,
      variables: input.variables,
      copy: input.copyUsed,
      designKey: input.designKey,
    });

    const htmlBody = await renderEmail(element);
    const textBody = await renderEmail(element, { plainText: true });

    const sendMeta: SendMeta = await ctx.runQuery(
      internal.core.emails.service.getSendMetaForOrgFromTenantSession,
      { orgId: args.organizationId, sessionIdHash: args.sessionIdHash },
    );
    if (!sendMeta.enabled) {
      throw new Error("Email is not enabled for this organization.");
    }

    const outboxId: Id<"emailOutbox"> = await ctx.runMutation(
      internal.core.emails.service.queueRenderedEmail,
      {
        orgId: sendMeta.orgId,
        to: args.to,
        templateKey: input.templateKey,
        subject: input.subject,
        htmlBody,
        textBody,
        fromName: sendMeta.fromName,
        fromEmail: sendMeta.fromEmail,
        replyToEmail: sendMeta.replyToEmail ?? undefined,
      },
    );

    return outboxId;
  },
});

export const sendTestEmail = action({
  args: {
    orgId: v.optional(v.id("organizations")),
    to: v.string(),
  },
  returns: v.id("emailOutbox"),
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const outboxId: Id<"emailOutbox"> = await ctx.runAction(
      api.core.emails.reactEmailRender.sendTransactionalEmail,
      {
        orgId: args.orgId,
        to: args.to,
        templateKey: "core.email.test",
        variables: {
          appName: "LaunchThat",
          orgName: "LaunchThat",
          sentAt: now,
        },
      },
    );
    return outboxId;
  },
});
