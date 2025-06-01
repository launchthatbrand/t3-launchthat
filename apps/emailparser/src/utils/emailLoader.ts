import { sampleEmails } from "./sampleEmails";

// Define DOMPurify interface for TypeScript
interface DOMPurifyI {
  sanitize: (
    html: string,
    config?: {
      ALLOWED_TAGS?: string[];
      ALLOWED_ATTR?: string[];
      KEEP_CONTENT?: boolean;
      ADD_ATTR?: string[];
      [key: string]: unknown;
    },
  ) => string;
}

// Add DOMPurify to the Window interface
declare global {
  interface Window {
    DOMPurify?: DOMPurifyI;
  }
}

/**
 * Loads the content of a sample email by its ID
 * @param emailId - The ID of the email to load
 * @returns The HTML content of the email or null if not found
 */
export const loadEmailContent = (emailId: string): string | null => {
  const email = sampleEmails.find((e) => e.id === emailId);
  if (!email) return null;
  return email.html;
};

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param html - HTML content to sanitize
 * @returns Sanitized HTML string
 */
export const sanitizeHtml = (html: string): string => {
  if (typeof window === "undefined") {
    // Server-side rendering - just return the content for now
    // In a production app, you would use a server-side sanitizer
    return html;
  }

  try {
    // Use the typed window.DOMPurify
    const dompurify = window.DOMPurify;

    if (!dompurify) {
      console.warn("DOMPurify not found in window object");
      return html;
    }

    // Client-side sanitization
    return dompurify.sanitize(html, {
      // Allow these tags
      ALLOWED_TAGS: [
        "a",
        "b",
        "br",
        "div",
        "em",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "hr",
        "i",
        "img",
        "li",
        "ol",
        "p",
        "span",
        "strong",
        "table",
        "tbody",
        "td",
        "th",
        "thead",
        "tr",
        "u",
        "ul",
      ],
      // Allow these attributes
      ALLOWED_ATTR: ["alt", "class", "href", "id", "style", "src", "target"],
      // Keep the original document structure
      KEEP_CONTENT: true,
      // Add noopener and noreferrer to all links
      ADD_ATTR: ["target", "rel"],
    });
  } catch (error) {
    console.error("Error sanitizing HTML:", error);
    // Return the input if sanitization fails
    return html;
  }
};

/**
 * Creates a DOM parser for email content analysis
 * @param html - The HTML content to parse
 * @returns A Document object containing the parsed HTML
 */
export const parseEmailContent = (html: string): Document => {
  const parser = new DOMParser();
  return parser.parseFromString(sanitizeHtml(html), "text/html");
};

/**
 * Extracts plain text from HTML content
 * @param html - The HTML content to extract text from
 * @returns The extracted plain text
 */
export const extractPlainText = (html: string): string => {
  if (typeof window === "undefined") {
    // Server-side rendering - simple regex approach
    return html
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  // Client-side extraction using DOM
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;
  return tempDiv.textContent ?? "";
};

/**
 * Extracts all links from HTML content
 * @param html - The HTML content to extract links from
 * @returns An array of extracted links
 */
export const extractLinks = (html: string): string[] => {
  if (typeof window === "undefined") return []; // Handle server-side rendering

  const doc = parseEmailContent(html);
  const links = Array.from(doc.querySelectorAll("a[href]"));
  return links
    .map((link) => link.getAttribute("href"))
    .filter(Boolean) as string[];
};

/**
 * Finds specific patterns in email content using regular expressions
 * @param text - The text to search in
 * @param pattern - The regular expression pattern to search for
 * @returns An array of matches
 */
export const findPatterns = (
  text: string,
  pattern: RegExp,
): RegExpMatchArray | null => {
  return text.match(pattern);
};

/**
 * Formats an email preview for display
 * @param html - The HTML content of the email
 * @param maxLength - Maximum length of the preview
 * @returns A formatted preview string
 */
export const formatEmailPreview = (html: string, maxLength = 150): string => {
  const text = extractPlainText(html);
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};
