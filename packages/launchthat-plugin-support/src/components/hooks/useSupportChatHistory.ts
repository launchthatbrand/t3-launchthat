import { useMemo } from "react";
import { api } from "@portal/convexspec";
import { useQuery } from "convex/react";

export interface ChatHistoryMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: { title: string; url: string; source?: string; slug?: string }[];
}

interface UseSupportChatHistoryResult {
  initialMessages: ChatHistoryMessage[];
  isBootstrapped: boolean;
}

export const useSupportChatHistory = (
  organizationId: string,
  threadId: string | null,
): UseSupportChatHistoryResult => {
  const messages = useQuery(
    api.plugins.support.queries.listMessages,
    organizationId && threadId
      ? {
          organizationId,
          sessionId: threadId,
        }
      : "skip",
  );

  const initialMessages = useMemo<ChatHistoryMessage[]>(() => {
    if (!messages) {
      return [];
    }
    return messages.map((message: { _id: any; role: any; content: any }) => ({
      id: message._id,
      role: message.role,
      content: message.content,
    }));
  }, [messages]);

  const isBootstrapped = messages !== undefined;

  return { initialMessages, isBootstrapped };
};
