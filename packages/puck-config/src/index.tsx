import type { Config } from "@measured/puck";
import type { ReactNode } from "react";

export interface PuckConfigOptions {
  brandColor?: string;
  mutedColor?: string;
}

const defaultOptions: Required<PuckConfigOptions> = {
  brandColor: "#2563eb",
  mutedColor: "#f3f4f6",
};

const sectionRenderer = (
  props: { background?: "default" | "muted"; children?: ReactNode },
  { brandColor, mutedColor }: Required<PuckConfigOptions>,
) => {
  const background =
    props.background === "muted"
      ? mutedColor
      : props.background === "default"
        ? "#ffffff"
        : "#ffffff";

  return (
    <section
      style={{
        background,
        padding: "48px 24px",
        borderRadius: 16,
        border:
          props.background === "muted"
            ? `1px solid ${mutedColor}`
            : `1px solid ${brandColor}1A`,
      }}
    >
      <div style={{ margin: "0 auto", maxWidth: 960 }}>{props.children}</div>
    </section>
  );
};

export function createConfig(options: PuckConfigOptions = {}): Config {
  const resolved = { ...defaultOptions, ...options };

  return {
    components: {
      Hero: {
        label: "Hero",
        fields: {
          eyebrow: { type: "text", label: "Eyebrow" },
          title: { type: "text", label: "Title" },
          description: { type: "textarea", label: "Description" },
          ctaLabel: { type: "text", label: "Button label" },
          ctaHref: { type: "text", label: "Button link" },
        },
        defaultProps: {
          eyebrow: "Welcome",
          title: "Visual builder",
          description:
            "Compose landing pages and post layouts without touching code.",
          ctaLabel: "Get Started",
          ctaHref: "#",
        },
        render: (props) => (
          <div style={{ textAlign: "center", padding: "64px 0" }}>
            {props.eyebrow && (
              <p
                style={{
                  color: resolved.brandColor,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                {props.eyebrow}
              </p>
            )}
            <h1 style={{ fontSize: 48, margin: "16px 0" }}>{props.title}</h1>
            <p
              style={{
                fontSize: 20,
                color: "#4b5563",
                maxWidth: 720,
                margin: "0 auto 32px",
              }}
            >
              {props.description}
            </p>
            {props.ctaLabel && (
              <a
                href={props.ctaHref ?? "#"}
                style={{
                  background: resolved.brandColor,
                  color: "#fff",
                  padding: "14px 28px",
                  borderRadius: 999,
                  fontWeight: 600,
                  display: "inline-block",
                }}
              >
                {props.ctaLabel}
              </a>
            )}
          </div>
        ),
      },
      TextBlock: {
        label: "Text",
        fields: {
          content: { type: "textarea", label: "Content" },
        },
        defaultProps: {
          content:
            "Drop uplifting copy here. Markdown is supported for quick formatting.",
        },
        render: (props) => (
          <p style={{ fontSize: 18, lineHeight: 1.6 }}>{props.content}</p>
        ),
      },
      Button: {
        label: "Button",
        fields: {
          label: { type: "text", label: "Label" },
          href: { type: "text", label: "Link" },
          variant: {
            type: "select",
            label: "Variant",
            options: [
              { label: "Primary", value: "primary" },
              { label: "Secondary", value: "secondary" },
              { label: "Ghost", value: "ghost" },
            ],
          },
        },
        defaultProps: { label: "Learn more", href: "#", variant: "primary" },
        render: (props) => {
          const base: Record<string, string> = {
            display: "inline-block",
            borderRadius: "999px",
            padding: "12px 20px",
            fontWeight: "600",
            textDecoration: "none",
          };
          let style = {
            ...base,
            background: resolved.brandColor,
            color: "#fff",
          };
          if (props.variant === "secondary") {
            style = {
              ...base,
              background: resolved.mutedColor,
              color: "#111827",
            };
          }
          if (props.variant === "ghost") {
            style = {
              ...base,
              background: "transparent",
              color: resolved.brandColor,
              border: `1px solid ${resolved.brandColor}`,
            };
          }
          return (
            <a href={props.href ?? "#"} style={style}>
              {props.label}
            </a>
          );
        },
      },
      Section: {
        label: "Section",
        fields: {
          background: {
            type: "select",
            label: "Background",
            options: [
              { label: "Default", value: "default" },
              { label: "Muted", value: "muted" },
            ],
          },
        },
        defaultProps: { background: "default" },
        render: (props) => sectionRenderer(props, resolved),
      },
      FeatureGrid: {
        label: "Feature Grid",
        fields: {
          title: { type: "text", label: "Title" },
          items: {
            type: "array",
            label: "Features",
            of: {
              type: "object",
              fields: {
                heading: { type: "text", label: "Heading" },
                body: { type: "textarea", label: "Description" },
              },
            },
          },
        },
        defaultProps: {
          title: "Why teams love LaunchThat",
          items: [
            {
              heading: "Reusable sections",
              body: "Compose hero, text and grid blocks without touching code.",
            },
            {
              heading: "Live preview",
              body: "Update a layout in the builder and publish instantly.",
            },
            {
              heading: "Multi-tenant ready",
              body: "Each org gets their own page tree, similar to WordPress multisite.",
            },
          ],
        },
        render: (props) => (
          <div>
            {props.title && (
              <h2 style={{ fontSize: 32, marginBottom: 24 }}>{props.title}</h2>
            )}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
                gap: 20,
              }}
            >
              {(props.items ?? []).map((item, idx) => (
                <div
                  key={`feature-${idx}`}
                  style={{
                    border: `1px solid ${resolved.mutedColor}`,
                    borderRadius: 16,
                    padding: 16,
                    background: "#fff",
                  }}
                >
                  <h3 style={{ fontSize: 20, marginBottom: 8 }}>
                    {item?.heading}
                  </h3>
                  <p style={{ color: "#4b5563" }}>{item?.body}</p>
                </div>
              ))}
            </div>
          </div>
        ),
      },
      Columns: {
        label: "Two Column",
        fields: {
          left: { type: "textarea", label: "Left content" },
          right: { type: "textarea", label: "Right content" },
        },
        defaultProps: {
          left: "Use this area for copy, checklists, or testimonials.",
          right: "Add supporting imagery or bullets on the right.",
        },
        render: (props) => (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
              gap: 24,
              alignItems: "center",
            }}
          >
            <div>
              <p style={{ fontSize: 18, lineHeight: 1.6 }}>{props.left}</p>
            </div>
            <div
              style={{
                background: resolved.mutedColor,
                borderRadius: 16,
                padding: 24,
              }}
            >
              <p style={{ fontSize: 18, lineHeight: 1.6 }}>{props.right}</p>
            </div>
          </div>
        ),
      },
    },
  };
}

export const puckConfig = createConfig();
