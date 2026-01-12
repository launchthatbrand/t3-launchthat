import React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

// The React Email component types can be hard for TS/ESLint to resolve cleanly in mixed toolchains.
// Normalize them to React.ElementType for safe usage with React.createElement.
const HtmlEl = Html as unknown as React.ElementType;
const HeadEl = Head as unknown as React.ElementType;
const PreviewEl = Preview as unknown as React.ElementType;
const BodyEl = Body as unknown as React.ElementType;
const ContainerEl = Container as unknown as React.ElementType;
const TextEl = Text as unknown as React.ElementType;
const HrEl = Hr as unknown as React.ElementType;
const LinkEl = Link as unknown as React.ElementType;
const SectionEl = Section as unknown as React.ElementType;
const ButtonEl = Button as unknown as React.ElementType;

export type EmailDesignKey = "clean" | "bold" | "minimal";

export interface EmailCopyField {
  key: string;
  label: string;
  description?: string;
  placeholder?: string;
  multiline?: boolean;
  kind?: "singleLine" | "multiLine" | "url";
  maxLength?: number;
}

export interface EmailTemplateDefinition {
  templateKey: string;
  title: string;
  defaultSubject: string;
  previewText: string;
  requiredVariables?: string[];
  copySchema: EmailCopyField[];
  defaultCopy: Record<string, string>;
  render: (args: {
    variables: Record<string, string>;
    copy: Record<string, string>;
  }) => React.ReactElement;
}

