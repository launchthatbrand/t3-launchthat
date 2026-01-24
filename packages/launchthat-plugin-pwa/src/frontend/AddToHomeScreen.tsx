"use client";

import * as React from "react";
import { Button } from "@acme/ui";
import { useAddToHomeScreen } from "./useAddToHomeScreen";

export type AddToHomeScreenProps = {
  appName?: string;
  className?: string;
  title?: string;
  description?: string;
  buttonLabel?: string;
  onInstalled?: () => void;
  onDismissed?: () => void;
};

export const AddToHomeScreen = ({
  appName = "this app",
  className,
  title = "Install App",
  description,
  buttonLabel = "Add to Home Screen",
  onInstalled,
  onDismissed,
}: AddToHomeScreenProps) => {
  const { isIOS, isStandalone, canPromptInstall, promptInstall } =
    useAddToHomeScreen();

  const [isInstalling, setIsInstalling] = React.useState(false);

  if (isStandalone) return null;

  const iosDescription =
    description ??
    `To install ${appName} on iOS, tap the Share button in Safari, then “Add to Home Screen”.`;

  const defaultDescription =
    description ?? `Install ${appName} for a faster, app-like experience.`;

  return (
    <div className={className}>
      <div className="space-y-2">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-sm text-muted-foreground">
          {isIOS ? iosDescription : defaultDescription}
        </div>
      </div>

      {!isIOS && (
        <div className="mt-3">
          <Button
            type="button"
            disabled={!canPromptInstall || isInstalling}
            onClick={async () => {
              setIsInstalling(true);
              try {
                const outcome = await promptInstall();
                if (outcome === "accepted") onInstalled?.();
                if (outcome === "dismissed") onDismissed?.();
              } finally {
                setIsInstalling(false);
              }
            }}
          >
            {buttonLabel}
          </Button>
        </div>
      )}
    </div>
  );
};

