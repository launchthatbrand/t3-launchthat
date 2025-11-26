"use client";

import { useCallback, useEffect, useState } from "react";

export const useSupportSessionState = (
  initialSessionId?: string,
  basePath?: string,
) => {
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>(
    initialSessionId,
  );

  useEffect(() => {
    setActiveSessionId((prev) => prev ?? initialSessionId);
  }, [initialSessionId]);

  const syncHistory = useCallback(
    (sessionId: string) => {
      if (typeof window === "undefined" || !basePath) {
        return;
      }
      const url = new URL(window.location.href);
      const targetPath = basePath ?? url.pathname;
      url.pathname = targetPath;
      url.searchParams.set("sessionId", sessionId);
      window.history.replaceState(null, "", url.toString());
    },
    [basePath],
  );

  const handleSelectConversation = useCallback(
    (sessionId: string) => {
      setActiveSessionId(sessionId);
      syncHistory(sessionId);
    },
    [syncHistory],
  );

  return {
    activeSessionId,
    setActiveSessionId,
    handleSelectConversation,
  };
};