export const EMAIL_TEMPLATE_REGISTRY: Record<string, EmailTemplateDefinition> =
  {
    "core.notification.event": {
      templateKey: "core.notification.event",
      title: "Notification event",
      defaultSubject: "{{title}}",
      previewText: "{{title}}",
      requiredVariables: ["title", "content", "actionUrl", "eventKey"],
      copySchema: [
        {
          key: "headline",
          label: "Headline",
          placeholder: "{{title}}",
          kind: "singleLine",
          maxLength: 140,
        },
        {
          key: "body",
          label: "Body",
          multiline: true,
          placeholder: "{{content}}",
          kind: "multiLine",
          maxLength: 4000,
        },
        {
          key: "ctaLabel",
          label: "CTA label",
          placeholder: "View",
          kind: "singleLine",
          maxLength: 60,
        },
        {
          key: "footer",
          label: "Footer",
          multiline: true,
          placeholder:
            "You received this because you enabled this notification.\nEvent: {{eventKey}}",
          kind: "multiLine",
          maxLength: 1000,
        },
      ],
      defaultCopy: {
        headline: "{{title}}",
        body: "{{content}}",
        ctaLabel: "View",
        footer:
          "You received this because you enabled this notification.\nEvent: {{eventKey}}",
      },
      render: ({ variables, copy }) => {
        const title = copy.headline ?? variables.title ?? "Notification";
        const body = copy.body ?? variables.content ?? "";
        const actionUrl = variables.actionUrl ?? "";
        const ctaLabel = copy.ctaLabel ?? "View";
        const footer = copy.footer ?? "";

        return React.createElement(
          React.Fragment,
          null,
          React.createElement(
            TextEl,
            {
              style: { fontSize: "18px", fontWeight: 700, margin: "0 0 12px" },
            },
            title,
          ),
          body
            ? React.createElement(
                TextEl,
                { style: { color: "#4b5563", margin: "0 0 16px" } },
                body,
              )
            : null,
          actionUrl
            ? React.createElement(
                SectionEl,
                { style: { margin: "16px 0 0" } },
                React.createElement(
                  ButtonEl,
                  {
                    href: actionUrl,
                    style: {
                      backgroundColor: "#111827",
                      color: "#ffffff",
                      borderRadius: "8px",
                      padding: "10px 16px",
                      textDecoration: "none",
                      display: "inline-block",
                    },
                  },
                  ctaLabel,
                ),
              )
            : null,
          footer
            ? React.createElement(
                React.Fragment,
                null,
                React.createElement(HrEl, { style: { margin: "16px 0" } }),
                React.createElement(
                  TextEl,
                  {
                    style: {
                      whiteSpace: "pre-line",
                      color: "#111827",
                      margin: 0,
                    },
                  },
                  footer,
                ),
              )
            : null,
        );
      },
    },
    "core.email.test": {
      templateKey: "core.email.test",
      title: "Test email",
      defaultSubject: "Test email from {{appName}}",
      previewText: "Test email",
      requiredVariables: ["appName", "orgName", "sentAt"],
      copySchema: [
        {
          key: "headline",
          label: "Headline",
          placeholder: "Test email",
          kind: "singleLine",
          maxLength: 120,
        },
        {
          key: "body",
          label: "Body",
          multiline: true,
          placeholder: "This is a test email from {{appName}}.",
          kind: "multiLine",
          maxLength: 2000,
        },
        {
          key: "footer",
          label: "Footer",
          multiline: true,
          placeholder: "Organization: {{orgName}}\nSent at: {{sentAt}}",
          kind: "multiLine",
          maxLength: 1000,
        },
      ],
      defaultCopy: {
        headline: "Test email",
        body: "This is a test email from {{appName}}.",
        footer: "Organization: {{orgName}}\nSent at: {{sentAt}}",
      },
      render: ({ copy }) =>
        React.createElement(
          React.Fragment,
          null,
          React.createElement(
            TextEl,
            {
              style: { fontSize: "18px", fontWeight: 700, margin: "0 0 12px" },
            },
            copy.headline ?? "",
          ),
          React.createElement(
            TextEl,
            { style: { color: "#4b5563", margin: "0 0 16px" } },
            copy.body ?? "",
          ),
          React.createElement(HrEl, { style: { margin: "16px 0" } }),
          React.createElement(
            TextEl,
            {
              style: {
                whiteSpace: "pre-line",
                color: "#111827",
                margin: 0,
              },
            },
            copy.footer ?? "",
          ),
        ),
    },

    "core.userInvite": {
      templateKey: "core.userInvite",
      title: "User invite",
      defaultSubject: "You're invited to {{appName}}",
      previewText: "You’re invited",
      requiredVariables: ["appName", "inviteeName", "inviteUrl"],
      copySchema: [
        {
          key: "headline",
          label: "Headline",
          placeholder: "You’re invited",
          kind: "singleLine",
          maxLength: 140,
        },
        {
          key: "body",
          label: "Body",
          multiline: true,
          placeholder:
            "Hi {{inviteeName}},\n\nYou've been invited to {{appName}}.",
          kind: "multiLine",
          maxLength: 3000,
        },
        {
          key: "ctaLabel",
          label: "Button label",
          placeholder: "Accept invite",
          kind: "singleLine",
          maxLength: 80,
        },
        {
          key: "finePrint",
          label: "Fine print",
          multiline: true,
          placeholder: "If the button doesn't work, copy/paste: {{inviteUrl}}",
          kind: "multiLine",
          maxLength: 1500,
        },
      ],
      defaultCopy: {
        headline: "You’re invited",
        body: "Hi {{inviteeName}},\n\nYou've been invited to {{appName}}.",
        ctaLabel: "Accept invite",
        finePrint:
          "If the button doesn't work, copy and paste this URL: {{inviteUrl}}",
      },
      render: ({ copy, variables }) => {
        const inviteUrl = variables.inviteUrl ?? "";
        return React.createElement(
          React.Fragment,
          null,
          React.createElement(
            TextEl,
            {
              style: { fontSize: "18px", fontWeight: 700, margin: "0 0 12px" },
            },
            copy.headline ?? "",
          ),
          React.createElement(
            TextEl,
            {
              style: {
                whiteSpace: "pre-line",
                color: "#4b5563",
                margin: "0 0 16px",
              },
            },
            copy.body ?? "",
          ),
          React.createElement(
            SectionEl,
            null,
            React.createElement(
              ButtonEl,
              {
                href: inviteUrl,
                style: {
                  display: "inline-block",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  backgroundColor: "#111827",
                  color: "#ffffff",
                  textDecoration: "none",
                  fontWeight: 600,
                },
              },
              copy.ctaLabel ?? "Open",
            ),
          ),
          React.createElement(
            TextEl,
            {
              style: {
                color: "#6b7280",
                fontSize: "12px",
                marginTop: "16px",
                whiteSpace: "pre-line",
              },
            },
            copy.finePrint ?? "",
          ),
        );
      },
    },

    "core.disclaimer.request": {
      templateKey: "core.disclaimer.request",
      title: "Disclaimer request",
      defaultSubject: "Please sign: {{disclaimerTitle}}",
      previewText: "Signature requested",
      requiredVariables: ["disclaimerTitle", "signUrl"],
      copySchema: [
        {
          key: "headline",
          label: "Headline",
          placeholder: "Signature requested",
          kind: "singleLine",
          maxLength: 140,
        },
        {
          key: "body",
          label: "Body",
          multiline: true,
          placeholder:
            "Please review and sign the following disclaimer:\n\n{{disclaimerTitle}}",
          kind: "multiLine",
          maxLength: 3000,
        },
        {
          key: "ctaLabel",
          label: "Button label",
          placeholder: "Review & sign",
          kind: "singleLine",
          maxLength: 80,
        },
        {
          key: "finePrint",
          label: "Fine print",
          multiline: true,
          placeholder:
            "If the button doesn't work, copy and paste: {{signUrl}}",
          kind: "multiLine",
          maxLength: 1500,
        },
      ],
      defaultCopy: {
        headline: "Signature requested",
        body: "Please review and sign the following disclaimer:\n\n{{disclaimerTitle}}",
        ctaLabel: "Review & sign",
        finePrint: "If the button doesn't work, copy and paste: {{signUrl}}",
      },
      render: ({ copy, variables }) => {
        const signUrl = variables.signUrl ?? "";
        return React.createElement(
          React.Fragment,
          null,
          React.createElement(
            TextEl,
            {
              style: { fontSize: "18px", fontWeight: 700, margin: "0 0 12px" },
            },
            copy.headline ?? "",
          ),
          React.createElement(
            TextEl,
            {
              style: {
                whiteSpace: "pre-line",
                color: "#4b5563",
                margin: "0 0 16px",
              },
            },
            copy.body ?? "",
          ),
          React.createElement(
            SectionEl,
            null,
            React.createElement(
              ButtonEl,
              {
                href: signUrl,
                style: {
                  display: "inline-block",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  backgroundColor: "#111827",
                  color: "#ffffff",
                  textDecoration: "none",
                  fontWeight: 600,
                },
              },
              copy.ctaLabel ?? "Open",
            ),
          ),
          React.createElement(
            TextEl,
            {
              style: {
                color: "#6b7280",
                fontSize: "12px",
                marginTop: "16px",
                whiteSpace: "pre-line",
              },
            },
            copy.finePrint ?? "",
          ),
        );
      },
    },
  };

