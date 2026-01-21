import { interpolateTemplateVariables, renderMarkdownToHtml, renderMarkdownToText } from "./render";

export type EmailDesignKey = "clean" | "bold" | "minimal";

export type EmailTemplateDefinition = {
  templateKey: string;
  defaultSubject: string;
  defaultCopy: Record<string, string>;
  requiredVariables: string[];
};

export const EMAIL_TEMPLATES: Record<string, EmailTemplateDefinition> = {
  "core.notification.event": {
    templateKey: "core.notification.event",
    defaultSubject: "{{title}}",
    requiredVariables: ["title", "content", "actionUrl", "eventKey"],
    defaultCopy: {
      headline: "{{title}}",
      body: "{{content}}",
      ctaLabel: "View",
      footer: "You received this because you enabled this notification.\nEvent: {{eventKey}}",
    },
  },
};

export const renderTemplate = (args: {
  templateKey: string;
  variables: Record<string, string>;
  subjectOverride?: string;
  copyOverrides?: Record<string, string>;
}): { subject: string; html: string; text: string; copyUsed: Record<string, string> } => {
  const def = EMAIL_TEMPLATES[args.templateKey];
  if (!def) {
    throw new Error(`Unknown templateKey: ${args.templateKey}`);
  }

  for (const key of def.requiredVariables) {
    if (!args.variables[key]) {
      throw new Error(`Missing template variable: ${key}`);
    }
  }

  const copyUsed: Record<string, string> = {
    ...def.defaultCopy,
    ...(args.copyOverrides ?? {}),
  };

  const subjectTemplate = args.subjectOverride?.trim() || def.defaultSubject;
  const subject = interpolateTemplateVariables(subjectTemplate, args.variables);

  const headline = interpolateTemplateVariables(copyUsed.headline ?? "", args.variables);
  const body = interpolateTemplateVariables(copyUsed.body ?? "", args.variables);
  const ctaLabel = interpolateTemplateVariables(copyUsed.ctaLabel ?? "View", args.variables);
  const footer = interpolateTemplateVariables(copyUsed.footer ?? "", args.variables);
  const actionUrl = args.variables.actionUrl ?? "";

  const markdown = [
    `## ${headline}`,
    "",
    body,
    "",
    actionUrl ? `[${ctaLabel}](${actionUrl})` : "",
    "",
    footer,
  ]
    .filter((l) => l !== "")
    .join("\n");

  const html = renderMarkdownToHtml(markdown);
  const text = renderMarkdownToText(markdown);

  return { subject, html, text, copyUsed };
};

