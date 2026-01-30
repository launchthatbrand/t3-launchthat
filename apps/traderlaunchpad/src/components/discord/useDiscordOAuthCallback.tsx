"use client";

import * as React from "react";
import { useConvexAuth } from "convex/react";
import { useRouter, useSearchParams } from "next/navigation";

type OAuthScope = "platform" | "org" | "any";

type UseDiscordOAuthCallbackOptions = {
  scope?: OAuthScope;
  onCompletePlatform?: (args: { state: string; code: string }) => Promise<void>;
  onCompleteOrg?: (args: { state: string; code: string }) => Promise<void>;
  onSuccess?: (scope: Exclude<OAuthScope, "any">) => void;
  onError?: (message: string) => void;
  onAuthRequired?: () => void;
  requireAuth?: boolean;
};

const getErrorMessage = (err: unknown): string => {
  if (err && typeof err === "object" && "message" in err && typeof err.message === "string") {
    return err.message;
  }
  try {
    return String(err);
  } catch {
    return "Unknown error";
  }
};

export const stripDiscordOauthParams = (url: string): string => {
  const u = new URL(url);
  u.searchParams.delete("state");
  u.searchParams.delete("code");
  u.searchParams.delete("error");
  u.searchParams.delete("error_description");
  u.searchParams.delete("guild_id");
  u.searchParams.delete("discordScope");
  return u.toString();
};

export const useDiscordOAuthCallback = (options: UseDiscordOAuthCallbackOptions) => {
  const {
    scope = "any",
    onCompletePlatform,
    onCompleteOrg,
    onSuccess,
    onError,
    onAuthRequired,
    requireAuth = true,
  } = options;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const handledRef = React.useRef<string | null>(null);

  const oauthState = (searchParams.get("state") ?? "").trim();
  const oauthCode = (searchParams.get("code") ?? "").trim();
  const oauthError = (searchParams.get("error") ?? "").trim();
  const oauthErrorDescription = (searchParams.get("error_description") ?? "").trim();
  const oauthScope = (searchParams.get("discordScope") ?? "").trim();

  React.useEffect(() => {
    if (!oauthState) return;
    if (requireAuth) {
      if (isLoading) return;
      if (!isAuthenticated) {
        onAuthRequired?.();
        return;
      }
    }

    const resolvedScope = (oauthScope || "org") as "platform" | "org";
    if (scope !== "any" && resolvedScope !== scope) return;

    const clearUrl = () => router.replace(stripDiscordOauthParams(window.location.href));

    if (oauthError) {
      onError?.(
        oauthErrorDescription
          ? `Discord connect failed: ${oauthErrorDescription}`
          : `Discord connect failed: ${oauthError}`,
      );
      clearUrl();
      return;
    }

    if (!oauthCode) return;

    const handledKey = `${oauthState}::${oauthCode}`;
    if (handledRef.current === handledKey) return;
    handledRef.current = handledKey;

    void (async () => {
      try {
        if (resolvedScope === "platform") {
          await onCompletePlatform?.({ state: oauthState, code: oauthCode });
        } else {
          await onCompleteOrg?.({ state: oauthState, code: oauthCode });
        }
        onSuccess?.(resolvedScope);
      } catch (err) {
        onError?.(getErrorMessage(err));
      } finally {
        clearUrl();
      }
    })();
  }, [
    isAuthenticated,
    isLoading,
    oauthCode,
    oauthError,
    oauthErrorDescription,
    oauthScope,
    oauthState,
    onAuthRequired,
    onCompleteOrg,
    onCompletePlatform,
    onError,
    onSuccess,
    requireAuth,
    router,
    scope,
  ]);
};