export const listEmailTemplateKeys = (): string[] =>
  Object.keys(EMAIL_TEMPLATE_REGISTRY).sort((a, b) => a.localeCompare(b));

export const getEmailTemplateDefinition = (
  templateKey: string,
): EmailTemplateDefinition | null =>
  EMAIL_TEMPLATE_REGISTRY[templateKey] ?? null;

const wrapWithDesign = (args: {
  designKey: EmailDesignKey;
  previewText: string;
  children: React.ReactNode;
}) => {
  if (args.designKey === "minimal") {
    return React.createElement(
      HtmlEl,
      { lang: "en" },
      React.createElement(HeadEl, null),
      React.createElement(PreviewEl, null, args.previewText),
      React.createElement(
        BodyEl,
        { style: { backgroundColor: "#ffffff", padding: "24px" } },
        React.createElement(
          ContainerEl,
          { style: { padding: "0", maxWidth: "600px" } },
          args.children,
        ),
      ),
    );
  }

  if (args.designKey === "bold") {
    return React.createElement(
      HtmlEl,
      { lang: "en" },
      React.createElement(HeadEl, null),
      React.createElement(PreviewEl, null, args.previewText),
      React.createElement(
        BodyEl,
        { style: { backgroundColor: "#0b1220", padding: "24px" } },
        React.createElement(
          ContainerEl,
          {
            style: {
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              padding: "24px",
              maxWidth: "600px",
              border: "4px solid #111827",
            },
          },
          args.children,
        ),
      ),
    );
  }

  // clean (default)
  return React.createElement(
    HtmlEl,
    { lang: "en" },
    React.createElement(HeadEl, null),
    React.createElement(PreviewEl, null, args.previewText),
    React.createElement(
      BodyEl,
      { style: { backgroundColor: "#f6f9fc", padding: "24px" } },
      React.createElement(
        ContainerEl,
        {
          style: {
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            padding: "24px",
            maxWidth: "600px",
            border: "1px solid #e5e7eb",
          },
        },
        args.children,
      ),
    ),
  );
};

export interface RenderReactEmailArgs {
  templateKey: string;
  variables: Record<string, string>;
  copy: Record<string, string>;
  designKey: EmailDesignKey;
}

export const buildEmailElement = (
  args: RenderReactEmailArgs,
): React.ReactElement => {
  const def = getEmailTemplateDefinition(args.templateKey);
  if (!def) {
    throw new Error(
      `No React Email template registered for "${args.templateKey}"`,
    );
  }

  const content = def.render({ variables: args.variables, copy: args.copy });
  const element = wrapWithDesign({
    designKey: args.designKey,
    previewText: def.previewText,
    children: content,
  });

  return element;
};
