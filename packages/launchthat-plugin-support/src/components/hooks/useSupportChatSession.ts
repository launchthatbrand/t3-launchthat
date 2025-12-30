import { useCallback, useEffect, useMemo, useState } from "react";

const getStoredValue = (key: string) => {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(key);
};

export const useSupportChatThread = (
  organizationId: string,
  widgetKey?: string | null,
) => {
  const storageKey = useMemo(
    () => `support-thread-${organizationId}`,
    [organizationId],
  );
  const sessionKey = useMemo(
    () => `support-client-session-${organizationId}`,
    [organizationId],
  );

  const [threadId, setThreadId] = useState<string | null>(() => {
    const stored = getStoredValue(storageKey);
    if (stored) {
      return stored;
    }
    return null;
  });

  const [clientSessionId, setClientSessionId] = useState<string | null>(() => {
    const stored = getStoredValue(sessionKey);
    if (stored) {
      return stored;
    }
    return null;
  });

  const persist = useCallback(
    (value: string) => {
      setThreadId(value);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(storageKey, value);
      }
    },
    [storageKey],
  );

  const persistClientSessionId = useCallback(
    (value: string) => {
      setClientSessionId(value);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(sessionKey, value);
      }
    },
    [sessionKey],
  );

  useEffect(() => {
    const stored = getStoredValue(sessionKey);
    if (stored) {
      setClientSessionId(stored);
      return;
    }
    if (typeof window === "undefined") {
      return;
    }
    const newId =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    persistClientSessionId(newId);
  }, [persistClientSessionId, sessionKey]);

  useEffect(() => {
    const stored = getStoredValue(storageKey);
    if (stored) {
      setThreadId(stored);
      return;
    }
    if (typeof widgetKey !== "string" || widgetKey.trim().length === 0) {
      return;
    }
    if (!clientSessionId) {
      return;
    }
    let cancelled = false;
    const run = async () => {
      try {
        const res = await fetch(
          `/api/support-chat/thread?organizationId=${encodeURIComponent(
            organizationId,
          )}&widgetKey=${encodeURIComponent(
            widgetKey,
          )}&clientSessionId=${encodeURIComponent(clientSessionId)}`,
        );
        if (!res.ok) {
          const errorBody = (await res
            .json()
            .catch(() => null)) as { error?: unknown } | null;
          const message =
            typeof errorBody?.error === "string" && errorBody.error.trim().length > 0
              ? errorBody.error
              : `Failed to create support thread (${res.status})`;
          throw new Error(message);
        }
        const data = (await res.json()) as { threadId?: string };
        if (!data.threadId) {
          throw new Error("Missing threadId from support thread endpoint");
        }
        if (!cancelled) {
          persist(data.threadId);
        }
      } catch (error) {
        console.error("[support-chat] failed to create thread", error);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [clientSessionId, organizationId, persist, storageKey, widgetKey]);

  const resetThread = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(storageKey);
      window.localStorage.removeItem(sessionKey);
    }
    setThreadId(null);
    setClientSessionId(null);
  }, [sessionKey, storageKey]);

  return { threadId, clientSessionId, resetThread };
};
