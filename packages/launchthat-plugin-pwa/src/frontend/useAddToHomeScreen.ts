"use client";

import * as React from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type AddToHomeScreenState = {
  isIOS: boolean;
  isStandalone: boolean;
  canPromptInstall: boolean;
};

const getIsIOS = (): boolean => {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  // iPadOS 13+ reports as Mac; we keep this conservative and rely on `navigator.standalone` too.
  return /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
};

const getIsStandalone = (): boolean => {
  if (typeof window === "undefined") return false;
  const displayModeStandalone =
    window.matchMedia?.("(display-mode: standalone)")?.matches ?? false;
  const iosStandalone = Boolean((navigator as any)?.standalone);
  return displayModeStandalone || iosStandalone;
};

export const useAddToHomeScreen = (): AddToHomeScreenState & {
  promptInstall: () => Promise<"accepted" | "dismissed" | "unavailable">;
} => {
  const [deferredPrompt, setDeferredPrompt] =
    React.useState<BeforeInstallPromptEvent | null>(null);
  const [state, setState] = React.useState<AddToHomeScreenState>(() => ({
    isIOS: false,
    isStandalone: false,
    canPromptInstall: false,
  }));

  React.useEffect(() => {
    const update = () => {
      setState({
        isIOS: getIsIOS(),
        isStandalone: getIsStandalone(),
        canPromptInstall: deferredPrompt !== null,
      });
    };

    update();
    const media = window.matchMedia?.("(display-mode: standalone)");
    const handleMediaChange = () => update();
    media?.addEventListener?.("change", handleMediaChange);

    return () => {
      media?.removeEventListener?.("change", handleMediaChange);
    };
  }, [deferredPrompt]);

  React.useEffect(() => {
    const handler = (e: Event) => {
      // Chrome/Edge fire this; Safari iOS does not.
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler as EventListener);
    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handler as EventListener,
      );
    };
  }, []);

  const promptInstall = React.useCallback(async () => {
    if (!deferredPrompt) return "unavailable";
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    return choice.outcome;
  }, [deferredPrompt]);

  return { ...state, promptInstall };
};

