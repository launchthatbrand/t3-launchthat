const escapeHtml = (input: string) =>
  input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const renderInline = (input: string) => {
  let out = escapeHtml(input);

  // Links: [text](url)
  out = out.replaceAll(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_match, text: string, url: string) =>
      `<a href="${escapeHtml(url)}" target="_blank" rel="noreferrer">${escapeHtml(
        text,
      )}</a>`,
  );

  // Bold: **text**
  out = out.replaceAll(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  // Italic: *text*
  out = out.replaceAll(/\*([^*]+)\*/g, "<em>$1</em>");

  return out;
};

/**
 * Very small markdown -> HTML renderer for email templates.
 * Supports:
 * - headings (#, ##)
 * - paragraphs
 * - unordered lists (- item)
 * - bold/italic/links
 */
export const renderMarkdownToHtml = (markdown: string): string => {
  const lines = markdown.replaceAll("\r\n", "\n").split("\n");
  const html: string[] = [];

  let inList = false;
  const closeListIfNeeded = () => {
    if (inList) {
      html.push("</ul>");
      inList = false;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      closeListIfNeeded();
      continue;
    }

    if (trimmed.startsWith("## ")) {
      closeListIfNeeded();
      html.push(`<h2>${renderInline(trimmed.slice(3))}</h2>`);
      continue;
    }
    if (trimmed.startsWith("# ")) {
      closeListIfNeeded();
      html.push(`<h1>${renderInline(trimmed.slice(2))}</h1>`);
      continue;
    }

    if (trimmed.startsWith("- ")) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${renderInline(trimmed.slice(2))}</li>`);
      continue;
    }

    closeListIfNeeded();
    html.push(`<p>${renderInline(trimmed)}</p>`);
  }

  closeListIfNeeded();

  const body = html.join("\n");
  return `
<div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; font-size: 14px; line-height: 1.5; color: #0f172a;">
${body}
</div>
`.trim();
};

export const renderMarkdownToText = (markdown: string): string => {
  // Simple fallback: strip some common markdown syntax.
  return markdown
    .replaceAll("\r\n", "\n")
    .replaceAll(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
    .replaceAll(/\*\*([^*]+)\*\*/g, "$1")
    .replaceAll(/\*([^*]+)\*/g, "$1")
    .trim();
};

export const interpolateTemplateVariables = (
  input: string,
  variables: Record<string, string>,
): string => {
  let out = input;
  for (const [key, value] of Object.entries(variables)) {
    // {{key}}
    out = out.replaceAll(`{{${key}}}`, value);
  }
  return out;
};



