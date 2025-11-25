"use client";

import type { InitialConfigType } from "@lexical/react/LexicalComposer";
import type { GenericId as Id } from "convex/values";
import type { EditorState, LexicalEditor, TextFormatType } from "lexical";
import type { LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { $generateHtmlFromNodes } from "@lexical/html";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable as LexicalContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { api } from "@portal/convexspec";
import { useMutation } from "convex/react";
import { $getRoot, FORMAT_TEXT_COMMAND } from "lexical";
import { Bold, Italic, Loader2, SendHorizontal, Underline } from "lucide-react";

import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@acme/ui/index";
import { toast } from "@acme/ui/toast";

import type {
  ContactDoc,
  ConversationSummary,
} from "../../components/ConversationInspector";

const composerTheme = {
  paragraph: "text-sm leading-relaxed text-foreground",
  text: {
    bold: "font-semibold",
    italic: "italic",
    underline: "underline",
  },
};

const composerInitialConfig: InitialConfigType = {
  namespace: "SupportConversationComposer",
  theme: composerTheme,
  onError: (error: Error) => {
    console.error("[support-composer] Lexical error", error);
  },
  nodes: [],
};

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
  const editorRef = useRef<LexicalEditor | null>(null);
  const latestState = useRef<EditorState | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [hasContent, setHasContent] = useState(false);

  const contactId =
    contact?._id ?? (conversation.contactId as Id<"contacts"> | undefined);
  const contactEmail = contact?.email ?? conversation.contactEmail ?? undefined;
  const contactName =
    contact?.fullName ?? conversation.contactName ?? undefined;
  const channelLabel =
    conversation.origin === "email" ? "Email reply" : "Chat reply";

  const handleChange = (editorState: EditorState) => {
    latestState.current = editorState;
    editorState.read(() => {
      const text = $getRoot().getTextContent().trim();
      setHasContent(text.length > 0);
    });
  };

  const handleSend = async () => {
    if (!editorRef.current || !latestState.current || isSending) {
      return;
    }

    let plainText = "";
    latestState.current.read(() => {
      plainText = $getRoot().getTextContent().trim();
    });

    if (!plainText) {
      return;
    }

    let htmlBody = "";
    latestState.current.read(() => {
      htmlBody = $generateHtmlFromNodes(
        editorRef.current as LexicalEditor,
        null,
      );
    });

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
        // @ts-ignore Convex spec needs regeneration to expose html/text bodies
        htmlBody,
        // @ts-ignore Convex spec needs regeneration to expose html/text bodies
        textBody: plainText,
      });

      editorRef.current.update(() => {
        const root = $getRoot();
        root.clear();
        root.selectEnd();
      });
      setHasContent(false);
    } catch (error) {
      console.error("[support-composer] send message error", error);
      toast.error("Unable to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-2 p-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {channelLabel}
            {contactEmail ? ` • ${contactEmail}` : ""}
          </span>
          <span>Enter to send, Shift + Enter for newline</span>
        </div>

        <div className="relative rounded-xl border bg-card shadow-sm">
          <LexicalComposer initialConfig={composerInitialConfig}>
            <ComposerRegisterPlugin editorRef={editorRef} />
            <RichTextPlugin
              contentEditable={
                <div className="relative">
                  <LexicalContentEditable
                    className="min-h-[120px] w-full resize-none rounded-t-xl bg-transparent px-4 py-3 text-sm focus:outline-none"
                    onKeyDown={handleKeyDown}
                  />
                </div>
              }
              placeholder={
                <ComposerPlaceholder>
                  Reply to this conversation…
                </ComposerPlaceholder>
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
            <HistoryPlugin />
            <AutoFocusPlugin />
            <OnChangePlugin onChange={handleChange} ignoreSelectionChange />
            <ComposerToolbar />
          </LexicalComposer>

          <div className="flex items-center justify-between border-t px-3 py-2">
            <div className="text-xs text-muted-foreground">
              {conversation.origin === "email"
                ? "Responses will be sent as email."
                : "Responses appear in the chat widget."}
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
    </TooltipProvider>
  );
}

const ComposerPlaceholder = ({ children }: { children: React.ReactNode }) => (
  <div className="pointer-events-none absolute left-0 top-0 mb-auto p-4 text-sm text-muted-foreground">
    {children}
  </div>
);

const ComposerToolbar = () => {
  const [editor] = useLexicalComposerContext();

  const buttons: Array<{
    label: string;
    icon: LucideIcon;
    format: TextFormatType;
  }> = [
    { label: "Bold", icon: Bold, format: "bold" },
    { label: "Italic", icon: Italic, format: "italic" },
    { label: "Underline", icon: Underline, format: "underline" },
  ];

  return (
    <div className="flex items-center gap-1 border-t px-2 py-1">
      {buttons.map((button) => (
        <Tooltip key={button.label}>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() =>
                editor.dispatchCommand(FORMAT_TEXT_COMMAND, button.format)
              }
            >
              <button.icon className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">{button.label}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
};

const ComposerRegisterPlugin = ({
  editorRef,
}: {
  editorRef: React.MutableRefObject<LexicalEditor | null>;
}) => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    editorRef.current = editor;
    return () => {
      editorRef.current = null;
    };
  }, [editor, editorRef]);

  return null;
};
