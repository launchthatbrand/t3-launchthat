"use client";

import { FC, useCallback, useEffect, useRef, useState } from "react";

import { useEmailParserStore } from "../../store";
import { useGmail } from "../../hooks/useGmail";
import { v4 as uuidv4 } from "uuid";

// Mock data for emails when not using Gmail
const MOCK_EMAIL_CONTENT: Record<string, { subject: string; content: string }> =
  {
    email1: {
      subject: "Invoice #1234",
      content: `Dear Customer,

Thank you for your recent purchase. Your invoice #1234 is attached.

Order Details:
- Product: Premium Subscription
- Amount: $99.99
- Date: May 15, 2023

Payment is due within 30 days. Please remit payment at your earliest convenience.

Thank you for your business.

Regards,
Billing Department
Example Inc.`,
    },
    email2: {
      subject: "Welcome to Our Service",
      content: `Hello and Welcome!

Thank you for signing up for our service. We're excited to have you on board.

To get started, here are a few things you can do:
1. Complete your profile
2. Explore the dashboard
3. Check out our tutorials

If you have any questions, feel free to reply to this email or contact our support team.

Best regards,
The Support Team
Company Inc.`,
    },
    email3: {
      subject: "Your Appointment Confirmation",
      content: `Dear Patient,

This is to confirm your appointment with Dr. Smith on May 20, 2023, at 10:00 AM.

Appointment Details:
- Date: May 20, 2023
- Time: 10:00 AM
- Provider: Dr. Jane Smith
- Location: Healthcare Clinic, 123 Medical Blvd, Suite 456

Please arrive 15 minutes early to complete any necessary paperwork. Bring your insurance card and a valid ID.

To reschedule or cancel, please call us at (555) 123-4567 at least 24 hours in advance.

Thank you,
Healthcare Organization
Appointments Team`,
    },
  };

