import { useEffect, useState } from "react";

import type { SupportChatSettings } from "../../settings";
import { defaultSupportChatSettings } from "../../settings";

interface UseSupportChatSettingsResult {
  settings: SupportChatSettings;
  isLoading: boolean;
}

export const useSupportChatSettings = (
  organizationId: string,
): UseSupportChatSettingsResult => {
  const [settings, setSettings] = useState<SupportChatSettings>(
    defaultSupportChatSettings,
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchSettings() {
      try {
        const response = await fetch(
          `/api/support-chat/settings?organizationId=${organizationId}`,
        );
        if (!response.ok) {
          throw new Error("Failed to load support settings");
        }
        const data = await response.json();
        if (!cancelled) {
          setSettings({
            ...defaultSupportChatSettings,
            ...(data.settings ?? {}),
          });
        }
      } catch (error) {
        console.error("[support-chat] settings error", error);
        if (!cancelled) {
          setSettings(defaultSupportChatSettings);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }
    void fetchSettings();
    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  return { settings, isLoading };
};
