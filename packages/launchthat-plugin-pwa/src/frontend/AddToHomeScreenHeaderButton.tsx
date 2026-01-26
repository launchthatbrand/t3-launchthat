"use client";

import * as React from "react";
import { Button, Dialog, DialogContent, DialogTrigger } from "@acme/ui";

import { useAddToHomeScreen } from "./useAddToHomeScreen";
import { InstallHowTo } from "./InstallHowTo";

export type AddToHomeScreenHeaderButtonProps = {
  appName?: string;
  buttonLabel?: string;
  buttonVariant?: "default" | "secondary" | "outline" | "ghost" | "link";
  buttonSize?: "default" | "sm" | "lg" | "icon";
  buttonClassName?: string;
};

export const AddToHomeScreenHeaderButton = ({
  appName = "this app",
  buttonLabel = "Install",
  buttonVariant = "ghost",
  buttonSize = "sm",
  buttonClassName,
}: AddToHomeScreenHeaderButtonProps) => {
  const { isIOS, isStandalone, canPromptInstall, promptInstall } =
    useAddToHomeScreen();

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [isInstalling, setIsInstalling] = React.useState(false);

  if (isStandalone) return null;

  const handleInstall = async () => {
    if (isInstalling) return;
    if (!canPromptInstall) {
      setDialogOpen(true);
      return;
    }

    setIsInstalling(true);
    try {
      await promptInstall();
    } finally {
      setIsInstalling(false);
    }
  };

  if (isIOS) {
    return (
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant={buttonVariant}
            size={buttonSize}
            className={buttonClassName}
          >
            {buttonLabel}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <InstallHowTo
            appName={appName}
            isIOS={isIOS}
            canPromptInstall={canPromptInstall}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <Button
        type="button"
        variant={buttonVariant}
        size={buttonSize}
        className={buttonClassName}
        disabled={isInstalling}
        onClick={() => void handleInstall()}
      >
        {buttonLabel}
      </Button>

      {!canPromptInstall && (
        <DialogContent className="max-w-md">
          <InstallHowTo
            appName={appName}
            isIOS={isIOS}
            canPromptInstall={canPromptInstall}
          />
        </DialogContent>
      )}
    </Dialog>
  );
};