export const EmailContent: FC = () => {
  const selectedEmailId = useEmailParserStore((s) => s.selectedEmailId);
  const highlights = useEmailParserStore((s) => s.highlights);
  const addHighlight = useEmailParserStore((s) => s.addHighlight);
  const removeHighlight = useEmailParserStore((s) => s.removeHighlight);
  const updateHighlightClassName = useEmailParserStore(
    (s) => s.updateHighlightClassName,
  );
  const getEmailHighlights = useEmailParserStore((s) => s.getEmailHighlights);
  const showToast = useEmailParserStore((s) => s.showToast);

  const { isAuthenticated, loadedEmails } = useGmail();

  const [selection, setSelection] = useState<{
    text: string;
    start: number;
    end: number;
  } | null>(null);
  const [emailContent, setEmailContent] = useState<string>("");
  const [emailSubject, setEmailSubject] = useState<string>("");
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset selection when email changes
    setSelection(null);

    if (!selectedEmailId) {
      setEmailContent("");
      setEmailSubject("");
      return;
    }

    if (isAuthenticated) {
      // Get email content from Gmail
      const email = loadedEmails[selectedEmailId];
      if (email) {
        setEmailContent(email.body);
        setEmailSubject(email.subject);
      }
    } else {
      // Get mock email content
      const mockEmail = MOCK_EMAIL_CONTENT[selectedEmailId];
      if (mockEmail) {
        setEmailContent(mockEmail.content);
        setEmailSubject(mockEmail.subject);
      }
    }
  }, [selectedEmailId, isAuthenticated, loadedEmails]);

  const handleSelection = useCallback(() => {
    if (!selectedEmailId || !contentRef.current) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setSelection(null);
      return;
    }

    const range = selection.getRangeAt(0);
    const preSelectionRange = range.cloneRange();
    preSelectionRange.selectNodeContents(contentRef.current);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);
    const start = preSelectionRange.toString().length;

    const text = selection.toString().trim();
    if (!text) {
      setSelection(null);
      return;
    }

    setSelection({
      text,
      start,
      end: start + text.length,
    });
  }, [selectedEmailId]);

  const handleAddHighlight = useCallback(() => {
    if (!selection || !selectedEmailId) return;

    const highlight = {
      id: uuidv4(),
      emailId: selectedEmailId,
      text: selection.text,
      start: selection.start,
      end: selection.end,
      className: "highlight-current",
    };

    // Validate selection doesn't overlap with existing highlights
    const emailHighlights = getEmailHighlights(selectedEmailId);
    const isOverlapping = emailHighlights.some(
      (h) =>
        (selection.start < h.end && selection.end > h.start) ||
        (selection.start === h.start && selection.end === h.end),
    );

    if (isOverlapping) {
      showToast("error", "Highlights cannot overlap");
      return;
    }

    addHighlight(highlight);
    setSelection(null);
  }, [selection, selectedEmailId, addHighlight, getEmailHighlights, showToast]);

  // Reset current highlight when selecting another text
  useEffect(() => {
    if (selection) {
      const currentHighlight = highlights.find(
        (h) => h.className === "highlight-current" && !h.fieldId,
      );
      if (currentHighlight) {
        // If it has no field ID, we can remove it
        if (!currentHighlight.fieldId) {
          removeHighlight(currentHighlight.id);
        } else {
          // If it has a field ID, just update its class
          updateHighlightClassName(currentHighlight.id, "highlight-saved");
        }
      }
    }
  }, [selection, highlights, removeHighlight, updateHighlightClassName]);

  const renderHighlightedContent = useCallback(() => {
    if (!selectedEmailId || !emailContent) return <p>No content to display</p>;

    const emailHighlights = getEmailHighlights(selectedEmailId).sort(
      (a, b) => a.start - b.start,
    );

    if (emailHighlights.length === 0) {
      return <p className="whitespace-pre-wrap">{emailContent}</p>;
    }

    const result = [];
    let lastEnd = 0;

    for (const highlight of emailHighlights) {
      // Add text before the highlight
      if (highlight.start > lastEnd) {
        result.push(
          <span key={`text-${lastEnd}`}>
            {emailContent.slice(lastEnd, highlight.start)}
          </span>,
        );
      }

      // Add the highlighted text
      result.push(
        <span
          key={highlight.id}
          className={highlight.className || "highlight-saved"}
          data-highlight-id={highlight.id}
          onClick={() => {
            if (highlight.className === "highlight-saved") {
              updateHighlightClassName(highlight.id, "highlight-current");
            }
          }}
        >
          {emailContent.slice(highlight.start, highlight.end)}
        </span>,
      );

      lastEnd = highlight.end;
    }

    // Add text after the last highlight
    if (lastEnd < emailContent.length) {
      result.push(
        <span key={`text-${lastEnd}`}>
          {emailContent.slice(lastEnd, emailContent.length)}
        </span>,
      );
    }

    return <p className="whitespace-pre-wrap">{result}</p>;
  }, [
    selectedEmailId,
    emailContent,
    getEmailHighlights,
    updateHighlightClassName,
  ]);

  return (
    <div className="flex h-full flex-col overflow-hidden p-4">
      {selectedEmailId ? (
        <>
          <div className="mb-4 rounded-md border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="mb-2 text-lg font-medium text-gray-900">
              {emailSubject || "No Subject"}
            </h2>
            {selection && (
              <div className="mb-3 flex items-center justify-between rounded-md bg-blue-50 p-2">
                <div className="text-sm text-blue-700">
                  <span className="font-medium">Selected text:</span>{" "}
                  {selection.text.length > 50
                    ? `${selection.text.substring(0, 50)}...`
                    : selection.text}
                </div>
                <button
                  onClick={handleAddHighlight}
                  className="rounded-md bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Add Highlight
                </button>
              </div>
            )}
            <div
              ref={contentRef}
              className="prose max-w-none overflow-auto"
              onMouseUp={handleSelection}
              onTouchEnd={handleSelection}
            >
              {renderHighlightedContent()}
            </div>
          </div>
        </>
      ) : (
        <div className="flex h-full flex-col items-center justify-center">
          <div className="text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              No Email Selected
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Select an email from the sidebar to view its content
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
