import { useCallback, useEffect, useMemo, useState } from "react";

const getStoredValue = (key: string) => {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(key);
};

export const useSupportChatThread = (organizationId: string) => {
  const storageKey = useMemo(
    () => `support-thread-${organizationId}`,
    [organizationId],
  );

  const [threadId, setThreadId] = useState<string | null>(() => {
    const stored = getStoredValue(storageKey);
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

  useEffect(() => {
    const stored = getStoredValue(storageKey);
    if (stored) {
      setThreadId(stored);
      return;
    }
    let cancelled = false;
    const run = async () => {
      try {
        const res = await fetch(
          `/api/support-chat/thread?organizationId=${encodeURIComponent(
            organizationId,
          )}`,
        );
        if (!res.ok) {
          throw new Error(`Failed to create support thread (${res.status})`);
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
  }, [organizationId, persist, storageKey]);

  const resetThread = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(storageKey);
    }
    setThreadId(null);
  }, [organizationId, persist]);

  return { threadId, resetThread };
};
