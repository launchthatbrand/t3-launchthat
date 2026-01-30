"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";

type UseDiscordBotInstallCallbackOptions = {
  basePath: string;
  onComplete: (args: { state: string; guildId: string }) => Promise<void>;
};

export const useDiscordBotInstallCallback = (
  options: UseDiscordBotInstallCallbackOptions,
) => {
  const { basePath, onComplete } = options;
  const router = useRouter();
  const searchParams = useSearchParams();
  const handledRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    const guildId = searchParams.get("guild_id");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    if (error) {
      router.replace(`${basePath}/connections`);
      return;
    }
    if (!guildId || !state) return;

    const key = `${state}::${guildId}`;
    if (handledRef.current === key) return;
    handledRef.current = key;

    void (async () => {
      try {
        await onComplete({ state, guildId });
      } finally {
        router.replace(`${basePath}/connections`);
      }
    })();
  }, [basePath, onComplete, router, searchParams]);
};
