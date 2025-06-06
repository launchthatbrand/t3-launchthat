"use client";

import { useRouter } from "next/navigation";

import { parseTextToReactParts } from "../../utils/textParser";
import { TextPart } from "../../utils/types";

interface FormattedTextProps {
  text: string;
  className?: string;
}

export function FormattedText({ text, className = "" }: FormattedTextProps) {
  const router = useRouter();

  // Parse text into parts (text, mention, hashtag)
  const parts: TextPart[] = parseTextToReactParts(text);

  // Handle mention click
  const handleMentionClick = (username: string) => {
    router.push(`/profile/${username}`);
  };

  // Handle hashtag click
  const handleHashtagClick = (tag: string) => {
    router.push(`/hashtag/${tag}`);
  };

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.type === "mention") {
          return (
            <button
              key={`${part.type}-${index}`}
              className="font-medium text-primary hover:underline"
              onClick={() => handleMentionClick(part.value ?? "")}
            >
              {part.content}
            </button>
          );
        }

        if (part.type === "hashtag") {
          return (
            <button
              key={`${part.type}-${index}`}
              className="font-medium text-secondary hover:underline"
              onClick={() => handleHashtagClick(part.value ?? "")}
            >
              {part.content}
            </button>
          );
        }

        // Regular text
        return <span key={`text-${index}`}>{part.content}</span>;
      })}
    </span>
  );
}
