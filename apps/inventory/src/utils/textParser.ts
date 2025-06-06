/**
 * Text parsing utilities for social feed features
 * Handles extraction and formatting of mentions and hashtags
 */

import { TextPart } from "./types";

/**
 * Extract all @mentions from a text string
 * @param text The text to parse
 * @returns Array of mention names (without the @ symbol)
 */
export function extractMentions(text: string): string[] {
  // Match @username patterns - usernames can contain letters, numbers, dots, and underscores
  // Must start with a letter and be at least 2 characters long
  const mentionRegex = /@([a-zA-Z][a-zA-Z0-9._]{1,})\b/g;
  const matches = text.match(mentionRegex) ?? [];

  // Remove the @ symbol from matches
  return matches.map((mention) => mention.substring(1));
}

/**
 * Extract all #hashtags from a text string
 * @param text The text to parse
 * @returns Array of hashtags (without the # symbol)
 */
export function extractHashtags(text: string): string[] {
  // Match #hashtag patterns - hashtags can contain letters, numbers, and underscores
  // Must start with # followed by at least one character
  const hashtagRegex = /#([a-zA-Z0-9_]{1,})\b/g;
  const matches = text.match(hashtagRegex) ?? [];

  // Remove the # symbol from matches
  return matches.map((hashtag) => hashtag.substring(1));
}

/**
 * Format text to convert mentions and hashtags to HTML
 * @param text The text to format
 * @returns HTML string with linked mentions and hashtags
 */
export function formatTextWithMentionsAndHashtags(text: string): string {
  // Handle mentions - replace with links
  let formattedText = text.replace(
    /@([a-zA-Z][a-zA-Z0-9._]{1,})\b/g,
    '<a href="/profile/$1" class="mention">@$1</a>',
  );

  // Handle hashtags - replace with links
  formattedText = formattedText.replace(
    /#([a-zA-Z0-9_]{1,})\b/g,
    '<a href="/hashtag/$1" class="hashtag">#$1</a>',
  );

  return formattedText;
}

/**
 * React-friendly formatter that returns parts array for rendering
 * @param text The text to parse
 * @returns Array of parts with type (regular, mention, hashtag) and content
 */
export function parseTextToReactParts(text: string): TextPart[] {
  const parts: TextPart[] = [];

  // Combined regex to match both mentions and hashtags
  const regex = /(@([a-zA-Z][a-zA-Z0-9._]{1,})\b)|(#([a-zA-Z0-9_]{1,})\b)/g;

  let lastIndex = 0;
  let match;

  // Find all matches and build parts array
  while ((match = regex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push({
        type: "text",
        content: text.substring(lastIndex, match.index),
      });
    }

    // Determine if this is a mention or hashtag
    if (match[1]) {
      // It's a mention
      parts.push({
        type: "mention",
        content: match[1], // Full match with @
        value: match[2], // Just the username without @
      });
    } else if (match[3]) {
      // It's a hashtag
      parts.push({
        type: "hashtag",
        content: match[3], // Full match with #
        value: match[4], // Just the tag without #
      });
    }

    lastIndex = regex.lastIndex;
  }

  // Add any remaining text
  if (lastIndex < text.length) {
    parts.push({
      type: "text",
      content: text.substring(lastIndex),
    });
  }

  return parts;
}
