"use client";

import type { GenericId as Id } from "convex/values";
import { useState } from "react";
import { api } from "@portal/convexspec";
import { useMutation } from "convex/react";
import { Loader2, SendHorizontal } from "lucide-react";

import { Editor } from "@acme/ui-lexical/components/editor-x/editor";
import { Button } from "@acme/ui/button";
import { toast } from "@acme/ui/toast";

import type {
  ContactDoc,
  ConversationSummary,
} from "../../components/ConversationInspector";

interface ConversationComposerProps {
  organizationId: Id<"organizations">;
  sessionId: string;
  conversation: ConversationSummary;
  contact: ContactDoc | null;
}

export function ConversationComposer({
  organizationId,
  sessionId,
  conversation,
  contact,
}: ConversationComposerProps) {
  const recordMessage = useMutation(
    api.plugins.support.mutations.recordMessage,
  );
  const [isSending, setIsSending] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const [draftText, setDraftText] = useState("");

  const contactId =
    contact?._id ?? (conversation.contactId as Id<"contacts"> | undefined);
  const contactEmail = contact?.email ?? conversation.contactEmail ?? undefined;
  const contactName =
    contact?.fullName ?? conversation.contactName ?? undefined;
  const channelLabel =
    conversation.origin === "email" ? "Email reply" : "Chat reply";

  const handleTextChange = (text: string) => {
    const trimmed = text.trim();
    setDraftText(trimmed);
    setHasContent(trimmed.length > 0);
  };

  const handleSend = async () => {
    if (isSending) {
      return;
    }

    const plainText = draftText.trim();
    if (!plainText) {
      return;
    }

    const htmlBody = plainText
      ? plainText
          .split("\n\n")
          .map((paragraph) =>
            paragraph
              ? `<p>${paragraph.replace(/\n/g, "<br/>")}</p>`
              : "<p><br/></p>",
          )
          .join("")
      : undefined;

    try {
      setIsSending(true);
      await recordMessage({
        organizationId,
        sessionId,
        role: "assistant",
        content: plainText,
        contactId,
        contactEmail,
        contactName,
        messageType:
          conversation.origin === "email" ? "email_outbound" : "chat",
        htmlBody,
        textBody: plainText,
      });

      setHasContent(false);
      setDraftText("");
    } catch (error) {
      console.error("[support-composer] send message error", error);
      toast.error("Unable to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-2 p-2">
      <div className="bg-card rounded-xl border shadow-sm">
        <Editor onTextContentChange={handleTextChange} />
        <div className="flex items-center justify-between border-t px-3 py-2">
          <div className="text-muted-foreground text-xs">
            {conversation.origin === "email"
              ? "Responses will be emailed to the contact."
              : "Responses will appear in the chat widget."}
          </div>
          <Button
            type="button"
            size="sm"
            disabled={!hasContent || isSending}
            onClick={() => void handleSend()}
            className="gap-2"
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <SendHorizontal className="h-4 w-4" />
                Send
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
