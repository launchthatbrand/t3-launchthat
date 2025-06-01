import { gmail_v1 } from "googleapis";

/**
 * Decodes a base64 encoded string (with or without URL encoding)
 */
function decodeBase64(data: string): string {
  // Replace URL-safe characters back to their original form
  const sanitized = data.replace(/-/g, "+").replace(/_/g, "/");

  try {
    return Buffer.from(sanitized, "base64").toString("utf-8");
  } catch (error) {
    console.error("Error decoding base64 data:", error);
    return "";
  }
}

/**
 * Extracts text content from email parts
 */
function extractTextFromParts(
  parts: gmail_v1.Schema$MessagePart[] = [],
): string {
  let result = "";

  for (const part of parts) {
    if (part.mimeType === "text/plain" && part.body?.data) {
      result += decodeBase64(part.body.data);
    } else if (
      part.mimeType === "text/html" &&
      part.body?.data &&
      result === ""
    ) {
      // Only use HTML if we haven't found plain text
      // This is a simplistic approach - in production, you'd want HTML-to-text conversion
      const html = decodeBase64(part.body.data);
      result += html.replace(/<[^>]*>/g, " "); // Very basic HTML stripping
    } else if (part.parts) {
      // Recursive extraction for multipart messages
      result += extractTextFromParts(part.parts);
    }
  }

  return result;
}

/**
 * Parses email content from Gmail API message
 */
export function parseEmailContent(message: gmail_v1.Schema$Message): string {
  // For simple messages with body data directly available
  if (message.payload?.body?.data) {
    return decodeBase64(message.payload.body.data);
  }

  // For multipart messages
  if (message.payload?.parts) {
    return extractTextFromParts(message.payload.parts);
  }

  // Fallback
  return "No content found in email";
}
