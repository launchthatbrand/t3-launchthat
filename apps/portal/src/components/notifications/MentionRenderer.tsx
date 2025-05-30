"use client";

import React from "react";
import Link from "next/link";

interface MentionRendererProps {
  content: string;
  className?: string;
}

export function MentionRenderer({
  content,
  className = "",
}: MentionRendererProps) {
  // Replace @username with linked spans
  const formatTextWithMentions = () => {
    // This simple regex matches @username patterns
    const mentionRegex = /@(\w+)/g;
    const parts: React.ReactNode[] = [];

    let lastIndex = 0;
    let match;

    // Find all mentions in the text
    while ((match = mentionRegex.exec(content)) !== null) {
      const username = match[1];
      const matchStart = match.index;
      const matchEnd = matchStart + match[0].length;

      // Add text before the mention
      if (matchStart > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {content.substring(lastIndex, matchStart)}
          </span>,
        );
      }

      // Add the mention as a styled link
      parts.push(
        <Link
          href={`/profile/${username}`}
          key={`mention-${matchStart}`}
          className="font-medium text-primary hover:underline"
        >
          @{username}
        </Link>,
      );

      lastIndex = matchEnd;
    }

    // Add remaining text after the last mention
    if (lastIndex < content.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>{content.substring(lastIndex)}</span>,
      );
    }

    return parts;
  };

  return <div className={className}>{formatTextWithMentions()}</div>;
}
