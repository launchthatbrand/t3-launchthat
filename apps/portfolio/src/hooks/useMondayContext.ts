"use client";

import { useEffect, useState } from "react";

/**
 * Typings for Monday.com SDK context
 */
export interface MondayContext {
  data: {
    boardId?: string;
    instanceId?: string;
    itemId?: string;
    workspaceId?: string;
    locale?: string;
    location?: string;
    user?: {
      id: string;
      email: string;
      name?: string;
    };
    themeConfig?: {
      name: string;
      iconStyle?: string;
      primaryColor?: string;
    };
  };
}

/**
 * Type declaration for Monday SDK
 */
interface MondaySdk {
  init: () => Promise<void>;
  get: (type: string) => Promise<MondayContext>;
}

declare global {
  interface Window {
    mondaySdk?: () => MondaySdk;
  }
}

/**
 * Hook to detect if the current app is embedded in Monday.com
 * and retrieve Monday.com context information
 */
export function useMondayContext() {
  const [isInMonday, setIsInMonday] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [context, setContext] = useState<MondayContext | null>(null);

  useEffect(() => {
    async function initMondaySdk() {
      try {
        setIsLoading(true);

        // Check if Monday.com SDK is available
        if (typeof window === "undefined") {
          setIsInMonday(false);
          return;
        }

        // Check if we're in Monday.com iframe
        const isIframe = window !== window.parent;
        if (!isIframe) {
          setIsInMonday(false);
          setIsLoading(false);
          return;
        }

        // Wait for Monday.com SDK to load
        if (!window.mondaySdk) {
          // Load Monday SDK dynamically
          const script = document.createElement("script");
          script.src = "https://cdn.monday.com/monday-sdk-js/0.1.6/main.js";
          script.async = true;

          await new Promise<void>((resolve, reject) => {
            script.onload = () => resolve();
            script.onerror = () =>
              reject(new Error("Failed to load Monday SDK"));
            document.head.appendChild(script);
          });
        }

        // Check again after dynamic loading
        if (!window.mondaySdk) {
          console.error("Monday SDK failed to load");
          setIsInMonday(false);
          setIsLoading(false);
          return;
        }

        const monday = window.mondaySdk();

        // Initialize Monday context
        await monday.init();

        // Get context from Monday.com
        const contextData = await monday.get("context");

        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (contextData.data) {
          setIsInMonday(true);
          setContext(contextData);
        } else {
          setIsInMonday(false);
        }
      } catch (error) {
        console.error("Error initializing Monday context:", error);
        setIsInMonday(false);
      } finally {
        setIsLoading(false);
      }
    }

    void initMondaySdk();
  }, []);

  return { isInMonday, isLoading, context };
}
