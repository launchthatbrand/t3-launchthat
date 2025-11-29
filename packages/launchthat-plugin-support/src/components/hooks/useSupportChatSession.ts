import { useCallback, useEffect, useMemo, useState } from "react";

import { generateSessionId } from "../supportChat/utils";

const getStoredValue = (key: string) => {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(key);
};

export const useSupportChatSession = (organizationId: string) => {
  const storageKey = useMemo(
    () => `support-session-${organizationId}`,
    [organizationId],
  );

  const [sessionId, setSessionId] = useState(() => {
    const stored = getStoredValue(storageKey);
    if (stored) {
      return stored;
    }
    const generated = generateSessionId(organizationId);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, generated);
    }
    return generated;
  });

  const persist = useCallback(
    (value: string) => {
      setSessionId(value);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(storageKey, value);
      }
    },
    [storageKey],
  );

  useEffect(() => {
    const stored = getStoredValue(storageKey);
    if (stored) {
      setSessionId(stored);
      return;
    }
    const generated = generateSessionId(organizationId);
    persist(generated);
  }, [organizationId, persist, storageKey]);

  const resetSession = useCallback(() => {
    const next = generateSessionId(organizationId);
    persist(next);
  }, [organizationId, persist]);

  return { sessionId, resetSession };
};
