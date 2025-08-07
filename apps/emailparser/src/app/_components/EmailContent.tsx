"use client";

import type { FC} from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { v4 as uuidv4 } from "uuid";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import type { Highlight} from "../../store";
import { useEmailParserStore } from "../../store";
import { sanitizeHtml } from "../../utils/emailLoader";

export const EmailContent: FC = () => {
  const selectedEmailId = useEmailParserStore((s) => s.selectedEmailId);
  const highlights = useEmailParserStore((s) => s.highlights);
  const addHighlight = useEmailParserStore((s) => s.addHighlight);
  const isOverlapping = useEmailParserStore((s) => s.isOverlapping);
  const getEmailHighlights = useEmailParserStore((s) => s.getEmailHighlights);
  const contentRef = useRef<HTMLDivElement>(null);
  const [emailHtml, setEmailHtml] = useState<string>("");
  const [_plainText, setPlainText] = useState<string>("");

  // Get the email from Convex using the selectedEmailId
  const email = useQuery(
    api.emails.get,
    selectedEmailId
      ? { id: selectedEmailId as unknown as Id<"emails"> }
      : "skip",
  );

  useEffect(() => {
    if (email && selectedEmailId) {
      // Set the sanitized HTML content
      setEmailHtml(sanitizeHtml(email.content));
      // Also extract plain text for easier searching/processing
      setPlainText(email.content.replace(/<[^>]*>/g, " "));
    } else {
      setEmailHtml("");
      setPlainText("");
    }
  }, [email, selectedEmailId]);

  useEffect(() => {
    // Apply highlights whenever the selected email or highlights change
    if (email && contentRef.current && selectedEmailId) {
      renderHighlights();
    }
  }, [email, highlights, selectedEmailId]);

  const renderHighlights = useCallback(() => {
    if (!email || !selectedEmailId) return;

    // Start with the original HTML
    const newHtml = email.content;

    // Get only highlights for the current email
    const emailHighlights = getEmailHighlights(selectedEmailId);

    if (emailHighlights.length === 0) {
      setEmailHtml(sanitizeHtml(newHtml));
      return;
    }

    // Sort highlights by start position, in reverse order
    // This ensures we insert spans from the end of the text, avoiding offset issues
    const sortedHighlights = [...emailHighlights].sort(
      (a, b) => b.start - a.start,
    );

    // Create a temporary element to work with the HTML
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = sanitizeHtml(newHtml);

    // Get all text nodes recursively
    const textNodes: Node[] = [];
    function getAllTextNodes(node: Node) {
      if (node.nodeType === Node.TEXT_NODE) {
        textNodes.push(node);
      } else {
        node.childNodes.forEach((child) => getAllTextNodes(child));
      }
    }

    getAllTextNodes(tempDiv);

    // Highlight each text node as needed
    for (const highlight of sortedHighlights) {
      let currPos = 0;
      let startNode: Node | null = null;
      let endNode: Node | null = null;
      let startOffset = 0;
      let endOffset = 0;

      // Find the text nodes that contain the highlight
      for (const node of textNodes) {
        const nodeLength = node.textContent?.length ?? 0;

        // Check if highlight starts in this node
        if (
          currPos <= highlight.start &&
          currPos + nodeLength > highlight.start
        ) {
          startNode = node;
          startOffset = highlight.start - currPos;
        }

        // Check if highlight ends in this node
        if (currPos <= highlight.end && currPos + nodeLength >= highlight.end) {
          endNode = node;
          endOffset = highlight.end - currPos;
          break;
        }

        currPos += nodeLength;
      }

      // If we found the nodes, apply the highlight
      if (startNode && endNode) {
        const range = document.createRange();
        range.setStart(startNode, startOffset);
        range.setEnd(endNode, endOffset);

        // Create a span for the highlight
        const span = document.createElement("span");
        span.classList.add("email-highlight");
        if (highlight.className) {
          span.classList.add(highlight.className);
        } else {
          span.classList.add(
            highlight.fieldId ? "highlight-saved" : "highlight-current",
          );
        }
        span.dataset.highlightId = highlight.id;

        // Apply the highlight
        range.surroundContents(span);

        // Reset the text nodes as we've modified the DOM
        textNodes.length = 0;
        getAllTextNodes(tempDiv);
      }
    }

    // Update the email HTML
    setEmailHtml(tempDiv.innerHTML);
  }, [email, getEmailHighlights, selectedEmailId]);

  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();

    if (!selection?.toString().trim() || !selectedEmailId) {
      return;
    }

    try {
      const range = selection.getRangeAt(0);
      const text = selection.toString().trim();

      // Calculate start and end positions
      // This is a simplified approach - in a real app, you'd need a more robust solution
      const preSelectionRange = range.cloneRange();
      if (contentRef.current) {
        preSelectionRange.selectNodeContents(contentRef.current);
        preSelectionRange.setEnd(range.startContainer, range.startOffset);
        const start = preSelectionRange.toString().length;
        const end = start + text.length;

        // Check for overlapping highlights
        const newHighlight: Omit<Highlight, "id"> = {
          emailId: selectedEmailId,
          text,
          start,
          end,
          className: "highlight-current",
        };

        if (isOverlapping(newHighlight)) {
          console.warn("Overlapping highlight detected");
          return;
        }

        // Add the highlight to the store
        addHighlight({
          id: uuidv4(),
          ...newHighlight,
        });
      }

      // Clear the selection
      selection.removeAllRanges();
    } catch (error) {
      console.error("Error creating highlight:", error);
    }
  }, [selectedEmailId, addHighlight, isOverlapping]);

  if (!selectedEmailId) {
    return (
      <div className="flex flex-1 items-center justify-center text-gray-400">
        Select an email to view its content.
      </div>
    );
  }

  if (!email) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <main className="flex-1 overflow-auto bg-white p-8">
      <style jsx global>{`
        .email-highlight {
          cursor: pointer;
          border-radius: 2px;
        }
        .highlight-current {
          background-color: rgba(255, 165, 0, 0.3);
        }
        .highlight-saved {
          background-color: rgba(0, 128, 0, 0.2);
        }
      `}</style>
      <div className="mb-4">
        <h1 className="mb-2 text-2xl font-bold">{email.subject}</h1>
        <div className="text-sm text-gray-600">
          From: <span className="font-medium">{email.sender}</span>
        </div>
      </div>
      <div
        ref={contentRef}
        className="prose max-w-none"
        dangerouslySetInnerHTML={{ __html: emailHtml }}
        onMouseUp={handleMouseUp}
      />
    </main>
  );
};
