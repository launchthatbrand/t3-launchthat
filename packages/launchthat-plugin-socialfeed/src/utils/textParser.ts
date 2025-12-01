"use client";

import type { TextPart } from "./types";

const TOKEN_REGEX = /(@[a-zA-Z][\w._]{1,})|(#\w+)/g;

export function parseTextToReactParts(text: string): TextPart[] {
  if (!text) {
    return [];
  }

  const parts: TextPart[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = TOKEN_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: "text",
        content: text.slice(lastIndex, match.index),
      });
    }

    const token = match[0];
    if (token?.startsWith("@")) {
      parts.push({
        type: "mention",
        content: token,
        value: token.slice(1),
      });
    } else if (token?.startsWith("#")) {
      parts.push({
        type: "hashtag",
        content: token,
        value: token.slice(1).toLowerCase(),
      });
    }

    lastIndex = TOKEN_REGEX.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({
      type: "text",
      content: text.slice(lastIndex),
    });
  }

  return parts;
}
