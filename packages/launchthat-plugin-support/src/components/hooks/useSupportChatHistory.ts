import { useEffect, useState } from "react";

export interface ChatHistoryMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface UseSupportChatHistoryResult {
  initialMessages: ChatHistoryMessage[];
  isBootstrapped: boolean;
}

export const useSupportChatHistory = (
  apiPath: string,
  organizationId: string,
  sessionId: string,
): UseSupportChatHistoryResult => {
  const [initialMessages, setInitialMessages] = useState<ChatHistoryMessage[]>(
    [],
  );
  const [isBootstrapped, setIsBootstrapped] = useState(false);

  useEffect(() => {
    if (!sessionId || typeof window === "undefined") {
      return;
    }
    let cancelled = false;
    async function loadHistory() {
      setIsBootstrapped(false);
      try {
        const url = new URL(apiPath, window.location.origin);
        url.searchParams.set("organizationId", organizationId);
        url.searchParams.set("sessionId", sessionId);
        const response = await fetch(url.toString(), { method: "GET" });
        if (!response.ok) {
          throw new Error("Failed to load chat history");
        }
        const data: {
          messages: Array<{
            _id: string;
            role: "user" | "assistant";
            content: string;
          }>;
        } = await response.json();
        if (!cancelled) {
          const normalized =
            data.messages?.map((message) => ({
              id: message._id,
              role: message.role,
              content: message.content,
            })) ?? [];
          setInitialMessages(normalized);
        }
      } catch (error) {
        console.error("[support-chat] failed to load history", error);
        if (!cancelled) {
          setInitialMessages([]);
        }
      } finally {
        if (!cancelled) {
          setIsBootstrapped(true);
        }
      }
    }
    void loadHistory();
    return () => {
      cancelled = true;
    };
  }, [apiPath, organizationId, sessionId]);

  return { initialMessages, isBootstrapped };
};
